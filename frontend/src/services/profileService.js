import { api, mockDelay, USE_MOCK_DATA } from './api';
import { mockUser, mockRoles } from '../data/mockUser';

/**
 *   GET /profile  → student profile
 *   PUT /profile  → updated student profile
 *   GET /roles    → [{ id, title }]
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
};
