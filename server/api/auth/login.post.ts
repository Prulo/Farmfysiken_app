import { defineEventHandler, readBody, createError } from "h3";
import bcrypt from "bcryptjs";
import User from "../../models/user";
import { connectDB } from "../../utils/db";
import { createToken } from "../../utils/jwt";

export default defineEventHandler(async (event) => {
  await connectDB();

  const body = await readBody<{ code: string; pin: string }>(event);
  const { code, pin } = body;

  if (!code || !pin)
    throw createError({ statusCode: 400, message: "Code and PIN required" });

  const user = await User.findOne({ code });
  if (!user) throw createError({ statusCode: 401, message: "User not found" });

  if (!user.pin) throw createError({ statusCode: 500, message: "PIN not set" });

  const valid = await bcrypt.compare(pin, user.pin);
  if (!valid) throw createError({ statusCode: 401, message: "Invalid PIN" });

  const token = createToken(user);

  return {
    token,
    user: {
      code: user.code,
      rrole: user.role || (user.code === "FF01" ? "admin" : "member"),
      _id: user._id,
    },
  };
});
