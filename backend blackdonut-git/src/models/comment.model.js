const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    food: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'food',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    reply: {
        text: String,
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'foodpartner'
        },
        createdAt: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const commentModel = mongoose.model('comment', commentSchema);

module.exports = commentModel;
