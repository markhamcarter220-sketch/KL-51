import request from 'supertest';
import app from '../../backend/server.js';

test('odds returns array', async () => {
  const res = await request(app)
    .get('/api/odds')
    .set('x-betterbets-key', process.env.BETTERBETS_API_KEY || 'test-secret-key');
  expect(Array.isArray(res.body.games)).toBe(true);
});
