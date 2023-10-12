const jwt = require("jsonwebtoken");
const { UserModel, validate } = require("../models/user");
const express = require("express");
const router = express.Router();

const jwtsecret = "secretkeyappearshere";

router.post("/signup", async (req, res) => {
  // First Validate The Request
  //console.log(req.body)
  const { error } = validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  // Check if this user already exisits
  let user = await UserModel.findOne({ email: req.body.email });
  if (user) {
    //console.log(user.password);
    return res.status(400).send("That user already exisits!");
  } else {
    // Insert the new user if they do not exist yet
    user = new UserModel({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });
    await user.save();
    res.send(user);
  }
});

router.post("/login", async (req, res) => {
  let user = await UserModel.findOne({ email: req.body.email });
  if (user) {
    if (req.body.password == user.password) {
      let token;
      try {
        token = jwt.sign(
          { userId: user.id, email: user.email },
          jwtsecret,
          { expiresIn: "1h" }
        );
        return res.status(200).send({ token: token });
      } catch (err) {
        console.log(err);
        const error = new Error("Error! Something went wrong.");
        return (error);
      }
    } else {
      return res.status(400).send({ response: "Wrong password" });
    }
  } else {
    return res.status(400).send({ response: "Account does not exist" });
  }
});

router.post("/listallusers", async (req, res) => {
  try {
    if(jwt.verify(req.body.token,jwtsecret)){
      /*allusers = UserModel.find({}, 'name email password');
      console.log(allusers)
      return res.status(200).send(UserModel.find({}));*/
      UserModel.find({}, 'name email password')
      .then(users => {
          res.status(200).send(users);
      })
      .catch(err => {
          res.status(500).send(err);
      });
      }
    }
   catch (error) {
    console.log(error)
  }
});


module.exports = router;
