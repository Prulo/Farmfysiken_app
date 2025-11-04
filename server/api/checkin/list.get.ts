import { defineEventHandler, getHeader, createError } from "h3";
import { connectDB } from "../../utils/db";
import Checkin from "../../models/checkins";
import { verifyToken } from "../../utils/jwt";

export default defineEventHandler(async (event) => {
  await connectDB();

  const authHeader = getHeader(event, "authorization");
  const token = authHeader?.split(" ")[1];
  if (!token) throw createError({ statusCode: 401, message: "Unauthorized" });

  const decoded = verifyToken(token) as { id?: string; code?: string } | null;
  if (!decoded || decoded.code !== "FF01") {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  // fetch all check-ins with user info
  const checkins = await Checkin.find().populate("userId", "code");
  return checkins;
});
