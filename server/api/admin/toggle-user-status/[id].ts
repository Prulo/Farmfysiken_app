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
  const decoded = verifyToken(token) as { role: string };
  if (!decoded || decoded.role !== "admin")
    throw createError({
      statusCode: 403,
      message: "Only admin can change status",
    });

  const { active } = await readBody<{ active: boolean }>(event);
  const userId = event.context.params?.id;

  if (!userId)
    throw createError({ statusCode: 400, message: "User ID missing" });

  const user = await User.findById(userId);
  if (!user) throw createError({ statusCode: 404, message: "User not found" });

  user.active = active;
  await user.save();

  return { success: true, active: user.active };
});
