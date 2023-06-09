const path = require('path');

const http = require('http');
const express = require('express');

const socketio = require('socket.io');
const { disconnect } = require('process');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const formatMsg = require('./utils/messages');
const {joinUser, currentUser,userLeft ,roomUsers} = require('./utils/users');

const adminName = 'Admin';

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket =>{

    socket.on('joinroom', ({username, room}) => {
        const user = joinUser(socket.id, username, room);
        socket.join(room);    


        socket.emit('msg', formatMsg(adminName, 'Welcome!'));
        socket.broadcast.to(user.room).emit('msg', formatMsg(adminName, `${username} has joined the chat!`));

        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: roomUsers(user.room),
        });

    });

    
    socket.on('chatmsg', (msg) => {
        const user = currentUser(socket.id);
        io.to(user.room).emit('msg', formatMsg(user.name, msg));
    });

    socket.on('disconnect', () => {
        const user = userLeft(socket.id);
        if(user){
            io.to(user.room).emit('msg', formatMsg(adminName, `${user.name} has left`));

            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: roomUsers(user.room),
            });
        }
    });
});


const port = process.env.port || 3000;

server.listen(port, () => console.log(`server runnin on port ${port}`));

