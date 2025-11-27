import { defineEventHandler, readBody, createError, getHeader } from "h3";
import { connectDB } from "../../../utils/db";
import User from "../../../models/user";
import { verifyToken } from "../../../utils/jwt";
import bcrypt from "bcrypt";

export default defineEventHandler(async (event) => {
  await connectDB();

  const authHeader = getHeader(event, "authorization");
  if (!authHeader)
    throw createError({ statusCode: 401, message: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token) as { role: string; code: string };

  if (!decoded || (decoded.role !== "admin" && decoded.code !== "FF01"))
    throw createError({ statusCode: 403, message: "Admin only" });

  const userId = event.context.params?.id;
  if (!userId)
    throw createError({ statusCode: 400, message: "User ID missing" });

  const { name, comment, password } = await readBody(event);

  const updateData: any = { name, comment };
  if (password) {
    updateData.pin = await bcrypt.hash(password, 10);
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
  });

  if (!updatedUser)
    throw createError({ statusCode: 404, message: "User not found" });

  return { success: true, user: updatedUser };
});
