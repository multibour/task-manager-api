const request = require('supertest');
const app = require('../src/app');
const models = require('../src/db/models');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose')

const sampleUserId = new mongoose.Types.ObjectId()
const sampleUser = {
    _id: sampleUserId,
    name: 'Test Person',
    email: 'testperson@example.com',
    password: 'pass',
    tokens: [{
        token: jwt.sign({
            _id: sampleUserId
        }, process.env.JWT_SECRET)
    }]
}

beforeEach(async () => {
    console.log('resetting test DB...');
    await models.User.deleteMany();
    await new models.User(sampleUser).save();
});


test('Sign up a new user', async () => {
    const res = await request(app).post('/users').send({
        name: 'Kaan 2',
        email: 'test@example.com',
        password: 'mynewpassw0rd'
    }).expect(201);

    const user = await models.User.findById(res.body.user._id);
    expect(user).not.toBeNull();
});

test('Login existing user', async () => {
    const res = await request(app).post('/users/login').send({
        email: sampleUser.email,
        password: sampleUser.password
    }).expect(200);

    const user = await models.User.findById(sampleUserId);
    expect(res.body.token).toBe(user.tokens[1].token); // check if auth tokens match
});

test('Login non-existent user', async () => {
    await request(app).post('/users/login').send({
        email: 'nonexistent@example.com',
        password: 'incorrectpass'
    }).expect(400);
});

test('Get profile with auth token', async () => {
    await request(app).get('/users/me')
        .set('Authorization', `Bearer ${sampleUser.tokens[0].token}`)
        .send().expect(200);
})

test('Get profile with unauthenticated token', async () => {
    await request(app).get('/users/me')
        .send().expect(401);
});

test('delete account when authenticated', async () => {
    await request(app).delete('/users/me')
        .set('Authorization', `Bearer ${sampleUser.tokens[0].token}`)
        .send().expect(200);

    const user = await models.User.findById(sampleUserId);
    expect(user).toBeNull(); // user must be deleted
});

test('delete account when not authenticated', async () => {
    await request(app).delete('/users/me')
        .send().expect(401);
});

test('Upload avatar image', async () => {
    await request(app).post('/users/me/avatar')
        .set('Authorization', `Bearer ${sampleUser.tokens[0].token}`)
        .attach('avatar', './tests/fixtures/test.png')
        .expect(200);

    const user = await models.User.findById(sampleUserId);
    expect(user.avatar).toEqual(expect.any(Buffer)); // check if img buffer is saved
});

test('Change a valid user field', async () => {
    await request(app).patch('/users/me')
        .set('Authorization', `Bearer ${sampleUser.tokens[0].token}`)
        .send({
            name: 'Test Persona'
        }).expect(200);

    const user = await models.User.findById(sampleUserId);
    expect(user.name).toEqual('Test Persona');
})

test('Change an invalid user field', async () => {
    const res = await request(app).patch('/users/me')
        .set('Authorization', `Bearer ${sampleUser.tokens[0].token}`)
        .send({
            _id: 0
        }).expect(400);

    expect(res.body.error).toEqual('Invalid update fields.'); // check if we got the right error
})
