import { defineEventHandler, readBody, createError } from "h3";
import bcrypt from "bcryptjs";
import User from "../../models/user";
import { connectDB } from "../../utils/db";
import { createToken } from "../../utils/jwt";

export default defineEventHandler(async (event) => {
  await connectDB();

  // Läs body
  const body = await readBody<{ code: string; pin: string }>(event);
  const { code, pin } = body;

  if (!code || !pin) {
    throw createError({ statusCode: 400, message: "Code and PIN required" });
  }

  // Hämta användare
  const user = await User.findOne({ code });
  if (!user) throw createError({ statusCode: 401, message: "User not found" });

  // Kolla om användaren är aktiv
  if (user.active === false) {
    throw createError({ statusCode: 403, message: "User is inactive" });
  }

  if (!user.pin) throw createError({ statusCode: 500, message: "PIN not set" });

  // Kontrollera PIN
  const valid = await bcrypt.compare(pin, user.pin);
  if (!valid) throw createError({ statusCode: 401, message: "Invalid PIN" });

  // Skapa token
  const token = createToken(user);

  return {
    token,
    user: {
      _id: user._id,
      code: user.code,
      role: user.role || (user.code === "FF01" ? "admin" : "member"),
      active: user.active, // ✅ returnera status
      name: user.name || "",
    },
  };
});
