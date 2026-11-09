const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8','8.8.4.4']);

const connectDB = async()=>{
      try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database Connected");
      } catch (error) {
         console.log("Error in Connecting database",error.message);
         throw error;
      }
}

module.exports=connectDB;