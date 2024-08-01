const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle socket.io connections
io.on('connection', (socket) => {
  console.log('a user connected');

  // Handle chat messages
  socket.on('chat message', (msg) => { 
    console.log('message: ' + msg);
    // Broadcast the message to everyone
    socket.broadcast.emit('chat message', msg);
  });

  
  socket.on('typing', (username) => {
    console.log("user is typing......");
   // socket.broadcast.emit('typing', 'text is here');
    socket.broadcast.emit('typing');

});

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Serve index.html for any other GET request
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public' , 'anchor.html'));
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
