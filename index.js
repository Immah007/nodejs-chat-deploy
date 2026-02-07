const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store active rooms and users
const chatRooms = new Map(); // roomId -> { users: Map, messages: Array }
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
            socket.userId = userId;
            socket.username = username;
            socket.room = room;
            
            socket.join(room);
            
            // Send welcome message
            socket.emit('systemMessage', {
                text: `Welcome to room ${room}!`,
                timestamp: new Date().toLocaleTimeString()
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
            
            console.log(`${username} joined room ${room}`);
            
        } catch (error) {
            console.error('Error in joinRoom:', error);
            socket.emit('error', { message: 'Failed to join room' });
        }
    });
    
    // Handle chat messages
    socket.on('chatMessage', (data) => {
        try {
            const { id, text, sender, room, userId, color, file, image } = data;
            
            if (!room || !sender) {
                return;
            }
            
            const roomData = chatRooms.get(room);
            if (!roomData) {
                socket.emit('error', { message: 'Room not found' });
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
            
            console.log(`Message in ${room} from ${sender}`);
            
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
    
    // Handle disconnection
    socket.on('disconnect', () => {
        const { userId, username, room } = socket;
        
        if (userId && room) {
            const roomData = chatRooms.get(room);
            
            if (roomData && roomData.users.has(userId)) {
                // Remove user from room
                roomData.users.delete(userId);
                
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
                
                console.log(`${username} left room ${room}`);
            }
        }
        
        console.log('User disconnected:', socket.id);
    });
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
