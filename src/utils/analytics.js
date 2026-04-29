import apiClient from '../services/apiClient';

const track = (feature, userId) => {
  apiClient.post(`/api/analytics/event`, {
    feature,
    userId
    //timestamp: today,
  }).catch((err) => {
    console.error("Analytics API failed:", err);
  });
};
 
export default { track };
