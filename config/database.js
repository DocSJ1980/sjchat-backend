//Imports
import mongoose from "mongoose"

//Database connection
export const connectDB = async (URI) => {
    try {
        const { connection } = await mongoose.connect(URI)
        console.log(`Database connected at: ${connection.host}`)
    } catch (error) {
        console.log("Sorry database could not be connected")
    }
}