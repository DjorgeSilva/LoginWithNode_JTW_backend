const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("./models/index");

require("dotenv").config();

const app = express();
app.use(express.json());

function checkToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      error: "access declined",
    });
  }
  try {
    const secret = process.env.SECRET;
    jwt.verify(token, secret);
    next();
  } catch (error) {
    res.status(400).json({
      error: "invalid token",
    });
  }
}

// Private Routes
app.get("/user/:id", checkToken, async (req, res) => {
  const id = req.params.id;
  const user = await UserModel.findById(id, "-password");
  if (!user) {
    return res.status(404).json({
      error: "user not found",
    });
  }
  res.status(200).json({
    user,
  });
});

// Main Route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "is connected",
  });
});

// Register Route
app.post("/auth/register", async (req, res) => {
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
    return res.status(201).json({
      msg: "user created successfully",
    });
  } catch (e) {
    return res.status(500).json({
      error: "error when posting new user",
    });
  }
});

// Login Route
app.post("/auth/user", async (req, res) => {
  const { email, password } = req.body;
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

  // check if user exists
  const userExists = await UserModel.findOne({
    email,
  });

  if (!userExists) {
    return res.status(404).json({
      error: "provide a valid email",
    });
  }

  // check if password match
  const checkedPassword = await bcrypt.compare(password, userExists.password);
  if (!checkedPassword) {
    return res.status(404).json({
      error: "password is not valid",
    });
  }

  try {
    const token = jwt.sign(
      {
        id: userExists._id,
      },
      process.env.SECRET
    );
    res.status(200).json({
      msg: "logged successfully",
      token: token,
    });
  } catch (e) {
    return res.status(404).json({
      error: `when logging, ${e}`,
    });
  }
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
