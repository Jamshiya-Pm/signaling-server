const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const users = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Store the user's socket ID
    socket.on('register', (userId) => {
        users[userId] = socket.id;
    });

    // Handle signaling data
    socket.on('signal', (data) => {
        const targetSocketId = users[data.target];
        if (targetSocketId) {
            io.to(targetSocketId).emit('signal', {
                sender: socket.id,
                signal: data.signal,
            });
        }
    });

    // Handle call initiation
    socket.on('initiateCall', (data) => {
        const targetSocketId = users[data.target];
        if (targetSocketId) {
            io.to(targetSocketId).emit('incomingCall', {
                caller: socket.id,
                offer: data.offer,
            });
        }
    });

    // Handle call acceptance
    socket.on('acceptCall', (data) => {
        const targetSocketId = users[data.target];
        if (targetSocketId) {
            io.to(targetSocketId).emit('callAccepted', {
                callee: socket.id,
                answer: data.answer,
            });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (const [userId, socketId] of Object.entries(users)) {
            if (socketId === socket.id) {
                delete users[userId];
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Signaling server running on port ${PORT}`);
});
