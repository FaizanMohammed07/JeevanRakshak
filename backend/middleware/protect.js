import jwt from "jsonwebtoken";
import Doctor from "../models/doctorModel.js";
import Patient from "../models/patientModel.js";
import Govt from "../models/govtModel.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header: Bearer <token>
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    // If no token found → unauthorized
    if (!token) {
      return res
        .status(401)
        .json({ msg: "You are not logged in! Please log in to get access." });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.id;

    // Try to find doctor first
    let user = await Doctor.findById(userId);

    if (user) {
      req.user = user;
      req.isDoctor = true;
      req.isPatient = false;
      return next();
    }

    // If not doctor → try patient
    user = await Patient.findById(userId);

    if (user) {
      req.user = user;
      req.isDoctor = false;
      req.isPatient = true;
      return next();
    }

    // If user not found in either collection
    return res.status(401).json({ msg: "User linked to token does not exist" });
  } catch (err) {
    console.error("JWT protect error:", err);
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
};

export const allowDoctorsOnly = (req, res, next) => {
  if (!req.isDoctor)
    return res.status(403).json({ msg: "Only doctors can access this route" });

  next();
};

export const allowPatientsOnly = (req, res, next) => {
  if (!req.isPatient)
    return res.status(403).json({ msg: "Only patients can access this route" });

  next();
};

export const govtProtect = async (req, res, next) => {
  try {
    // 1) Read cookie token
    const token = req.cookies.govt_jwt;
    if (!token) return res.status(401).json({ msg: "Government access denied" });

    // 2) Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if the govt user still exists
    const govtUser = await Govt.findById(decoded.id);
    if (!govtUser)
      return res.status(401).json({ msg: "Government user no longer exists" });

    // 4) Add user to req for next middleware
    req.govt = govtUser;

    next();
  } catch (err) {
    console.log("GOVT PROTECT ERROR:", err);
    res.status(401).json({ msg: "Invalid or expired govt session" });
  }
};


// export const protectDoctor = async (req, res, next) => {
//   try {
//     let token;
//     if (
//       req.headers.authorization &&
//       req.headers.authorization.startsWith("Bearer ")
//     ) {
//       token = req.headers.authorization.split(" ")[1];
//     } else if (req.cookies && req.cookies.jwt) {
//       token = req.cookies.jwt;
//     }

//     // If no token found in either place
//     if (!token) {
//       return res.status(401).json({ msg: "Not authorized. Please log in." });
//     }

//     // verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // find doctor
//     const doctor = await Doctor.findById(decoded.id);

//     if (!doctor)
//       return res.status(401).json({ msg: "Doctor not found or unauthorized." });

//     // attach doctor to request
//     req.user = doctor;

//     next();
//   } catch (err) {
//     res.status(401).json({ msg: "Invalid or expired token." });
//   }
// };
