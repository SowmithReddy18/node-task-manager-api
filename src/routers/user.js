const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendGoodbyeEmail, sendWelcomeEmail } = require('../emails/account');
require('../db/mongoose');
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');

const app = express();
const router = new express.Router();

router.get('/user/me', auth, async(req, res) => {
    try {
        res.send(req.user);
    } catch (e) {
        res.status(400).send(e);
    }
})

router.get('/user', auth, async(req, res) => {
    try {
        if (req.user.name == 'Admin') {
            let users = await User.find();
            return res.send(users)
        }
        res.status(401).send('Permission to Action Denied');
    } catch (e) {
        res.status(400).send(e);
    }
})

router.get('/user/:id', async(req, res) => {
    try {
        let user = await User.findById(req.params.id);
        if (!user) {
            return res.sendStatus(404).send();
        }
        res.send(user);
    } catch (e) {
        res.sendStatus(500).send();
    }
})

router.post('/user', async(req, res) => {
    try {
        let user = new User(req.body);
        let token = await user.getAuthToken(user);
        sendWelcomeEmail(user.email, user.name);
        res.status(201).send({ user, token });
    } catch (e) {
        console.log(e);
        res.sendStatus(500).send();
    }
})

router.patch('/user/me', auth, async(req, res) => {
    try {
        let patchRequest = Object.keys(req.body);
        let allowedPatches = ['name', 'age', 'email', 'password'];
        let isPatchAllowed = patchRequest.every(function(patchKey) {
            if (!allowedPatches.includes(patchKey))
                return false;
            return true;
        })
        if (!isPatchAllowed) {
            return res.sendStatus(400).send('Invalid update');
        }
        let user = req.user;
        if (!user) {
            return res.sendStatus(404).send();
        }
        patchRequest.forEach(function(update) {
            user[update] = req.body[update];
        })
        await user.save();
        res.send(user);
    } catch (e) {
        console.log(e);
        res.sendStatus(500).send();
    }
})

//file upload functionality
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
            return cb(undefined, true);
        }
        cb(new Error('Please upload an Image'));
    }
})

router.post('/user/me/avatar', auth, upload.single('avatar'), async(req, res) => {
    if (req.file.buffer) {
        // req.user.avatar = req.file.buffer;
        let buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
        req.user.avatar = buffer;
    }
    await req.user.save();
    res.sendStatus(200);
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
})

router.get('/user/:id/avatar', async(req, res) => {
    try {
        let user = await User.findById(req.params.id);
        if (!user && !user.avatar) {
            return res.status(404).send();
        }
        res.set('Content-Type', 'image/png').send(user.avatar);
    } catch (e) {
        res.status(400).send(e);
    }
})

router.delete('/user/me/avatar', auth, async(req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.sendStatus(200);
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
})

router.delete('/user/me', auth, async(req, res) => {
    try {
        let user = req.user;
        await user.remove()
        sendGoodbyeEmail(user.email, user.name);
        res.send(user);
    } catch (e) {
        res.sendStatus(400);
    }
})

router.post('/user/login', async(req, res) => {
    try {
        let { email, password } = req.body;
        var user = await User.findByCredentials(email, password);
        var token = await user.getAuthToken(user);
        res.send({ user, token });
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
})

router.post('/user/logout', auth, async(req, res) => {
    try {
        req.user.token = req.user.token.filter(t => t.token != req.token)
        await req.user.save();
        res.send(req.user);
    } catch (e) {
        res.sendStatus(400);
    }
})

router.post('/user/logout/all', auth, async(req, res) => {
    try {
        req.user.token = [];
        await req.user.save();
        res.send(req.user);
    } catch (e) {
        res.sendStatus(400);
    }
})

module.exports = router;