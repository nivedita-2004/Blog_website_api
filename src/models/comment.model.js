const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    content:{
        type: String,
        required: true,
        trim:true
    },
    post:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'post',
        required: true

    },
    author:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required:true
    }
},{timestamps: true})

const commentModel = mongoose.model('comment',commentSchema);

module.exports=commentModel;