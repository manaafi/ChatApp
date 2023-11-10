const { joinedUsersModel } = require("../models/joined-users");
const { messageModel } = require("../models/messages");
const { privateRoomModel } = require("../models/rooms");


async function joinUser(id, userName, room) {
  const model = new joinedUsersModel({
    room: room,
    userName: userName,
    userId: id,
  });
  try {
    const user = await model.save();
    return user;
  } catch (error) {
    console.log(error);
  }
}

async function onlineTextedUsers(user, globalOnlineUsers) {
  // let textedUsers = await privateRoomModel.find({ users: user }, "users")
  // for (let i of textedUsers) {
  //   console.log(i.users);
  // }
  // if (!textedUsers) {
  //   return null;
  // }
  // let filteredTextedUsers = []
  // for (let i of textedUsers) {
  //   filteredUser = globalOnlineUsers.includes(i.users[i.users.indexOf(user) + 1] || globalOnlineUsers.includes(i.users[i.users.indexOf(user) - 1]))
  //   if (filteredUser){
  //     filteredTextedUsers.push(i.users.indexOf(user));
  //   }
  // }
  // console.log(filteredTextedUsers);
  let users = await textedUsers(user);
  let onlineUsers = [];
  for (let i of users){
    if(globalOnlineUsers.find(u => u.userName === i)){
      onlineUsers.push(i);
    }
  }
  console.log("onlineTextedUsers: ",onlineUsers)
  return [onlineUsers, users];
}

async function textedUsers(user) {
  let textedUsers = await privateRoomModel.find({ users: user }, "users")
  if (!textedUsers) {
    return null;
  }
  let ret = [];
  for (let i of textedUsers) {
    for(let x of i.users){
      if(x != user){
        ret.push(x);
      }
    }
  }
  console.log("textedUsers: ", ret)
  return ret;
}

async function currentUser(id) {
  return await joinedUsersModel.findOne({ userId: id });
}

async function userLeft(id) {
  const user = await joinedUsersModel.findOne({ userId: id });
  await joinedUsersModel.deleteOne({ userId: id });
  return user;
}

async function joinedUsers(room) {
  return await joinedUsersModel.find({ room: room });
}

async function currentUserRooms(userName) {
  // console.log("function call currentUserRooms", userName)
  return await messageModel.distinct("room", { userName: userName });
}
module.exports = { joinUser, currentUser, userLeft, joinedUsers, currentUserRooms, onlineTextedUsers, textedUsers };

