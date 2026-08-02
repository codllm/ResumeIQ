import mongoose, { Schema, Document } from "mongoose";

export interface IInterviewReport extends Document {
  user: mongoose.Types.ObjectId;
  jobDescription: string;
  resumeText: string;
  selfDescription: string;
  matchScore: number;
  technicalQuestions: Array<{
    question: string;
    answer: string;
    intention: string;
  }>;
  behavioralQuestions: Array<{
    question: string;
    answer: string;
    intention: string;
  }>;
  skillGaps: Array<{
    skill: string;
    severity: string;
  }>;
  preparationPlan: Array<{
    day: number;
    focus: string;
    tasks: string[];
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

const interviewReportSchema = new Schema<IInterviewReport>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    jobDescription: {
      type: String,
      required: [true, "Job description is required"],
    },
    resumeText: {
      type: String,
      required: [true, "Resume text is required"],
    },
    selfDescription: {
      type: String,
      required: [true, "Self description is required"],
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    technicalQuestions: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
        intention: { type: String, required: true },
      },
    ],
    behavioralQuestions: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
        intention: { type: String, required: true },
      },
    ],
    skillGaps: [
      {
        skill: { type: String, required: true },
        severity: { type: String, required: true },
      },
    ],
    preparationPlan: [
      {
        day: { type: Number, required: true },
        focus: { type: String, required: true },
        tasks: [{ type: String, required: true }],
      },
    ],
  },
  {
    timestamps: true,
  }
);

const InterviewReport = mongoose.model<IInterviewReport>(
  "InterviewReport",
  interviewReportSchema
);

export default InterviewReport;