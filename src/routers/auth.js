const jwt = require('jsonwebtoken');
const models = require('../db/models');

const auth = async function(req, res, nextFunction){
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const user = await  models.User.findOne({
            _id: jwt.verify(token, process.env.JWT_SECRET)._id,
            'tokens.token': token
        });

        if(!user)
            throw new Error('Invalid session.');

        req.user = user;
        req.token = token;

        nextFunction();
    }
    catch (err){
        res.status(401).send(err);
    }
};

module.exports = auth;
