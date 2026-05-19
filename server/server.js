import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import pdfParse from "pdf-parse";
import { GoogleGenerativeAI } from "@google/generative-ai";


// Load environment variables from .env file
dotenv.config();
// Initialize Express app
const app = express();

// CORS configuration to allow requests from frontend
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://ai-resume-analyzer-xi-plum.vercel.app",
        ],
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Upload folder
const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for file uploads (only PDFs allowed)
const upload = multer({
    dest: uploadDir,
});

// Gemini API client initialization
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Test route to verify server is running
app.get("/", (req, res) => {
    res.send("Server is running");
});

// Analyze route to handle resume analysis requests
app.post("/analyze", upload.single("resume"), async (req, res) => {
    let filePath = null;

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No resume uploaded",
            });
        }

        filePath = req.file.path;

        const jobDescription = req.body.jobDescription;

        if (!jobDescription) {
            return res.status(400).json({
                success: false,
                message: "Job description required",
            });
        }

        // READ PDF
        const pdfBuffer = fs.readFileSync(filePath);

        // PARSE PDF
        const pdfData = await pdfParse(pdfBuffer);

        const resumeText = pdfData.text;

        // Gemini model prompting
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
        });

        const prompt = `
Analyze this resume against the job description.

Return:
- Match Score
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

        const response = result.response.text();

        res.json({
            success: true,
            analysis: response,
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message,
        });

    } finally {
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