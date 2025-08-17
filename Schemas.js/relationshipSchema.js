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
    type: {
        type: String,
        required: true,
        enum: [
            'adoption',
            'adoption-request',
            'proposal',
            'marriage',
            'divorce',
            'disown',
            'other-type'
        ],
    },
    status: {
        type: String,
        required: true,
        enum: [
            'pending',
            'accepted',
            'declined',
            'terminated',
            'disowned',
            'divorced'
        ],
        default: 'pending',
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Relationship = mongoose.model('Relationship', relationshipSchema);
module.exports = Relationship;
