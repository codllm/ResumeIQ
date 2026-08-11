import mongoose, { Document, Schema } from "mongoose";

export interface ICareerProfile extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  resumeText: string;
  jobDescription: string;
  selfDescription: string;
  targetRole?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const careerProfileSchema = new Schema<ICareerProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      default: "Career Profile",
    },
    resumeText: {
      type: String,
      required: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    selfDescription: {
      type: String,
      required: true,
    },
    targetRole: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const CareerProfile = mongoose.model<ICareerProfile>(
  "CareerProfile",
  careerProfileSchema
);

export default CareerProfile;
