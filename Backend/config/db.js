import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || "admin";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const ensureAdminUser = async ({ email, name }) => {
  const normalizedEmail = normalizeEmail(email);
  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

  const result = await User.updateOne(
    { email: normalizedEmail },
    {
      $setOnInsert: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: "Admin",
      },
    },
    { upsert: true }
  );

  if (result.upsertedCount > 0) {
    console.log(`Admin user created: ${normalizedEmail}`);
  }
};

const seedDefaultAdmin = async () => {
  const admins = [
    { email: "dmin@gmail.com", name: "Default Admin" },
    { email: "admin@gmail.com", name: "Requested Admin" }
  ];

  for (const admin of admins) {
    await ensureAdminUser(admin);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);

    try {
      await seedDefaultAdmin();
    } catch (error) {
      console.error("Default admin seed failed:", error.stack || error.message || error);
    }

    return conn;
  } catch (error) {
    console.error("MongoDB connection error:", error.stack || error.message || error);
    throw error;
  }
};

export default connectDB;
