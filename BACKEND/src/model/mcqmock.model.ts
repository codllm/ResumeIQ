import mongoose, { Schema, Document } from "mongoose";

export interface IMcqMockQuestion extends Document {
  interviewReport: mongoose.Types.ObjectId;
  question: string;
  options: string[];
  correctAnswer: string;
  topic: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

const mcqMockQuestionSchema = new Schema<IMcqMockQuestion>(
  {
    interviewReport: {
      type: Schema.Types.ObjectId,
      ref: "InterviewReport",
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