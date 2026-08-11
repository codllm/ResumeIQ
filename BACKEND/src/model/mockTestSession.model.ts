import mongoose, { Document, Schema } from "mongoose";

interface IMockTestSection {
  category: string;
  questionCount: number;
  durationMinutes: number;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  reason: string;
  topicsToTest: string[];
}

interface IMockTestAnswer {
  question: mongoose.Types.ObjectId;
  chosenAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  score: number;
}

export interface IMockTestSession extends Document {
  user: mongoose.Types.ObjectId;
  careerProfile?: mongoose.Types.ObjectId;
  interviewReport: mongoose.Types.ObjectId;
  role: string;
  experienceLevel: string;
  totalDurationMinutes: number;
  sections: IMockTestSection[];
  questions: mongoose.Types.ObjectId[];
  answers: IMockTestAnswer[];
  status: "in_progress" | "submitted";
  score: number;
  totalScore: number;
  startedAt: Date;
  submittedAt?: Date;
}

const mockTestSectionSchema = new Schema<IMockTestSection>(
  {
    category: { type: String, required: true },
    questionCount: { type: Number, required: true },
    durationMinutes: { type: Number, required: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "mixed"],
      required: true,
    },
    reason: { type: String, required: true },
    topicsToTest: [{ type: String, required: true }],
  },
  { _id: false }
);

const mockTestAnswerSchema = new Schema<IMockTestAnswer>(
  {
    question: {
      type: Schema.Types.ObjectId,
      ref: "MCQMockQuestion",
      required: true,
    },
    chosenAnswer: { type: String, required: true },
    correctAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    score: { type: Number, required: true },
  },
  { _id: false }
);

const mockTestSessionSchema = new Schema<IMockTestSession>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    careerProfile: {
      type: Schema.Types.ObjectId,
      ref: "CareerProfile",
      index: true,
    },
    interviewReport: {
      type: Schema.Types.ObjectId,
      ref: "InterviewReport",
      required: true,
      index: true,
    },
    role: { type: String, required: true },
    experienceLevel: { type: String, required: true },
    totalDurationMinutes: { type: Number, required: true },
    sections: [mockTestSectionSchema],
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: "MCQMockQuestion",
        required: true,
      },
    ],
    answers: [mockTestAnswerSchema],
    status: {
      type: String,
      enum: ["in_progress", "submitted"],
      default: "in_progress",
      index: true,
    },
    score: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

const MockTestSession = mongoose.model<IMockTestSession>(
  "MockTestSession",
  mockTestSessionSchema
);

export default MockTestSession;
