const mongoose = require("mongoose");
const moment = require("moment");

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  plan: {
    type: String,
    enum: ["free", "premium"],
    default: "free",
  },
  createdAt: {
    type: String,
    default: moment().format("DD MMM YYYY"),
  },
});

module.exports = mongoose.model("User", UserSchema);
