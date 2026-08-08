import { useState } from "react";
import { apiFetch } from "../services/api";

export default function SupplementAgent() {
  const [recommendations, setRecommendations] = useState([]);
  const [generalNote, setGeneralNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasAsked, setHasAsked] = useState(false);

  async function getRecommendations() {
    setError("");
    setLoading(true);
    setHasAsked(true);

    try {
      const res = await apiFetch("/api/supplements/recommendations");
      setRecommendations(res.recommendations || []);
      setGeneralNote(res.general_note || "");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">Supplement Suggestions</h1>
        <p className="text-slate-400 text-sm mb-6">
          Get personalized supplement recommendations based on your fitness goals.
        </p>

        {!hasAsked && (
          <button
            onClick={getRecommendations}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Get Recommendations
          </button>
        )}

        {loading && <p className="text-slate-400 text-sm mt-4">Finding the right supplements for you...</p>}
        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

        {generalNote && (
          <p className="bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-lg py-3 px-4 mt-4">
            {generalNote}
          </p>
        )}

        <div className="flex flex-col gap-3 mt-4">
          {recommendations.map((rec, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-4">
              {rec.image && (
                <img
                  src={rec.image}
                  alt={rec.name}
                  className="w-20 h-20 object-contain bg-slate-800 rounded-lg flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm">{rec.name}</h3>
                <p className="text-slate-400 text-xs mt-1">{rec.reason}</p>
                <p className="text-slate-300 text-sm mt-2">
                  ₹{rec.price} {rec.rating && <span className="text-slate-500">· ⭐ {rec.rating}</span>}
                </p>
                <a href={rec.url} target="_blank" rel="noopener noreferrer">
                  <button className="mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors">
                    View & Buy on HealthKart
                  </button>
                </a>
              </div>
            </div>
          ))}
        </div>

        {hasAsked && !loading && recommendations.length > 0 && (
          <button
            onClick={getRecommendations}
            className="bg-slate-800 hover:bg-slate-700 text-white text-sm px-5 py-2.5 rounded-lg transition-colors mt-4"
          >
            Get New Suggestions
          </button>
        )}
      </div>
    </div>
  );
}