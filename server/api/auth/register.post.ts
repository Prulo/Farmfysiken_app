import { defineEventHandler, readBody } from "h3";
import bcrypt from "bcryptjs";
import User from "../../models/user";
import { connectDB } from "../../utils/db";
import { createToken } from "../../utils/jwt";

export default defineEventHandler(async (event) => {
  await connectDB();
  const body = await readBody(event);
  const { name, email, password } = body;

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed });
  const token = createToken(user);

  return { token, user };
});
