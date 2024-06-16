const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userModel = require("./models/userModel");
const quizModel = require("./models/quizModel");
const answerModel = require("./models/answerModel");

dotenv.config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});

// initial Route
app.get("/", (req, res) => {
  return res.send("Home").status(200);
});

app.get("/user", async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res
      .status(400)
      .json({ message: "userId query parameter is required" });
  }
  try {
    let user = await userModel.findOne({ userId });
    if (user) {
      return res.status(200).json(user);
    } else {
      user = new userModel({ userId });
      const newUser = await user.save();
      return res.status(201).json(newUser);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/quizzes", async (req, res) => {
  const { userId, questions, level, description, title } = req.body;

  if (!userId || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ message: "Invalid data" });
  }

  try {
    const user = await userModel.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const quizCount = await quizModel.countDocuments({
      userId,
    });
    const maxQuizzes = user.plan === "premium" ? 10 : 5;
    if (quizCount >= maxQuizzes) {
      return res.status(403).json({
        message: `User with ${user.plan} plan can only create up to ${maxQuizzes} quizzes`,
      });
    }
    const quiz = new quizModel({
      userId,
      questions,
      level,
      description,
      title,
    });
    const newQuiz = await quiz.save();
    res.status(201).json(newQuiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/quizzes", async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res
      .status(400)
      .json({ message: "userId query parameter is required" });
  }
  try {
    const quizzes = await quizModel.find({ userId });
    res.status(200).json(quizzes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/quizzes/:userId/:quizId", async (req, res) => {
  const { userId, quizId } = req.params;
  try {
    const quiz = await quizModel.findOne({ _id: quizId, userId });
    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found or user is not responsible for this quiz",
      });
    }
    res.status(200).json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/answers", async (req, res) => {
  const { userId, quizId, answers } = req.body;
  if (!userId || !quizId || !Array.isArray(answers)) {
    return res.status(400).json({ message: "Invalid data" });
  }
  try {
    const quiz = await quizModel.findOne({ _id: quizId, userId });
    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found or user is not responsible for this quiz",
      });
    }
    let answerDoc = await answerModel.findOne({ userId, quizId });
    if (answerDoc) {
      answerDoc.answers = answers;
      await answerDoc.save();
    } else {
      answerDoc = new answerModel({ userId, quizId, answers });
      await answerDoc.save();
    }
    quiz.isCompleted = true;
    await quiz.save();
    res.status(201).json(answerDoc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/quizzes/review/:userId/:quizId", async (req, res) => {
  const { userId, quizId } = req.params;

  try {
    const quiz = await quizModel.findOne({ _id: quizId, userId });
    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found or user is not responsible for this quiz",
      });
    }

    const answers = await answerModel.findOne({ userId, quizId });
    if (!answers) {
      return res
        .status(404)
        .json({ message: "Answers not found for this quiz" });
    }

    let totalScore = 0;

    const detailedResults = quiz.questions.map((question, index) => {
      const isCorrect = answers.answers[index] === question.answer;
      if (isCorrect) {
        totalScore++;
      }
      return {
        question: question.question,
        userAnswer: answers.answers[index],
        correctAnswer: question.answer,
        explanation: question.explanation,
        isCorrect,
      };
    });
    const response = {
      title: quiz.title,
      description: quiz.description,
      level: quiz.level,
      createdAt: quiz.createdAt,
      questions: detailedResults,
      totalScore
    };
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
