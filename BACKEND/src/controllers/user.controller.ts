import { Request, Response } from 'express';
import { loginUser,createUser } from '../services/user.service';
import BlacklistTokenModel from '../model/blacklisttoken.model';
import userModel from '../model/user.model';

export const userLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    const result = await loginUser(email, password);

    if (!result.success) {
      res.status(result.status).json({
        success: false,
        message: result.message || "Operation completed successfully.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message,
      token: result.token,
      user: result.user,
    });
  } catch (error: any) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

export const createUserController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const username = req.body.username?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();

    // Validate input
    if (!username || !email || !password) {
      res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
      return;
    }

    // Call service
    const result = await createUser(username, email, password);

    if (!result) {
      res.status(500).json({
        success: false,
        message: "failed to create user try again.",
      });
      return;
    }

    // Success
    res.status(201).json({
      success: true,
      message: "User created successfully.",
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error("Create User Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

export const logoutController = async(req:Request,res:Response)=>{
  try{

    const token = req.headers.authorization?.split(" ")[1];

    await BlacklistTokenModel.create({token});

    if(token) res.status(200).json({success:true,message:"Logout successful."});
  }catch(error){
    console.error("Logout Error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed.",
    });
  }
}

export const getMeController = async(req:Request,res:Response)=>{

  const userID = (req as any).user?.id;
  console.log(userID);

  if(!userID){
    return res.status(401).json({success:false,message:'User not Found'})
  }

  const user = await userModel.findById(userID).select("username email")

  if (!user) {
    res.status(404).json({
      success: false,
      message: "User not found",
    });
    return;
  }

  console.log("user found console log via token",user);

  return res.status(200).json({success:true,user})

}
