import apiClient from "./apiClient.js";

const ProgressAPIService = {
  // Save/update topic + course progress
  saveProgress: async (progressData) => {
    try {
      const response = await apiClient.post('/api/progress', progressData);
      return response.data;
    } catch (error) {
      console.error('Error saving progress:', error);
      throw error;
    }
  },

  // Get all courses for user
  getApplicantProgress: async (applicantId) => {
    try {
      const response = await apiClient.get(`/api/progress/applicant/${applicantId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching applicant progress:', error);
      throw error;
    }
  },

  // Get topics for a course
  getCourseTopics: async (courseProgressId) => {
    try {
      const response = await apiClient.get(`/api/progress/topics/${courseProgressId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course topics:', error);
      throw error;
    }
  }
};

export default ProgressAPIService;
