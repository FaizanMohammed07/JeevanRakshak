import bcrypt from "bcryptjs";
import Doctor from "../models/doctorModel.js";
import Patient from "../models/patientModel.js";
import Prescription from "../models/prescriptionModel.js";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "90d",
  });
};

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const serialized = serialize("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 90,
    path: "/",
  });
  res.setHeader("Set-Cookie", serialized);
  // console.log("Set-Cookie header:", res.getHeaders()["set-cookie"]);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

export const login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const doctor = await Doctor.findOne({ phoneNumber }).select("+password");

    if (!doctor) return res.status(400).json({ msg: "Doctor not found" });

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });
    const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // res.json({ msg: "Login successful", token, doctor });
    createAndSendToken(doctor, 201, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// let ans=bcrypt.hash("keralagovt", 12);
// console.log(ans);

export const signup = async (req, res) => {
  try {
    const { name, age, phoneNumber, password, passwordConfirm } = req.body;

    if (!name || !phoneNumber || !password || !passwordConfirm)
      return res.status(400).json({ msg: "Please fill all fields" });

    if (password !== passwordConfirm)
      return res.status(400).json({ msg: "Passwords do not match" });

    // Hash password manually
    const hashedPassword = await bcrypt.hash(password, 12);

    const newDoctor = await Doctor.create({
      name,
      age,
      phoneNumber,
      password: hashedPassword, // hashed value stored
      passwordConfirm: undefined, // remove confirm field
    });

    newDoctor.password = undefined;

    // res.status(201).json({
    //   msg: "Signup successful",
    //   doctor: newDoctor,
    // });
    createAndSendToken(newDoctor, 201, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const logout = (req, res, next) => {
  const serialized = serialize("jwt", null, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: -1,
    path: "/",
  });
  res.setHeader("Set-Cookie", serialized);

  // res.clearCookie("jwt");
  // console.log("cookie cleared");

  res.status(200).json({ status: "success" });
};

export const getPatientByPhone = async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    if (!phoneNumber)
      return res.status(400).json({ msg: "Phone number is required" });

    const patient = await Patient.findOne({ phoneNumber });

    if (!patient) return res.status(404).json({ msg: "Patient not found" });

    res.json({ patient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMe = (req, res, next) => {
  res.status(200).json({
    status: "success",
    data: {
      user: req.user, // This comes from the protectDoctor middleware
    },
  });
};

export const getDoctorPrescriptions = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    if (!doctorId) {
      return res.status(400).json({ msg: "Doctor ID is required" });
    }

    const prescriptions = await Prescription.find(
      { doctor: doctorId },
      {
        symptoms: 1,
        confirmedDisease: 1,
        suspectedDisease: 1,
        medicinesIssued: 1,
        dateOfIssue: 1,
        followUpDate: 1,
        contagious: 1,
        notes: 1,
      }
    )
      .populate({
        path: "patient",
        select: "name age gender district phoneNumber",
      })
      .sort({ dateOfIssue: -1 }) // newest first
      .lean();

    const uniquePatients = new Set(
      prescriptions.map((p) => p.patient?._id?.toString())
    ).size;

    return res.status(200).json({
      doctorId,
      count: prescriptions.length,
      uniquePatients,
      prescriptions,
    });
  } catch (err) {
    console.error("Error fetching doctor prescriptions:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const getTodayPrescriptionCount = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    if (!doctorId) {
      return res.status(400).json({ msg: "Doctor ID is required" });
    }

    // Build date window for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Query prescriptions for today
    const count = await Prescription.countDocuments({
      doctor: doctorId,
      dateOfIssue: { $gte: startOfDay, $lte: endOfDay },
    });

    return res.status(200).json({
      doctorId,
      date: startOfDay.toISOString().split("T")[0], // yyyy-mm-dd format
      count,
    });
  } catch (err) {
    console.error("Error counting prescriptions:", err);
    return res.status(500).json({ error: err.message });
  }
};
