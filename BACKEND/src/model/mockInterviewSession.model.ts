import mongoose, { Document, Schema } from "mongoose";

interface IMockInterviewTranscript {
  question: string;
  answer?: string;
  score?: number;
  feedback?: string;
  technicalCorrectness?: string;
}

export interface IMockInterviewSession extends Document {
  user: mongoose.Types.ObjectId;
  careerProfile?: mongoose.Types.ObjectId;
  interviewReport?: mongoose.Types.ObjectId;
  questions: mongoose.Types.ObjectId[];
  transcript: IMockInterviewTranscript[];
  status: "in_progress" | "completed";
  totalQuestions: number;
  currentQuestionNumber: number;
  startedAt: Date;
  completedAt?: Date;
}

const mockInterviewTranscriptSchema = new Schema<IMockInterviewTranscript>(
  {
    question: { type: String, required: true },
    answer: { type: String, trim: true },
    score: { type: Number, min: 0, max: 10 },
    feedback: { type: String, trim: true },
    technicalCorrectness: { type: String, trim: true },
  },
  { _id: false }
);

const mockInterviewSessionSchema = new Schema<IMockInterviewSession>(
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
      index: true,
    },
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: "MockInterview",
        required: true,
      },
    ],
    transcript: [mockInterviewTranscriptSchema],
    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
      index: true,
    },
    totalQuestions: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
    },
    currentQuestionNumber: {
      type: Number,
      default: 1,
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

const MockInterviewSession = mongoose.model<IMockInterviewSession>(
  "MockInterviewSession",
  mockInterviewSessionSchema
);

export default MockInterviewSession;
