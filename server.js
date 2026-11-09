require('dotenv').config();
const app = require('./src/app');
const connectDB= require('./src/config/db');


const startServer = async()=>{
    try {
        await connectDB();

       app.listen(3000, () => {
    console.log("app is running on server 3000");
});
    } catch (error) {
        console.log("error in starting the server");
    }
}

startServer();