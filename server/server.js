import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createRequire } from "module";

dotenv.config();

const app = express();

// PDF PARSE
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// CORS
const allowedOrigins = [
    "http://localhost:5173",
    "https://ai-resume-analyzer-xi-plum.vercel.app",
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploads folder
const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer
const upload = multer({
    dest: uploadDir,
});

// Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// route
app.get("/", (req, res) => {
    res.send("Resume Analyzer API Running");
});

// Analyze route
app.post("/analyze", upload.single("resume"), async (req, res) => {
    let filePath = null;

    try {
        console.log("FILE:", req.file);
        console.log("BODY:", req.body);

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
            });
        }

        filePath = req.file.path;

        const jobDescription = req.body.jobDescription?.trim();

        if (!jobDescription) {
            return res.status(400).json({
                success: false,
                message: "Job description is required",
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                success: false,
                message: "Missing GEMINI_API_KEY",
            });
        }

        // READ PDF
        const dataBuffer = fs.readFileSync(filePath);

        // THIS IS THE FIX
        const pdfData = await pdfParse(dataBuffer);

        const resumeText = pdfData.text;

        if (!resumeText || resumeText.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Could not extract text from PDF",
            });
        }

        // Gemini model
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
        });

        const prompt = `
Analyze this resume against the job description.

Return:
1. Match Score (0-100)
2. Strengths
3. Missing Skills
4. Improvements
5. ATS Optimization Tips

Resume:
${resumeText}

Job Description:
${jobDescription}
`;

        const result = await model.generateContent(prompt);

        const response = result.response.text();

        return res.json({
            success: true,
            analysis: response,
        });
    } catch (error) {
        console.error("BACKEND ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    } finally {
        // Delete uploaded file
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});