const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    points: {
        type: Number,
        required: true
    },
    comment: {
        type: String,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
})

module.exports = mongoose.model('Comment', commentSchema)