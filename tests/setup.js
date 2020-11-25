const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const models = require('../src/db/models');

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

const sampleUser2Id = new mongoose.Types.ObjectId()
const sampleUser2 = {
    _id: sampleUser2Id,
    name: 'Testing Person2',
    email: 'testperson2@example.com',
    password: 'pass2',
    tokens: [{
        token: jwt.sign({
            _id: sampleUser2Id
        }, process.env.JWT_SECRET)
    }]
}

const task1 = {
    _id: new mongoose.Types.ObjectId(),
    description: 'finish task 1',
    completed: false,
    author: sampleUserId
}

const task2 = {
    _id: new mongoose.Types.ObjectId(),
    description: 'finish task 2',
    completed: true,
    author: sampleUserId
}

const task3 = {
    _id: new mongoose.Types.ObjectId(),
    description: 'finish task 3',
    completed: true,
    author: sampleUser2Id
}

const setupDB = async () => {
    await models.User.deleteMany();
    await models.Task.deleteMany();

    await new models.User(sampleUser).save();
    await new models.User(sampleUser2).save();

    await Promise.all([
        new models.Task(task1).save(),
        new models.Task(task2).save(),
        new models.Task(task3).save()
    ]);
}


module.exports = { sampleUserId, sampleUser, setupDB, sampleUser2Id, sampleUser2, task1 }
