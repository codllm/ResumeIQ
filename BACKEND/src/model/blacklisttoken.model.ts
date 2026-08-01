import mongoose from "mongoose";
import { Document } from "mongodb";
import { Schema } from "mongoose";

interface IBlacklistToken extends Document{
  token:string,
  timestamp:Date
}

const BlacklistTokenSchema = new Schema<IBlacklistToken>({
  token:{
    type:String,
    required:true
  },
  timestamp:{
    type:Date,
    default:Date.now
  }
})
const BlacklistToken = mongoose.model<IBlacklistToken>('BlacklistToken',BlacklistTokenSchema);
export default BlacklistToken;