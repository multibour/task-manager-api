const mongoose = require('mongoose');
const validator = require('validator').default;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//--- User ---//

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(val){
            if (!validator.isEmail(val))
                throw new Error('');
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(val){
            if (val < 0)
                throw new Error('no negative.');
        }
    },
    password: {
        type: String,
        trim: true,
        minLength: 7,
        validate(val){
            if (val.toLowerCase().includes('password'))
                throw new Error('A password cannot contain the word \'password\'.');
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, { // options
    timestamps: true
});

userSchema.virtual('tasks', {
    ref: 'Task',            // Within a Task document,
    foreignField: 'author', // the field 'author' references
    localField: '_id'       // the '_id' field of the User document.
});

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });

    if (!user)
        throw new Error('Unable to login. E-mail or password is incorrect.');
    else if (!bcrypt.compareSync(password, user.password))
        throw new Error('Unable to login. E-mail or password is incorrect.');

    return user;
};

userSchema.methods.generateAuthenticationToken = async function(){
    const token = jwt.sign({ _id: this._id.toString() }, process.env.JWT_SECRET);

    this.tokens.push({ token });
    await this.save();

    return token;
};

userSchema.methods.toJSON = function(){
    const user = this.toObject();

    delete user.password;
    delete user.tokens;
    delete user.avatar;

    return user;
};

// hash the 'password' field before the User document is saved
userSchema.pre('save', function(doneSignal){
    if (this.isModified('password')) {
        const salt = bcrypt.genSaltSync(10);
        this.password = bcrypt.hashSync(this.password, salt);
    }

    doneSignal();
});

// delete all Task documents whose 'author' field is the id of the User document before its removal
userSchema.pre('remove', async function(nextFunction){
    await Task.deleteMany({
        author: this._id
    });
    nextFunction();
});

const User = mongoose.model('User', userSchema);


//--- Task ---//

const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false,
        required: false
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // references a User document
    }
}, { // options
    timestamps: true
});

const Task = mongoose.model('Task', taskSchema);

module.exports = { User, Task };
