
const request = require('supertest');
const app = require('../src/app');

describe('Post API', () => {
    let token;
    let postId;
    let otherUserToken;

    const user = {
        name: 'Post Author',
        email: 'author@example.com',
        password: 'Password123'
    };

    const otherUser = {
        name: 'Other User',
        email: 'other@example.com',
        password: 'Password123'
    };

    beforeEach(async () => {
        // Register first user
        await request(app).post('/api/auth/register').send(user);

        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: user.email,
                password: user.password
            });

        token = loginResponse.headers['set-cookie'];

        // Register and login second user
        await request(app).post('/api/auth/register').send(otherUser);

        const otherLogin = await request(app)
            .post('/api/auth/login')
            .send({
                email: otherUser.email,
                password: otherUser.password
            });

        otherUserToken = otherLogin.headers['set-cookie'];
    });

    test('should create a post', async () => {
        const response = await request(app)
            .post('/api/post')
            .set('Cookie', token)
            .send({
                title: 'My First Post',
                content: 'This is my first blog post.'
            });

        expect(response.status).toBe(201);
        expect(response.body.post.title).toBe('My First Post');

        postId = response.body.post._id;
    });

    test('should reject post creation without authentication', async () => {
        const response = await request(app)
            .post('/api/post')
            .send({
                title: 'Unauthorized Post',
                content: 'This should not be created.'
            });

        expect(response.status).toBe(401);
    });

    test('should fetch all posts', async () => {
        const response = await request(app)
            .get('/api/post');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.posts)).toBe(true);
    });

    test('should fetch a post by ID', async () => {
        const created = await request(app)
            .post('/api/post')
            .set('Cookie', token)
            .send({
                title: 'Post for Fetch',
                content: 'Testing fetch by ID.'
            });

        const id = created.body.post._id;

        const response = await request(app)
            .get(`/api/post/${id}`);

        expect(response.status).toBe(200);
        expect(response.body.post._id).toBe(id);
    });

    test('should update own post', async () => {
        const created = await request(app)
            .post('/api/post')
            .set('Cookie', token)
            .send({
                title: 'Old Title',
                content: 'Old Content'
            });

        const id = created.body.post._id;

        const response = await request(app)
            .put(`/api/post/${id}`)
            .set('Cookie', token)
            .send({
                title: 'Updated Title',
                content: 'Updated Content'
            });

        expect(response.status).toBe(200);
        expect(response.body.post.title).toBe('Updated Title');
    });

    test('should prevent another user from updating a post', async () => {
        const created = await request(app)
            .post('/api/post')
            .set('Cookie', token)
            .send({
                title: 'Author Post',
                content: 'Only the author can update this.'
            });

        const id = created.body.post._id;

        const response = await request(app)
            .put(`/api/post/${id}`)
            .set('Cookie', otherUserToken)
            .send({
                title: 'Hacked Title',
                content: 'Trying to change another users post.'
            });

        expect(response.status).toBe(403);
    });

    test('should delete own post', async () => {
        const created = await request(app)
            .post('/api/post')
            .set('Cookie', token)
            .send({
                title: 'Post to Delete',
                content: 'This post will be deleted.'
            });

        const id = created.body.post._id;

        const response = await request(app)
            .delete(`/api/post/${id}`)
            .set('Cookie', token);

        expect(response.status).toBe(200);
    });

    test('should return paginated posts', async () => {
        const response = await request(app)
            .get('/api/post?page=1&limit=5');

        expect(response.status).toBe(200);
        expect(response.body.pagination).toBeDefined();
        expect(response.body.pagination.currentPage).toBe(1);
    });
});
