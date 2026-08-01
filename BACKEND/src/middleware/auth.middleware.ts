import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import BlacklistTokenModel from "../model/blacklisttoken.model";


export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: "You are not logged in.",
    });
    return;
  }

  const isTokenBlackListed = await BlacklistTokenModel.findOne({token});

  if(isTokenBlackListed){
    res.status(401).json({success:false,message:"Token expired"})
    return;
  }
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not defined");
    }

    const decoded = jwt.verify(token, secret);

    (req as any).user = decoded;
    console.log("token verify process has been done successfully it console data",decoded)

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }
};