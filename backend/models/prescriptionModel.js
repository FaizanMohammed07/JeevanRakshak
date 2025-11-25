import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema({
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
    type: String, // example: "3 days", "1 week", etc.
    required: [true, "Please provide symptom duration"],
  },

  contagious: {
    type: Boolean,
    required: true,
    default: false,
  },

  medicinesIssued: {
    type: [String],
    required: [true, "Please list the medicines issued"],
  },

  suspectedDisease: {
    type: String,
  },

  confirmedDisease: {
    type: String,
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
});

// Index for faster patient-wise prescription search
prescriptionSchema.index({ patient: 1 });

const Prescription = mongoose.model("Prescription", prescriptionSchema);

export default Prescription;
