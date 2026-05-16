import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createRequire } from "module";

dotenv.config();

const app = express();

// Safe CommonJS dependency loading for ES Modules
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// Production CORS configuration
const allowedOrigins = [
    "http://localhost:5173",
    "https://ai-resume-analyzer-xi-plum.vercel.app"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        } else {
            return callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload setup
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
    dest: uploadDir,
});

// Gemini AI Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Root route to verify server health status
app.get("/", (req, res) => {
    res.send("Resume Analyzer API Running");
});

// Core resume analyzer engine
app.post("/analyze", upload.single("resume"), async (req, res) => {
    const filePath = req.file?.path;

    try {
        console.log("FILE:", req.file);
        console.log("BODY:", req.body);

        const jobDescription = (req.body.jobDescription || "").trim();

        // System Input Validations
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No resume uploaded",
            });
        }

        if (!jobDescription) {
            return res.status(400).json({
                success: false,
                message: "Job description is required",
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                success: false,
                message: "Missing Gemini API key",
            });
        }

        // Parse PDF Buffer Content Safely
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        const resumeText = pdfData.text;

        if (!resumeText) {
            return res.status(400).json({
                success: false,
                message: "Could not extract text from PDF",
            });
        }

        // Initialize production flash intelligence layer
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
        });

        const prompt = `
Analyze this resume against the job description.

Return:
- Match Score (0-100)
- Strengths
- Missing Skills
- Improvements
- ATS Tips

Resume:
${resumeText}

Job Description:
${jobDescription}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response.text();

        return res.json({
            success: true,
            analysis: response,
        });

    } catch (error) {
        console.log("BACKEND ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Server error",
        });

    } finally {
        // Safe filesystem teardown
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
});

// Server Initialization
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});