import { connectDB } from "./db";
import bcrypt from "bcryptjs";
import User from "../models/user";

export async function seedAdmin() {
  await connectDB();

  const adminExists = await User.findOne({ role: "admin" });
  if (adminExists) return;

  const hashedPin = await bcrypt.hash("1991", 10); // default first PIN
  await User.create({
    code: "FF01",
    pin: hashedPin,
    role: "admin",
  });

  console.log("First admin seeded successfully!");
}
