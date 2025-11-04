import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  code: string; // FF01 for admin, FF10+ for members
  pin: string; // 4-digit password (hashed)
  role: "admin" | "member";
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  code: { type: String, required: true, unique: true },
  pin: { type: String, required: true }, // hashed using bcrypt
  role: { type: String, enum: ["admin", "member"], required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>("User", userSchema);
