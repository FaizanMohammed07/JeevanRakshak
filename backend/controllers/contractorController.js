import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import Contractor from "../models/contractorModel.js";
import Patient from "../models/patientModel.js";
import { sendWhatsAppMessage } from "../utils/sendWhatsAppMessage.js";
import { createAndSendToken } from "./doctorController.js";

// const signToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
// };

// const createAndSendToken = (user, statusCode, res) => {
//   const token = signToken(user._id);

//   const serialized = serialize("jwt", token, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "strict",
//     maxAge: 60 * 60 * 24 * 90,
//     path: "/",
//   });
//   res.setHeader("Set-Cookie", serialized);
//   // console.log("Set-Cookie header:", res.getHeaders()["set-cookie"]);

//   user.password = undefined;

//   res.status(statusCode).json({
//     status: "success",
//     token,
//     data: {
//       user,
//     },
//   });
// };

const sanitizeContractor = (contractor) => {
  const safe = contractor.toObject();
  delete safe.password;
  return safe;
};

export const signupContractor = async (req, res) => {
  try {
    const {
      name,
      companyName,
      phoneNumber,
      password,
      passwordConfirm,
      email,
      region,
    } = req.body;
    console.log(req.body);

    if (
      !name ||
      // !companyName ||
      !phoneNumber ||
      !password ||
      !passwordConfirm
    ) {
      return res
        .status(400)
        .json({ msg: "Please fill all required contractor fields" });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ msg: "Passwords do not match" });
    }

    const existing = await Contractor.findOne({ phoneNumber });
    if (existing) {
      return res
        .status(400)
        .json({ msg: "A contractor with this phone number already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const contractor = await Contractor.create({
      name,
      companyName,
      phoneNumber,
      email,
      region,
      password: hashedPassword,
    });

    // const token = signToken(contractor._id);

    // res.status(201).json({
    //   msg: "Contractor registered successfully",
    //   token,
    //   contractor: sanitizeContractor(contractor),
    // });
    // console.log("success");

    createAndSendToken(contractor, 201, res);
  } catch (err) {
    console.error("Contractor signup error", err);
    res.status(500).json({ error: err.message });
  }
};

export const loginContractor = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res
        .status(400)
        .json({ msg: "Phone number and password are required" });
    }

    const contractor = await Contractor.findOne({ phoneNumber }).select(
      "+password"
    );
    if (!contractor) {
      return res.status(400).json({ msg: "Contractor not found" });
    }

    const isMatch = await bcrypt.compare(password, contractor.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    createAndSendToken(contractor, 200, res);
  } catch (err) {
    console.error("Contractor login error", err);
    res.status(500).json({ error: err.message });
  }
};

export const addWorker = async (req, res) => {
  try {
    const contractor = req.contractor;
    if (!contractor) {
      return res.status(403).json({ msg: "Contractor credentials required" });
    }

    const {
      name,
      age,
      gender,
      phoneNumber,
      district,
      taluk,
      village,
      address,
    } = req.body;

    if (!name || !phoneNumber || !district || !taluk || !village) {
      return res
        .status(400)
        .json({ msg: "Missing required worker information" });
    }

    const existingWorker = await Patient.findOne({ phoneNumber });
    if (existingWorker) {
      return res.status(400).json({ msg: "Worker already exists" });
    }

    const tempPassword = crypto.randomBytes(6).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const worker = await Patient.create({
      name,
      age,
      gender,
      phoneNumber,
      district,
      taluk,
      village,
      address,
      password: hashedPassword,
      passwordConfirm: undefined,
      contractor: contractor._id,
      contractorCompany: contractor.companyName,
    });

    const sanitizedWorker = worker.toObject();
    delete sanitizedWorker.password;
    delete sanitizedWorker.passwordConfirm;

    res.status(201).json({
      msg: "Worker added successfully",
      worker: sanitizedWorker,
      temporaryPassword: tempPassword,
    });
  } catch (err) {
    console.error("addWorker error", err);
    res.status(500).json({ error: err.message });
  }
};

export const listWorkers = async (req, res) => {
  try {
    const contractor = req.contractor;
    const workers = await Patient.find({ contractor: contractor._id }).select(
      "-password -passwordConfirm"
    );

    res.json({ workers, count: workers.length });
  } catch (err) {
    console.error("listWorkers error", err);
    res.status(500).json({ error: err.message });
  }
};

// Link an existing patient (found by phoneNumber) to the authenticated contractor
export const linkWorkerByPhone = async (req, res) => {
  try {
    const contractor = req.contractor;
    if (!contractor) {
      return res.status(403).json({ msg: "Contractor credentials required" });
    }

    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ msg: "phoneNumber is required" });
    }

    // Find patient by phone
    const patient = await Patient.findOne({ phoneNumber }).select(
      "+password contractor"
    );

    if (!patient) {
      return res.status(404).json({ msg: "Patient not found" });
    }

    // If patient already assigned to a contractor, prevent linking
    if (patient.contractor) {
      return res
        .status(400)
        .json({ msg: "Patient is already assigned to a contractor" });
    }

    // Link and save
    patient.contractor = contractor._id;
    patient.contractorCompany = contractor.companyName;
    await patient.save();

    const sanitized = patient.toObject();
    delete sanitized.password;
    delete sanitized.passwordConfirm;

    res.json({ msg: "Patient linked successfully", worker: sanitized });
  } catch (err) {
    console.error("linkWorkerByPhone error", err);
    res.status(500).json({ error: err.message });
  }
};

