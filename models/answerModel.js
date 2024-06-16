const mongoose = require('mongoose');
const moment = require('moment');

const AnswerSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  answers: [String],
  createdAt: {
    type: String,
    default: moment().format('DD MMM YYYY'),
  },
});

module.exports = mongoose.model('Answer', AnswerSchema);
