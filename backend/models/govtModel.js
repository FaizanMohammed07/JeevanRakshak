import mongoose from "mongoose";

const govtSchema = new mongoose.Schema({
  govtId: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
    select: false,
  },

  role: {
    type: String,
    default: "government",
  }
});

const Govt = mongoose.model("Govt", govtSchema);
export default Govt;
