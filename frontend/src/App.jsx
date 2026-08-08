import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Onboarding from "./pages/Onboarding";
import Chatbot from "./pages/Chatbot";
import WorkoutLog from "./pages/WorkoutLog";
import GymFinder from "./pages/GymFinder";
import Tracker from "./pages/Tracker";
import SupplementAgent from "./pages/SupplementAgent";
import FoodAnalyzer from "./pages/FoodAnalyzer";

function ProtectedRoute({ children }) {
  const { currentUser, userProfile } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;
  if (userProfile && !userProfile.profileComplete) return <Navigate to="/onboarding" />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chatbot"
          element={
            <ProtectedRoute>
              <Chatbot />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workouts"
          element={
            <ProtectedRoute>
              <WorkoutLog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gyms"
          element={
            <ProtectedRoute>
              <GymFinder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tracker"
          element={
            <ProtectedRoute>
              <Tracker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supplements"
          element={
            <ProtectedRoute>
              <SupplementAgent />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route
          path="/food-analyzer"
          element={
            <ProtectedRoute>
              <FoodAnalyzer />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;