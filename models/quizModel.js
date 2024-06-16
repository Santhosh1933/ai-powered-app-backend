const mongoose = require("mongoose");
const moment = require("moment");

const QuizSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
  },
  questions: [Object],
  isCompleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: String,
    default: moment().format("DD MMM YYYY"),
  },
});

module.exports = mongoose.model("Quiz", QuizSchema);
