// Schemas.js/messageSchema.js
const mongoose = require('mongoose');

// Define the schema for storing message data
const messageSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true // Indexing for faster lookups based on user
    },
    guildId: {
        type: String,
        required: true,
        index: true // Indexing for faster lookups based on guild
    },
    channelId: {
        type: String,
        required: true
    },
    messageId: {
        type: String,
        required: true,
        unique: true // Ensure each message is logged only once
    },
    timestamp: {
        type: Date,
        default: Date.now // Automatically set the current time when a message is logged
    },
    // You can add more fields here if you wish to store more message properties, e.g.:
    // content: { type: String },
    // length: { type: Number },
});

// Export the Mongoose model.
// mongoose.models.Message checks if the model already exists to prevent redefinition issues
module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);
