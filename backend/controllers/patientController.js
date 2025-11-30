import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Patient from "../models/patientModel.js";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const patient = await Patient.findOne({ phoneNumber }).select("+password");

    if (!patient) return res.status(400).json({ msg: "Patient not found" });

    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: patient._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const safePatient = patient.toObject();
    delete safePatient.password;
    delete safePatient.passwordConfirm;

    res.json({ msg: "Login successful", token, patient: safePatient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const signup = async (req, res) => {
  try {
    const {
      name,
      age,
      phoneNumber,
      password,
      passwordConfirm,
      district,
      taluk,
      village,
      address,
    } = req.body;

    if (!name || !phoneNumber || !password || !passwordConfirm)
      return res.status(400).json({ msg: "Please fill all fields" });

    if (password !== passwordConfirm)
      return res.status(400).json({ msg: "Passwords do not match" });

    // Hash password manually
    const hashedPassword = await bcrypt.hash(password, 12);

    const newPatient = await Patient.create({
      name,
      age,
      phoneNumber,
      password: hashedPassword, // hashed value stored
      passwordConfirm: undefined,
      district,
      taluk,
      village,
      address,
      // remove confirm field
    });

    newPatient.password = undefined;

    res.status(201).json({
      msg: "Signup successful",
      patient: newPatient,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPatientProfile = async (req, res) => {
  try {
    const { identifier } = req.params;
    if (!identifier) {
      return res.status(400).json({ msg: "Patient identifier is required" });
    }

    const query = mongoose.isValidObjectId(identifier)
      ? { _id: identifier }
      : { phoneNumber: identifier };

    const patient = await Patient.findOne(query).select(
      "-password -passwordConfirm"
    );

    if (!patient) {
      return res.status(404).json({ msg: "Patient not found" });
    }

    res.status(200).json({ patient });
  } catch (err) {
    console.error("getPatientProfile error", err);
    res.status(500).json({ error: err.message });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user._id).select(
      "-password -passwordConfirm"
    );

    if (!patient) {
      return res.status(404).json({ msg: "Patient not found" });
    }

    res.status(200).json({ patient });
  } catch (err) {
    console.error("getMyProfile error", err);
    res.status(500).json({ error: err.message });
  }
};

export const getMyLabReports = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user._id).select("documents");

    if (!patient) {
      return res.status(404).json({ msg: "Patient not found" });
    }

    res.status(200).json({ documents: patient.documents || [] });
  } catch (err) {
    console.error("getMyLabReports error", err);
    res.status(500).json({ error: err.message });
  }
};
