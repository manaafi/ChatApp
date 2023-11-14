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
  let users = await textedUsers(user);
  let onlineUsers = [];
  for (let i of users) {
    if (globalOnlineUsers.find(u => u.userName === i)) {
      onlineUsers.push(i);
    }
  }
  // console.log("onlineTextedUsers: ",onlineUsers, "textedUsers: ", users)
  return [onlineUsers, users];
}

async function textedUsers(user) {
  let ret = []
   await privateRoomModel.aggregate(
    [
      {
        '$match': {
          'users': user
        }
      }, {
        '$lookup': {
          'as': 'messages', 
          'from': 'messages', 
          'foreignField': 'room', 
          'localField': 'roomID'
        }
      }, {
        '$sort': {
          'messages.time': -1
        }
      }, {
        '$project': {
          'roomID': '$roomID', 
          'users': {
            '$filter': {
              'input': '$users', 
              'as': 'user', 
              'cond': {
                '$ne': [
                  '$$user', user
                ]
              }
            }
          }
        }
      }
    ])
    .then((users) => {
      for (let i of users){
        ret.push(i.users[0]);
      }
    })
  console.log("textedUsers: ", ret)
  // let textedUsers = await privateRoomModel.find({ users: user }, "users")
  // if (!textedUsers) {
  //   return null;
  // }
  // let ret = [];
  // for (let i of textedUsers) {
  //   for (let x of i.users) {
  //     if (x != user) {
  //       ret.push(x);
  //     }
  //   }
  // }
  // console.log("textedUsers: ", ret)
  return ret;
}

async function lastTexted(userName) {
  messageModel.findOne({ userName: userName }).sort('-time').then(function (lastTextedUser) {
    console.log(userName, " has last texted", lastTextedUser)
  }).catch(function (err) { console.log(err) })

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
module.exports = { joinUser, currentUser, userLeft, joinedUsers, currentUserRooms, onlineTextedUsers, textedUsers, lastTexted };

