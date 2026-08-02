import mongoose, { Schema } from "mongoose";
import { Document } from "mongodb";
import { text } from "stream/consumers";
import { getHeapSnapshot } from "v8";

// job discussion
// resume text
// self discription

///
// technical question [array of object]
// behavioral question[array of objects]
// skill gaps[]
// preperation plan[{}](array of objects)

export interface IInterviewReport extends Document{
  jobDiscription:string,
  resumeText:string,
  selfDiscription:string,
  mathScore:number,
  technicalQuestions:[{
    question:string,
    answer:string,
    intention:string
  }],
  behavioralQuestions:[{
    question:string,
    answer:string,
    intention:string
  }],
  skillGaps:[{
    skill:string,
    serverity:string,
  }],
  preperationPlan:[{
    day:number,
    focus:string,
    tasks:[{}]
  }],
  timeStamp:Date
}

const interviewResportSchema = new Schema<IInterviewReport>({

  jobDiscription:{
    type:String,
    required:[true,"Job discription is required"]
  },
  resumeText:{
    type:String
  },
  selfDiscription:{
    type:String
  },
  mathScore:{
    min:0,
    max:10,
  },
  technicalQuestions:[{
    question:{
      type:String,
      required:[true,"TechnicalQuestion is required"]
    },
    answer:{
      type:String,
      required:[true,"Answer is required"]
    },
    intention:{
      type:String,
      required:[true,"Intention is required"]
    }
  }],
  behavioralQuestions:[{
    question:{
      type:String,
      required:[true,"BehavioralQuestion is required"]
    },
    answer:{
      type:String,
      required:[true,"Answer is required"]
    },
    intention:{
      type:String,
      required:[true,"Intention is required"]
    }
  }],
  skillGaps:[{
    skill:{
      type:String,
      required:[true,"Skill is required"]
    },
    serverity:{
      type:String,
      enum:["low","medium","high"],
      required:[true,"Serverity is required"]
    }
  }],
  preperationPlan:[{
    day:{
      type:Number,
      required:[true,"Day is required"]
    },
    focus:{
      type:String,
      required:[true,"Focus is required"]
    },
    tasks:[{
      type:String,
      required:[true,"Task is required"]
    }]
  }],
  timeStamp:{
    type:Date,
    default:Date.now
  } 
})

const InterviewReport = mongoose.model<IInterviewReport>('InterviewReport',interviewResportSchema);
export default InterviewReport;