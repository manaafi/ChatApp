const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    room: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    asset:{
        type: String
    }
})

const messageModel = mongoose.model("message", messageSchema)


exports.messageModel = messageModel; 