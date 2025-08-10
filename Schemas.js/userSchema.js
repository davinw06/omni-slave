// Schemas.js/userSchema.js
const mongoose = require('mongoose');

// Define the schema for storing user data for the leaderboard
const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true // Each user should have only one document
    },
    messageCount: {
        type: Number,
        default: 0 // Start the count at 0
    },
    // You could add more fields here, like a username, etc.
    // username: { type: String }
});

// Export the Mongoose model
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
