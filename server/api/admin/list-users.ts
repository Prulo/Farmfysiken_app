import { defineEventHandler, createError, getHeader } from "h3";
import { connectDB } from "../../utils/db";
import User from "../../models/user";
import { verifyToken } from "../../utils/jwt";

export default defineEventHandler(async (event) => {
  await connectDB();

  const authHeader = getHeader(event, "authorization");
  if (!authHeader)
    throw createError({ statusCode: 401, message: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token) as { code: string; role?: string };

  // Admin-check (FF01 eller admin)
  if (!decoded || (decoded.role !== "admin" && decoded.code !== "FF01")) {
    throw createError({ statusCode: 403, message: "Forbidden" });
  }

  try {
    // ❗ FIX: Hämta active!
    const users = await User.find(
      {},
      "code name comment active role createdAt"
    ).sort({ code: 1 });

    return users;
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: "Serverfel i /api/admin/list-users",
      data: error,
    });
  }
});
