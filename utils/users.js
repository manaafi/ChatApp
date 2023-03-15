const users = [];

function joinuser(id, name, room){
    const user = {id, name, room};

    users.push(user);

    return user;
}

function getCurrentUser(id){
    users.find(user => user.id == id)
}