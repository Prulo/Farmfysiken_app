import { defineEventHandler, readBody, createError, getHeader } from "h3";
import bcrypt from "bcryptjs";
import User from "../../models/user";
import { connectDB } from "../../utils/db";
import { verifyToken } from "../../utils/jwt";

export default defineEventHandler(async (event) => {
  await connectDB();

  // 🔒 Auth check
  const authHeader = getHeader(event, "authorization");
  if (!authHeader)
    throw createError({ statusCode: 401, message: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  if (!token) throw createError({ statusCode: 401, message: "Unauthorized" });

  const decoded = verifyToken(token) as { code: string; role: string };
  if (!decoded || decoded.role !== "admin")
    throw createError({
      statusCode: 403,
      message: "Only admin can create users",
    });

  // 🧾 Read body — now includes name
  const body = await readBody<{ code: string; pin: string; name?: string }>(
    event
  );
  const { code, pin, name } = body;

  if (!code || !pin)
    throw createError({ statusCode: 400, message: "Code and PIN required" });

  // 🧠 Hash pin
  const hashedPin = await bcrypt.hash(pin, 10);

  // 🧱 Create user with new fields
  const user = await User.create({
    code,
    pin: hashedPin,
    name: name || "", // 👈 optional name
    comment: "", // 👈 empty comment by default
    role: "member",
  });

  return {
    success: true,
    user: {
      code: user.code,
      name: user.name,
      role: user.role,
    },
  };
});
