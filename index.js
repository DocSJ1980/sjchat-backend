//. Imports
import express from "express";
import { config } from "dotenv";
import { connectDB } from "./config/database.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import chatRouter from "./routes/chatRoutes.js"
import messageRouter from "./routes/messageRoutes.js"
import userRouter from "./routes/userRoutes.js"
import { createServer } from "http"
import { Server } from "socket.io";

//. Declaring Path for dotenv
config({
    path: "./config/config.env"
})

//. Declaring consts and initializing express
const app = express()
const port = process.env.PORT
const URI = process.env.URI

//. Middlewares
// app.use(cors({
//     credentials: true,
//     origin: "*"
// }))
app.use(cors({
    credentials: true,
    origin: ["https://sjchat.netlify.app"]
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())


//. Using routes
app.get("/", (req, res) => {
    res.send("<h1>App Working fine</h1>")
})
app.use("/api/chat", chatRouter)
app.use("/api/message", messageRouter)
app.use("/api/user", userRouter)

//. Connecting Database
connectDB(URI)

const http = createServer(app)
const io = new Server(http, {
    cors: {
        origin: "*",
        // origin: "http://localhost:5173",
    },
})

let activeUsers = [];

io.on("connection", (socket) => {
    // add new User
    socket.on("new-user-add", (newUserId) => {
        // if user is not added previously
        if (!activeUsers.some((user) => user.userId === newUserId)) {
            activeUsers.push({ userId: newUserId, socketId: socket.id });
            console.log("New User Connected", activeUsers);
        }
        // send all active users to new user
        io.emit("get-users", activeUsers);
    });

    socket.on("disconnect", () => {
        // remove user from active users
        activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
        console.log("User Disconnected", activeUsers);
        // send all active users to all users
        io.emit("get-users", activeUsers);
    });

    // send message to a specific user
    socket.on("send-message", (data) => {
        const { receiverId } = data;
        const user = activeUsers.find((user) => user.userId === receiverId);
        console.log("Sending from socket to :", receiverId)
        console.log("Data: ", data)
        if (user) {
            io.to(user.socketId).emit("recieve-message", data);
        }
    });
});



//. Running http server
http.listen(port, () => {
    console.log(`Server is running on port: ${port}`)
})

