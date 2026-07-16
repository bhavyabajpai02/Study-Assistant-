import jwt from "jsonwebtoken"

const SECRET = process.env.JWT_SECRET || "aether_jwt_secret_key_123_xyz"

export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, SECRET, {
    expiresIn: "30d"
  })
}

export const verifyToken = (token) => {
  return jwt.verify(token, SECRET)
}
