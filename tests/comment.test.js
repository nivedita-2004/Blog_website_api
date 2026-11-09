
const request = require('supertest');
const app = require('../src/app');

describe('Comment API', () => {
    let token;
    let otherUserToken;
    let postId;
    let commentId;

    const user = {
        name: 'Comment Author',
        email: 'commentauthor@example.com',
        password: 'Password123'
    };

    const otherUser = {
        name: 'Other Comment User',
        email: 'othercomment@example.com',
        password: 'Password123'
    };

    beforeEach(async () => {
        await request(app).post('/api/auth/register').send(user);

        const login = await request(app)
            .post('/api/auth/login')
            .send({
                email: user.email,
                password: user.password
            });

        token = login.headers['set-cookie'];

        await request(app).post('/api/auth/register').send(otherUser);

        const otherLogin = await request(app)
            .post('/api/auth/login')
            .send({
                email: otherUser.email,
                password: otherUser.password
            });

        otherUserToken = otherLogin.headers['set-cookie'];

        const post = await request(app)
            .post('/api/post')
            .set('Cookie', token)
            .send({
                title: 'Test Post',
                content: 'This post is for testing comments.'
            });

        postId = post.body.post._id;
    });

    test('should create a comment', async () => {
        const response = await request(app)
            .post('/api/comment')
            .set('Cookie', token)
            .send({
                content: 'This is a test comment.',
                postId
            });

        expect(response.status).toBe(201);
        expect(response.body.comment.content).toBe('This is a test comment.');
    });

    test('should reject comment creation without authentication', async () => {
        const response = await request(app)
            .post('/api/comment')
            .send({
                content: 'Unauthorized comment',
                postId
            });

        expect(response.status).toBe(401);
    });

    test('should fetch all comments for a post', async () => {
        await request(app)
            .post('/api/comment')
            .set('Cookie', token)
            .send({
                content: 'First comment',
                postId
            });

        const response = await request(app)
            .get(`/api/comment?post_id=${postId}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.comments)).toBe(true);
        expect(response.body.totalCount).toBe(1);
    });

    test('should fetch a comment by ID', async () => {
        const created = await request(app)
            .post('/api/comment')
            .set('Cookie', token)
            .send({
                content: 'Comment to fetch',
                postId
            });

        const id = created.body.comment._id;

        const response = await request(app)
            .get(`/api/comment/${id}`);

        expect(response.status).toBe(200);
        expect(response.body.comment._id).toBe(id);
    });

    test('should update own comment', async () => {
        const created = await request(app)
            .post('/api/comment')
            .set('Cookie', token)
            .send({
                content: 'Old comment',
                postId
            });

        const id = created.body.comment._id;

        const response = await request(app)
            .put(`/api/comment/${id}`)
            .set('Cookie', token)
            .send({
                content: 'Updated comment'
            });

        expect(response.status).toBe(200);
        expect(response.body.comment.content).toBe('Updated comment');
    });

    test('should prevent another user from updating a comment', async () => {
        const created = await request(app)
            .post('/api/comment')
            .set('Cookie', token)
            .send({
                content: 'Author comment',
                postId
            });

        const id = created.body.comment._id;

        const response = await request(app)
            .put(`/api/comment/${id}`)
            .set('Cookie', otherUserToken)
            .send({
                content: 'Trying to change another users comment'
            });

        expect(response.status).toBe(403);
    });

    test('should delete own comment', async () => {
        const created = await request(app)
            .post('/api/comment')
            .set('Cookie', token)
            .send({
                content: 'Comment to delete',
                postId
            });

        const id = created.body.comment._id;

        const response = await request(app)
            .delete(`/api/comment/${id}`)
            .set('Cookie', token);

        expect(response.status).toBe(200);
    });

    test('should return 404 for a nonexistent comment', async () => {
        const response = await request(app)
            .get('/api/comment/507f1f77bcf86cd799439011');

        expect(response.status).toBe(404);
    });
});
