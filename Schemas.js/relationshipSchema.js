// A possible schema for your Relationship model, updated to fix the error.

const mongoose = require('mongoose');

const relationshipSchema = new mongoose.Schema({
    initiatorId: {
        type: String,
        required: true,
    },
    targetId: {
        type: String,
        required: true,
    },
    // The 'type' field was the source of the error.
    type: {
        type: String,
        required: true,
        // The enum array must contain all possible valid values for 'type'.
        // We've added 'proposal', 'divorce', and 'disown' to the list.
        enum: ['adoption', 'adoption-request', 'proposal', 'divorce', 'disowned', 'marriage', 'other-type'], // 'divorce' and 'disown' have been added here
    },
    status: {
        type: String,
        required: true,
        // The enum array for 'status' needs to include 'disowned' and 'divorced' to fix the latest errors.
        enum: ['pending', 'accepted', 'declined', 'terminated', 'disowned', 'divorced'], // 'disowned' and 'divorced' have been added here
        default: 'pending',
    },
    // You might have other fields like a timestamp
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Relationship = mongoose.model('Relationship', relationshipSchema);

module.exports = Relationship;
