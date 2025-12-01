import bcrypt from "bcryptjs";
import ReportAssistant from "../models/reportAssistantModel.js";
import Patient from "../models/patientModel.js";
import Reports from "../models/reportsModels.js";
// import Patient from "../models/patientModel.js";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import { uploadPdfToS3 } from "../utils/uploadS3.js";

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

export const signup = async (req, res) => {
  try {
    const { name, age, phoneNumber, password, passwordConfirm } = req.body;

    if (!name || !phoneNumber || !password || !passwordConfirm)
      return res.status(400).json({ msg: "Please fill all fields" });

    if (password !== passwordConfirm)
      return res.status(400).json({ msg: "Passwords do not match" });

    // Hash password manually
    const hashedPassword = await bcrypt.hash(password, 12);

    const newRA = await ReportAssistant.create({
      name,
      age,
      phoneNumber,
      password: hashedPassword, // hashed value stored
      passwordConfirm: undefined, // remove confirm field
    });

    newRA.password = undefined;

    createAndSendToken(newRA, 201, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const ra = await ReportAssistant.findOne({ phoneNumber }).select(
      "+password"
    );

    if (!ra) return res.status(400).json({ msg: "Report Assistant not found" });

    const isMatch = await bcrypt.compare(password, ra.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });
    // const token = jwt.sign({ id: ra._id }, process.env.JWT_SECRET, {
    //   expiresIn: "7d",
    // });

    createAndSendToken(ra, 201, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// let ans=bcrypt.hash("keralagovt", 12);
// console.log(ans);

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

// export const addPatientReport = async (req, res) => {
//   try {
//     const { patientId, doctor, documentName, notes } = req.body;

//     if (!patientId || !documentName || !doctor) {
//       return res
//         .status(400)
//         .json({ msg: "patientId, documentName and doctor name are required" });
//     }

//     // Confirm patient exists
//     const patient = await Patient.findById(patientId);
//     if (!patient) {
//       return res.status(404).json({ msg: "Patient not found" });
//     }

//     // Validate file
//     if (!req.file) {
//       return res.status(400).json({ msg: "Please upload a PDF file" });
//     }

//     if (req.file.mimetype !== "application/pdf") {
//       return res.status(400).json({ msg: "Only PDF files are allowed" });
//     }

//     // Upload PDF to S3
//     const pdfUrl = await uploadPdfToS3(req.file, patient.name, doctor);

//     // Create report document
//     const report = await Reports.create({
//       patient: patientId,
//       doctor: doctor,
//       documentName,
//       notes,
//       file: pdfUrl,
//     });

//     return res.status(201).json({
//       msg: "Report uploaded successfully",
//       report,
//     });
//   } catch (err) {
//     console.error("Error adding report:", err);
//     return res.status(500).json({ error: err.message });
//   }
// };

export const getReportsForPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({ msg: "Patient ID is required" });
    }

    // Fetch prescriptions
    const reports = await Reports.find({
      patient: patientId,
    })
      .populate("patient", "name age phoneNumber district taluk village")
      .sort({ dateOfIssue: -1 });
    // .limit(2);

    return res.status(200).json({
      count: reports.length,
      reports,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
