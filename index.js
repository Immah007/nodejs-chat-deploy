const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Configure file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image, document, and archive files are allowed'));
        }
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Store active rooms and users
const chatRooms = new Map(); // roomId -> { users: Set, messages: Array }
const userSockets = new Map(); // userId -> socketId

// Initialize room
function initRoom(roomId) {
    if (!chatRooms.has(roomId)) {
        chatRooms.set(roomId, {
            users: new Map(), // userId -> { username, color, joinTime }
            messages: [],
            createdAt: new Date(),
            lastActivity: new Date()
        });
    }
    return chatRooms.get(roomId);
}

// Get room info
function getRoomInfo(roomId) {
    const room = chatRooms.get(roomId);
    if (!room) return null;
    
    return {
        roomId,
        userCount: room.users.size,
        users: Array.from(room.users.values()),
        createdAt: room.createdAt,
        lastActivity: room.lastActivity,
        messageCount: room.messages.length
    };
}

// Cleanup inactive rooms
function cleanupInactiveRooms() {
    const now = new Date();
    const hours = 24; // Rooms expire after 24 hours of inactivity
    
    for (const [roomId, room] of chatRooms.entries()) {
        const inactiveTime = (now - room.lastActivity) / (1000 * 60 * 60);
        if (room.users.size === 0 && inactiveTime > hours) {
            chatRooms.delete(roomId);
            console.log(`Cleaned up inactive room: ${roomId}`);
        }
    }
}

// Run cleanup every hour
setInterval(cleanupInactiveRooms, 60 * 60 * 1000);

