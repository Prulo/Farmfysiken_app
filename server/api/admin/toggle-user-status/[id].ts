import { defineEventHandler, readBody, createError, getHeader } from "h3";
import User from "../../../models/user";
import { connectDB } from "../../../utils/db";
import { verifyToken } from "../../../utils/jwt";

export default defineEventHandler(async (event) => {
  await connectDB();

  const authHeader = getHeader(event, "authorization");
  if (!authHeader)
    throw createError({ statusCode: 401, message: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token) as { code: string; role: string };

  if (!decoded || (decoded.role !== "admin" && decoded.code !== "FF01"))
    throw createError({ statusCode: 403, message: "Admin-only" });

  const userId = event.context.params?.id;
  if (!userId)
    throw createError({ statusCode: 400, message: "User ID missing" });

  const { active } = await readBody<{ active: boolean }>(event);

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { active },
    { new: true }
  );

  if (!updatedUser)
    throw createError({ statusCode: 404, message: "User not found" });

  return {
    success: true,
    active: updatedUser.active,
  };
});
