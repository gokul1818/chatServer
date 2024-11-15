const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const Message = require('./models/Message'); // Import the Message model

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  },
});

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

io.on('connection', (socket) => {
  console.log('A user connected');

  // Join a specific chat room
  socket.on('joinRoom', async (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);

    // Send existing messages to the client when they join a room
    const messages = await Message.find({ roomId });
    socket.emit('previousMessages', messages);
  });

  // Handle sending a message to a specific room
  socket.on('sendMessage', async ({ roomId, username, message }) => {
    const newMessage = new Message({ roomId, username, message });
    await newMessage.save(); // Save the message to the database

    io.to(roomId).emit('receiveMessage', newMessage); // Send the message to all users in the room
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
