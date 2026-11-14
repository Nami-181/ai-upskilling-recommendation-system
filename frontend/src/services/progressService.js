import { api, mockDelay, USE_MOCK_DATA } from './api';

/**
 *   GET  /progress  → { overall, weekly_hours: [...], milestones_completed, streak_days, ... }
 *   POST /progress  { item_id, item_type, status, minutes? } → updated progress
 */
const SAMPLE_PROGRESS = {
  overall: 64,
  milestones_completed: 9,
  streak_days: 5,
  weekly_hours: [3, 5, 4, 7, 6, 8, 9],
  is_sample: true,
};

export const progressService = {
  getProgress() {
    return USE_MOCK_DATA ? mockDelay(SAMPLE_PROGRESS) : api.get('/progress');
  },

  updateProgress(update) {
    return USE_MOCK_DATA ? mockDelay({ ...SAMPLE_PROGRESS, last_update: update }, 300) : api.post('/progress', update);
  },
};
