import { defineEventHandler } from "h3";
import { connectDB } from "../../utils/db";
import Checkin from "../../models/checkins";

export default defineEventHandler(async () => {
  await connectDB();
  const checkins = await Checkin.find().populate("userId", "name email");
  return checkins;
});
