const models = require('../db/models');
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const emailer = require('../emailer');

const router = new express.Router();

const authenticate = require('./auth');

router.post('/users', async (req, res) => {
    const user = new models.User(req.body);

    try {
        await user.save();
        const token = await user.generateAuthenticationToken();

        emailer.sendWelcomeMail(user.email, user.name); // no need to await the promise

        res.status(201).send({ user, token });
    }
    catch(err) {
        res.status(400).send(err);
    }
});

router.post('/users/login', async (req, res) => {
    try {
        const user = await models.User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthenticationToken();
        res.status(200).send({ user, token });
    }
    catch (err) {
        res.status(400).send(err);
    }
});

router.post('/users/logout', authenticate, async (req, res) => {
    try{
        const user = req['user'];
        const currToken = req['token'];

        user.tokens = user.tokens.filter(token => token.token !== currToken);
        await user.save();

        res.send();
    }
    catch (err){
        res.status(500).send();
    }
});

router.post('/users/logoutall', authenticate, async (req, res) => {
   try{
       const user = req['user'];

       user.tokens = [];
       await user.save();

       res.send();
   }
   catch(err){
       res.status(500).send();
   }
});

router.get('/users/me', authenticate, async (req, res) => {
    res.send(req['user']);
});

router.patch('/users/me', authenticate, async (req, res) => {
    const isValid = Object.keys(req.body).every(field => ['name', 'email', 'password', 'dateOfBirth'].includes(field));
    if (!isValid)
        return res.status(400).send({ error: 'Invalid update fields.' });

    try {
        const user = req.user;

        Object.keys(req.body).forEach(key => user[key] = req.body[key]);

        await user.save();
        res.status(200).send(user);
    }
    catch(err) {
        res.status(400).send(err);
    }
});

router.delete('/users/me', authenticate, async (req, res) => {
    try{
        const user = req.user;
        await user.remove();

        emailer.sendRemovalMail(user.email, user.name); // no need to await the promise

        res.status(200).send(user);
    }
    catch(err) {
        res.status(400).send(err);
    }
});


//-- Image upload, deletion, fetching --//

const upload = multer({
    limits: {
        fileSize: 1048576 // bytes // (1MB)
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match( /\.(jpg|jpeg|png)$/ )){ // jpg, jpeg or png
            // this had to be done since I could not find a prettier way to catch an error from multer
            req.fileValidationError = 'Images can only be of extension JPG, JPEG or PNG.';

            return cb(null, false);
        }
        cb(null, true);
    }
});

router.post('/users/me/avatar', authenticate, upload.single('avatar'), async (req, res) => {
    if (req.fileValidationError)
        return res.status(400).send({ error: req.fileValidationError });

    const user = req.user;

    user.avatar = await sharp(req.file.buffer).resize({
        width: 250,
        height: 250
    }).png().toBuffer();

    await user.save();

    res.send();
});

router.delete('/users/me/avatar', authenticate, async (req, res) => {
    const user = req['user'];

    user.avatar = undefined;
    await user.save();

    res.send();
});

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await models.User.findById(req.params.id);

        if(!user || !user.avatar)
            throw new Error();

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    }
    catch (err){
        res.status(500).send();
    }
});


module.exports = router;
