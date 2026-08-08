import { useAuth } from "../context/AuthContext";
import { useMotionSensors } from "../hooks/useMotionSensors";
import { useCameraPPG } from "../hooks/useCameraPPG";

export default function Tracker() {
  const { userProfile } = useAuth();
  const {
    stepCount, isTracking, permissionError,
    startTracking, stopTracking, resetSteps,
    elapsedSeconds, caloriesBurned,
  } = useMotionSensors(userProfile?.weight);

  const { videoRef, start: startHR, stop: stopHR, isMeasuring, bpm, error: hrError, progress } = useCameraPPG();

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Motion Tracker</h1>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center mb-4">
          <div className="text-5xl font-bold text-emerald-400">{stepCount}</div>
          <p className="text-slate-400 text-sm mt-1">
            steps this session ({minutes}m {seconds}s)
          </p>

          {caloriesBurned !== null && (
            <p className="text-slate-300 text-sm mt-3">🔥 ~{caloriesBurned} kcal burned (estimate)</p>
          )}

          {permissionError && <p className="text-red-400 text-sm mt-3">{permissionError}</p>}

          <div className="flex gap-2 justify-center mt-4">
            {!isTracking ? (
              <button
                onClick={startTracking}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-5 py-2 rounded-lg transition-colors"
              >
                Start Tracking
              </button>
            ) : (
              <button
                onClick={stopTracking}
                className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-lg transition-colors"
              >
                Stop Tracking
              </button>
            )}
            <button
              onClick={resetSteps}
              className="text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
          <h2 className="text-white font-semibold mb-1">Heart Rate</h2>
          <p className="text-slate-500 text-xs mb-4">
            Cover your rear camera and flash completely with your fingertip, then hold still for 15 seconds.
          </p>

          <video ref={videoRef} className="w-px h-px opacity-0" playsInline muted />

          {isMeasuring && (
            <div className="mb-3">
              <p className="text-slate-400 text-sm mb-2">Measuring... {Math.round(progress)}%</p>
              <div className="bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {bpm !== null && (
            <p className="text-4xl font-bold text-white mb-2">❤️ {bpm} <span className="text-lg text-slate-400">BPM</span></p>
          )}

          {hrError && <p className="text-red-400 text-sm mb-3">{hrError}</p>}

          {!isMeasuring ? (
            <button
              onClick={startHR}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              Measure Heart Rate
            </button>
          ) : (
            <button
              onClick={stopHR}
              className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        <p className="text-slate-600 text-xs text-center mt-6">
          These readings are estimates, not medical-grade measurements.
        </p>
      </div>
    </div>
  );
}