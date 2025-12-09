import mongoose from "mongoose";

const employerSchema = new mongoose.Schema({
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

// // ENCRYPT PASSWORD
// patientSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();

//   this.password = await bcrypt.hash(this.password, 12);
//   this.passwordConfirm = undefined;

//   next();
// });

const Employer = mongoose.model("Employer", employerSchema);

export default Employer;
