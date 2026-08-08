import { useState, useRef, useCallback, useEffect } from "react";

export function useMotionSensors(weightKg) {
  const [stepCount, setStepCount] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [permissionError, setPermissionError] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const lastMagnitudes = useRef([]);
  const lastStepTime = useRef(0);
  const handlerRef = useRef(null);
  const isAboveThreshold = useRef(false);
  const sessionStart = useRef(null);
  const tickInterval = useRef(null);

  const THRESHOLD = 12;
  const MIN_STEP_INTERVAL_MS = 300;
  const WALKING_MET = 3.5;

  function handleMotion(event) {
    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.x == null) return;

    const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);

    lastMagnitudes.current.push(magnitude);
    if (lastMagnitudes.current.length > 3) lastMagnitudes.current.shift();

    const avg = lastMagnitudes.current.reduce((a, b) => a + b, 0) / lastMagnitudes.current.length;
    const now = Date.now();

    if (avg > THRESHOLD && !isAboveThreshold.current && now - lastStepTime.current > MIN_STEP_INTERVAL_MS) {
      isAboveThreshold.current = true;
      lastStepTime.current = now;
      setStepCount((prev) => prev + 1);
    } else if (avg < THRESHOLD - 1) {
      isAboveThreshold.current = false;
    }
  }

  const startTracking = useCallback(async () => {
    setPermissionError("");

    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
      try {
        const result = await DeviceMotionEvent.requestPermission();
        if (result !== "granted") {
          setPermissionError("Motion sensor permission was denied.");
          return;
        }
      } catch (err) {
        setPermissionError("Couldn't request motion permission: " + err.message);
        return;
      }
    }

    handlerRef.current = handleMotion;
    window.addEventListener("devicemotion", handlerRef.current);
    sessionStart.current = Date.now();
    tickInterval.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStart.current) / 1000));
    }, 1000);
    setIsTracking(true);
  }, []);

  const stopTracking = useCallback(() => {
    if (handlerRef.current) {
      window.removeEventListener("devicemotion", handlerRef.current);
    }
    if (tickInterval.current) clearInterval(tickInterval.current);
    setIsTracking(false);
  }, []);

  const resetSteps = useCallback(() => {
    setStepCount(0);
    setElapsedSeconds(0);
    lastMagnitudes.current = [];
    lastStepTime.current = 0;
    sessionStart.current = Date.now();
  }, []);

  useEffect(() => {
    return () => {
      if (handlerRef.current) window.removeEventListener("devicemotion", handlerRef.current);
      if (tickInterval.current) clearInterval(tickInterval.current);
    };
  }, []);

  const minutesElapsed = elapsedSeconds / 60;
  const caloriesBurned = weightKg
    ? Math.round((WALKING_MET * 3.5 * weightKg / 200) * minutesElapsed)
    : null;

  return {
    stepCount,
    isTracking,
    permissionError,
    startTracking,
    stopTracking,
    resetSteps,
    elapsedSeconds,
    caloriesBurned,
  };
}