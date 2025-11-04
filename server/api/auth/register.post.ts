import { defineEventHandler, readBody, createError } from "h3";
import bcrypt from "bcryptjs";
import User from "../../models/user";
import { connectDB } from "../../utils/db";
import { createToken } from "../../utils/jwt";

export default defineEventHandler(async (event) => {
  await connectDB();
  const body = await readBody<{
    name: string;
    email: string;
    password: string;
  }>(event);

  const { name, email, password } = body;

  if (!name || !email || !password)
    throw createError({ statusCode: 400, message: "Missing fields" });

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({ name, email, password: hashed });
  const token = createToken(user);

  return { user, token };
});
