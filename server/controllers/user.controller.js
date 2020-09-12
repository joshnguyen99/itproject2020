const User = require("../models/user.model");

// Get all users (as an array of usernames)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).send(
      users.map(user => {
        return user.username;
      })
    );
  } catch (err) {
    req.status(400).json(err);
  }
};

// Get the currently logged in user
const getCurrentUser = (req, res) => {
  if (req.user) {
    res.status(200).send(req.user.toObject());
  } else {
    res.status(404).json("Not found");
  }
};

// Change the details of an authenticated user
const changeUserDetails = (req, res) => {
  if (req.user) {
    const firstName = req.body.firstName;
    const middleName = req.body.middleName;
    const lastName = req.user.lastName;
    const email = req.user.email;
    const user = req.user;
    user.firstName = firstName ? firstName : user.firstName;
    user.middleName = middleName ? middleName : user.middleName;
    user.lastName = lastName ? lastName : user.lastName;
    user.email = email ? email : user.email;
    user
      .save()
      .then(() => res.sendStatus(200))
      .catch(err => res.status(400).json(err));
  } else {
    res.status(400).json("No user detected");
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  if (req.user && req.user._id) {
    User.findByIdAndDelete(req.user._id)
      .then(() => res.sendStatus(200))
      .catch(err => res.status(400).json(err));
  } else {
    res.status(400).json("No user detected");
  }
};

// Add a new user to the database
const createUser = async (req, res) => {
  try {
    // Create a new user
    const username = req.body.username;
    const password = req.body.password;
    const firstName = req.body.firstName;
    const middleName = req.body.middleName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const newUser = new User({
      username,
      firstName,
      middleName,
      lastName,
      password,
      email,
    });

    // Save the new User to the database
    // Create an authentication token
    const token = await newUser.generateAuthToken();

    res.status(201).send({
      user: newUser.toObject(),
      token,
    });
  } catch (err) {
    if (err.code == 11000) {
      res.status(400).json("Username already exists.");
    } else if (err.message) {
      res.status(400).json(err.message);
    } else {
      res.status(400).json(err);
    }
  }
};

// Log in to existing user
const loginUser = async (req, res) => {
  try {
    // Get username and password from the request body
    // and find the user in the database
    const { username, password } = req.body;
    const user = await User.findByCredentials(username, password);
    const token = await user.generateAuthToken();
    res.status(200).send({
      user: user.toObject(),
      token,
    });
  } catch (err) {
    res.status(401).json("Incorrect username or password.");
  }
};

// Log out a user
const logoutUser = async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => {
      return token.token != req.token;
    });
    await req.user.save();
    res.status(200).send();
  } catch (err) {
    res.status(400).json(err);
  }
};

module.exports = {
  createUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  deleteUser,
  getAllUsers,
  changeUserDetails,
};
