const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Configure file uploads
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store active users
const activeUsers = {};

io.on('connection', (socket) => {
    console.log('New user connected');
    
    // Handle joining a room
    socket.on('joinRoom', (data) => {
        const { username, room } = data;
        
        // Store user info
        socket.username = username;
        socket.room = room;
        
        // Join the room
        socket.join(room);
        
        // Add to active users
        if (!activeUsers[room]) {
            activeUsers[room] = [];
        }
        activeUsers[room].push(username);
        
        // Notify room that user joined
        socket.to(room).emit('userJoined', username);
        
        // Send welcome message
        socket.emit('systemMessage', {
            text: `Welcome to chat room ${room}!`,
            timestamp: new Date().toLocaleTimeString()
        });
        
        console.log(`${username} joined room ${room}`);
    });
    
    // Handle chat messages
    socket.on('chat message', (data) => {
        const { room, id, text, sender, replyTo, file } = data;
        
        // Broadcast to room
        socket.to(room).emit('chat message', {
            id,
            text,
            sender,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            replyTo,
            file,
            status: 'delivered'
        });
        
        console.log(`Message in ${room} from ${sender}: ${text}`);
    });
    
    // Handle typing indicator
    socket.on('typing', (data) => {
        const { username, room } = data;
        socket.to(room).emit('typing', username);
    });
    
    // Handle message status updates
    socket.on('messageStatus', (data) => {
        const { messageId, status, room } = data;
        socket.to(room).emit('messageStatus', {
            messageId,
            status
        });
    });
    
    // Handle message read receipts
    socket.on('messageRead', (data) => {
        const { messageId, room } = data;
        socket.to(room).emit('messageStatus', {
            messageId,
            status: 'read'
        });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        if (socket.username && socket.room) {
            // Remove from active users
            const roomUsers = activeUsers[socket.room];
            if (roomUsers) {
                const index = roomUsers.indexOf(socket.username);
                if (index !== -1) {
                    roomUsers.splice(index, 1);
                }
                
                // Notify room that user left
                socket.to(socket.room).emit('userLeft', socket.username);
                
                console.log(`${socket.username} left room ${socket.room}`);
            }
        }
    });
    
    // Handle file uploads
    socket.on('fileUpload', (fileData, callback) => {
        const { name, data, room } = fileData;
        const filePath = path.join(__dirname, 'uploads', name);
        
        fs.writeFile(filePath, data, (err) => {
            if (err) {
                console.error('File upload error:', err);
                callback({ success: false });
            } else {
                console.log(`File uploaded to ${room}: ${name}`);
                callback({ success: true, path: `/uploads/${name}` });
                
                // Notify room about new file
                io.to(room).emit('fileUploaded', {
                    name,
                    path: `/uploads/${name}`,
                    sender: socket.username,
                    timestamp: new Date().toLocaleTimeString()
                });
            }
        });
    });
});

// File upload route
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    res.json({
        success: true,
        file: {
            name: req.file.originalname,
            path: `/uploads/${req.file.filename}`,
            size: req.file.size,
            type: req.file.mimetype
        }
    });
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
