import bcrypt from "bcryptjs";
import Doctor from "../models/doctorModel.js";
import Patient from "../models/patientModel.js";
import jwt from "jsonwebtoken";

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

    res.json({ msg: "Login successful", token, doctor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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

    res.status(201).json({
      msg: "Signup successful",
      doctor: newDoctor,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPatientByPhone = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber)
      return res.status(400).json({ msg: "Phone number is required" });

    const patient = await Patient.findOne({ phoneNumber });

    if (!patient) return res.status(404).json({ msg: "Patient not found" });

    res.json({ patient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
