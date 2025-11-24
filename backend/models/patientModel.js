// import crypto from "crypto";
import mongoose from "mongoose";
// import validator from "validator";
import bcrypt from "bcryptjs";

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
  },
  age: { type: Number, required: [true, "Please enter your age"] },
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

// // ENCRYPT PASSWORD
// patientSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();

//   this.password = await bcrypt.hash(this.password, 12);
//   this.passwordConfirm = undefined;

//   next();
// });

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;
