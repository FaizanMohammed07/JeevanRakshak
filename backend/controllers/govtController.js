import Patient from "../models/patientModel.js";
import Prescription from "../models/prescriptionModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Govt from "../models/govtModel.js";
import { serialize } from "cookie";

export const getPatientByPhone = async (req, res) => {
  try {
    const { phoneNumber } = req.query;

    if (!phoneNumber)
      return res.status(400).json({ msg: "phoneNumber is required" });

    // 1) Find patient
    const patient = await Patient.findOne({ phoneNumber }).lean();
    if (!patient)
      return res.status(404).json({ msg: "Patient not found" });

    // 2) Fetch latest 10 prescriptions for this patient
    const prescriptions = await Prescription.find({ patient: patient._id })
      .sort({ dateOfIssue: -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      patient,
      prescriptions,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const latestPatients = async (req, res) => {
  try {
    const latest = await Prescription.find()
      .sort({ dateOfIssue: -1 })
      .limit(10)
      .populate("patient", "name age phoneNumber district taluk village")
      .lean();

    res.status(200).json({ latest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "90d",
  });
};

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const serialized = serialize("govt_jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 90,
    path: "/",
  });

  res.setHeader("Set-Cookie", serialized);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};

// // ⭐ GOVT SIGNUP
export const govtSignup = async (req, res) => {
  try {
    const { govtId, password, passwordConfirm } = req.body;

    if (!govtId || !password || !passwordConfirm)
      return res.status(400).json({ msg: "All fields required" });

    if (password !== passwordConfirm)
      return res.status(400).json({ msg: "Passwords do not match" });

    const hashed = await bcrypt.hash(password, 12);

    const newGovt = await Govt.create({
      govtId,
      password: hashed,
    });

    createAndSendToken(newGovt, 201, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ⭐ GOVT LOGIN
export const govtLogin = async (req, res) => {
  try {
    const { govtId, password } = req.body;

    const govtUser = await Govt.findOne({ govtId }).select("+password");
    if (!govtUser) return res.status(400).json({ msg: "Invalid Government ID" });

    const isMatch = await bcrypt.compare(password, govtUser.password);
    if (!isMatch) return res.status(400).json({ msg: "Incorrect password" });

    createAndSendToken(govtUser, 200, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ⭐ GOVT LOGOUT
export const govtLogout = (req, res) => {
  const serialized = serialize("govt_jwt", null, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: -1,
    path: "/",
  });

  res.setHeader("Set-Cookie", serialized);
  res.status(200).json({ status: "success" });
};

export const checkGovtAuth = async (req, res) => {
  try {
    const token = req.cookies.govt_jwt;
    if (!token) return res.status(401).json({ msg: "No govt token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const govtUser = await Govt.findById(decoded.id).lean();
    if (!govtUser) return res.status(401).json({ msg: "Govt user not found" });

    res.status(200).json({
      loggedIn: true,
      govt: govtUser,
    });
  } catch (err) {
    res.status(401).json({ msg: "Invalid or expired govt token" });
  }
};

