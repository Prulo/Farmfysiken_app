import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "supersecret"; // default secret

export const createToken = (user: any) => {
  return jwt.sign(
    { id: user._id, code: user.code, role: user.role }, // MUST include id
    SECRET,
    { expiresIn: "1d" }
  );
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, SECRET); // same secret
  } catch {
    return null;
  }
};
