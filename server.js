const path = require('path');

const http = require('http');
const express = require('express');

const socketio = require('socket.io');
const { disconnect } = require('process');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket =>{
    socket.emit('msg', 'welcome');

    socket.broadcast.emit('msg', 'some1 has joined the chat');

    socket.on('disconnect', () => {
        io.emit('msg', 'some1 disconnected');
    });

    socket.on('chatmsg', (msg) => {
        io.emit('msg', msg);
    });
});


const port = process.env.port || 3000;

server.listen(port, () => console.log(`server runnin on port ${port}`));

