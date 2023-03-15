const users = [];

function joinUser(id, name, room){
    const user = {id, name, room};

    users.push(user);

    return user;
}

function currentUser(id){
    return users.find(user => user.id === id);
}

function userLeft(id){
    const index = users.findIndex(user => user.id === id);
    if(index !== 1){
        return users.splice(index, 1)[0];
    }
}

function roomUsers(room){
    return users.filter(user => user.room === room);

}
module.exports = {joinUser, currentUser, userLeft ,roomUsers};