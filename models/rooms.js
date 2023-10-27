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

const privateRoomSchema = new mongoose.Schema({
    roomID: {
        type: String,
        required: true,
    },
    users: {
        type: String,
        required: true,
    }
})

// const roomModel = mongoose.model("message", roomSchema)
const privateRoomModel = mongoose.model("privateRoomIds", privateRoomSchema)

// exports.roomModel = roomModel; 
exports.privateRoomModel = privateRoomModel; 