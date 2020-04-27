const models = require('../db/models');
const express = require('express');
const router = new express.Router();

const authenticate = require('./auth');

router.post('/tasks', authenticate, async (req, res) =>{
    const task = new models.Task({
        ...req.body,
        author: req['user']._id
    });

    try {
        await task.save();
        res.status(201).send(task);
    }
    catch(err) {
        res.status(400).send(err);
    }
});

// GET /tasks?completed=true
// GET /tasks?limit=20&skip=40
// GET /tasks?sortBy=createdAt:descending
router.get('/tasks', authenticate, async (req, res) => {
    const match = { author: req['user'] };
    if (req.query.completed)
        match.completed = req.query.completed === 'true';

    const sort = {};
    if (req.query.sortBy) {
        const fields = req.query.sortBy.split(':');
        sort[fields[0]] = (fields[1] === 'desc' ? -1 : 1)
    }

    try{
        const tasks = await models.Task.find(match, null, {
            limit: parseInt(req.query.limit),
            skip: parseInt(req.query.skip),
            sort
        });
        res.send(tasks)
    }
    catch(err){
        res.status(500).send(err)
    }
});

router.get('/tasks/:id', authenticate, async (req, res) => {
    try{
        const task = await models.Task.findOne({
            _id: req.params.id,
            author: req['user']._id
        });

        if (!task)
            return res.status(404).send();

        res.send(task);
    }
    catch (err) {
        res.status(500).send();
    }
});

router.patch('/tasks/:id', authenticate, async (req, res) => {
    const isValid = Object.keys(req.body).every(field => ['description', 'completed'].includes(field));
    if(!isValid)
        return res.status(400).send({ error: 'Invalid update fields.' });

    try {
        const task = await models.Task.findOneAndUpdate({
            _id: req.params.id,
            author: req['user']
        }, req.body, {
            new: true,
            runValidators: true
        });

        if(!task)
            return res.status(404).send();

        res.send(task);
    }
    catch(err) {
        res.status(400).send(err)
    }
});

router.delete('/tasks/:id', authenticate, async (req, res) => {
    try {
        const task = await models.Task.findOneAndDelete({
            _id: req.params.id,
            author: req['user']._id
        });

        if(!task)
            return res.status(404).send();

        res.send(task);
    }
    catch (err) {
        res.status(400).send(err)
    }
});


module.exports = router;
