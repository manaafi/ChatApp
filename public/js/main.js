const formdom = document.getElementById('chat-form');
const socket = io();

socket.on('msg', message => {
    console.log(message);
    outputMsg(message);
})

formdom.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = e.target.elements.msg.value;
    socket.emit('chatmsg', msg)
});

function outputMsg(message){
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta">Brad <span>9:12pm</span></p>
    <p class="text">
        ${message}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
}