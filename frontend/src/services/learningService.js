import { api, ApiError, USE_MOCK_DATA } from './api';

/**
 * Student-app services added in Phases 2–7 (FastAPI backend, see backend/README.md and docs/api.md).
 * These screens need the real backend: in mock mode they raise a clear error that pages show as
 * an empty state, because the recommendation engine only runs on the server.
 */
function live(call) {
  if (USE_MOCK_DATA) {
    return Promise.reject(
      new ApiError('These pages use the LUMORA backend. Set VITE_USE_MOCK_DATA=false and start the API.', {
        code: 'MOCK_MODE',
      }),
    );
  }
  return call();
}

export const catalogService = {
  roles: () => live(() => api.get('/roles')),
  role: (id) => live(() => api.get(`/roles/${id}`)),
  skills: () => live(() => api.get('/skills')),
  taxonomy: () => live(() => api.get('/skills/taxonomy')),
  resources: (params) => live(() => api.get('/resources', { params })),
  resource: (id) => live(() => api.get(`/resources/${id}`)),
  projectIdeas: (params) => live(() => api.get('/project-ideas', { params })),
  certifications: (params) => live(() => api.get('/certifications', { params })),
};

export const roadmapService = {
  /** Skill-gap report for the saved profile (or a role override). */
  analyze: (target_role) => live(() => api.post('/analyze/skills', target_role ? { target_role } : {})),
  careers: () => live(() => api.get('/analyze/careers')),
  get: () => live(() => api.get('/recommendations')),
  generate: (target_role) => live(() => api.post('/recommendations/generate', target_role ? { target_role } : {})),
  setItemStatus: (id, status) => live(() => api.patch(`/recommendations/${id}`, { status })),
  setModuleStatus: (id, status) => live(() => api.patch(`/roadmap/modules/${id}`, { status })),
  toggleSaved: (id) => live(() => api.post(`/recommendations/${id}/save`)),
  feedback: (id, value, comment = '') =>
    live(() => api.post('/feedback', { type: 'recommendation', item_type: 'recommendation', item_id: id, value, comment })),
  quiz: (skillId) => live(() => api.get(`/quizzes/${skillId}`)),
  submitQuiz: (skillId, answers) => live(() => api.post(`/quizzes/${skillId}/attempts`, { answers })),
};

export const activityService = {
  progress: () => live(() => api.get('/progress')),
  logStudy: (minutes) => live(() => api.post('/progress', { item_type: 'study', minutes })),
  notifications: () => live(() => api.get('/notifications')),
  markAllRead: () => live(() => api.post('/notifications/read')),
  achievements: () => live(() => api.get('/achievements')),
};

export const accountService = {
  me: () => live(() => api.get('/auth/me')),
  changePassword: (current_password, new_password) =>
    live(() => api.post('/auth/change-password', { current_password, new_password })),
  deleteAccount: () => live(() => api.delete('/profile')),
  exportData: () => live(() => api.get('/profile/export')),
};

export const LEVEL_LABELS = ['None', 'Aware', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];
export const DIFFICULTY = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' };
export const STATUS_LABELS = { not_started: 'Not started', in_progress: 'In progress', completed: 'Completed' };
