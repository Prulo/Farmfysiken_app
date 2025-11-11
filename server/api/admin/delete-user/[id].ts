import { defineEventHandler, createError, getHeader } from "h3";
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
      message: "Only admin can delete users",
    });

  const userId = event.context.params?.id;
  if (!userId)
    throw createError({ statusCode: 400, message: "User ID missing" });

  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user)
      throw createError({ statusCode: 404, message: "User not found" });

    return { success: true, message: `User ${user.code} deleted.` };
  } catch (err) {
    console.error(err);
    throw createError({ statusCode: 500, message: "Error deleting user" });
  }
});
