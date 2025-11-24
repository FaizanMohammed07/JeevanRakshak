import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import patientRoutes from "./routes/patientRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";

dotenv.config();

const app = express();
const port = 3030;

const allowedOrigins = [
  // "https://newmetro.online",
  // "https://www.newmetro.online",
  // "http://localhost:5175",
  "http://localhost:5173",
  // "https://admin-newmetro.onrender.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views"));

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ Error connecting to DB:", err);
  }
};

app.get("/", (req, res) => {
  res.send("Home Page");
});

app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  connectDb();
});
