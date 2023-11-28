const mongoose = require("mongoose");

const privateRoomSchema = new mongoose.Schema({
    roomID: {
        type: String,
        required: true,
    },
    users: {
        type: [],
        required: true,
    },
    isGroup: {
        type: Boolean,
        required: true,
        // default: false,
    },
    groupName: {
        type: String,
        required: function() {
            return this.isGroup;
        },
    },
    groupAdmins: {
        type: [],
        required: function() {
            return this.isGroup;
        },
    },
})

const privateRoomModel = mongoose.model("privateRoomIds", privateRoomSchema)

exports.privateRoomModel = privateRoomModel; 
