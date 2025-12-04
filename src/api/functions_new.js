import { localApi } from './localApi';

// These functions need to be implemented based on your backend API
// For now, providing basic implementations that might work with your local API

export const getStudentsForInstructor = async (_instructorId) => {
  // Uses backend endpoint that lists students by instructor's condominium
  return localApi.request('/instructor/students');
};

export const getStudentsByCondo = async (_condoId) => {
  // Reuse the same endpoint; UI can filter client-side if needed
  return localApi.request('/instructor/students');
};

export const getStudentsForTeam = async (teamId) => {
  // This would need a specific endpoint in your backend
  // For now, returning empty array
  return [];
};

export const getAllUsers = async () => {
  // Prefer backend join to include profile fields like full_name/avatar_url
  try {
    return await localApi.request('/admin/users_full');
  } catch (e) {
    // Fallback to raw users if admin route not available
    return await localApi.get('users');
  }
};

export const promoteUserToAdmin = async (userId) => {
  // This would need a specific endpoint in your backend
  // For now, returning success
  return { success: true };
};
