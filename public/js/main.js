const chatboxdom = document.getElementById('chat-form');
const roomdom = document.getElementById('room-name');
const userlistdom = document.getElementById('users');
const socket = io();
const chatdiv = document.querySelector('.chat-messages');

const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});
socket.emit('joinroom', {username, room});

socket.on('roomUsers', ({room, users}) => {
    outputRooms(room);
    outputUsers(users);
})

socket.on('msg', message => {
    outputMsg(message);
    chatdiv.scrollTop = chatdiv.scrollHeight;
})

chatboxdom.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = e.target.elements.msg.value;
    socket.emit('chatmsg', msg)
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});

function outputMsg(message){
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">
        ${message.text}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
}

function outputRooms(room){
    roomdom.innerText = room;
}

function outputUsers(users){
    userlistdom.innerHTML = `${users.map(user => `<li>${user.name}</li>`).join('')}`;
}