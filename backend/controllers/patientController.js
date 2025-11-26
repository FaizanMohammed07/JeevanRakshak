import bcrypt from "bcryptjs";
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

    res.json({ msg: "Login successful", token, patient });
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
