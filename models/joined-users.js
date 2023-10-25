const mongoose = require("mongoose");

const joinedUsersSchema = new mongoose.Schema({
    room: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    }
})

const joinedUsersModel = mongoose.model("joinedUsers", joinedUsersSchema)


exports.joinedUsersModel = joinedUsersModel; 