import mongoose from "mongoose";

const reportsSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctor: {
      //   type: mongoose.Schema.Types.ObjectId,
      type: String,
      ref: "Doctor",
      required: true,
    },
    documentName: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
    file: {
      type: String, // array of S3 URLs
      default: [],
    },
  },
  { timestamps: true }
);

// Index for faster patient-wise prescription search
reportsSchema.index({ patient: 1 });

const Reports = mongoose.model("Reports", reportsSchema);

export default Reports;
