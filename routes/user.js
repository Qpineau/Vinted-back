const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const express = require("express");
const router = express.Router();
const formidable = require("express-formidable");
const app = express();
app.use(formidable());
const cloudinary = require("cloudinary").v2;

const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  const { password, email, username, phone } = req.fields;
  const salt = uid2(16);
  const hash = SHA256(password + salt).toString(encBase64);
  const token = uid2(16);
  const checkUser = await User.findOne({ email: email });

  try {
    if (checkUser) {
      res.status(401).json({ message: "Email already exists" });
    } else {
      if (email && username && password) {
        let pictureToUpload = req.files.picture.path;
        const result = await cloudinary.uploader.upload(pictureToUpload, {
          folder: `/Vinted/Users/Avatar`,
        });
        const newUser = new User({
          email: email,
          account: { username: username, phone: phone, avatar: result },
          token: token,
          salt: salt,
          hash: hash,
        });
        await newUser.save();
        const dataUser = {
          token: newUser.token,
          _id: newUser._id,
          account: {
            username: newUser.account.username,
            phone: newUser.account.phone,
          },
        };
        res.status(200).json(dataUser);
      } else {
        res.status(400).json({ message: "missing parameters" });
      }
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.fields;
    const checkUser = await User.findOne({ email: email });
    const hashed = SHA256(password + checkUser.salt).toString(encBase64);

    if (hashed === checkUser.hash && checkUser.email === email) {
      const dataUser = {
        token: checkUser.token,
        _id: checkUser._id,
        account: {
          username: checkUser.account.username,
          phone: checkUser.account.phone,
        },
      };
      res.status(200).json(dataUser);
    } else {
      res.status(401).json({ message: "Invalid email and/or password" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
