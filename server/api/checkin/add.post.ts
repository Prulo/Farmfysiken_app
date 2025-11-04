import { defineEventHandler, getHeader, createError } from "h3";
import { connectDB } from "../../utils/db";
import Checkin from "../../models/checkins";
import { verifyToken } from "../../utils/jwt";

export default defineEventHandler(async (event) => {
  await connectDB();

  const authHeader = getHeader(event, "authorization");
  if (!authHeader) throw createError({ statusCode: 401, message: "DIck" });

  const token = authHeader.split(" ")[1];
  if (!token) throw createError({ statusCode: 401, message: "Unauthorized" });

  const decoded = verifyToken(token) as { id?: string; role?: string } | null;

  if (!decoded || !decoded.id)
    throw createError({ statusCode: 401, message: "Kossa" });

  const checkin = await Checkin.create({ userId: decoded.id });
  return { success: true, checkin };
});
