// import crypto from "crypto";
import mongoose from "mongoose";
// import validator from "validator";
// import bcrypt from "bcryptjs";

const reportAssistantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
  },
  phoneNumber: {
    type: String,
    unique: true,
    required: [true, "Please provide your phone number"],
    validate: {
      validator: function (value) {
        // Must be ONLY digits and exactly 10 characters
        return /^\d{10}$/.test(value);
      },
      message: "Phone number must be exactly 10 digits",
    },
  },
  //   age: { type: Number, required: [true, "Please enter your age"] },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: [8, "Password must be at least 8 characters long"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: false,
  },
});

const ReportAssistant = mongoose.model(
  "ReportAssistant",
  reportAssistantSchema
);

export default ReportAssistant;
