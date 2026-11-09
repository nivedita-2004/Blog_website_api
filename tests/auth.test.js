
const request = require('supertest');
const app = require('../src/app');

describe('Authentication API', () => {

    test('should register a new user', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'Password123'
            });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('User registered successfully');
        expect(response.body.user.email).toBe('test@example.com');
    });

    test('should not register an existing email', async () => {
        const user = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'Password123'
        };

        await request(app).post('/api/auth/register').send(user);

        const response = await request(app)
            .post('/api/auth/register')
            .send(user);

        expect(response.status).toBe(409);
    });

    test('should login with correct credentials', async () => {
        const user = {
            name: 'Test User',
            email: 'login@example.com',
            password: 'Password123'
        };

        await request(app).post('/api/auth/register').send(user);

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: user.email,
                password: user.password
            });

        expect(response.status).toBe(200);
        expect(response.headers['set-cookie']).toBeDefined();
    });

    test('should reject incorrect password', async () => {
        const user = {
            name: 'Test User',
            email: 'wrongpass@example.com',
            password: 'Password123'
        };

        await request(app).post('/api/auth/register').send(user);

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: user.email,
                password: 'WrongPassword'
            });

        expect(response.status).toBe(401);
    });

    test('should logout successfully', async () => {
        const response = await request(app)
            .post('/api/auth/logout');

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('User logout successfully');
    });

});
