import mongoose from "mongoose";

/**
 * Doctor schema embeds minimal facility metadata so we do not need a separate
 * hospital collection. Extend the availability/assignedCamps arrays as your
 * ops workflows evolve.
 */
const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter the doctor's name"],
      trim: true,
    },
    phoneNumber: {
      type: String,
      unique: true,
      required: [true, "Please provide a phone number"],
      validate: {
        validator: (value) => /^\d{10}$/.test(value),
        message: "Phone number must be exactly 10 digits",
      },
    },
    specialization: {
      type: String,
      default: "General Medicine",
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    facility: {
      code: { type: String, required: true },
      name: { type: String, required: true },
      type: {
        type: String,
        enum: ["district-command", "taluk-hub", "field-camp", "clinic"],
        default: "district-command",
      },
      district: { type: String, required: true },
      taluk: { type: String, required: true },
      address: { type: String, default: "" },
    },
    availability: {
      status: {
        type: String,
        enum: ["on-duty", "off-duty", "leave"],
        default: "on-duty",
      },
      shift: { type: String, default: "06:00-14:00" },
      lastSyncedAt: { type: Date, default: Date.now },
    },
    assignedCamps: [
      {
        campId: { type: String, required: true },
        role: { type: String, default: "support" },
        coverage: { type: String, default: "general" },
      },
    ],
  },
  { timestamps: true }
);

const Doctor = mongoose.model("Doctor", doctorSchema);

/**
 * Patient schema tracks residential hierarchy plus medical status fields used
 * in the dashboard and disease monitoring screens.
 */
const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter the patient's name"],
      trim: true,
    },
    age: {
      type: Number,
      min: 0,
      required: [true, "Please enter age"],
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    phoneNumber: {
      type: String,
      unique: true,
      required: [true, "Please provide a phone number"],
      validate: {
        validator: (value) => /^\d{10}$/.test(value),
        message: "Phone number must be exactly 10 digits",
      },
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    district: {
      type: String,
      required: [true, "Please provide a district"],
      lowercase: true,
    },
    taluk: {
      type: String,
      required: [true, "Please provide a taluk"],
      lowercase: true,
    },
    village: {
      type: String,
      required: [true, "Please provide a village"],
      lowercase: true,
    },
    address: { type: String, default: "" },
    camp: {
      id: { type: String },
      name: { type: String },
    },
    diagnosis: {
      primary: { type: String },
      icdCode: { type: String },
      severity: { type: String, enum: ["low", "medium", "high"] },
      reportedOn: { type: Date },
    },
    vitals: {
      temperature: Number,
      bp: String,
      spo2: Number,
    },
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    treatmentPlan: [
      {
        date: { type: Date, default: Date.now },
        action: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ["under-observation", "recovered", "referred", "transferred"],
      default: "under-observation",
    },
  },
  { timestamps: true }
);

const Patient = mongoose.model("Patient", patientSchema);

/**
 * Prescription schema links doctor and patient records and captures visit
 * details required by the outbreak surveillance UI.
 */
const prescriptionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    symptoms: {
      type: String,
      required: [true, "Please enter symptoms"],
    },
    durationOfSymptoms: {
      type: String,
      required: [true, "Please provide symptom duration"],
    },
    contagious: {
      type: Boolean,
      default: false,
    },
    medicinesIssued: {
      type: [String],
      required: [true, "Please list the medicines issued"],
    },
    suspectedDisease: String,
    confirmedDisease: String,
    dateOfIssue: {
      type: Date,
      default: Date.now,
    },
    followUpDate: Date,
    notes: String,
  },
  { timestamps: true }
);

prescriptionSchema.index({ patient: 1, dateOfIssue: -1 });
prescriptionSchema.index({ doctor: 1, dateOfIssue: -1 });

const Prescription = mongoose.model("Prescription", prescriptionSchema);

export { Doctor, Patient, Prescription };
