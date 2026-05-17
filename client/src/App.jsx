import { useState } from "react";
import axios from "axios";

// Main App Component
function App() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");

  // Handle Analyze Button Click
  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();

    // 🛑 SAFETY LOCK 1: Stop parallel execution loops if already loading
    if (loading) return;

    if (!file || !jobDescription) {
      alert("Please upload resume and add job description");
      return;
    }

    const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    
    try {
      setLoading(true);
      setAnalysis(""); // Clear previous results on a new run

      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobDescription", jobDescription);

      // Send POST request to backend
      const response = await axios.post(
        `${BACKEND_URL}/analyze`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setAnalysis(response.data.analysis);

    } catch (error) {
      console.log("FULL ERROR:", error);
      console.log("RESPONSE:", error.response?.data);

      alert(
        error.response?.data?.message ||
        error.message ||
        "Something went wrong"
      );

    } finally {
      setLoading(false); // Releases the safety lock
    }
  };

  // JSX Return - Main UI
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-gray-100">
      <div className="w-full max-w-3xl bg-gray-900 border border-gray-800 rounded-2xl shadow-xl p-8">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-white">
          AI Resume Analyzer
        </h1>
        <p className="text-gray-400 mb-6">
          Upload your CV and match it against any industry job description.
        </p>

        {/* Dropzone File Input */}
        <label className="mb-5 flex flex-col items-center justify-center w-full h-36 border-2 border-gray-700 border-dashed rounded-xl cursor-pointer bg-gray-850 hover:bg-gray-800 hover:border-gray-500 transition duration-200">
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
            <p className="mb-2 text-sm text-gray-300 font-semibold">
              {file ? `Selected: ${file.name}` : "Click to upload your resume"}
            </p>
            <p className="text-xs text-gray-500">PDF files only</p>
          </div>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="hidden"
          />
        </label>

        {/* Job Description Textarea */}
        <textarea
          placeholder="Paste Job Description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="w-full border border-gray-700 bg-gray-850 text-white p-4 rounded-xl h-44 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />

        {/* Submit Button */}
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className={`mt-5 w-full text-white font-bold py-4 px-6 rounded-xl transition duration-200 shadow-md ${
            loading 
              ? "bg-gray-700 cursor-not-allowed text-gray-400" 
              : "bg-blue-600 hover:bg-blue-500 active:scale-[0.99]"
          }`}
        >
          {loading ? "Analyzing Active..." : "Analyze Resume"}
        </button>

        {/* Analysis Presentation Panel */}
        {analysis && (
          <div className="mt-8 border-t border-gray-800 pt-6 animate-fadeIn">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Analysis Result
            </h2>
            <div className="bg-gray-850 border border-gray-800 rounded-xl p-5 whitespace-pre-wrap text-gray-300 leading-relaxed text-sm md:text-base">
              {analysis}
            </div>
          </div>
        )}
      </div>

      <footer className="mt-8 text-center text-gray-600 text-xs tracking-wide">
        &copy; By Mustafa Al-Bayati
      </footer>
    </div>
  );
}

// Export the App component as default
export default App;