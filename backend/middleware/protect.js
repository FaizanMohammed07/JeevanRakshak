import jwt from "jsonwebtoken";
import Doctor from "../models/doctorModel.js";

export const protectDoctor = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res
        .status(401)
        .json({ msg: "Not authorized. No token provided." });

    const token = authHeader.split(" ")[1];

    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // find doctor
    const doctor = await Doctor.findById(decoded.id);

    if (!doctor)
      return res.status(401).json({ msg: "Doctor not found or unauthorized." });

    // attach doctor to request
    req.user = doctor;

    next();
  } catch (err) {
    res.status(401).json({ msg: "Invalid or expired token." });
  }
};
