import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Lobby() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const roomCode = query.get("code") || "----";

  // Simulación de jugadores
  const [players, setPlayers] = useState(["Tú (anfitrión)", "Alex", "Mia"]);
  const [impostors, setImpostors] = useState(1);

  const startGame = () => {
    navigate(`/game?code=${roomCode}&impostors=${impostors}`);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // Simula jugadores uniéndose aleatoriamente
      if (players.length < 6 && Math.random() < 0.3) {
        setPlayers((prev) => [...prev, `Jugador${prev.length + 1}`]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [players]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <h1 className="text-4xl font-bold text-green-400 mb-3">💬 Lobby</h1>
      <p className="text-gray-400 mb-6">Esperando a los jugadores...</p>

      {/* Código de sala */}
      <div className="bg-gray-800/50 px-8 py-4 rounded-2xl mb-6">
        <p className="text-gray-400 mb-1">Código de sala:</p>
        <h2 className="text-3xl font-bold tracking-widest text-[--color-accent]">
          {roomCode}
        </h2>
      </div>

      {/* Lista de jugadores */}
      <div className="bg-gray-800/40 p-6 rounded-xl shadow-lg w-full max-w-sm mb-6">
        <h3 className="text-lg mb-3 font-semibold text-gray-200">Jugadores ({players.length})</h3>
        <ul className="text-gray-300 space-y-2">
          {players.map((p, i) => (
            <li
              key={i}
              className="bg-gray-700/50 p-2 rounded-md border border-gray-600"
            >
              {p}
            </li>
          ))}
        </ul>
      </div>

      {/* Configuración del juego */}
      <div className="bg-gray-800/40 p-6 rounded-xl shadow-lg w-full max-w-sm mb-6">
        <h3 className="text-lg mb-3 font-semibold text-gray-200">Configuración</h3>
        <label className="text-gray-400">Cantidad de impostores:</label>
        <input
          type="number"
          min="1"
          max={Math.floor(players.length / 2)}
          value={impostors}
          onChange={(e) => setImpostors(Number(e.target.value))}
          className="w-full mt-2 p-2 rounded-md text-center text-black outline-none"
        />
      </div>

      <button
        onClick={startGame}
        className="bg-[--color-accent] hover:bg-blue-500 px-8 py-3 rounded-xl font-semibold text-white shadow-md transition-all"
      >
        Iniciar partida 🚀
      </button>
    </div>
  );
}
