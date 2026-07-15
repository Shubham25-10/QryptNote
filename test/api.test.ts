import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../server.js'; // Ensure correct import depending on TypeScript setup

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

// We'll store mock data in memory for tests
let mockDb: Record<string, any> = {};

vi.mock('firebase/firestore', () => {
  return {
    getFirestore: vi.fn(() => ({})),
    collection: vi.fn(),
    doc: vi.fn((db, collectionName, id) => ({ id, collectionName })),
    setDoc: vi.fn(async (docRef, data) => {
      mockDb[docRef.id] = data;
    }),
    getDoc: vi.fn(async (docRef) => {
      const data = mockDb[docRef.id];
      return {
        exists: () => !!data,
        data: () => data,
      };
    }),
    deleteDoc: vi.fn(async (docRef) => {
      delete mockDb[docRef.id];
    }),
    updateDoc: vi.fn(async (docRef, updates) => {
      mockDb[docRef.id] = { ...mockDb[docRef.id], ...updates };
    }),
  };
});

describe('QryptNote API', () => {
  let app: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    app = await createApp();
  });

  it('should create a message and return an id', async () => {
    const response = await request(app)
      .post('/api/messages')
      .send({
        message: 'Hello secret',
        expiryHours: 24,
        viewLimit: 1,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(mockDb[response.body.id]).toBeDefined();
  });

  it('should fetch message metadata', async () => {
    // First create a message
    const createRes = await request(app)
      .post('/api/messages')
      .send({
        message: 'Hello metadata',
        viewLimit: 1,
      });
    
    const id = createRes.body.id;

    // Now fetch metadata
    const response = await request(app)
      .get(`/api/messages/${id}/metadata`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(id);
    expect(response.body.isPasswordProtected).toBe(false);
  });

  it('should view a message and delete it (burn after reading)', async () => {
    const createRes = await request(app)
      .post('/api/messages')
      .send({
        message: 'Burn this',
        viewLimit: 1,
      });
    
    const id = createRes.body.id;

    // View the message
    const viewRes = await request(app)
      .post(`/api/messages/${id}/view`);

    expect(viewRes.status).toBe(200);
    expect(viewRes.body.message).toBe('Burn this');

    // Trying to view again should fail because it was deleted
    const viewAgainRes = await request(app)
      .post(`/api/messages/${id}/view`);
    
    expect(viewAgainRes.status).toBe(404);
  });
});
