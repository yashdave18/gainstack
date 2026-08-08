import { useState } from "react";
import { apiFetch } from "../services/api";

export default function FoodAnalyzer() {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(e) {
    const file = e.target.files[0];
    setImageFile(file);
    setResult(null);
    setError("");
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  async function handleAnalyze() {
    if (!imageFile) return;
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      const res = await apiFetch("/api/food-analysis/analyze", {
        method: "POST",
        body: formData,
      });
      setResult(res);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">Food Analyzer</h1>
        <p className="text-slate-400 text-sm mb-6">
          Upload a food photo — analyzed by a custom-trained CNN, an image captioning model, and Gemini together.
        </p>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="text-slate-400 text-sm w-full file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-300 mb-3"
          />

          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="rounded-lg max-h-64 mx-auto mb-3" />
          )}

          <button
            onClick={handleAnalyze}
            disabled={!imageFile || loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-950 font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? "Analyzing..." : "Analyze Food"}
          </button>

          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>

        {result && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mt-4">
            <h2 className="text-white font-semibold text-lg mb-1">{result.food_name}</h2>
            <p className="text-slate-400 text-sm mb-4">{result.estimated_portion}</p>

            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-slate-800 rounded-lg p-3 text-center">
                <p className="text-emerald-400 font-bold text-lg">{result.calories}</p>
                <p className="text-slate-500 text-xs">kcal</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3 text-center">
                <p className="text-white font-bold text-lg">{result.protein_g}g</p>
                <p className="text-slate-500 text-xs">protein</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3 text-center">
                <p className="text-white font-bold text-lg">{result.carbs_g}g</p>
                <p className="text-slate-500 text-xs">carbs</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3 text-center">
                <p className="text-white font-bold text-lg">{result.fat_g}g</p>
                <p className="text-slate-500 text-xs">fat</p>
              </div>
            </div>

            <p className="text-slate-300 text-sm mb-3">{result.suggestions}</p>

            <details className="text-xs text-slate-500 mt-4">
              <summary className="cursor-pointer hover:text-slate-300">Model pipeline details</summary>
              <div className="mt-2 space-y-1 pl-2">
                <p>CNN prediction: {result.cnn_prediction} ({(result.cnn_confidence * 100).toFixed(1)}% confidence, {result.cnn_trusted ? "trusted" : "not trusted"})</p>
                <p>Image caption: "{result.caption}"</p>
                <p>{result.confidence_note}</p>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}