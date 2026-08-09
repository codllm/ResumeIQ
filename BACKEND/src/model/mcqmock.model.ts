import mongoose, { Schema, Document } from "mongoose";
import { number } from "zod";

export interface IMcqMockQuestion extends Document {
  interviewReport: mongoose.Types.ObjectId;
  category: string;
  question: string;
  options: string[];
  correctAnswer: string;
  topic: string;
  explanation: string;
  score: number;
  difficulty: "easy" | "medium" | "hard";
}

const mcqMockQuestionSchema = new Schema<IMcqMockQuestion>(
  {
    interviewReport: {
      type: Schema.Types.ObjectId,
      ref: "InterviewReport",
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
    },
    correctAnswer: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    score: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const MCQMockQuestion = mongoose.model<IMcqMockQuestion>(
  "MCQMockQuestion",
  mcqMockQuestionSchema
);

export default MCQMockQuestion;