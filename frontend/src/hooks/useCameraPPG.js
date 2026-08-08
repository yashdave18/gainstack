import { useRef, useState, useCallback } from "react";

export function useCameraPPG() {
  const videoRef = useRef(null);
  const canvasRef = useRef(document.createElement("canvas"));
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const samplesRef = useRef([]);

  const [isMeasuring, setIsMeasuring] = useState(false);
  const [bpm, setBpm] = useState(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const MEASURE_DURATION_MS = 15000;

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  function detrend(samples, windowMs = 1500) {
    // subtract a local moving average to remove slow baseline drift
    // (auto-exposure/white-balance shifts) while preserving the faster pulse signal
    return samples.map((s, i) => {
      const windowSamples = samples.filter((o) => Math.abs(o.t - s.t) <= windowMs / 2);
      const localAvg = windowSamples.reduce((a, o) => a + o.v, 0) / windowSamples.length;
      return { t: s.t, v: s.v - localAvg };
    });
  }

  function estimateBpmFromFrequency(samples) {
    // scan candidate heart-rate frequencies (40-200 bpm) and find which one
    // best matches the signal, using a direct DFT-style power calculation.
    // More robust than peak-counting since it doesn't depend on clean zero-crossings.
    const times = samples.map((s) => s.t / 1000); // seconds
    const values = samples.map((s) => s.v);

    let bestFreq = 0;
    let bestPower = -Infinity;

    for (let bpmCandidate = 40; bpmCandidate <= 200; bpmCandidate += 1) {
      const freq = bpmCandidate / 60; // Hz
      let real = 0;
      let imag = 0;
      for (let i = 0; i < values.length; i++) {
        const angle = 2 * Math.PI * freq * times[i];
        real += values[i] * Math.cos(angle);
        imag += values[i] * Math.sin(angle);
      }
      const power = real * real + imag * imag;
      if (power > bestPower) {
        bestPower = power;
        bestFreq = freq;
      }
    }

    return Math.round(bestFreq * 60);
  }

  function finishMeasurement() {
    clearInterval(intervalRef.current);
    stopStream();
    setIsMeasuring(false);

    const rawSamples = samplesRef.current;
    if (rawSamples.length < 50) {
      setError("Not enough data captured. Try again, keeping your finger steady over the camera and flash.");
      return;
    }

    const detrended = detrend(rawSamples);
    const estimatedBpm = estimateBpmFromFrequency(detrended);

    if (estimatedBpm < 40 || estimatedBpm > 200) {
      setError("Reading seems off — make sure your finger fully covers the camera lens and flash, then try again.");
      return;
    }

    setBpm(estimatedBpm);
  }

  const start = useCallback(async () => {
    setError("");
    setBpm(null);
    setProgress(0);
    samplesRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.torch) {
        try {
          await track.applyConstraints({ advanced: [{ torch: true }] });
        } catch (e) {
          // torch control not supported on this device/browser — continue without it
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsMeasuring(true);
      const startTime = Date.now();

      intervalRef.current = setInterval(() => {
        const video = videoRef.current;
        if (!video || video.videoWidth === 0) return;

        const canvas = canvasRef.current;
        canvas.width = 20;
        canvas.height = 20;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, 20, 20);
        const frame = ctx.getImageData(0, 0, 20, 20).data;

        let redSum = 0;
        for (let i = 0; i < frame.length; i += 4) {
          redSum += frame[i];
        }
        const redAvg = redSum / (frame.length / 4);

        const elapsed = Date.now() - startTime;
        samplesRef.current.push({ t: elapsed, v: redAvg });
        setProgress(Math.min(100, (elapsed / MEASURE_DURATION_MS) * 100));

        if (elapsed >= MEASURE_DURATION_MS) {
          finishMeasurement();
        }
      }, 50); // ~20 samples/sec for better frequency resolution
    } catch (err) {
      setError("Couldn't access camera: " + err.message);
    }
  }, []);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    stopStream();
    setIsMeasuring(false);
  }, []);

  return { videoRef, start, stop, isMeasuring, bpm, error, progress };
}