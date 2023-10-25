const { joinedUsersModel } = require("../models/joined-users");
const { messageModel } = require("../models/messages");

async function joinUser(id, userName, room) {
  const model = new joinedUsersModel({
    room: room,
    userName: userName,
    userId: id,
  });
  const user = await model.save();
  return user;
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

async function currentUserRooms(userName){
  console.log("function call currentUserRooms", userName)
  return await messageModel.distinct("room", { userName: userName });
}
module.exports = { joinUser, currentUser, userLeft, joinedUsers, currentUserRooms };

