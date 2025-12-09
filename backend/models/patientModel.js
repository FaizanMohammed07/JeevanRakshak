import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    document_name: String,
    document_type: String,
    file_url: String,
    uploaded_at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const vaccinationSchema = new mongoose.Schema(
  {
    vaccine_name: String,
    date_administered: Date,
    next_dose_date: Date,
  },
  { _id: false }
);

const visitSchema = new mongoose.Schema(
  {
    facility_name: String,
    doctor_name: String,
    visit_date: Date,
    reason: String,
  },
  { _id: false }
);

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    age: { type: Number, required: [true, "Please enter your age"] },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say"],
      default: "Prefer not to say",
    },
    phoneNumber: {
      type: String,
      unique: true,
      required: [true, "Please provide your phone number"],
      validate: {
        validator: function (value) {
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
    bloodGroup: {
      type: String,
    },
    emergencyContact: {
      type: String,
    },
    photoUrl: {
      type: String,
    },
    district: {
      type: String,
      required: [true, "Please provide a district"],
    },
    taluk: {
      type: String,
      required: [true, "Please provide a taluk"],
    },
    village: {
      type: String,
      required: [true, "Please provide a village"],
    },
    address: {
      type: String,
    },
    allergies: {
      type: [String],
      default: [],
    },
    chronicDiseases: {
      type: [String],
      default: [],
    },
    currentMedication: {
      type: [String],
      default: [],
    },
    vaccinations: {
      type: [vaccinationSchema],
      default: [],
    },
    visits: {
      type: [visitSchema],
      default: [],
    },
    documents: {
      type: [documentSchema],
      default: [],
    },
    // Contractor linkage: a patient may be assigned to one contractor
    contractor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contractor",
      default: null,
    },
    contractorCompany: {
      type: String,
    },
    // If a contagious prescription is added while patient is linked to a contractor,
    // this field stores the current alert for the contractor to act on.
    contagiousAlert: {
      active: { type: Boolean, default: false },
      disease: { type: String },
      prescription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Prescription",
      },
      createdAt: { type: Date },
      // optional: who created the alert (doctor id)
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    },
  },
  {
    timestamps: true,
  }
);

// // ENCRYPT PASSWORD
// patientSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();

//   this.password = await bcrypt.hash(this.password, 12);
//   this.passwordConfirm = undefined;

//   next();
// });

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;
