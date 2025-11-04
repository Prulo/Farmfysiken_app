import mongoose from "mongoose";
import { seedAdmin } from "./seedAdmin";

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/Farmfysiken"
  );

  await seedAdmin();
};
