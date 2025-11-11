import { defineEventHandler, createError, getHeader } from "h3";
import { connectDB } from "../../utils/db";
import User from "../../models/user";
import { verifyToken } from "../../utils/jwt";

export default defineEventHandler(async (event) => {
  try {
    console.log("👉 Connecting to DB...");
    await connectDB();

    const authHeader = getHeader(event, "authorization");
    console.log("Auth header:", authHeader);

    if (!authHeader)
      throw createError({
        statusCode: 401,
        message: "Unauthorized - no header",
      });

    const token = authHeader.split(" ")[1];
    console.log("Token:", token);

    const decoded = verifyToken(token) as { code: string; role?: string };
    console.log("Decoded token:", decoded);

    if (!decoded || (decoded.role !== "admin" && decoded.code !== "FF01")) {
      throw createError({ statusCode: 403, message: "Forbidden - not admin" });
    }

    console.log("Fetching users...");
    const users = await User.find({}, "code name comment").sort({ code: 1 });
    console.log("Users found:", users.length);

    return users;
  } catch (error) {
    console.error("🔥 API error:", error);
    throw createError({
      statusCode: 500,
      message: "Server error in /api/admin/list-users",
      data: error,
    });
  }
});
