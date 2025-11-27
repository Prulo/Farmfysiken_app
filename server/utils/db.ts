import mongoose from "mongoose";
import { seedAdmin } from "./seedAdmin";

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI not set in environment variables!");
  }

  await mongoose.connect(mongoUri);

  await seedAdmin();
};
