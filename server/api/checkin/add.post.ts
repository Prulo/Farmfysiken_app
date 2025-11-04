import { defineEventHandler, getHeader, createError } from "h3";
import { connectDB } from "../../utils/db";
import Checkin from "../../models/checkins";
import { verifyToken } from "../../utils/jwt";
import { JwtPayload } from "jsonwebtoken";

// Define your JWT payload type
interface MyTokenPayload extends JwtPayload {
  id: string;
  role?: string;
}

export default defineEventHandler(async (event) => {
  await connectDB();

  const authHeader = getHeader(event, "authorization");
  if (!authHeader)
    throw createError({ statusCode: 401, message: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  if (!token) throw createError({ statusCode: 401, message: "Unauthorized" });

  const decodedRaw = verifyToken(token);
  if (!decodedRaw)
    throw createError({ statusCode: 401, message: "Unauthorized" });

  const decoded = decodedRaw as MyTokenPayload;

  const checkin = await Checkin.create({ userId: decoded.id });
  return { success: true, checkin };
});
