import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function Game() {
  const [time, setTime] = useState(30);
  const [voteCount, setVoteCount] = useState(0);
  const [playerVotes, setPlayerVotes] = useState({});
  const [lastVoted, setLastVoted] = useState(null);
  const [isFlash, setIsFlash] = useState(false);
  const [showMajorityMsg, setShowMajorityMsg] = useState(false);
  const navigate = useNavigate();

  const [players] = useState([
    { id: 1, name: "Jugador 1", color: "bg-rose-500" },
    { id: 2, name: "Jugador 2", color: "bg-indigo-500" },
    { id: 3, name: "Jugador 3", color: "bg-emerald-500" },
    { id: 4, name: "Jugador 4", color: "bg-amber-500" },
  ]);

  // 🕒 Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 📐 Cálculo dinámico del grid
  const gridCols = useMemo(() => Math.ceil(Math.sqrt(players.length)), [players.length]);

  // 💥 Función de vibración universal
  const vibrate = (pattern = [50]) => {
    if (navigator.vibrate) navigator.vibrate(pattern);
  };

  // 🗳️ Votar para iniciar votación
  const handleVoteForVoting = () => {
    vibrate([40]);
    setVoteCount((prev) => prev + 1);
  };

  // 🧍‍♂️ Votar por un jugador
  const handleVotePlayer = (id) => {
    vibrate([25]);
    setPlayerVotes((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
    setLastVoted(id);
    setTimeout(() => setLastVoted(null), 500);
  };

  // 📊 Umbral de votación
  const votingThreshold = Math.ceil(players.length / 2);

  // 💫 Detectar cuando se alcanza la mayoría
  useEffect(() => {
    if (voteCount >= votingThreshold && !isFlash) {
      setIsFlash(true);
      setShowMajorityMsg(true);
      vibrate([100, 80, 100]); // vibración más intensa
      setTimeout(() => setShowMajorityMsg(false), 1200);
      setTimeout(() => navigate("/voting"), 1800);
    }
  }, [voteCount, votingThreshold, navigate, isFlash]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* 🌟 Flash de pantalla */}
      {isFlash && (
        <div className="absolute inset-0 z-40 animate-screen-flash pointer-events-none" />
      )}

      {/* ⏱️ Timer */}
      <div className="absolute top-5 px-6 py-2 bg-white/20 backdrop-blur-md rounded-xl text-lg font-semibold z-10">
        ⏱️ {time}s
      </div>

      {/* 🔳 Rectángulo principal */}
      <div className="relative w-[90%] h-[80vh] bg-white/10 rounded-3xl flex items-center justify-center overflow-hidden z-10">
        {/* 🔘 Círculo central */}
        <button
          onClick={handleVoteForVoting}
          className="absolute z-20 w-40 h-40 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-xl font-semibold shadow-[0_0_40px_rgba(0,255,150,0.4)] flex items-center justify-center transition-all border-4 border-white/20 animate-breathe"
        >
          Vote ({voteCount})
        </button>

        {/* 🧩 Grid de jugadores */}
        <div
          className="absolute inset-0 grid gap-[2px]"
          style={{
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gridTemplateRows: `repeat(${Math.ceil(players.length / gridCols)}, 1fr)`,
          }}
        >
          {players.map((p) => (
            <div
              key={p.id}
              className={`${p.color} flex flex-col items-center justify-center relative transition-transform active:scale-95 animate-pulse-slow ${
                lastVoted === p.id ? "animate-vote-flash" : ""
              }`}
              onClick={() => handleVotePlayer(p.id)}
            >
              <span className="font-semibold text-center drop-shadow">
                {p.name}
              </span>
              {playerVotes[p.id] !== undefined && (
                <span className="mt-2 text-sm font-medium bg-black/30 text-white px-3 py-1 rounded-full backdrop-blur-sm shadow-md">
                  🗳️ {playerVotes[p.id]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 🟨 Mensaje de mayoría */}
      {showMajorityMsg && (
        <div className="absolute bottom-10 px-6 py-3 bg-amber-400 text-black font-bold rounded-xl shadow-lg z-50 text-center text-lg animate-bounce">
          🗳️ ¡La mayoría ha decidido votar!
        </div>
      )}
    </div>
  );
}
