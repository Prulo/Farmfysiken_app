import { defineEventHandler, readBody, createError, getHeader } from "h3";
import bcrypt from "bcryptjs";
import User from "../../../models/user";
import { connectDB } from "../../../utils/db";
import { verifyToken } from "../../../utils/jwt";

export default defineEventHandler(async (event) => {
  await connectDB();

  // --- Auth check ---
  const authHeader = getHeader(event, "authorization");
  if (!authHeader)
    throw createError({ statusCode: 401, message: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  if (!token) throw createError({ statusCode: 401, message: "Unauthorized" });

  const decoded = verifyToken(token) as { code: string; role: string };
  if (!decoded || decoded.role !== "admin")
    throw createError({
      statusCode: 403,
      message: "Only admin can update users",
    });

  const body = await readBody<{
    name?: string;
    comment?: string;
    password?: string;
  }>(event);

  const userId = event.context.params?.id;
  if (!userId)
    throw createError({ statusCode: 400, message: "User ID missing" });

  const updateData: Record<string, any> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.comment !== undefined) updateData.comment = body.comment;

  if (body.password) {
    updateData.pin = await bcrypt.hash(body.password, 10);
  }

  try {
    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });
    if (!user)
      throw createError({ statusCode: 404, message: "User not found" });

    return { success: true, user };
  } catch (err) {
    console.error(err);
    throw createError({ statusCode: 500, message: "Error updating user" });
  }
});
