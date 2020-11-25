const request = require('supertest');
const app = require('../src/app');
const models = require('../src/db/models');
const { sampleUserId, sampleUser, setupDB, sampleUser2Id, sampleUser2, task1 } = require('./setup');

beforeEach(setupDB);


test('Create task for user', async () => {
    const res = await request(app).post('/tasks')
        .set('Authorization', `Bearer ${sampleUser.tokens[0].token}`)
        .send({
            description: 'Task 1'
        }).expect(201);

    const task = await models.Task.findById(res.body._id);
    expect(task).not.toBeNull();
    expect(task.completed).toEqual(false);
});

test('Get user tasks', async () => {
    const res = await request(app).get('/tasks')
        .set('Authorization', `Bearer ${sampleUser.tokens[0].token}`)
        .send().expect(200);

    expect(res.body.length).toEqual(2); // there must be 2 tasks
})

test('Delete task from unauthorized user', async () => {
    const res = await request(app).delete(`/tasks/${task1._id}`)
        .set('Authorization', `Bearer ${sampleUser2.tokens[0].token}`)
        .send().expect(404);

    const task = await models.Task.findById(task1._id);
    expect(task).not.toBeNull(); // confirm the task is not deleted
})

// TODO: add more tests
