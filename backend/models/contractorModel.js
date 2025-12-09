import mongoose from "mongoose";

const contractorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Contractor name is required"],
    },
    companyName: {
      type: String,
      // required: [true, "Company name is required"],
    },
    phoneNumber: {
      type: String,
      unique: true,
      required: [true, "Phone number is required"],
      validate: {
        validator: (value) => /^\d{10}$/.test(value),
        message: "Phone number must be exactly 10 digits",
      },
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    region: {
      type: String,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual to populate contractor's patients via Patient.contractor
contractorSchema.virtual("patients", {
  ref: "Patient",
  localField: "_id",
  foreignField: "contractor",
});

// Ensure virtuals are included when converting to JSON / Objects
contractorSchema.set("toObject", { virtuals: true });
contractorSchema.set("toJSON", { virtuals: true });

const Contractor = mongoose.model("Contractor", contractorSchema);

export default Contractor;
