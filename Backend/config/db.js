import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const seedDefaultAdmin = async () => {
  const email = "dmin@gmail.com";
  const existing = await User.findOne({ email });
  if (existing) return;

  const hashedPassword = await bcrypt.hash("admin", 10);
  await User.create({
    name: "Default Admin",
    email,
    password: hashedPassword,
    role: "Admin"
  });

  console.log("Default admin user created: dmin@gmail.com");
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    await seedDefaultAdmin();
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