export const getWorker = async (req, res) => {
  try {
    const contractor = req.contractor;
    const { workerId } = req.params;

    if (!workerId) {
      return res.status(400).json({ msg: "Worker ID is required" });
    }

    const worker = await Patient.findOne({
      _id: workerId,
      contractor: contractor._id,
    }).select("-password -passwordConfirm");

    if (!worker) {
      return res.status(404).json({ msg: "Worker not found" });
    }

    res.json({ worker });
  } catch (err) {
    console.error("getWorker error", err);
    res.status(500).json({ error: err.message });
  }
};

// Update an existing worker's location & address fields (contractor-scoped)
export const updateWorker = async (req, res) => {
  try {
    const contractor = req.contractor;
    const { workerId } = req.params;
    if (!contractor)
      return res.status(403).json({ msg: "Contractor credentials required" });
    if (!workerId) return res.status(400).json({ msg: "Worker ID required" });

    const { district, taluk, village, address } = req.body;

    const update = {};
    if (district !== undefined) update.district = district;
    if (taluk !== undefined) update.taluk = taluk;
    if (village !== undefined) update.village = village;
    if (address !== undefined) update.address = address;

    const worker = await Patient.findOneAndUpdate(
      { _id: workerId, contractor: contractor._id },
      { $set: update },
      { new: true }
    )
      .select("-password -passwordConfirm")
      .populate({
        path: "contractor",
        select: "name companyName phoneNumber employer",
        populate: { path: "employer", select: "name companyName phoneNumber" },
      });

    if (!worker) {
      return res.status(404).json({ msg: "Worker not found or not assigned to you" });
    }

    res.json({ msg: "Worker updated successfully", worker });
  } catch (err) {
    console.error("updateWorker error", err);
    res.status(500).json({ error: err.message });
  }
};

export const removeWorker = async (req, res) => {
  try {
    const contractor = req.contractor;
    const { workerId } = req.params;

    if (!workerId) {
      return res.status(400).json({ msg: "Worker ID is required" });
    }

    const worker = await Patient.findOneAndDelete({
      _id: workerId,
      contractor: contractor._id,
    });

    if (!worker) {
      return res
        .status(404)
        .json({ msg: "Worker not found or already removed" });
    }

    res.json({ msg: "Worker removed successfully" });
  } catch (err) {
    console.error("removeWorker error", err);
    res.status(500).json({ error: err.message });
  }
};

export const clearWorkerAlert = async (req, res) => {
  try {
    const contractor = req.contractor;
    const { workerId } = req.params;
    if (!contractor)
      return res.status(403).json({ msg: "Contractor credentials required" });
    if (!workerId) return res.status(400).json({ msg: "Worker ID required" });

    const worker = await Patient.findOne({
      _id: workerId,
      contractor: contractor._id,
    });
    if (!worker)
      return res
        .status(404)
        .json({ msg: "Worker not found or not assigned to you" });

    worker.contagiousAlert = { active: false };
    await worker.save();

    res.json({
      msg: "Alert cleared successfully",
      worker: { _id: worker._id },
    });
  } catch (err) {
    console.error("clearWorkerAlert error", err);
    res.status(500).json({ error: err.message });
  }
};

export const fetchContractorProfile = async (req, res) => {
  try {
    const contractor = req.contractor || req.user;
    if (!contractor) {
      return res.status(401).json({ msg: "Not authenticated as contractor" });
    }

    const safe = sanitizeContractor(contractor);
    res.json({ contractor: safe });
  } catch (err) {
    console.error("fetchContractorProfile error", err);
    res.status(500).json({ error: err.message });
  }
};

// Contractor broadcast: send a WhatsApp message to all patients linked to this contractor
export const broadcastToPatients = async (req, res) => {
  try {
    const contractor = req.contractor;
    if (!contractor)
      return res.status(403).json({ msg: "Contractor credentials required" });

    const { message, title } = req.body || {};
    if (!message || !message.toString().trim()) {
      return res.status(400).json({ msg: "Message text is required" });
    }

    // Fetch patients assigned to this contractor
    const patients = await Patient.find(
      { contractor: contractor._id },
      "phoneNumber name"
    ).lean();

    // respond immediately with counts and a lightweight payload
    res.status(202).json({ msg: "Broadcast queued", count: patients.length });

    // Background broadcast (do not block response)
    setTimeout(async () => {
      for (const p of patients) {
        try {
          const to = p.phoneNumber;
          // Simple payload: title (optional) + message + patient name
          const text = title ? `*${title}*\n\n${message}` : message;
          await sendWhatsAppMessage(to, `Hello ${p.name || ""},\n\n${text}`);
          console.log("WhatsApp sent to", to);
        } catch (err) {
          console.error(
            "Broadcast send failed for",
            p.phoneNumber,
            err?.message || err
          );
        }
      }
      console.log(
        "Broadcast finished for contractor",
        contractor._id.toString()
      );
    }, 50);
  } catch (err) {
    console.error("broadcastToPatients error", err);
    res.status(500).json({ error: err.message });
  }
};
