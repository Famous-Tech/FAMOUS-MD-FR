const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
    },
    session: String,
});

module.exports = mongoose.model("sessionSchema", sessionSchema);
