import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
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
import cookieParser from "cookie-parser";
import morgan from "morgan";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TTS_STATIC_DIR = path.join(__dirname, "tts-files");

const app = express();
const port = 3030;

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

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use("/tts-files", express.static(TTS_STATIC_DIR));
// app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views"));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

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
app.use("/api/report-assistant", reportAssistantRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/disease", diseaseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/camps", campRoutes);
app.use("/api/govt", govtRoutes);

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  connectDb();
});
