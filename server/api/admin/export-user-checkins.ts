import { defineEventHandler, getHeader, createError } from "h3";
import { connectDB } from "../../utils/db";
import Checkin from "../../models/checkins";
import { verifyToken } from "../../utils/jwt";
import ExcelJS from "exceljs";

export default defineEventHandler(async (event) => {
  await connectDB();

  // 🔒 Auth
  const authHeader = getHeader(event, "authorization");
  if (!authHeader)
    throw createError({ statusCode: 401, message: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token) as { role: string };
  if (!decoded || decoded.role !== "admin")
    throw createError({ statusCode: 403, message: "Forbidden" });

  // Hämta alla check-ins med användarinformation via userId
  const checkins = await Checkin.find()
    .populate("userId", "code name") // populera endast code och name
    .sort({ timestamp: 1 })
    .lean();

  // Skapa workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("User Check-ins");

  worksheet.columns = [
    { header: "User Code", key: "userCode", width: 10 },
    { header: "User Name", key: "userName", width: 20 },
    { header: "Check-in Date", key: "date", width: 20 },
  ];

  // Lägg till rader
  checkins.forEach((c) => {
    worksheet.addRow({
      userCode: c.userId?.code || "",
      userName: c.userId?.name || "",
      date: c.timestamp ? new Date(c.timestamp).toLocaleString() : "",
    });
  });

  // Skicka fil som buffer
  const buffer = await workbook.xlsx.writeBuffer();

  event.res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  event.res.setHeader(
    "Content-Disposition",
    "attachment; filename=user-checkins.xlsx"
  );

  return buffer;
});
