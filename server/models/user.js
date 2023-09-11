const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    default: "0000",
  },
  email: {
    type: String,
    default: "oos@mail.com",
  },
});

module.exports = mongoose.model("User", UserSchema);
