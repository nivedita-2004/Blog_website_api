const jwt = require('jsonwebtoken');
const userModel= require('../models/user.model');

const authMiddleware = async(req, res, next)=>{
  try {
      const token = req.cookies.token;
    
  
      if(!token){
          return res.status(401).json({msaage:"Authentication required"});
      }
  
     const verified =  jwt.verify(token, process.env.JWT_SECRET);
      
     const user= await userModel.findById(verified.userId);
     
     if(!user){
      return res.status(401).json({message: "user not found"});
     }
     req.user=user;
     next();
  } catch (error) {
     return res.status(401).json({message: "Invalid or expired token"});
  }

}

module.exports= authMiddleware;