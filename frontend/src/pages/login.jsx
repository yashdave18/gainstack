import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [error, setError] = useState("");
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleGoogleLogin() {
    setError("");
    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome</h1>
          <p className="text-slate-400 mt-2">Sign in to continue your fitness journey</p>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center mb-4 bg-red-950/40 border border-red-900 rounded-lg py-2 px-3">
            {error}
          </p>
        )}

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-3 rounded-lg transition-colors"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}