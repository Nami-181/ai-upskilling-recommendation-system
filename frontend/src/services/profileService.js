import { api, mockDelay, USE_MOCK_DATA } from './api';
import { mockUser, mockRoles } from '../data/mockUser';

/**
 *   GET    /profile             → student profile (camelCase) with skills, courses, projects
 *   PUT    /profile             → partial update; any of: firstName, lastName, program, institution, year, bio,
 *                                 targetRoleId, weeklyHoursGoal, preferredResourceType, interests,
 *                                 onboardingComplete, skills[{skill_id, level}], courses[...], projects[...]
 *   GET    /roles               → [{ id, title, description }]
 *   POST   /profile/courses     { title, provider, status }             → course
 *   DELETE /profile/courses/:id
 *   POST   /profile/projects    { title, description, tech_stack, url } → project
 *   DELETE /profile/projects/:id
 */
export const profileService = {
  getProfile() {
    return USE_MOCK_DATA ? mockDelay(mockUser) : api.get('/profile');
  },

  updateProfile(profile) {
    return USE_MOCK_DATA ? mockDelay({ ...mockUser, ...profile }) : api.put('/profile', profile);
  },

  getRoles() {
    return USE_MOCK_DATA ? mockDelay(mockRoles, 300) : api.get('/roles');
  },

  addCourse: (course) => api.post('/profile/courses', course),
  deleteCourse: (id) => api.delete(`/profile/courses/${id}`),
  addProject: (project) => api.post('/profile/projects', project),
  deleteProject: (id) => api.delete(`/profile/projects/${id}`),
};
