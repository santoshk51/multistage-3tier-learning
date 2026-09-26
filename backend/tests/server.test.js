import { jest, describe, test, expect, afterEach } from '@jest/globals';
import request from 'supertest';
import { app, pool, initialiseDatabase } from '../server.js';

describe('Madhubani API', () => {

  afterEach(() => {
    jest.restoreAllMocks();
  });


  // ============================================================
  // DATABASE INITIALIZATION
  // ============================================================

  test('initialiseDatabase should create the reviews table', async () => {

    const queryMock = jest
      .spyOn(pool, 'query')
      .mockResolvedValueOnce([[], []]);

    await initialiseDatabase();

    expect(queryMock).toHaveBeenCalledTimes(1);

    expect(queryMock.mock.calls[0][0]).toContain(
      'CREATE TABLE IF NOT EXISTS reviews'
    );
  });


  // ============================================================
  // METRICS
  // ============================================================

  test('GET /metrics should return Prometheus metrics', async () => {

    const response = await request(app)
      .get('/metrics');

    expect(response.statusCode).toBe(200);

    expect(response.text).toContain('# HELP');
  });


  // ============================================================
  // HEALTH CHECK
  // ============================================================

  test('GET /health should return database connected', async () => {

    jest.spyOn(pool, 'query')
      .mockResolvedValueOnce([
        [{ test: 1 }],
        []
      ]);

    const response = await request(app)
      .get('/health');

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      api: 'running',
      database: 'connected'
    });
  });


  test('GET /health should return 503 when database is unavailable', async () => {

    jest.spyOn(pool, 'query')
      .mockRejectedValueOnce(
        new Error('Database connection failed')
      );

    const response = await request(app)
      .get('/health');

    expect(response.statusCode).toBe(503);

    expect(response.body).toEqual({
      api: 'running',
      database: 'disconnected'
    });
  });


  // ============================================================
  // GET REVIEWS
  // ============================================================

  test('GET /reviews should return reviews', async () => {

    const reviews = [
      {
        id: 1,
        name: 'Santosh',
        message: 'Great application',
        created_at: '2026-09-26'
      }
    ];

    jest.spyOn(pool, 'query')
      .mockResolvedValueOnce([
        reviews,
        []
      ]);

    const response = await request(app)
      .get('/reviews');

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual(reviews);
  });


  // ============================================================
  // CREATE REVIEW
  // ============================================================

  test('POST /reviews should create a review', async () => {

    jest.spyOn(pool, 'execute')
      .mockResolvedValueOnce([
        {
          insertId: 10
        },
        []
      ]);

    const response = await request(app)
      .post('/reviews')
      .send({
        name: 'Santosh',
        message: 'Excellent application'
      });

    expect(response.statusCode).toBe(201);

    expect(response.body).toEqual({
      id: 10,
      name: 'Santosh',
      message: 'Excellent application'
    });
  });


  // ============================================================
  // VALIDATION
  // ============================================================

  test('POST /reviews should reject empty name', async () => {

    const response = await request(app)
      .post('/reviews')
      .send({
        name: '',
        message: 'Hello'
      });

    expect(response.statusCode).toBe(400);

    expect(response.body).toEqual({
      error: 'Name and message are required.'
    });
  });


  test('POST /reviews should reject empty message', async () => {

    const response = await request(app)
      .post('/reviews')
      .send({
        name: 'Santosh',
        message: ''
      });

    expect(response.statusCode).toBe(400);

    expect(response.body).toEqual({
      error: 'Name and message are required.'
    });
  });


  test('POST /reviews should reject input that is too long', async () => {

    const response = await request(app)
      .post('/reviews')
      .send({
        name: 'A'.repeat(81),
        message: 'Hello'
      });

    expect(response.statusCode).toBe(400);

    expect(response.body).toEqual({
      error: 'Input is too long.'
    });
  });


  // ============================================================
  // DATABASE ERROR HANDLING
  // ============================================================

  test('GET /reviews should return 500 when database query fails', async () => {

    jest.spyOn(pool, 'query')
      .mockRejectedValueOnce(
        new Error('Database failure')
      );

    const response = await request(app)
      .get('/reviews');

    expect(response.statusCode).toBe(500);

    expect(response.body).toEqual({
      error: 'Internal server error'
    });
  });


  test('POST /reviews should return 500 when database insert fails', async () => {

    jest.spyOn(pool, 'execute')
      .mockRejectedValueOnce(
        new Error('Database failure')
      );

    const response = await request(app)
      .post('/reviews')
      .send({
        name: 'Santosh',
        message: 'Testing database error'
      });

    expect(response.statusCode).toBe(500);

    expect(response.body).toEqual({
      error: 'Internal server error'
    });
  });

});