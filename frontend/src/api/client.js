import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

const client = axios.create({ baseURL: BASE_URL, headers: { 'Content-Type': 'application/json' } });

client.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return client(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export const auth = {
  register: d => client.post('/auth/register/', d),
  login: d => client.post('/auth/login/', d),
  profile: () => client.get('/auth/profile/'),
  updateProfile: d => client.patch('/auth/profile/', d),
  medicalRecord: () => client.get('/auth/medical-record/'),
  updateMedical: d => client.patch('/auth/medical-record/', d),
  preferences: () => client.get('/auth/preferences/'),
  updatePreferences: d => client.patch('/auth/preferences/', d),
  badges: () => client.get('/auth/badges/'),
  leaderboard: () => client.get('/auth/leaderboard/'),
};

export const habits = {
  dashboard: () => client.get('/habits/dashboard/'),
  today: () => client.get('/habits/habits/today/'),
  goals: () => client.get('/habits/goals/'),
  createGoal: d => client.post('/habits/goals/', d),
  updateGoal: (id, d) => client.patch(`/habits/goals/${id}/`, d),
  deleteGoal: id => client.delete(`/habits/goals/${id}/`),
  list: () => client.get('/habits/habits/'),
  create: d => client.post('/habits/habits/', d),
  update: (id, d) => client.patch(`/habits/habits/${id}/`, d),
  delete: id => client.delete(`/habits/habits/${id}/`),
  microtasks: () => client.get('/habits/microtasks/'),
  updateMicrotask: (id, d) => client.patch(`/habits/microtasks/${id}/`, d),
  createLog: d => client.post('/habits/logs/', d),
  logs: id => client.get(`/habits/logs/${id}/`),
  nudges: () => client.get('/habits/nudges/'),
  markNudgeRead: id => client.post(`/habits/nudges/${id}/read/`),
};

export const insights = {
  list: () => client.get('/insights/'),
  coach: () => client.get('/insights/coach/'),
  sendMessage: d => client.post('/insights/coach/', d),
  mood: () => client.get('/insights/mood/'),
  logMood: d => client.post('/insights/mood/', d),
};

export const analytics = {
  weekly: () => client.get('/analytics/weekly/'),
  monthly: () => client.get('/analytics/monthly/'),
  consistency: () => client.get('/analytics/consistency/'),
  reports: () => client.get('/analytics/reports/'),
  generateReport: () => client.post('/analytics/reports/'),
};

export const social = {
  leaderboard: () => client.get('/social/leaderboard/'),
  friends: () => client.get('/social/friends/'),
  sendRequest: d => client.post('/social/friends/request/', d),
  respondRequest: (id, d) => client.post(`/social/friends/${id}/respond/`, d),
  challenges: () => client.get('/social/challenges/'),
  createChallenge: d => client.post('/social/challenges/', d),
  joinChallenge: id => client.post(`/social/challenges/${id}/join/`),
};

export default client;
