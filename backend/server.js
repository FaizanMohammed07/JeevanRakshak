import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import patientRoutes from "./routes/patientRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import reportAssistantRoutes from "./routes/reportAssistantRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import diseaseRoutes from "./routes/diseaseRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import campRoutes from "./routes/campRoutes.js";
import govtRoutes from "./routes/govtRoutes.js";

import translateRoute from "./routes/translateRoute.js"; // <-- NEW ROUTE
import ttsRoute from "./routes/ttsRoute.js";

dotenv.config();

// ---------------------------------------------------
// 1) CREATE APP FIRST (THIS MUST COME BEFORE app.use())
// ---------------------------------------------------
const app = express();
const port = 3030;

// ---------------------------------------------
// 2) CORS SETTINGS
// ---------------------------------------------
const allowedOrigins = [
  "http://localhost:5174",
  "http://localhost:5173",
  "http://localhost:5175",
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

// ---------------------------------------------
// 3) MIDDLEWARE
// ---------------------------------------------
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ---------------------------------------------
// 4) DATABASE CONNECTION
// ---------------------------------------------
const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ Error connecting to DB:", err);
  }
};

// ---------------------------------------------
// 5) TEST ROUTE
// ---------------------------------------------
app.get("/", (req, res) => {
  res.send("Home Page");
});

// ---------------------------------------------
// 6) TRANSLATION ROUTE (MUST BE BEFORE OTHER /api ROUTES)
// ---------------------------------------------
app.use("/api/translate", translateRoute);
// TTS endpoint (server-side fallback)
app.use("/api/tts", ttsRoute);

// serve generated tts audio files
app.use(
  "/tts-audio",
  express.static(path.join(process.cwd(), "storage", "tts"))
);

// ---------------------------------------------
// 7) ALL OTHER ROUTES
// ---------------------------------------------
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/report-assistant", reportAssistantRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/disease", diseaseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/camps", campRoutes);
app.use("/api/govt", govtRoutes);

// ---------------------------------------------
// 8) START SERVER
// ---------------------------------------------
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  connectDb();
});
