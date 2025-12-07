import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1024,
    },
    audience: {
      type: String,
      enum: ["Doctors", "Patients", "All"],
      default: "Doctors",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    districts: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: String,
      default: "automation",
      trim: true,
      maxlength: 120,
    },
    tags: {
      type: [String],
      default: [],
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ audience: 1, createdAt: -1 });

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;
