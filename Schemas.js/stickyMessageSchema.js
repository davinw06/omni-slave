const mongoose = require('mongoose');

// Define the Mongoose schema for storing sticky messages.
// This will keep track of which message is sticky in which channel and its content.
const stickyMessageSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        description: 'The ID of the Discord guild (server) where the sticky message resides.'
    },
    channelId: {
        type: String,
        required: true,
        unique: true, // Only one sticky message per channel at a time
        description: 'The ID of the channel where the sticky message is active.'
    },
    messageId: {
        type: String,
        required: false, // Will be set after the message is sent
        description: 'The ID of the current message that is acting as the sticky message.'
    },
    content: {
        type: String, // Store the raw text content of the sticky message.
                      // For embeds, you could store a JSON string here and parse it.
        required: true,
        description: 'The text content of the sticky message.'
    },
    // Optional: Add a field to store embed data if you want to support sticky embeds
    // embedData: {
    //     type: Object, // Store as a plain JavaScript object that can be converted to JSON
    //     required: false,
    //     description: 'Optional: Stores the JSON structure of an embed if the sticky message is an embed.'
    // },
    lastUpdated: {
        type: Date,
        default: Date.now,
        description: 'Timestamp of when the sticky message was last updated/re-sent.'
    }
});

// Export the Mongoose model. This allows you to interact with the database.
module.exports = mongoose.models.StickyMessage || mongoose.model('StickyMessage', stickyMessageSchema);
