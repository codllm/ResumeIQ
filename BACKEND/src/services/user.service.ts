import User from '../model/user.model';
import {hashPassword} from '../model/user.model';

export interface LoginResult {
  success: boolean;
  status: number;
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    username?: string;
  };
}

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const user = await User.findOne({ email });

  if (!user) {
    return {
      success: false,
      status: 404,
      message: 'User not found. Please check your email.',
    };
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return {
      success: false,
      status: 401,
      message: 'Invalid password. Please try again.',
    };
  }

  const token = user.generateToken();
  
  return {
    success: true,
    status: 200,
    message: 'Login successful',
    token,
    user: {
      id: String(user._id),
      email: user.email,
      username: user.username,
    },
  };
}

export async function createUser(
  username: string,
  email: string,
  password: string
) {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return {
      success: false,
      status: 409,
      message: "An account with this email already exists. Please sign in.",
    };
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
      username,
      email,
      password: hashedPassword,
  });

  const token = user.generateToken();

  return {
      success: true,
      status: 201,
      message: "Account created successfully.",
      token,
      user: {
        id: String(user._id),
        email: user.email,
        username: user.username,
      },
  };
}
