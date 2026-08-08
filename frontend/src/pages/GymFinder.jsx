import { useState } from "react";
import { apiFetch } from "../services/api";

export default function GymFinder() {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationRequested, setLocationRequested] = useState(false);

  function findNearbyGyms() {
    setError("");
    setLoading(true);
    setLocationRequested(true);

    if (!navigator.geolocation) {
      setError("Geolocation isn't supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await apiFetch("/api/gyms/nearby", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });
          setGyms(res.gyms);
        } catch (err) {
          setError(err.message);
        }
        setLoading(false);
      },
      (geoError) => {
        setError(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Location permission denied. Enable it in your browser settings to find nearby gyms."
            : "Couldn't get your location. Please try again."
        );
        setLoading(false);
      }
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Find Nearby Gyms</h1>

        {!locationRequested && (
          <button
            onClick={findNearbyGyms}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Find Gyms Near Me
          </button>
        )}

        {loading && <p className="text-slate-400 text-sm mt-4">Finding gyms near you...</p>}

        {error && (
          <div className="mt-4">
            <p className="text-red-400 text-sm mb-2">{error}</p>
            <button
              onClick={findNearbyGyms}
              className="bg-slate-800 hover:bg-slate-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {gyms.length > 0 && (
          <div className="flex flex-col gap-3 mt-6">
            {gyms.map((gym) => (
              <div key={gym.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h3 className="text-white font-semibold">{gym.name}</h3>
                <p className="text-slate-400 text-sm mt-1">{gym.address}</p>
                {gym.rating && (
                  <p className="text-slate-300 text-sm mt-1">
                    ⭐ {gym.rating} <span className="text-slate-500">({gym.ratingCount} reviews)</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && locationRequested && gyms.length === 0 && !error && (
          <p className="text-slate-400 text-sm mt-4">
            No gyms found nearby. Try a different location or increase search radius.
          </p>
        )}
      </div>
    </div>
  );
}