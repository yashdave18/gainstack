import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/api";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [backendData, setBackendData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/me")
      .then(setBackendData)
      .catch((err) => setError(err.message));
  }, []);

  const navItems = [
    { to: "/chatbot", label: "Fitness Assistant", desc: "Chat, track macros, ask anything" },
    { to: "/workouts", label: "Workout Log", desc: "Track your lifts and progress" },
    { to: "/gyms", label: "Find Gyms", desc: "Discover gyms near you" },
    { to: "/tracker", label: "Motion Tracker", desc: "Steps, calories, heart rate" },
    { to: "/supplements", label: "Supplement Suggestions", desc: "Personalized recommendations" },
    { to: "/food-analyzer", label: "Food Analyzer", desc: "CNN + caption model + Gemini food analysis" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">{currentUser?.email}</p>
          </div>
          <button
            onClick={logout}
            className="text-slate-400 hover:text-white text-sm border border-slate-800 hover:border-slate-700 rounded-lg px-4 py-2 transition-colors"
          >
            Log Out
          </button>
        </div>

        {/* {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        {backendData && (
          <p className="text-emerald-500 text-xs mb-6">✓ Connected</p>
        )} */}

        <div className="grid gap-3">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="block bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-xl px-5 py-4 transition-colors"
            >
              <h2 className="text-white font-semibold">{item.label}</h2>
              <p className="text-slate-400 text-sm mt-0.5">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}