// Socket.IO Connection Handler
io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);
    
    // Handle joining a room
    socket.on('joinRoom', (data) => {
        try {
            const { userId, username, room, color } = data;
            
            if (!username || !room) {
                socket.emit('error', { message: 'Username and room are required' });
                return;
            }
            
            // Initialize room if needed
            const roomData = initRoom(room);
            
            // Check if username is already taken in this room
            const existingUser = Array.from(roomData.users.values()).find(u => u.username === username);
            if (existingUser && existingUser.userId !== userId) {
                socket.emit('error', { message: 'Username is already taken in this room' });
                return;
            }
            
            // Store user info
            socket.userId = userId;
            socket.username = username;
            socket.room = room;
            
            userSockets.set(userId, socket.id);
            
            // Add user to room
            roomData.users.set(userId, {
                userId,
                username,
                color,
                joinTime: new Date(),
                socketId: socket.id
            });
            
            roomData.lastActivity = new Date();
            
            // Join socket room
            socket.join(room);
            
            // Send welcome message to user
            socket.emit('systemMessage', {
                type: 'welcome',
                text: `Welcome to room ${room}!`,
                timestamp: new Date().toLocaleTimeString(),
                roomInfo: getRoomInfo(room)
            });
            
            // Send room history (last 50 messages)
            const recentMessages = roomData.messages.slice(-50);
            socket.emit('roomHistory', recentMessages);
            
            // Notify other users in the room
            socket.to(room).emit('userJoined', {
                username,
                userId,
                color,
                timestamp: new Date().toLocaleTimeString(),
                users: Array.from(roomData.users.values())
            });
            
            console.log(`${username} (${userId}) joined room ${room}`);
            console.log(`Room ${room} now has ${roomData.users.size} users`);
            
        } catch (error) {
            console.error('Error in joinRoom:', error);
            socket.emit('error', { message: 'Failed to join room' });
        }
    });
    
    // Handle chat messages
    socket.on('chatMessage', (data) => {
        try {
            const { id, text, sender, room, userId, color, replyTo, file, image } = data;
            
            if (!room || !sender) {
                return;
            }
            
            const roomData = chatRooms.get(room);
            if (!roomData) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }
            
            // Verify user is in room
            if (!roomData.users.has(userId)) {
                socket.emit('error', { message: 'You are not in this room' });
                return;
            }
            
            const message = {
                id: id || Date.now().toString(),
                text,
                sender,
                userId,
                color,
                room,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                replyTo,
                file,
                image,
                status: 'delivered'
            };
            
            // Store message in room history
            roomData.messages.push(message);
            roomData.lastActivity = new Date();
            
            // Keep only last 1000 messages
            if (roomData.messages.length > 1000) {
                roomData.messages = roomData.messages.slice(-1000);
            }
            
            // Broadcast to room
            socket.to(room).emit('chatMessage', message);
            
            // Send delivery confirmation to sender
            socket.emit('messageStatus', {
                messageId: message.id,
                status: 'delivered'
            });
            
            console.log(`Message in ${room} from ${sender}: ${text?.substring(0, 50)}${text?.length > 50 ? '...' : ''}`);
            
        } catch (error) {
            console.error('Error in chatMessage:', error);
        }
    });
    
    // Handle typing indicator
    socket.on('typing', (data) => {
        const { username, room } = data;
        
        if (socket.room === room) {
            socket.to(room).emit('typing', username);
        }
    });
    
    // Handle message status updates
    socket.on('messageStatus', (data) => {
        const { messageId, status, room } = data;
        
        if (socket.room === room) {
            socket.to(room).emit('messageStatus', {
                messageId,
                status
            });
        }
    });
    
    // Handle message read receipts
    socket.on('messageRead', (data) => {
        const { messageId, room } = data;
        
        if (socket.room === room) {
            socket.to(room).emit('messageStatus', {
                messageId,
                status: 'read'
            });
        }
    });
    
    // Handle file upload
    socket.on('fileUpload', (fileData, callback) => {
        try {
            const { name, size, type, room, sender } = fileData;
            
            if (!room || !sender) {
                callback({ success: false, error: 'Invalid data' });
                return;
            }
            
            const roomData = chatRooms.get(room);
            if (!roomData) {
                callback({ success: false, error: 'Room not found' });
                return;
            }
            
            // In a real application, you would save the file here
            // For now, we'll just log it and return a simulated URL
            const fileUrl = `/uploads/${Date.now()}-${name.replace(/\s+/g, '-')}`;
            
            console.log(`File upload in ${room} from ${sender}: ${name} (${size} bytes)`);
            
            // Notify room about file upload
            io.to(room).emit('fileUploaded', {
                name,
                size,
                type,
                url: fileUrl,
                sender,
                timestamp: new Date().toLocaleTimeString()
            });
            
            callback({ success: true, url: fileUrl });
            
        } catch (error) {
            console.error('Error in fileUpload:', error);
            callback({ success: false, error: error.message });
        }
    });
    
    // Handle room info request
    socket.on('getRoomInfo', (data, callback) => {
        try {
            const { room } = data;
            const roomInfo = getRoomInfo(room);
            
            if (roomInfo) {
                callback({ success: true, roomInfo });
            } else {
                callback({ success: false, error: 'Room not found' });
            }
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        const { userId, username, room } = socket;
        
        if (userId && room) {
            const roomData = chatRooms.get(room);
            
            if (roomData && roomData.users.has(userId)) {
                // Remove user from room
                roomData.users.delete(userId);
                userSockets.delete(userId);
                
                // Notify other users in the room
                if (roomData.users.size > 0) {
                    io.to(room).emit('userLeft', {
                        username,
                        userId,
                        timestamp: new Date().toLocaleTimeString(),
                        users: Array.from(roomData.users.values())
                    });
                }
                
                // Update room activity
                roomData.lastActivity = new Date();
                
                console.log(`${username} (${userId}) left room ${room}`);
                console.log(`Room ${room} now has ${roomData.users.size} users`);
                
                // If room is empty, schedule cleanup
                if (roomData.users.size === 0) {
                    console.log(`Room ${room} is now empty`);
                }
            }
        }
        
        console.log('User disconnected:', socket.id);
    });
});

// API Routes
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        
        res.json({
            success: true,
            file: {
                name: req.file.originalname,
                path: `/uploads/${req.file.filename}`,
                size: req.file.size,
                type: req.file.mimetype,
                url: `/uploads/${req.file.filename}`
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/rooms/:roomId', (req, res) => {
    try {
        const roomInfo = getRoomInfo(req.params.roomId);
        
        if (roomInfo) {
            res.json({ success: true, roomInfo });
        } else {
            res.status(404).json({ success: false, error: 'Room not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/rooms', (req, res) => {
    try {
        const rooms = Array.from(chatRooms.entries()).map(([roomId, room]) => ({
            roomId,
            userCount: room.users.size,
            createdAt: room.createdAt,
            lastActivity: room.lastActivity
        }));
        
        res.json({ success: true, rooms });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve chat interface for any room
app.get('/chat/:roomId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
}

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Uploads directory: ${uploadsDir}`);
    console.log(`💬 WebSocket ready for real-time chat`);
});
