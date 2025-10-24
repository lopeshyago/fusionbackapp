import { localApi } from './localApi';

// Helper function to create entity classes
function createEntity(name, tableName) {
  return {
    async list(orderBy = null) {
      const data = await localApi.get(tableName);
      if (orderBy) {
        // Simple sorting - you might want to enhance this
        return data.sort((a, b) => {
          const aVal = a[orderBy.replace('-', '')];
          const bVal = b[orderBy.replace('-', '')];
          if (orderBy.startsWith('-')) {
            return bVal > aVal ? 1 : -1;
          }
          return aVal > bVal ? 1 : -1;
        });
      }
      return data;
    },

    async filter(filters) {
      const data = await localApi.get(tableName);
      return data.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
          if (Array.isArray(value)) {
            return value.includes(item[key]);
          }
          return item[key] === value;
        });
      });
    },

    async get(id) {
      const data = await localApi.get(tableName);
      return data.find(item => item.id === id);
    },

    async create(data) {
      return localApi.create(tableName, data);
    },

    async update(id, data) {
      return localApi.update(tableName, id, data);
    },

    async delete(id) {
      return localApi.delete(tableName, id);
    }
  };
}

// Create entity instances
export const User = {
  ...createEntity('User', 'users'),
  async me() {
    const response = await localApi.getCurrentUser();
    return response.user;
  },
  async updateMyUserData(data) {
    // This would need a specific endpoint - for now, we'll assume profile update
    return localApi.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async logout() {
    return localApi.logout();
  }
};

export const Booking = createEntity('Booking', 'bookings');
export const Activity = createEntity('Activity', 'activities');
export const LessonPlan = createEntity('LessonPlan', 'lesson_plans');
export const Notice = createEntity('Notice', 'notices');
export const Condominium = createEntity('Condominium', 'condominiums');
export const Class = createEntity('Class', 'classes');
export const Workout = createEntity('Workout', 'workouts');
export const Message = createEntity('Message', 'messages');
export const Checkin = createEntity('Checkin', 'checkins');
export const Channel = createEntity('Channel', 'channels');
export const Event = createEntity('Event', 'events');
export const PhysicalAssessment = createEntity('PhysicalAssessment', 'physical_assessments');
export const WorkoutSession = createEntity('WorkoutSession', 'workout_sessions');
export const DetailedAssessment = createEntity('DetailedAssessment', 'detailed_assessments');
export const ExerciseVideo = createEntity('ExerciseVideo', 'exercise_videos');
export const Exercise = createEntity('Exercise', 'exercises');
export const InstructorInvite = createEntity('InstructorInvite', 'instructor_invites');
export const ParqQuestion = createEntity('ParqQuestion', 'parq_questions');
export const ParqResponse = createEntity('ParqResponse', 'parq_responses');
export const Post = createEntity('Post', 'posts');
export const PostInteraction = createEntity('PostInteraction', 'post_interactions');
export const Comment = createEntity('Comment', 'comments');
export const Notification = createEntity('Notification', 'notifications');
export const Achievement = createEntity('Achievement', 'achievements');
export const FeaturedPost = createEntity('FeaturedPost', 'featured_posts');
export const Poll = createEntity('Poll', 'polls');
export const PollVote = createEntity('PollVote', 'poll_votes');
export const MaintenanceItem = createEntity('MaintenanceItem', 'maintenance_items');
export const WeeklySchedule = createEntity('WeeklySchedule', 'weekly_schedules');
export const CommentInteraction = createEntity('CommentInteraction', 'comment_interactions');
export const AdminInvite = createEntity('AdminInvite', 'admin_invites');

// Auth is handled by localApi directly
export const auth = {
  async login(email, password) {
    return localApi.login(email, password);
  },
  async register(email, password, full_name, role) {
    return localApi.register(email, password, full_name, role);
  }
};
