import { defineEventHandler, readBody, createError } from "h3";
import bcrypt from "bcryptjs";
import User from "../../models/user";
import { connectDB } from "../../utils/db";
import { createToken } from "../../utils/jwt";

export default defineEventHandler(async (event) => {
  await connectDB();
  const body = await readBody<{ email: string; password: string }>(event);
  const { email, password } = body;

  const user = await User.findOne({ email });
  if (!user) throw createError({ statusCode: 401, message: "User not found" });
  if (!user.password)
    throw createError({ statusCode: 500, message: "Password missing" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid)
    throw createError({ statusCode: 401, message: "Invalid password" });

  const token = createToken(user);
  return { token, user };
});
