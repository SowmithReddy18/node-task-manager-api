const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Task = require('./task');

//Schema
const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        validate(value) {
            if (value < 0) {
                throw Error('Age cannot be negative');
            }
        }
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw Error('invalid Email');
            }
        }

    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 8
    },
    token: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

//virtual properties
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

//object methods
userSchema.methods.getAuthToken = async(user) => {
    let token = await jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
    user.token = user.token.concat({ token });
    await user.save();
    return token;
}

userSchema.methods.toJSON = function() {
    let user = this;
    let userObj = user.toObject();
    delete userObj.password;
    delete userObj.token;
    delete userObj.avatar;
    return userObj;
}

//Static Model methods
userSchema.statics.findByCredentials = async(email, password) => {
    let user = await User.findOne({ email });
    if (!user) {
        throw new Error('Unable to login');
    }
    let isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Unable to login');
    }
    return user;
}

//middlewares
userSchema.pre('save', async function(next) {
    let user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
})

userSchema.pre('remove', async function(next) {
    let user = this;
    await Task.deleteMany({ owner: user._id });
    next();
})

const User = mongoose.model('User', userSchema);

module.exports = User;