import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Voting() {
  const navigate = useNavigate();
  const [players] = useState([
    { id: 1, name: "Jugador 1", color: "bg-rose-500" },
    { id: 2, name: "Jugador 2", color: "bg-indigo-500" },
    { id: 3, name: "Jugador 3", color: "bg-emerald-500" },
    { id: 4, name: "Jugador 4", color: "bg-amber-500" },
  ]);

  const [selected, setSelected] = useState(null);
  const [time, setTime] = useState(15);

  // 🕒 Temporizador
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 📳 Vibración
  const vibrate = (pattern = [50]) => {
    if (navigator.vibrate) navigator.vibrate(pattern);
  };

  // 🧍‍♂️ Seleccionar jugador
  const handleSelect = (id) => {
    vibrate([25]);
    setSelected(id);
  };

  // 🔚 Auto redirigir cuando se acabe el tiempo
  useEffect(() => {
    if (time === 0) {
      vibrate([100, 60, 100]);
      setTimeout(() => navigate("/results"), 1000);
    }
  }, [time, navigate]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white animate-fade-in-blur overflow-hidden">
      {/* Header */}
      <div className="absolute top-5 px-6 py-2 bg-white/20 backdrop-blur-md rounded-xl text-lg font-semibold">
        🗳️ Votación - {time}s restantes
      </div>

      <h1 className="text-3xl font-bold mb-4 mt-16">¿Quién crees que es el impostor?</h1>

      {/* Grid de jugadores */}
      <div
        className="grid gap-3 w-[90%] max-w-lg mt-4"
        style={{
          gridTemplateColumns: `repeat(2, 1fr)`,
        }}
      >
        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => handleSelect(p.id)}
            className={`${p.color} h-32 rounded-2xl flex items-center justify-center text-lg font-semibold transition-all 
              ${selected === p.id ? "scale-105 ring-4 ring-white" : "hover:scale-105"} 
              animate-pulse-slow`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Confirmación visual */}
      {selected && (
        <div className="absolute bottom-10 bg-emerald-500 text-black font-bold px-6 py-3 rounded-xl shadow-lg animate-bounce">
          Votaste por {players.find((p) => p.id === selected)?.name} ✅
        </div>
      )}
    </div>
  );
}
