import mongoose, { Document, Schema } from "mongoose";

export interface IMockInterview extends Document {
  question: string;
  answer?: string;
  score?: number;
  topic?: string;
  feedback?: string;
  technicalCorrectness?: string;
  user: mongoose.Types.ObjectId;
  interviewReport: mongoose.Types.ObjectId;
}

const mockInterviewSchema = new Schema<IMockInterview>(
  {
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      trim: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 10,
    },
    topic: {
      type: String,
      trim: true,
    },
    feedback: {
      type: String,
      trim: true,
    },
    technicalCorrectness: {
      type: String,
      trim: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    interviewReport: {
      type: Schema.Types.ObjectId,
      ref: "InterviewReport",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const MOCKInterview = mongoose.model<IMockInterview>(
  "MockInterview",
  mockInterviewSchema
);

export default MOCKInterview;
