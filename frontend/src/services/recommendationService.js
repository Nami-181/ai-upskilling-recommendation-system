import { api, mockDelay, USE_MOCK_DATA } from './api';

/**
 * Integration point for the AI/ML recommendation engine (built by a teammate).
 *
 *   POST /analyze/skills            { target_role, skills: [{ name, level }] } → skill-gap report
 *   POST /recommendations/generate  { target_role }                             → recommendation set
 *   GET  /recommendations                                                       → latest recommendation set
 *   POST /feedback                  { item_id, item_type, rating, comment }     → { ok: true }
 *
 * Mock responses are intentionally minimal in Phase 1; Phase 3 adds full
 * sample data for the Skill Gap Analyzer, Roadmap, Resources, Projects and Certifications.
 */
const SAMPLE_GAP_REPORT = {
  target_role: 'Data Scientist',
  skills: [
    { name: 'Python', current: 4, required: 5 },
    { name: 'SQL', current: 2, required: 4 },
    { name: 'Machine Learning', current: 2, required: 5 },
    { name: 'Statistics', current: 3, required: 4 },
  ],
  is_sample: true,
};

export const recommendationService = {
  analyzeSkills(payload) {
    return USE_MOCK_DATA ? mockDelay(SAMPLE_GAP_REPORT, 1200) : api.post('/analyze/skills', payload);
  },

  generateRecommendations(payload) {
    return USE_MOCK_DATA
      ? mockDelay({ generated_at: new Date().toISOString(), items: [], is_sample: true }, 1200)
      : api.post('/recommendations/generate', payload);
  },

  getRecommendations() {
    return USE_MOCK_DATA ? mockDelay({ items: [], is_sample: true }) : api.get('/recommendations');
  },

  sendFeedback(feedback) {
    return USE_MOCK_DATA ? mockDelay({ ok: true }, 300) : api.post('/feedback', feedback);
  },
};
