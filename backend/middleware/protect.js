import jwt from "jsonwebtoken";
import Doctor from "../models/doctorModel.js";

export const protectDoctor = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    // If no token found in either place
    if (!token) {
      return res.status(401).json({ msg: "Not authorized. Please log in." });
    }

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
