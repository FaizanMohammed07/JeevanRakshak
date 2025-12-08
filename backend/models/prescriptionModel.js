import mongoose from "mongoose";

const medicineScheduleSchema = new mongoose.Schema(
  {
    morning: { type: Boolean, default: false },
    afternoon: { type: Boolean, default: false },
    night: { type: Boolean, default: false },
  },
  { _id: false }
);

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, trim: true },
    schedule: {
      type: medicineScheduleSchema,
      default: () => ({ morning: false, afternoon: false, night: false }),
    },
    mealTiming: {
      type: String,
      enum: ["before", "after", "any"],
      default: "after",
    },
  },
  { _id: false }
);

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
      // required: [true, "Please enter symptoms"],
    },

    durationOfSymptoms: {
      type: String, // example: "3 days", "1 week", etc.
      // required: [true, "Please provide symptom duration"],
    },

    contagious: {
      type: Boolean,
      required: false,
      default: false,
    },

    medicinesIssued: {
      type: [medicineSchema],
      default: [],
    },

    suspectedDisease: {
      type: String,
    },

    confirmedDisease: {
      type: String,
      required: [false, "Please mention the disease"],
    },

    dateOfIssue: {
      type: Date,
      default: Date.now,
    },

    followUpDate: {
      type: Date,
    },

    notes: {
      type: String, // optional doctor's remarks
    },
    images: {
      type: [String], // array of S3 URLs
      default: [],
    },
  },
  { timestamps: true }
);

// Index for faster patient-wise prescription search
prescriptionSchema.index({ patient: 1 });

const Prescription = mongoose.model("Prescription", prescriptionSchema);

export default Prescription;
