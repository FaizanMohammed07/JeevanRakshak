import bcrypt from "bcryptjs";
import Employer from "../models/employerModel.js";
import { serialize } from "cookie";
import { createAndSendToken } from "./doctorController.js";

export const login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const employer = await Employer.findOne({ phoneNumber }).select(
      "+password"
    );

    if (!employer) return res.status(400).json({ msg: "Employer not found" });

    const isMatch = await bcrypt.compare(password, employer.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    createAndSendToken(employer, 201, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const signup = async (req, res) => {
  try {
    const { name, phoneNumber, password, passwordConfirm } = req.body;

    if (!name || !phoneNumber || !password || !passwordConfirm)
      return res.status(400).json({ msg: "Please fill all fields" });

    if (password !== passwordConfirm)
      return res.status(400).json({ msg: "Passwords do not match" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const newEmployer = await Employer.create({
      name,
      phoneNumber,
      password: hashedPassword,
      passwordConfirm: undefined,
    });

    newEmployer.password = undefined;

    createAndSendToken(newEmployer, 201, res);
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
