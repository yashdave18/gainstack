import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";

export default function Onboarding() {
  const { currentUser, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [goals, setGoals] = useState([]);
  const [activityLevel, setActivityLevel] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const goalOptions = [
    { value: "weight_loss", label: "Weight Loss" },
    { value: "muscle_gain", label: "Muscle Gain" },
    { value: "maintenance", label: "Maintenance" },
    { value: "general_fitness", label: "General Fitness" },
  ];

  function toggleGoal(value) {
    setGoals((prev) =>
      prev.includes(value) ? prev.filter((g) => g !== value) : [...prev, value]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (goals.length === 0) {
      setError("Please select at least one goal.");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        gender,
        age: Number(age),
        goals,
        activityLevel,
        weight: Number(weight),
        height: Number(height),
        profileComplete: true,
      });
      await refreshProfile();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  const inputClass =
    "w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg px-4 py-2.5 text-white outline-none transition-colors";
  const labelClass = "block text-slate-300 text-sm font-medium mb-1.5";

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">Tell us about yourself</h1>
        <p className="text-slate-400 text-sm mb-6">
          This helps us personalize your workouts, nutrition guidance, and chatbot responses.
        </p>

        {error && (
          <p className="text-red-400 text-sm mb-4 bg-red-950/40 border border-red-900 rounded-lg py-2 px-3">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} required className={inputClass}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
              min="13"
              max="100"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Goal (select all that apply)</label>
            <div className="grid grid-cols-2 gap-2">
              {goalOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 border rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                    goals.includes(opt.value)
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                      : "border-slate-800 bg-slate-900 text-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={goals.includes(opt.value)}
                    onChange={() => toggleGoal(opt.value)}
                    className="accent-emerald-500"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Activity Level</label>
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Select</option>
              <option value="sedentary">Sedentary</option>
              <option value="light">Lightly Active</option>
              <option value="moderate">Moderately Active</option>
              <option value="very_active">Very Active</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
                min="20"
                max="300"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                required
                min="100"
                max="250"
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-950 font-semibold py-3 rounded-lg transition-colors"
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}