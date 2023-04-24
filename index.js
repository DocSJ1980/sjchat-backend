//. Imports
import express from "express";
import { config } from "dotenv";
import { connectDB } from "./config/database.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import chatRouter from "./routes/chatRoutes.js"
import messageRouter from "./routes/messageRoutes.js"
import userRouter from "./routes/userRoutes.js"

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
    origin: ["http://localhost:5173"]
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

//. Running http server
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`)
})

