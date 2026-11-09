const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');




const register = async(req,res)=>{
    const {name, email, password} = req.body;

    const AlreadyExists = await userModel.findOne({email});

    if(AlreadyExists){
        return res.status(409).json({message: "User with this account is already exists"});
    }

    const hash = await bcrypt.hash(password,10);

  const user=  await userModel.create({
        name,
        email,
        password: hash
    })
   const token = jwt.sign(
    {userId:user._id},
    process.env.JWT_SECRET,
    {expiresIn: '1d'}

   )
   res.cookie('token',token,{
        httpOnly: true,
        secure: process.env.NODE_ENV==='production',
        sameSite: 'lax',
        maxAge: 24*60*60*1000,
        path: '/'
   })

   return res.status(201).json({
    message: "User registered successfully",
    user: {
        id: user._id,
        name: user.name,
        email: user.email
    }
});
}

const login= async(req,res)=>{
    const {email,password} = req.body;

    const user = await userModel.findOne({email}).select('+password');

    if(!user){
        return res.status(401).json({message: "Invalid Email or password"});
    }

    const decoded = await bcrypt.compare(password, user.password);

   

    if(!decoded){
        return res.status(401).json({message: "Email or password is wrong"});
    }

    const token = jwt.sign(
      { userId: user._id},
        process.env.JWT_SECRET,
        {expiresIn: '1d'}
    )

    res.cookie('token',token,{
        httpOnly: true,
        secure: process.env.NODE_ENV==='production',
        sameSite: 'lax',
        maxAge: 24*60*60*1000,
        path:'/'
    })

    return res.status(200).json({message: "Login successfully"});
}

const logout=async(req,res)=>{
   res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
});
    return res.status(200).json({message: "User logout successfully"});
}

module.exports = {
    register,
    login,
    logout
}