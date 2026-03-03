import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const seedDefaultAdmin = async () => {
  // create two admin accounts if they don't already exist
  const admins = [
    { email: "dmin@gmail.com", name: "Default Admin" },
    { email: "admin@gmail.com", name: "Requested Admin" }
  ];

  for (const { email, name } of admins) {
    const existing = await User.findOne({ email });
    if (existing) continue;

    const hashedPassword = await bcrypt.hash("admin", 10);
    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "Admin"
    });

    console.log(`Admin user created: ${email}`);
  }
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
