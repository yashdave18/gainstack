import { useState, useEffect, useRef } from "react";
import { apiFetch } from "../services/api";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfStatus, setPdfStatus] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    apiFetch("/api/chat/history")
      .then((res) => setMessages(res.messages))
      .catch((err) => setError(err.message))
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setError("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setLoading(true);

    try {
      const res = await apiFetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      setMessages((prev) => [...prev, { role: "model", text: res.reply }]);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleImageUpload() {
    if (!imageFile) return;
    setError("");
    setLoading(true);

    const previewUrl = URL.createObjectURL(imageFile);
    setMessages((prev) => [...prev, { role: "user", text: "", imageUrl: previewUrl }]);

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      const macros = await apiFetch("/api/chat/analyze-image", {
        method: "POST",
        body: formData,
      });
      const summary = `${macros.food_name} (${macros.estimated_portion}): ${macros.calories} kcal — P: ${macros.protein_g}g, C: ${macros.carbs_g}g, F: ${macros.fat_g}g. ${macros.suggestions}`;
      setMessages((prev) => [...prev, { role: "model", text: summary }]);
    } catch (err) {
      setError(err.message);
    }
    setImageFile(null);
    setLoading(false);
  }

  async function handlePdfUpload() {
    if (!pdfFile) return;
    setError("");
    setPdfStatus("Processing PDF...");

    const formData = new FormData();
    formData.append("file", pdfFile);

    try {
      const res = await apiFetch("/api/chat/upload-pdf", {
        method: "POST",
        body: formData,
      });
      if (res.error) {
        setPdfStatus(res.error);
      } else {
        setPdfStatus(`"${res.filename}" processed — ${res.chunks_stored} sections stored. You can now ask questions about it.`);
        setMessages((prev) => [
          ...prev,
          { role: "user", text: `[Uploaded PDF: ${res.filename}]` },
        ]);
      }
    } catch (err) {
      setError(err.message);
      setPdfStatus("");
    }
    setPdfFile(null);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="max-w-2xl w-full mx-auto flex flex-col flex-1 px-4 py-6">
        <h1 className="text-2xl font-bold text-white mb-4">Fitness Assistant</h1>

        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-y-auto p-4 flex flex-col gap-3 min-h-[60vh] max-h-[60vh]">
          {historyLoading && <p className="text-slate-500 text-sm">Loading conversation...</p>}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "self-end bg-emerald-500 text-slate-950"
                  : "self-start bg-slate-800 text-slate-100"
              }`}
            >
              {msg.imageUrl ? (
                <img src={msg.imageUrl} alt="Uploaded food" className="rounded-lg max-w-full" />
              ) : (
                msg.text
              )}
            </div>
          ))}
          {loading && <div className="self-start text-slate-500 text-sm">Thinking...</div>}
          <div ref={bottomRef} />
        </div>

        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

        <form onSubmit={handleSend} className="flex gap-2 mt-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about workouts, nutrition, form..."
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg px-4 py-2.5 text-white outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-950 font-semibold px-5 rounded-lg transition-colors"
          >
            Send
          </button>
        </form>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <p className="text-slate-400 text-xs font-medium mb-2">Analyze a food photo</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="text-slate-400 text-xs w-full file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-slate-800 file:text-slate-300"
            />
            <button
              onClick={handleImageUpload}
              disabled={!imageFile || loading}
              className="w-full mt-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-sm py-1.5 rounded-lg transition-colors"
            >
              Analyze Photo
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <p className="text-slate-400 text-xs font-medium mb-2">Upload a PDF</p>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files[0])}
              className="text-slate-400 text-xs w-full file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-slate-800 file:text-slate-300"
            />
            <button
              onClick={handlePdfUpload}
              disabled={!pdfFile}
              className="w-full mt-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-sm py-1.5 rounded-lg transition-colors"
            >
              Upload PDF
            </button>
          </div>
        </div>

        {pdfStatus && <p className="text-slate-400 text-xs mt-2">{pdfStatus}</p>}
      </div>
    </div>
  );
}