// Schemas.js/userSchema.js
const mongoose = require('mongoose');

// Define the schema for storing user data for the leaderboard
const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    messageCount: {
        type: Number,
        default: 0
    },
    active: {
        type: Boolean,
        default: true // true = currently in server
    }
});

// Export the Mongoose model
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
