import { useState } from "react";
import axios from "axios";


// Main App Component
function App() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");

  // Handle Analyze Button Click
  const handleAnalyze = async () => {
    if (!file || !jobDescription) {
      alert("Please upload resume and add job description");
      return;
    }
    const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    try {
      setLoading(true);

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
      setLoading(false);
    }
  };

  // JSX Return - Main UI
  return (
    <div className="min-h-screen bg-gray-900 p-10">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-4xl font-bold mb-6">
          AI Resume Analyzer
        </h1>

        <label className="mb-4 flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <p className="mb-2 text-sm text-gray-500 font-semibold">
              {file ? `Selected: ${file.name}` : "Click to upload your resume"}
            </p>
            <p className="text-xs text-gray-400">PDF files only</p>
          </div>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="hidden"
          />
        </label>

        <textarea
          placeholder="Paste Job Description"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="w-full border p-4 rounded-lg h-40"
        />

        <button
          onClick={handleAnalyze}
          className="mt-4 bg-black text-white px-6 py-3 rounded-lg"
        >
          {loading ? "Analyzing..." : "Analyze Resume"}
        </button>

        {analysis && (
          <div className="mt-8 whitespace-pre-wrap border-t pt-6">
            <h2 className="text-2xl font-bold mb-4">
              Analysis Result
            </h2>

            <p>{analysis}</p>
          </div>
        )}
      </div>
      <footer className="mt-8 text-center text-gray-500 text-sm">
        &copy; By Mustafa Al-Bayati
      </footer>
    </div>
  );
}

// Export the App component as default
export default App;