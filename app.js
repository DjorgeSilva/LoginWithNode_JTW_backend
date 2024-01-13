const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("./models/index");

require("dotenv").config();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "is connected",
  });
});

app.post("/auth/register", async (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name) {
    return res.status(422).json({
      error: "name is required",
    });
  }

  if (!email) {
    return res.status(422).json({
      error: "email is required",
    });
  }

  if (!password) {
    return res.status(422).json({
      error: "password is required",
    });
  }

  if (!confirmPassword) {
    return res.status(422).json({
      error: "confirmPassword is required",
    });
  }

  if (password !== confirmPassword) {
    return res.status(422).json({
      error: "password and confirmPassword should match.",
    });
  }

  //check if user exists
  const userExists = await UserModel.findOne({
    email,
  });

  if (userExists) {
    return res.status(422).json({
      msg: "email is already in use",
    });
  }

  // create and save user with encrypted password
  const hash = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, hash);

  const newUser = new UserModel({
    name,
    email,
    password: hashedPassword,
  });

  try {
    newUser.save();
  } catch (e) {
    return res.status(500).json({
      error: "error when posting new user",
    });
  }
  next();
});

mongoose
  .connect(process.env.URI)
  .then(() => {
    app.listen(process.env.PORT);
    console.log("database is connected, PORT: ", process.env.PORT);
  })
  .catch((error) => {
    console.log(error);
  });
