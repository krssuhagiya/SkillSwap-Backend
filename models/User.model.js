const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    minlength: [3, "Username must be at least 3 character long"],
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    minlength: [7, "Email must be at least 7 character long"],
  },
  password: {
    type: String,
    required: true,
    trim: true, 
    minlength: [5, "Password must be at least 5 character long"],
  },
});

const user = mongoose.model("User", userSchema);

module.exports = user;
