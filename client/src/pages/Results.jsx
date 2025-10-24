import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Results() {
  const navigate = useNavigate();
  const [isRevealing, setIsRevealing] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [impostor] = useState(() => {
    // 👀 Simula al impostor aleatoriamente
    const players = ["Jugador 1", "Jugador 2", "Jugador 3", "Jugador 4"];
    return players[Math.floor(Math.random() * players.length)];
  });

  // 💫 Flash inicial y vibración
  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate([150, 100, 200]);
    setTimeout(() => {
      setIsRevealing(false);
      setShowResult(true);
    }, 2000); // 2s de “suspenso”
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white overflow-hidden animate-dramatic-reveal">
      {/* 🌟 Flash inicial */}
      {isRevealing && (
        <div className="absolute inset-0 z-40 animate-screen-flash pointer-events-none" />
      )}

      {/* 🕵️ Mensaje principal */}
      {showResult ? (
        <>
          <h1 className="text-4xl font-bold mb-4 animate-bounce">Resultado Final 🕵️</h1>
          <p className="text-2xl font-semibold mb-8">
            El impostor era <span className="text-rose-400">{impostor}</span> 😈
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(60);
                navigate("/lobby");
              }}
              className="bg-amber-400 text-black font-semibold px-6 py-3 rounded-xl hover:bg-amber-300 active:scale-95 transition-all"
            >
              🔁 Nueva partida
            </button>

            <button
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(40);
                navigate("/");
              }}
              className="bg-white/20 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/30 active:scale-95 transition-all"
            >
              🏠 Volver al inicio
            </button>
          </div>
        </>
      ) : (
        <h1 className="text-3xl font-bold text-white/80 animate-pulse">
          Revelando al impostor...
        </h1>
      )}
    </div>
  );
}
