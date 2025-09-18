require('dotenv').config();
const express = require("express");
const connectToDB = require("./config/db");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");

// Import Routes
const authRoute = require("./routes/auth.route");
const usetProfileRoutes = require("./routes/userProfile.route");
const swapRequestRoutes = require("./routes/swapRequest.route");
const chatRoutes = require("./routes/chat.route");

// middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
connectToDB();
app.use(cors({
  origin: "http://localhost:5173", // React app's URL (Vite default port)
  credentials: true, // Allow cookies to be sent
}));
app.use(morgan("dev"));


// Use Routes
app.use("/api/auth",authRoute); 
app.use("/api/profile",usetProfileRoutes);
app.use("/api/swap-requests",swapRequestRoutes);
app.use("/api/chats",chatRoutes);

app.listen(process.env.PORT , () => {
  console.log("server is running on 3000");
});
