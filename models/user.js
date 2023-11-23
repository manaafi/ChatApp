const mongoose = require('mongoose');
const Joi = require('joi');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 1024
    },
    verified:{
        type: Boolean,
        default: false
    },
    otp: {
        type: String,
    },
});


// const UserVerifySchema = new mongoose.Schema({
//     email: {
//         type: String,
//         required: true,
//         minlength: 5,
//         maxlength: 255,
//         unique: true
//     },
//     otp: {
//         type: String,
//     },
//     verified: {
//         type: Boolean,
//         required: true,
//         default: false
//     }
// });

// const UserVerifyModel = mongoose.model("userOtps", UserVerifySchema)
const UserModel = mongoose.model("users", UserSchema)

function validateUser(user) {
    const schema = Joi.object({
        name: Joi.string().min(5).max(50).required(),
        email: Joi.string().min(5).max(255).required().email(),
        password: Joi.string().min(5).max(255).required()
    });
    //console.log(schema.validate(user))
    return schema.validate(user);
}

exports.UserModel = UserModel;
// exports.UserVerifyModel = UserVerifyModel;
exports.validate = validateUser;
