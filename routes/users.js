const jwt = require("jsonwebtoken");
const { UserModel, validate } = require("../models/user");
const { messageModel } = require("../models/messages");
const express = require("express");
const router = express.Router();
const { processMsg } = require("../utils/messages");
require('dotenv').config();

const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'manafek2000@gmail.com',
    pass: process.env.GMAIL_PASSWORD
  }
});


async function otpGenerator(user) {
  user.otp = Math.floor(100000 + Math.random() * 900000).toString()
  try {
    await user.save();
  } catch (error) {
    console.log(error)
    return;
  }
  let mailOptions = {
    from: 'manafek2000@gmail.com',
    to: user.email,
    subject: 'ChatCord: OTP for verification',
    text: 'Your OTP is: ' + user.otp
  };
  
  // transporter.sendMail(mailOptions, function(error, info){
  //   if (error) {
  //     console.log(error);
  //   } else {
  //     console.log('Email sent: ' + info.response);
  //   }
  // });
}
 
router.post("/signup", async (req, res) => {
  const { error } = validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  if (req.body.name == "Admin") {
    return res
      .status(400)
      .send({ message: "Cannot create an account with that name." });
  }
  let user = await UserModel.findOne({ email: req.body.email });
  if (user) {
    if (user.verified) {
      res.status(400).send({ message: "That user already exisits!" });
    }
    else{
      await otpGenerator(user)
      res.status(200).send({ message: "An account with the email already exists, though it has not been verified. Please enter the OTP you have recieved in your mail in the next page.", otpRedirect: true });
    }
  }
  else {
    user = new UserModel({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });
    await otpGenerator(user)
    res.status(200).send({ message: "Successfully registered.", otpRedirect: true });
  }
});

router.post("/login", async (req, res) => {
  let user = await UserModel.findOne({ email: req.body.email });
  if (user) {
    if (req.body.password == user.password) {
      if (!user.verified) {
        await otpGenerator(user)
        return res.status(400).send({ message: "Account has not yet been verfied, please enter the OTP you'll recieve in the next page.", otpRedirect: true });
      }
      let token, room = await messageModel.findOne({ userName: req.body.email }, 'room').sort('-time');;
      try {
        token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
          expiresIn: "24h",
        });
        res.status(200).send({ token: token, room: room? room.room: null });
      } catch (err) {
        console.log(err);
        return { message: "Error! Something went wrong." };
      }
    } else {
      return res.status(400).send({ message: "Wrong password" });
    }
  } else {
    return res.status(400).send({ message: "Account does not exist" });
  }
});

router.post("/tokenCheck", async (req, res) => {
  // console.log(req.body)
  // if (req.body.hasOwnProperty("token")) {
  try {
    let payload = jwt.verify(req.body.token, process.env.JWT_SECRET);
    if (payload) {
      // console.log(payload);
      res.send({ message: "Token Valid" });
    }
  } catch (error) {
    if (error.message == "jwt must be provided") {
      res.status(200);
    } else if (error.message == "invalid signature") {
      res.status(400).send({ message: "Invalid Session" });
    } else if (error.message == "jwt expired") {
      res.status(400).send({ message: "Session Expired" });
    } else {
      console.log("token check error", error.message);
      res
        .status(400)
        .send({ message: "An error occured, please login again." });
    }
  }
  // }
});

router.get("/listallusers", async (req, res) => {
  try {
    if (jwt.verify(req.query.token, process.env.JWT_SECRET)) {
      UserModel.find({ email: { $regex: "^" + req.query.userName } }, "email")
        .then((users) => {
          res.status(200).send(users);
        })
        .catch((err) => {
          res.status(500).send(err);
        });
      // UserModel.find({}, "name email password")  FIND ALL USERS
      //   .then((users) => {
      //     res.status(200).send(users);
      //   })
      //   .catch((err) => {
      //     res.status(500).send(err);
      //   });
    }
  } catch (error) {
    if (error.message == "jwt must be provided") {
      res.status(200);
    } else if (error.message == "invalid signature") {
      res.status(400).send({ message: "Invalid Session" });
    } else if (error.message == "jwt expired") {
      res.status(400).send({ message: "Session Expired" });
    } else {
      console.log("AAA", error.message);
      res
        .status(400)
        .send({ message: "An error occured, please login again." });
    }
  }
});

router.post("/addRoom", async (req, res) => {
  try {
    if (jwt.verify(req.body.token, process.env.JWT_SECRET)) {
      if (await messageModel.findOne({ room: { $regex: new RegExp('^' + req.body.room.trim() + '$', 'i') } })) {
        res.status(200).send({ message: "Room already exists!" });
      } else {
        const message = await processMsg(
          req.body.userName,
          req.body.userName + " has created this room",
          req.body.room
        );
        res.status(200).send({ message: "Room Created" });
      }
    }
  } catch (error) {
    if (error.message == "jwt must be provided") {
      res.status(200);
    } else if (error.message == "invalid signature") {
      res.status(400).send({ message: "Invalid Session" });
    } else if (error.message == "jwt expired") {
      res.status(400).send({ message: "Session Expired" });
    } else {
      console.log(error.message);
      res.status(400).send({ message: "An error occured, please try again." });
    }
  }
});

router.get("/chats", async (req, res) => {
  try {
    if (jwt.verify(req.body.token, process.env.JWT_SECRET)) {
      const test = await messageModel.distinct("room", { userName: req.body.userName });
      res.status(200).send(test);
    }
  } catch (error) {
    if (error.message == "jwt must be provided") {
      res.status(200);
    } else if (error.message == "invalid signature") {
      res.status(400).send({ message: "Invalid Session" });
    } else if (error.message == "jwt expired") {
      res.status(400).send({ message: "Session Expired" });
    } else {
      console.log("AAA", error.message);
      res
        .status(400)
        .send({ message: "An error occured, please login again." });
    }
  }
});

router.post("/verifyAccount", async (req, res) => {
  let user = await UserModel.findOne({ email: req.body.email });
  if (user && user.password == req.body.password) {
    if (user.verified) {
      res.status(400).send({ message: "User Already Verified", homeRedirect: true });
    }
    else if (user.otp == req.body.otp) {
      user.verified = true;
      await user.save();
      return res.status(200).send({ message: "User Verified", homeRedirect: true });
    }
    else {
      otpGenerator(user)
      return res.status(400).send({ message: "Incorrect OTP. A new OTP has been sent to your mail.", homeRedirect: false });
    }
  }
  else {
    return res.status(404)
  }
});

module.exports = router;
