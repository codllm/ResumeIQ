import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface IUser extends Document {
  username?: string;
  email: string;
  password?: string;
  oauth: boolean;
  hashPassword(password: string): Promise<string>;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateToken(): string;
}

// Standalone Helper Function to Hash Password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function (this: IUser) {
        return !this.oauth;
      },
    },
    oauth: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);


// Instance Method to Hash Password
UserSchema.methods.hashPassword = function (password: string): Promise<string> {
  return hashPassword(password);
};

// Instance Method to Compare Password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance Method to Generate JWT Token
UserSchema.methods.generateToken = function (): string {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key';
  return jwt.sign(
    { id: this._id, email: this.email },
    secret,
    { expiresIn: '7d' }
  );
};

const User = mongoose.model<IUser>('User', UserSchema);

export default User;