import bcrypt from "bcryptjs";
import Employer from "../models/employerModel.js";
import Contractor from "../models/contractorModel.js";
import { serialize } from "cookie";
import { createAndSendToken } from "./doctorController.js";
import { sendWhatsAppMessage } from "../utils/sendWhatsAppMessage.js";

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

export const listContractors = async (req, res) => {
  try {
    const employer = req.employer;
    if (!employer) return res.status(401).json({ msg: "Employer required" });

    const contractors = await Contractor.find({
      employer: employer._id,
    }).select("-password -__v");

    res.json({ contractors, count: contractors.length });
  } catch (err) {
    console.error("listContractors error", err);
    res.status(500).json({ error: err.message });
  }
};

export const linkContractorByPhone = async (req, res) => {
  try {
    const employer = req.employer;
    if (!employer) return res.status(401).json({ msg: "Employer required" });

    const { phoneNumber } = req.body;
    if (!phoneNumber)
      return res.status(400).json({ msg: "phoneNumber required" });

    const contractor = await Contractor.findOne({ phoneNumber }).select(
      "+password"
    );
    if (!contractor)
      return res.status(404).json({ msg: "Contractor not found" });

    if (
      contractor.employer &&
      contractor.employer.toString() !== employer._id.toString()
    ) {
      return res
        .status(400)
        .json({ msg: "Contractor already linked to another employer" });
    }

    contractor.employer = employer._id;
    await contractor.save();

    const safe = contractor.toObject();
    delete safe.password;

    res.json({ msg: "Contractor linked", contractor: safe });
  } catch (err) {
    console.error("linkContractorByPhone error", err);
    res.status(500).json({ error: err.message });
  }
};

export const unlinkContractor = async (req, res) => {
  try {
    const employer = req.employer;
    if (!employer) return res.status(401).json({ msg: "Employer required" });

    const { contractorId } = req.params;
    if (!contractorId)
      return res.status(400).json({ msg: "Contractor ID required" });

    const contractor = await Contractor.findById(contractorId);
    if (!contractor)
      return res.status(404).json({ msg: "Contractor not found" });

    if (
      !contractor.employer ||
      contractor.employer.toString() !== employer._id.toString()
    ) {
      return res
        .status(400)
        .json({ msg: "Contractor not linked to this employer" });
    }

    contractor.employer = null;
    await contractor.save();

    res.json({ msg: "Contractor unlinked" });
  } catch (err) {
    console.error("unlinkContractor error", err);
    res.status(500).json({ error: err.message });
  }
};

export const fetchEmployerProfile = async (req, res) => {
  try {
    const employer = req.employer || req.user;
    if (!employer)
      return res.status(401).json({ msg: "Not authenticated as employer" });

    const safe = { ...employer.toObject() };
    delete safe.password;
    res.json({ employer: safe });
  } catch (err) {
    console.error("fetchEmployerProfile error", err);
    res.status(500).json({ error: err.message });
  }
};

export const broadcastToContractors = async (req, res) => {
  try {
    const employer = req.employer;
    if (!employer) return res.status(401).json({ msg: "Employer required" });

    const { title, message } = req.body || {};
    if (!title || !message)
      return res.status(400).json({ msg: "Title and message are required" });

    // respond immediately and perform delivery in background
    res.status(202).json({ msg: "Broadcast started" });

    // Background send
    setTimeout(async () => {
      try {
        const contractors = await Contractor.find({ employer: employer._id }).select(
          "phoneNumber name"
        );

        for (const c of contractors) {
          if (!c.phoneNumber) continue;
          try {
            await sendWhatsAppMessage(c.phoneNumber, `📢 ${title}\n\n${message}\n\n— ${employer.name}`);
            console.log("WhatsApp sent to contractor:", c.phoneNumber);
          } catch (err) {
            console.error("WhatsApp send failed for contractor", c.phoneNumber, err.message);
          }
        }
      } catch (err) {
        console.error("Broadcast background error", err.message);
      }
    }, 100);
  } catch (err) {
    console.error("broadcastToContractors error", err);
    return res.status(500).json({ error: err.message });
  }
};

export const getContractorDetails = async (req, res) => {
  try {
    const employer = req.employer;
    if (!employer) return res.status(401).json({ msg: "Employer required" });

    const { contractorId } = req.params;
    if (!contractorId) return res.status(400).json({ msg: "Contractor ID required" });

    const contractor = await Contractor.findById(contractorId)
      .select('-password -__v')
      .populate({
        path: 'patients',
        select: 'name age phoneNumber district village contractorCompany contagiousAlert visits chronicDiseases vaccinations updatedAt createdAt',
      })
      .lean();

    if (!contractor) return res.status(404).json({ msg: 'Contractor not found' });

    if (!contractor.employer || contractor.employer.toString() !== employer._id.toString()) {
      return res.status(403).json({ msg: 'Not authorized to view this contractor' });
    }

    // Compute simple monitoring metrics
    const patients = contractor.patients || [];
    const totalPatients = patients.length;
    const contagiousAlerts = patients.filter((p) => p.contagiousAlert && p.contagiousAlert.active).length;
    const lastActivity = patients.reduce((last, p) => {
      const visits = p.visits || [];
      const lastVisit = visits.length ? new Date(Math.max(...visits.map(v=> new Date(v.visit_date || v.visitDate || v.visit_date)))) : null;
      const updated = p.updatedAt ? new Date(p.updatedAt) : null;
      const candidate = lastVisit || updated;
      if (!candidate) return last;
      if (!last) return candidate;
      return candidate > last ? candidate : last;
    }, null);

    const summary = {
      totalPatients,
      contagiousAlerts,
      lastActivity: lastActivity ? lastActivity.toISOString() : null,
    };

    res.json({ contractor, patients, summary });
  } catch (err) {
    console.error('getContractorDetails error', err);
    res.status(500).json({ error: err.message });
  }
};

export const pingContractor = async (req, res) => {
  try {
    const employer = req.employer;
    if (!employer) return res.status(401).json({ msg: 'Employer required' });

    const { contractorId } = req.params;
    const { message } = req.body || {};
    if (!contractorId) return res.status(400).json({ msg: 'Contractor ID required' });
    if (!message) return res.status(400).json({ msg: 'Message is required' });

    const contractor = await Contractor.findById(contractorId).select('phoneNumber name employer');
    if (!contractor) return res.status(404).json({ msg: 'Contractor not found' });

    if (!contractor.employer || contractor.employer.toString() !== employer._id.toString()) {
      return res.status(403).json({ msg: 'Not authorized to message this contractor' });
    }

    // send immediately (fire-and-forget)
    setTimeout(async () => {
      try {
        if (!contractor.phoneNumber) return;
        await sendWhatsAppMessage(contractor.phoneNumber, `${message}\n\n— ${employer.name}`);
        console.log('Ping sent to contractor', contractor.phoneNumber);
      } catch (err) {
        console.error('pingContractor send error', err.message);
      }
    }, 50);

    res.json({ msg: 'Ping queued' });
  } catch (err) {
    console.error('pingContractor error', err);
    res.status(500).json({ error: err.message });
  }
};
