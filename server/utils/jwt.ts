import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "supersecret";

export const createToken = (user: any) => {
  return jwt.sign({ id: user._id, role: user.role }, SECRET, {
    expiresIn: "7d",
  });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
};
