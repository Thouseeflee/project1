const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Comment = require('../models/comment');
const celebSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    work: {
        type: String,
        required: true
    },
    networth: {
        type: String,
        required: true
    },
    place: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    comments: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Comment'
        }
    ],
    likes: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ]

})

celebSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Comment.deleteMany({ _id: { $in: doc.comments } })
    }
})

module.exports = mongoose.model('Celeb', celebSchema)