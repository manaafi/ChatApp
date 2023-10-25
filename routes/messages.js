const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { messageModel } = require("../models/messages");
const {fetchGifs} = require("../utils/messages");

const jwtsecret = "secretkeyappearshere";

router.get("/retrieveHistory", async (req, res) => {
  try {
    if (jwt.verify(req.query.token, jwtsecret)) {
      allMessages = await messageModel.find({ room: req.query.room });
      res.status(200).send(allMessages);
    }
  } catch (error) {
    // console.log(error.message);
    if (error.message == "invalid signature") {
      res.status(400).send({ message: "Invalid Session" });
    } else if (error.message == "jwt expired") {
      res.status(400).send({ message: "Session Expired" });
    } else {
      console.log(error);
      res
        .status(400)
        .send({ message: "An error occured, please login again." });
    }
  }
});

router.get("/searchGifs", async (req, res) => {
  console.log(req.query.token, req.query.search)
  try {
    if (jwt.verify(req.query.token, jwtsecret)) {
      const gifUrls = await fetchGifs(req.query.search)
      res.status(200).send(gifUrls)
    }
  } catch (error) {
    console.log(error.message);
    if (error.message == "invalid signature") {
      res.status(400).send({ message: "Invalid Session" });
    } else if (error.message == "jwt expired") {
      res.status(400).send({ message: "Session Expired" });
    } else {
      console.log(error);
      res
        .status(400)
        .send({ message: "An error occured, please login again." });
    }
  }
});


module.exports = router;
