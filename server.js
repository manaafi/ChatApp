try {
  const path = require("path");
  const jwt = require("jsonwebtoken");
  const bodyParser = require("body-parser");
  const http = require("http");
  const express = require("express");
  const mongoose = require("mongoose");
  // const cors = require("cors"); 
  const jwtsecret = "secretkeyappearshere";
  const { privateRoomModel } = require("./models/rooms");
  const uuid = require("uuid");
  const Joi = require("joi");
  Joi.objectId = require("joi-objectid")(Joi);
  const usersRoutes = require("./routes/users");
  const messagesRoutes = require("./routes/messages");
  const { messageModel } = require("./models/messages");
  const socketio = require("socket.io");
  const { disconnect } = require("process");

  const app = express();

  app.use(bodyParser.json());
  // app.use(cors);
  app.use("/api", usersRoutes, messagesRoutes);

  mongoose
    .connect("mongodb://127.0.0.1:27017/chatapp")
    .then(() => console.log("Now connected to MongoDB!"))
    .catch((err) => console.error("Something went wrong", JSON.stringify(err)));

  const server = http.createServer(app);
  const io = socketio(server);
  const { processMsg } = require("./utils/messages");
  const {
    joinUser,
    currentUser,
    userLeft,
    joinedUsers,
    currentUserRooms,
    onlineTextedUsers,
    textedUsers
  } = require("./utils/users");
  const { join } = require("path");

  const adminName = "Admin";
  app.all("/private/*", function (req, res, next) {
    // console.log(req.query.token);
    try {
      if (jwt.verify(req.query.token, jwtsecret)) {
        // next();
      }
    } catch (error) {
      console.log("PRIVATE ACCESS ERROR", error);
      // res.status(401);
      res.redirect("/index.html");
    }
    next();
  });
  app.use(express.static(path.join(__dirname, "public")));
  app.use("/private", express.static(path.join(__dirname, "private")));

  let globalOnlineUsers = []

  function getOnlineUser(userId) {
    let user = globalOnlineUsers.find(user => user.userId === userId);
    if (user) {
      return user
    }
    return false
  }

  io.on("connection", (socket) => {
    let firstTime = true
    socket.on("joinroom", async ({ userName, room }) => {
      // const user = await joinUser(socket.id, userName, room);
      globalOnlineUsers.push({ userName: userName, room: room, userId: socket.id })
      console.log("Connected: ", { userName: userName, room: room, userId: socket.id })
      console.log("All online users ", globalOnlineUsers)
      if (room == "018b954f-fd29-726a-9a5e-f7586c0e47a3") {
        // socket.emit("msg", await processMsg(adminName, "Welcome!", room));
        firstTime = false
        return;
      }
      console.log("eee",userName, globalOnlineUsers )
      let onlineUsers = await onlineTextedUsers(userName, globalOnlineUsers)
      // textedUsers(userName)
      socket.join(room);
      if (firstTime) {
        socket.emit("msg", await processMsg(adminName, "Welcome!", room));
        firstTime = false
        // globalOnlineUsers.push(userName)
      }

      if (!privateRoomIdCheck(room)) {
        if (await messageModel.findOne({ message: user.userName + " has joined the chat!", room: room }) == null) {
          socket.broadcast
            .to(user.room)
            .emit(
              "msg",
              await processMsg(userName, `${user.userName} has joined the chat!`, room)
            );
        }
      }

      io.to(socket.id).emit("currentRooms", {
        rooms: await currentUserRooms(userName),
      });
      
      let onlineSockets = onlineUsers[0].length ? onlineUsers[0].map(user => user.userId) : null
      console.log("online sockets", onlineSockets)
      if (onlineSockets) {
        io.to(onlineSockets).emit("joinedUsers", {
          onlineUsers: onlineUsers[0].map(user => user.userName),
        });
      }
    });

    async function privateRoomIdCheck(room) {
      let roomID = await privateRoomModel.findOne({ roomID: room });
      // console.log("roomIDcheck", roomID)
      let ret = roomID ? true : false
      return ret
    }

    socket.on("roomIDcheck", async (room, callback) => {

      // console.log("roomIDcheck", roomID)
      let ret = await privateRoomIdCheck(room);
      // console.log("roomIDcheck ret", ret)
      callback({
        status: ret
      });
    });

    socket.on('joinPrivateRoom', async ({ user1, user2 }) => {
      try {
        socket.leaveAll();
        const users = [user1, user2].sort()
        let roomID = await privateRoomModel.findOne({ users: users });
        if (roomID == null) {
          roomID = uuid.v4();
          let privateRoom = new privateRoomModel({
            roomID: roomID,
            users: users
          });
          await privateRoom.save();
          socket.join(roomID);
          socket.emit("privateRoomID", roomID);
          // const user = await joinUser(socket.id, user1, roomID);
          globalOnlineUsers.push({ userName: user1, room: roomID, userId: socket.id })
          console.log("Connected: ", { userName: userName, room: roomID, userId: socket.id })
        }
        else {
          socket.join(roomID.roomID);
          socket.emit("privateRoomID", roomID.roomID);
          // const user = await joinUser(socket.id, user1, roomID.roomID);
          globalOnlineUsers.push({ userName: userName, room: roomID.roomID, userId: socket.id })
          console.log("Connected: ", { userName: userName, room: roomID.roomID, userId: socket.id })
        }
        console.log("All online users ", globalOnlineUsers)
        socket.emit("currentRooms", {
          rooms: await currentUserRooms(user1),
        });
      } catch (error) {
        console.error('error joining dm', error);
      }
    });

    socket.on("chatmsg", async (msg, room) => {
      if (room == "018b954f-fd29-726a-9a5e-f7586c0e47a3") {
        return
      }
      const user = getOnlineUser(socket.id);
      io.to(room).emit("msg", await processMsg(user.userName, msg, room));
    });


    socket.on("imgMessage", async (img, room, message) => {
      if (room == "018b954f-fd29-726a-9a5e-f7586c0e47a3") {
        return
      }
      const user = getOnlineUser(socket.id);
      io.to(user.room).emit(
        "msg",
        await processMsg(user.userName, message, room, img)
      );
    });

    // socket.onAny((event, ...args) => {
    //   console.log(event, args);
    // });

    socket.on("disconnect", async () => {
      // const user = await userLeft(socket.id);
      // if (user) {
      // io.to(user.room).emit(
      //   "msg",
      //   await processMsg(adminName, `${user.userName} has left`, user.room)
      // );

      disconnectedUser = getOnlineUser(socket.id)

      if (disconnectedUser) {
        globalOnlineUsers = globalOnlineUsers.filter(user => user.userId != disconnectedUser.userId);
        console.log("Disconnected: ", disconnectedUser)
        console.log("All online users: ", globalOnlineUsers)
        // io.to(user.room).emit("joinedUsers", {
        //   room: user.room,
        //   users: await joinedUsers(user.room),
        // });
      }
      // }
    });



    socket.on('switchRoom', async (userName, room, callback) => {
      socket.leaveAll()
      const user = await getOnlineUser(socket.id);
      if (user) {
        globalOnlineUsers = globalOnlineUsers.filter(user => user.userId != user.userId);
        console.log("Disconnected: ", user)
        console.log("All online users: ", globalOnlineUsers)
      }
      // console.log(user);
      // io.to(socket.id).emit("currentRooms", {
      //   rooms: await currentUserRooms(userName),  
      // });
      // if(user){
      //   io.to(user.room).emit("roomUsers", {
      //     room: user.room,
      //     users: joinedUsers(user.room),
      //   });
      // }
      // socket.join(join)

      // await currentUserRooms(userName).then((room) => {callback(room)})

      const currentRooms = await currentUserRooms(userName);
      callback(currentRooms)

      // callback(await currentUserRooms(userName))
    });
  });

  const port = process.env.port || 4000;

  server.listen(4000, () => console.log(`server runnin on port ${port}`));
}
catch (error) {
  console.log("EROOOOOOOOOOOORRRRRRRR ---------- ", error);
}