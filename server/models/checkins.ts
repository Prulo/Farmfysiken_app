import mongoose, { Document, Schema } from "mongoose";

export interface ICheckin extends Document {
  userId: mongoose.Types.ObjectId;
  timestamp: Date;
}

const checkinSchema = new Schema<ICheckin>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model<ICheckin>("Checkin", checkinSchema);
