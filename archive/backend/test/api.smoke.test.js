import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { test, before, after } from 'node:test';

const port = 4317;
const baseUrl = `http://127.0.0.1:${port}`;
let server;

async function waitForServer() {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Backend did not become healthy in time');
}

before(async () => {
  server = spawn('node', ['src/server.js'], {
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      PORT: String(port),
      HOST: '127.0.0.1',
      NODE_ENV: 'test',
      FIREBASE_MOCK_MODE: 'true',
      RATE_LIMIT_MAX: '1000',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  server.stdout.on('data', () => {});
  server.stderr.on('data', () => {});

  await waitForServer();
});

after(() => {
  if (server && !server.killed) server.kill();
});

test('health endpoint responds', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, 'ok');
});

test('doctor listing responds with seeded doctors', async () => {
  const response = await fetch(`${baseUrl}/api/v1/doctors`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data));
  assert.ok(body.data.length >= 1);
});

test('protected profile rejects missing token', async () => {
  const response = await fetch(`${baseUrl}/api/v1/auth/profile`);
  assert.equal(response.status, 401);
});

test('mock registration creates a user profile', async () => {
  const registerResponse = await fetch(`${baseUrl}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'patient.demo@darman.test',
      password: 'DemoPass123!',
      fullName: 'Demo Patient',
      phone: '+93700000001',
      role: 'patient',
    }),
  });

  assert.equal(registerResponse.status, 201);
  const registerBody = await registerResponse.json();
  const uid = registerBody.data.uid;
  assert.ok(uid);

  const profileResponse = await fetch(`${baseUrl}/api/v1/auth/profile`, {
    headers: { Authorization: `Bearer mock_${uid}` },
  });

  assert.equal(profileResponse.status, 200);
  const profileBody = await profileResponse.json();
  assert.equal(profileBody.data.email, 'patient.demo@darman.test');
});
