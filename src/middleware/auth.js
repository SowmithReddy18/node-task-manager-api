const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async(req, res, next) => {
    try {
        let token = req.header('Authorization').replace('Bearer ', '');
        let decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        let user = await User.findOne({ _id: decodedToken._id.toString(), 'token.token': token });
        req.user = user;
        req.token = token;
        next();
    } catch (e) {
        console.log(e);
        res.status(400).send('Invalid token');
    }
}

module.exports = auth;