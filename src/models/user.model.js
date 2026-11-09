const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required:true,
        unique: true,
        lowercase: true,
        trim:true
    },
    password:{
       type:String,
       required:true,
       minlength: 6,
       select: false
    }
},{timestamps: true});

const userModel = mongoose.model("user", userSchema);

module.exports=userModel;