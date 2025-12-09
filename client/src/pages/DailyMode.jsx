import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Play, Download, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ScratchCard from "react-scratchcard-v2";
import UserNameBar from "../components/UserNameBar";
import { api } from "../services/api";

export default function DailyMode() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dailyMode, setDailyMode] = useState(null);
  const [setupMode, setSetupMode] = useState(true);
  const [totalPlayers, setTotalPlayers] = useState(4);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [sessionWordList, setSessionWordList] = useState([]);
  const [impostorIndex, setImpostorIndex] = useState(null);
  const [normalWord, setNormalWord] = useState("");
  const [impostorWord, setImpostorWord] = useState("");
  const [showingCard, setShowingCard] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [votingMode, setVotingMode] = useState(false);
  const [alivePlayers, setAlivePlayers] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  // Fetch daily mode on mount
  useEffect(() => {
    const fetchDailyMode = async () => {
      setLoading(true);
      try {
        const res = await api.get('/modes/daily');
        setDailyMode(res.data);
      } catch (error) {
        console.error("Error al cargar modo del día:", error);
        toast.error("Error al cargar el modo del día");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchDailyMode();
  }, [navigate]);

  // Detect if app is in standalone mode (installed as PWA)
  useEffect(() => {
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      document.referrer.includes('android-app://');

    setIsStandalone(isInStandaloneMode);
  }, []);

  // Capture PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.info("Abre la app desde tu pantalla de inicio para la mejor experiencia 📱");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast.success("¡App instalada! Ábrela desde tu pantalla de inicio 📱");
    }

    setDeferredPrompt(null);
  };

  const startGame = () => {
    if (totalPlayers < 3) {
      toast.error("Se necesitan al menos 3 jugadores");
      return;
    }

    if (!dailyMode || !dailyMode.words || dailyMode.words.length === 0) {
      toast.error("No hay palabras disponibles para este modo");
      return;
    }

    // Select random word from daily mode words (array of strings)
    const randomWord = dailyMode.words[Math.floor(Math.random() * dailyMode.words.length)];

    // Check if it's a valid word
    if (!randomWord || typeof randomWord !== 'string') {
      toast.error("Error en la estructura de palabras del modo");
      return;
    }

    setNormalWord(randomWord);
    setImpostorWord("???");

    // Generate word list: one impostor gets "???", rest get the word
    const impostor = Math.floor(Math.random() * totalPlayers);
    setImpostorIndex(impostor);

    const words = Array(totalPlayers).fill(null).map((_, idx) =>
      idx === impostor ? "???" : randomWord
    );

    setSessionWordList(words);
    setCurrentPlayerIndex(0);
    setSetupMode(false);
    setShowingCard(true);
  };

  const handleNextPlayer = () => {
    if (currentPlayerIndex < totalPlayers - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setShowingCard(true);
    } else {
      // All players saw their words - start discussion
      const playersArray = Array(totalPlayers).fill(null).map((_, idx) => ({
        index: idx,
        isAlive: true,
        isImpostor: idx === impostorIndex
      }));
      setAlivePlayers(playersArray);
      toast.success("¡Todos vieron su palabra! Discutan y voten.");
      setShowingCard(false);
    }
  };

  const handleVote = (votedPlayerIndex) => {
    const votedPlayer = alivePlayers.find(p => p.index === votedPlayerIndex);

    if (votedPlayer.isImpostor) {
      // ¡Ganaron los jugadores!
      setWinner('PLAYERS');
      setGameOver(true);
      toast.success("¡Eliminaron al impostor! Ganaron los jugadores 🎉");
    } else {
      // Eliminaron a un jugador normal, el juego continúa
      const newAlivePlayers = alivePlayers.map(p =>
        p.index === votedPlayerIndex ? { ...p, isAlive: false } : p
      );

      const remainingAlive = newAlivePlayers.filter(p => p.isAlive);

      if (remainingAlive.length === 2) {
        // Solo quedan 2: el impostor gana
        setWinner('IMPOSTOR');
        setGameOver(true);
        toast.error("El impostor sobrevivió hasta el final 🎭");
      } else {
        // El juego continúa
        setAlivePlayers(newAlivePlayers);
        toast.info(`Jugador ${votedPlayerIndex + 1} eliminado. El juego continúa...`);
      }
    }

    setVotingMode(false);
  };

  const startVoting = () => {
    setVotingMode(true);
  };

  const resetGame = () => {
    setSetupMode(true);
    setCurrentPlayerIndex(0);
    setSessionWordList([]);
    setImpostorIndex(null);
    setShowingCard(false);
    setVotingMode(false);
    setAlivePlayers([]);
    setGameOver(false);
    setWinner(null);
  };

  if (loading) {
    return (
      <>
        <UserNameBar />
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="text-gray-400">Cargando modo del día...</p>
        </div>
      </>
    );
  }

  if (setupMode) {
    return (
      <>
        <UserNameBar />
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 pt-20">
          <button
            onClick={() => navigate('/')}
            className="absolute top-24 left-6 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            <span>Volver</span>
          </button>

          <div className="flex items-center gap-3 mb-6">
            <Star className="text-yellow-400" size={32} />
            <h1 className="text-3xl font-bold">Modo Especial del Día</h1>
          </div>

          <div className="bg-gradient-to-r from-purple-900/30 to-yellow-900/30 border border-yellow-500/30 p-6 rounded-2xl max-w-md w-full mb-6">
            <h2 className="text-2xl font-bold mb-2">{dailyMode.name}</h2>
            {dailyMode.description && (
              <p className="text-gray-300 text-sm mb-3">{dailyMode.description}</p>
            )}
            <div className="bg-yellow-900/20 px-3 py-2 rounded-lg border border-yellow-500/30">
              <p className="text-xs text-yellow-300">
                📚 {dailyMode.words?.length || 0} palabras disponibles
              </p>
            </div>
          </div>

          <div className="bg-gray-800/50 p-8 rounded-2xl max-w-md w-full space-y-6">
            <div>
              <label className="flex items-center gap-2 text-lg font-semibold mb-3">
                <Users size={24} />
                <span>Número de jugadores</span>
              </label>
              <input
                type="number"
                min="3"
                max="12"
                value={totalPlayers}
                onChange={(e) => setTotalPlayers(parseInt(e.target.value) || 3)}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl text-center text-2xl font-bold border-2 border-gray-600 focus:border-yellow-500 focus:outline-none"
              />
              <p className="text-sm text-gray-400 mt-2 text-center">
                Mínimo 3 jugadores
              </p>
            </div>

            <button
              onClick={startGame}
              disabled={!dailyMode.words || dailyMode.words.length === 0}
              className="w-full bg-yellow-500 hover:bg-yellow-600 px-6 py-4 rounded-xl text-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={24} />
              <span>Iniciar Partida</span>
            </button>
          </div>

          {/* PWA Install Banner */}
          {!isStandalone && (
            <div className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-xs animate-bounce cursor-pointer hover:scale-105 transition-transform"
              onClick={handleInstallClick}
            >
              <Download size={20} />
              <p className="text-sm font-medium">
                Guarda la app en tu pantalla de inicio para jugar sin conexión 💾
              </p>
            </div>
          )}
        </div>
      </>
    );
  }

  // Game in progress
  if (showingCard) {
    const currentWord = sessionWordList[currentPlayerIndex];
    const isImpostor = currentPlayerIndex === impostorIndex;

    return (
      <>
        <UserNameBar />
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6">
          <div className="max-w-md w-full space-y-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="text-yellow-400" size={24} />
                <h2 className="text-2xl font-bold">
                  Jugador {currentPlayerIndex + 1} de {totalPlayers}
                </h2>
              </div>
              <p className="text-gray-400">
                Raspa la tarjeta para ver tu palabra
              </p>
            </div>

            <div className="relative flex justify-center">
              <ScratchCard
                key={currentPlayerIndex}
                width={320}
                height={240}
                image="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='240'%3E%3Crect width='320' height='240' fill='%23374151'/%3E%3Ctext x='160' y='120' font-family='Arial' font-size='20' fill='%23ffffff' text-anchor='middle' dominant-baseline='middle'%3ERaspa aquí 👆%3C/text%3E%3C/svg%3E"
                finishPercent={50}
                onComplete={() => {
                  if (navigator.vibrate) navigator.vibrate(40);
                }}
              >
                <div className={`w-full h-full flex flex-col items-center justify-center px-4 ${
                  isImpostor
                    ? 'bg-gradient-to-br from-red-600 to-red-800'
                    : 'bg-gradient-to-br from-yellow-600 to-yellow-800'
                }`}>
                  <p className={`font-black text-white text-center ${
                    currentWord.length > 15 ? 'text-3xl' : currentWord.length > 10 ? 'text-4xl' : 'text-5xl'
                  }`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {currentWord}
                  </p>
                  {isImpostor && (
                    <p className="text-lg font-semibold bg-red-900/50 px-3 py-2 rounded-lg mt-3 text-center">
                      🎭 Eres el IMPOSTOR<br/>
                      <span className="text-xs">Descubre la palabra secreta</span>
                    </p>
                  )}
                </div>
              </ScratchCard>
            </div>

            <button
              onClick={handleNextPlayer}
              className="w-full bg-yellow-500 hover:bg-yellow-600 px-6 py-4 rounded-xl text-xl font-bold transition-all active:scale-95"
            >
              {currentPlayerIndex < totalPlayers - 1
                ? `Listo / Siguiente Jugador`
                : `Comenzar Discusión`
              }
            </button>

            <button
              onClick={resetGame}
              className="w-full bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all text-sm"
            >
              Cancelar partida
            </button>
          </div>

          {/* PWA Install Banner */}
          {!isStandalone && (
            <div className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-xs cursor-pointer hover:scale-105 transition-transform"
              onClick={handleInstallClick}
            >
              <Download size={20} />
              <p className="text-sm font-medium">
                Guarda la app en tu pantalla de inicio 💾
              </p>
            </div>
          )}
        </div>
      </>
    );
  }

  // Game Over Screen
  if (gameOver) {
    return (
      <>
        <UserNameBar />
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className={`p-8 rounded-2xl ${
              winner === 'IMPOSTOR'
                ? 'bg-gradient-to-br from-red-600/20 to-red-800/20 border-2 border-red-500'
                : 'bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border-2 border-yellow-500'
            }`}>
              <h2 className="text-4xl font-bold mb-4">
                {winner === 'IMPOSTOR' ? '🎭 ¡Victoria del Impostor!' : '🎉 ¡Victoria de los Jugadores!'}
              </h2>
              <p className="text-xl mb-6">
                {winner === 'IMPOSTOR'
                  ? 'El impostor sobrevivió hasta el final'
                  : '¡Eliminaron al impostor correctamente!'}
              </p>

              <div className="bg-gray-800/50 p-4 rounded-lg mb-4">
                <p className="text-lg font-semibold mb-2">Resumen:</p>
                <p className="text-sm text-gray-300">
                  <strong>Modo:</strong> {dailyMode.name}<br/>
                  <strong>Palabra secreta:</strong> {normalWord}<br/>
                  <strong>El impostor era:</strong> Jugador {impostorIndex + 1}
                </p>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="w-full bg-yellow-500 hover:bg-yellow-600 px-6 py-4 rounded-xl text-xl font-bold transition-all active:scale-95"
            >
              Nueva Partida
            </button>
          </div>

          {/* PWA Install Banner */}
          {!isStandalone && (
            <div className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-xs cursor-pointer hover:scale-105 transition-transform"
              onClick={handleInstallClick}
            >
              <Download size={20} />
              <p className="text-sm font-medium">
                Guarda la app 💾
              </p>
            </div>
          )}
        </div>
      </>
    );
  }

  // Voting Screen
  if (votingMode) {
    const alivePlayersList = alivePlayers.filter(p => p.isAlive);

    return (
      <>
        <UserNameBar />
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6">
          <div className="max-w-md w-full space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">⚖️ Votación</h2>
              <p className="text-gray-400">
                ¿Quién creen que es el impostor?
              </p>
            </div>

            <div className="bg-gray-800/50 p-6 rounded-2xl space-y-3">
              <p className="text-sm text-gray-400 mb-4">
                Jugadores vivos: {alivePlayersList.length}
              </p>

              {alivePlayersList.map((player) => (
                <button
                  key={player.index}
                  onClick={() => handleVote(player.index)}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 px-6 py-4 rounded-xl text-lg font-semibold transition-all active:scale-95 flex items-center justify-between"
                >
                  <span>Jugador {player.index + 1}</span>
                  <span>👉</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setVotingMode(false)}
              className="w-full bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all text-sm"
            >
              ← Cancelar votación
            </button>
          </div>

          {/* PWA Install Banner */}
          {!isStandalone && (
            <div className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-xs cursor-pointer hover:scale-105 transition-transform"
              onClick={handleInstallClick}
            >
              <Download size={20} />
              <p className="text-sm font-medium">
                Guarda la app 💾
              </p>
            </div>
          )}
        </div>
      </>
    );
  }

  // Discussion Phase
  return (
    <>
      <UserNameBar />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <Star className="text-yellow-400" size={32} />
            <h2 className="text-3xl font-bold">💬 Discusión</h2>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-2xl space-y-4">
            <p className="text-lg">
              Todos vieron su palabra. ¡Discutan!
            </p>

            <div className="bg-yellow-900/30 px-4 py-3 rounded-lg border border-yellow-500/50">
              <p className="text-sm font-semibold mb-2">Modo: {dailyMode.name}</p>
            </div>

            <div className="bg-blue-500/20 px-4 py-3 rounded-lg border border-blue-500/30">
              <p className="text-xs text-blue-300 mb-1">ℹ️ Jugadores Vivos</p>
              <p className="text-sm text-gray-300">
                {alivePlayers.filter(p => p.isAlive).map(p => `Jugador ${p.index + 1}`).join(', ')}
              </p>
            </div>

            <div className="text-left space-y-2 text-sm text-gray-300">
              <p>📋 <strong>Reglas:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Discutan sobre sus palabras sin decirlas directamente</li>
                <li>El impostor debe descubrir la palabra secreta</li>
                <li>Los demás deben identificar al impostor</li>
              </ul>
            </div>
          </div>

          <button
            onClick={startVoting}
            className="w-full bg-yellow-600 hover:bg-yellow-700 px-6 py-4 rounded-xl text-xl font-bold transition-all active:scale-95"
          >
            ⚖️ Ir a Votar
          </button>

          <button
            onClick={resetGame}
            className="w-full bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all text-sm"
          >
            Cancelar partida
          </button>
        </div>

        {/* PWA Install Banner */}
        {!isStandalone && (
          <div className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-xs cursor-pointer hover:scale-105 transition-transform"
            onClick={handleInstallClick}
          >
            <Download size={20} />
            <p className="text-sm font-medium">
              Guarda la app 💾
            </p>
          </div>
        )}
      </div>
    </>
  );
}
