import mongoose from "mongoose";

const DEFAULT_MEAL_TIMING = "after";
const VALID_MEAL_TIMINGS = ["before", "after", "any"];
const TIME_SLOT_KEYS = ["morning", "afternoon", "night"];

const slotSchema = new mongoose.Schema(
  {
    active: { type: Boolean, default: false },
    mealTiming: {
      type: String,
      enum: VALID_MEAL_TIMINGS,
      default: DEFAULT_MEAL_TIMING,
    },
  },
  { _id: false }
);

const medicineScheduleSchema = new mongoose.Schema(
  TIME_SLOT_KEYS.reduce((acc, key) => {
    acc[key] = {
      type: slotSchema,
      default: () => ({}),
    };
    return acc;
  }, {}),
  { _id: false }
);

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, trim: true },
    schedule: {
      type: medicineScheduleSchema,
      default: () =>
        TIME_SLOT_KEYS.reduce((acc, key) => {
          acc[key] = { active: false, mealTiming: DEFAULT_MEAL_TIMING };
          return acc;
        }, {}),
    },
    mealTiming: {
      type: String,
      enum: VALID_MEAL_TIMINGS,
      default: DEFAULT_MEAL_TIMING,
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
