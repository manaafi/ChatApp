const path = require("path");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const http = require("http");
const express = require("express");
const mongoose = require("mongoose");

const jwtsecret = "secretkeyappearshere";

const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const usersRoutes = require("./routes/users");
const messagesRoutes = require("./routes/messages");

const socketio = require("socket.io");
const { disconnect } = require("process");

const app = express();

app.use(bodyParser.json());

app.use("/api", usersRoutes, messagesRoutes);

mongoose
  .connect("mongodb://127.0.0.1:27017/chatapp")
  .then(() => console.log("Now connected to MongoDB!"))
  .catch((err) => console.error("Something went wrong", err));

const server = http.createServer(app);
const io = socketio(server);
const { processMsg } = require("./utils/messages");
const {
  joinUser,
  currentUser,
  userLeft,
  joinedUsers,
  currentUserRooms,
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

io.on("connection", (socket) => {
  socket.on("joinroom", async ({ username: userName, room }) => {
    const user = await joinUser(socket.id, userName, room);
    socket.join(room);
    socket.emit("msg", await processMsg(adminName, "Welcome!", room));
    socket.broadcast
      .to(user.room)
      .emit(
        "msg",
        await processMsg(userName, `${user.userName} has joined the chat!`, room)
      );


    io.to(socket.id).emit("currentRooms", {
      rooms: await currentUserRooms(userName),
    });

    io.to(user.room).emit("joinedUsers", {
      users: await joinedUsers(user.room),
    });
  });

  socket.on("chatmsg", async (msg, room) => {
    const user = await currentUser(socket.id);
    io.to(user.room).emit("msg", await processMsg(user.userName, msg, room));
  });

  socket.on("imgMessage", async (img, room, message) => {
    const user = await currentUser(socket.id);
    io.to(user.room).emit(
      "msg",
      await processMsg(user.userName, message, room, img)
    );
  });

  socket.onAny((event, ...args) => {
    console.log(event, args);
  });

  socket.on("disconnect", async () => {
    const user = await userLeft(socket.id);
    if (user) {
      io.to(user.room).emit(
        "msg",
        await processMsg(adminName, `${user.userName} has left`, user.room)
      );

      io.to(user.room).emit("joinedUsers", {
        room: user.room,
        users: await joinedUsers(user.room),
      });
    }
  });

  socket.on('switchRoom', async ({ userName, room }) => {
    socket.leaveAll()
    const user = await userLeft(socket.id);
    console.log(user);
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
  });
});

const port = process.env.port || 4000;

server.listen(4000, () => console.log(`server runnin on port ${port}`));
