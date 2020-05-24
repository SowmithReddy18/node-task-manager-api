require('../db/mongoose.js');
const express = require('express');
const Task = require('../models/task.js');
const User = require('../models/user');
const auth = require('../middleware/auth');

const router = new express.Router();

//Endpoints
router.post('/task', auth, async(req, res) => {
    if (!req.body) {
        return res.send('request body unavailable');
    }
    let task = new Task({
        ...req.body,
        owner: req.user._id
    });
    try {
        await task.save();
        res.status(201).send(task);
    } catch (e) {
        res.sendStatus(500).send(e);
    }
})

router.get('/task', auth, async(req, res) => {
    try {
        let match, sort = {};
        if (req.query.completed) {
            match.completed = req.query.completed === 'true' ? true : req.query.completed === 'false' ? false : null;
        }
        if (req.query.sort) {
            let sortParams = req.query.sort.split(':');
            sort[sortParams[0]] = sortParams[1] === 'asc' ? 1 : -1;
        }
        let user = await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        if (!user) {
            res.sendStatus(404).send();
        }
        res.send(user.tasks);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
})

router.get('/task/:id', auth, async(req, res) => {
    try {
        let task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        if (!task) {
            res.sendStatus(404).send();
        }
        res.send(task);
    } catch (e) {
        res.sendStatus(500).send();
    }
})

router.patch('/task/:id', auth, async(req, res) => {
    let patchRequest = Object.keys(req.body);
    let allowedPatches = ['description', 'completed'];
    let isPatchAllowed = patchRequest.every(function(patchKey) {
        if (!allowedPatches.includes(patchKey))
            return false;
        return true;
    })
    try {
        if (!isPatchAllowed) {
            return res.sendStatus(400).send('Invalid update');
        }
        let task = await Task.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, req.body, { new: true, runValidators: true });
        if (!task) {
            return res.sendStatus(404);
        }
        res.send(task);
    } catch (e) {
        res.sendStatus(500).send();
    }
})

router.delete('/task/:id', auth, async(req, res) => {
    try {
        let task = await Task.deleteOne({ _id: req.params.id, owner: req.user._id });
        if (!task.deletedCount) {
            return res.sendStatus(404);
        }
        res.send(task);
    } catch (e) {
        res.sendStatus(500);
    }
})

module.exports = router;