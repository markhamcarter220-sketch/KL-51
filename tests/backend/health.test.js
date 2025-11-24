import request from 'supertest';
import app from '../../backend/server.js';

test('health check', async () => {
  const res = await request(app)
    .get('/api/health')
    .set('x-betterbets-key', process.env.BETTERBETS_API_KEY || 'test-secret-key');
  expect(res.status).toBe(200);
});
