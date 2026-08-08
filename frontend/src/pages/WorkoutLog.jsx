import { useState, useEffect } from "react";
import { apiFetch } from "../services/api";

export default function WorkoutLog() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [exercises, setExercises] = useState([{ name: "", sets: "", reps: "", weight: "" }]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadWorkouts();
  }, []);

  function loadWorkouts() {
    setLoading(true);
    apiFetch("/api/workouts")
      .then((res) => setWorkouts(res.workouts))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  function updateExercise(index, field, value) {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
    );
  }

  function addExerciseRow() {
    setExercises((prev) => [...prev, { name: "", sets: "", reps: "", weight: "" }]);
  }

  function removeExerciseRow(index) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await apiFetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          exercises: exercises.map((ex) => ({
            name: ex.name,
            sets: Number(ex.sets),
            reps: Number(ex.reps),
            weight: Number(ex.weight),
          })),
          notes,
        }),
      });
      setExercises([{ name: "", sets: "", reps: "", weight: "" }]);
      setNotes("");
      loadWorkouts();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  const inputClass =
    "bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-white text-sm outline-none transition-colors";

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Workout Log</h1>

        <form onSubmit={handleSubmit} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-8">
          <label className="block text-slate-300 text-sm font-medium mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className={`${inputClass} mb-4`}
          />

          <p className="text-slate-300 text-sm font-medium mb-2">Exercises</p>
          <div className="space-y-2 mb-3">
            {exercises.map((ex, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  placeholder="Exercise name"
                  value={ex.name}
                  onChange={(e) => updateExercise(i, "name", e.target.value)}
                  required
                  className={`${inputClass} flex-1 min-w-0`}
                />
                <input
                  type="number"
                  placeholder="Sets"
                  value={ex.sets}
                  onChange={(e) => updateExercise(i, "sets", e.target.value)}
                  required
                  className={`${inputClass} w-16`}
                />
                <input
                  type="number"
                  placeholder="Reps"
                  value={ex.reps}
                  onChange={(e) => updateExercise(i, "reps", e.target.value)}
                  required
                  className={`${inputClass} w-16`}
                />
                <input
                  type="number"
                  placeholder="kg"
                  value={ex.weight}
                  onChange={(e) => updateExercise(i, "weight", e.target.value)}
                  required
                  className={`${inputClass} w-20`}
                />
                {exercises.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExerciseRow(i)}
                    className="text-slate-500 hover:text-red-400 px-2 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addExerciseRow}
            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium mb-4"
          >
            + Add Exercise
          </button>

          <label className="block text-slate-300 text-sm font-medium mb-1.5">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={`${inputClass} w-full mb-4 resize-none`}
          />

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-950 font-semibold py-2.5 rounded-lg transition-colors"
          >
            {saving ? "Saving..." : "Save Workout"}
          </button>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </form>

        <h2 className="text-lg font-semibold text-white mb-3">History</h2>
        {loading && <p className="text-slate-500 text-sm">Loading...</p>}
        <div className="space-y-3">
          {workouts.map((w) => (
            <div key={w.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-emerald-400 font-semibold text-sm mb-2">{w.date}</p>
              <ul className="space-y-1">
                {w.exercises.map((ex, i) => (
                  <li key={i} className="text-slate-300 text-sm">
                    {ex.name}: {ex.sets}×{ex.reps} @ {ex.weight}kg
                  </li>
                ))}
              </ul>
              {w.notes && <p className="text-slate-500 text-xs mt-2 italic">{w.notes}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}