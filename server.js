const path = require('path');

const http = require('http');
const express = require('express');

const socketio = require('socket.io');
const { disconnect } = require('process');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const formatMsg = require('./utils/messages');

const adminName = 'Admin';

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket =>{
    socket.emit('msg', formatMsg(adminName, 'Welcome!'));

    socket.broadcast.emit('msg', formatMsg(adminName, 'some1 has joined the chat'));

    socket.on('disconnect', () => {
        io.emit('msg', formatMsg(adminName,'some1 disconnected'));
    });

    socket.on('chatmsg', (msg) => {
        io.emit('msg', formatMsg('User', msg));
    });
});


const port = process.env.port || 3000;

server.listen(port, () => console.log(`server runnin on port ${port}`));

