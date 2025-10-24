import { base44 } from './base44Client';
import { User } from "./models/User";
import { Booking } from "./models/Booking";
import { Activity } from "./models/Activity";
import { LessonPlan } from "./models/LessonPlan"; // <-- 1. IMPORTE AQUI

export {
  User,
  Booking,
  Activity,
  LessonPlan // <-- 2. EXPORTE AQUI
}

export const Activity = base44.entities.Activity;

export const Notice = base44.entities.Notice;

export const Condominium = base44.entities.Condominium;

export const Class = base44.entities.Class;

export const Booking = base44.entities.Booking;

export const Workout = base44.entities.Workout;

export const Message = base44.entities.Message;

export const Checkin = base44.entities.Checkin;

export const Channel = base44.entities.Channel;

export const Event = base44.entities.Event;

export const PhysicalAssessment = base44.entities.PhysicalAssessment;

export const WorkoutSession = base44.entities.WorkoutSession;

export const DetailedAssessment = base44.entities.DetailedAssessment;

export const ExerciseVideo = base44.entities.ExerciseVideo;

export const Exercise = base44.entities.Exercise;

export const InstructorInvite = base44.entities.InstructorInvite;

export const ParqQuestion = base44.entities.ParqQuestion;

export const ParqResponse = base44.entities.ParqResponse;

export const Post = base44.entities.Post;

export const PostInteraction = base44.entities.PostInteraction;

export const Comment = base44.entities.Comment;

export const Notification = base44.entities.Notification;

export const Achievement = base44.entities.Achievement;

export const FeaturedPost = base44.entities.FeaturedPost;

export const Poll = base44.entities.Poll;

export const PollVote = base44.entities.PollVote;

export const MaintenanceItem = base44.entities.MaintenanceItem;

export const WeeklySchedule = base44.entities.WeeklySchedule;

export const CommentInteraction = base44.entities.CommentInteraction;

export const AdminInvite = base44.entities.AdminInvite;



// auth sdk:
export const User = base44.auth;