const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    roomID: {
        type: String,
        required: true,
    },
    users: {
        type: String,
        required: true,
    }
})

const roomModel = mongoose.model("message", roomSchema)


exports.roomModel = roomModel; 