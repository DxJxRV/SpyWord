import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Play, HelpCircle, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import ScratchCard from "react-scratchcard-v2";
import Joyride, { ACTIONS, EVENTS, STATUS } from "react-joyride";
import AppHeader from "../components/AppHeader";
import { palabras } from "../data/palabras";
import AdPlaceholder from "../components/AdPlaceholder";
import InterstitialAd from "../components/InterstitialAd";
import { useAuth } from "../contexts/AuthContext";

export default function PassAndPlay() {
  const navigate = useNavigate();
  const [setupMode, setSetupMode] = useState(true);
  const [totalPlayers, setTotalPlayers] = useState(4);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [sessionWordList, setSessionWordList] = useState([]);
  const [impostorIndex, setImpostorIndex] = useState(null);
  const [normalWord, setNormalWord] = useState("");
  const [impostorWord, setImpostorWord] = useState("");
  const [showingCard, setShowingCard] = useState(false);
  const [votingMode, setVotingMode] = useState(false);
  const [alivePlayers, setAlivePlayers] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const { isPremium } = useAuth();
  const isRoomPremium = false; // Premium Pass - false porque es modo local
  const [showNewRoundInterstitial, setShowNewRoundInterstitial] = useState(false);

  // Estados del tutorial
  const [runTutorial, setRunTutorial] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [isTutorialMode, setIsTutorialMode] = useState(false);

  // Definir TODOS los pasos del tutorial en un solo array
  const tutorialSteps = [
    // Paso 0: Contador de jugadores
    {
      target: '.pnp-player-counter',
      content: '👥 Este es el contador de jugadores. Ajusta cuántas personas van a jugar en esta partida. Mínimo 3 jugadores.',
      disableBeacon: true,
      placement: 'bottom',
    },
    // Paso 1: Botón iniciar partida
    {
      target: '.pnp-start-button',
      content: '🎮 Cuando estés listo, presiona "Iniciar Partida". Cada jugador verá su palabra por turnos.',
      disableBeacon: true,
      placement: 'bottom',
    },
    // Paso 2: Contenedor de raspado (se mostrará cuando showingCard sea true)
    {
      target: '.pnp-scratch-container',
      content: '✨ Este es el contenedor de raspado. Cada jugador debe raspar con el dedo (o mouse) para revelar su palabra. Si eres el impostor te saldrá "???"',
      disableBeacon: true,
      placement: 'bottom',
    },
    // Paso 3: Botón siguiente jugador
    {
      target: '.pnp-next-button',
      content: '➡️ Cuando hayas visto tu palabra, presiona este botón. En una partida real, cada jugador verá su palabra. En el tutorial, pasaremos directamente a la fase de discusión.',
      disableBeacon: true,
      placement: 'top',
    },
    // Paso 4: Botón ir a votar (se mostrará en fase de discusión)
    {
      target: '.pnp-vote-button',
      content: '🗳️ Después de discutir, presiona "Ir a Votar" para ir a la pantalla de votación.',
      disableBeacon: true,
      placement: 'top',
    },
    // Paso 5: Pantalla de votación (se mostrará cuando votingMode sea true)
    {
      target: '.pnp-voting-container',
      content: '⚖️ Aquí todos votan por quien creen que es el impostor. Si eliminan al impostor, ¡los jugadores ganan! Si fallan, el juego continúa. Si solo quedan 2 jugadores y uno es el impostor, ¡el impostor gana!',
      disableBeacon: true,
      placement: 'top',
    },
  ];

  // Función para iniciar el tutorial
  const startTutorial = () => {
    // Si no estamos en setup mode, resetear primero
    if (!setupMode) {
      resetGame();
      // Esperar un momento para que se complete el reset
      setTimeout(() => {
        setIsTutorialMode(true);
        setRunTutorial(true);
        setTutorialStepIndex(0);
      }, 300);
    } else {
      setIsTutorialMode(true);
      setRunTutorial(true);
      setTutorialStepIndex(0);
    }
  };

  // Manejador del callback del tutorial
  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data;

    console.log(`📘 Tutorial Callback: index=${index}, action=${action}, status=${status}, type=${type}, votingMode=${votingMode}, showingCard=${showingCard}`);

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Tutorial terminado o saltado
      setRunTutorial(false);
      if (status === STATUS.FINISHED) {
        toast.success("¡Tutorial completado! Ya puedes jugar libremente.");
      }
      setIsTutorialMode(false);
      setTutorialStepIndex(0);
      // Resetear al modo setup
      resetGame();
      return;
    }

    if (![EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      return; // Solo procesar eventos STEP_AFTER
    }

    // PASO 1: Botón "Iniciar Partida" - Iniciar el juego en modo tutorial
    if (index === 1 && action === ACTIONS.NEXT) {
      console.log("📘 Tutorial: Paso 1 → Iniciando juego...");
      setTimeout(() => {
        startGameTutorial();
        setTimeout(() => {
          setTutorialStepIndex(2);
        }, 800);
      }, 300);
      return;
    }

    // PASO 3: Botón "Listo/Siguiente" - Pasar a discusión (las reglas del tutorial lo permiten)
    if (index === 3 && action === ACTIONS.NEXT) {
      console.log(`📘 Tutorial: Paso 3 → Activando siguiente jugador (modo tutorial saltará a discusión)...`);

      // Llamar handleNextPlayer una sola vez - la lógica del tutorial dentro de la función
      // se encargará de saltar directamente a la discusión
      handleNextPlayer();

      // Esperar un momento para que el estado se actualice y avanzar al paso 4
      setTimeout(() => {
        console.log("📘 Tutorial: Avanzando al paso 4 (botón ir a votar)");
        setTutorialStepIndex(4);
      }, 600);
      return;
    }

    // PASO 4: Botón "Ir a Votar" - Activar pantalla de votación
    if (index === 4 && action === ACTIONS.NEXT) {
      console.log("📘 Tutorial: Paso 4 → Activando votación...");
      setTimeout(() => {
        startVoting();
        setTimeout(() => {
          setTutorialStepIndex(5);
        }, 800);
      }, 300);
      return;
    }

    // PASO 5: Pantalla de votación - Finalizar tutorial
    if (index === 5 && action === ACTIONS.NEXT) {
      console.log("📘 Tutorial: Paso 5 → Finalizando...");
      setRunTutorial(false);
      setIsTutorialMode(false);
      toast.success("¡Tutorial completado! Ya puedes jugar libremente.");
      setTimeout(() => {
        resetGame();
      }, 500);
      return;
    }

    // Navegación normal solo para pasos 0 y 2 (que no tienen lógica especial)
    if (action === ACTIONS.NEXT && (index === 0 || index === 2)) {
      console.log(`📘 Tutorial: Navegación normal ${index} → ${index + 1}`);
      setTutorialStepIndex(index + 1);
    } else if (action === ACTIONS.PREV && index > 0) {
      console.log(`📘 Tutorial: Navegación atrás ${index} → ${index - 1}`);
      setTutorialStepIndex(index - 1);
    }
  };

  const startGameTutorial = () => {
    // Configurar juego en modo tutorial
    setTotalPlayers(4);

    // Select random word
    const randomWord = palabras[Math.floor(Math.random() * palabras.length)];
    setNormalWord(randomWord);
    setImpostorWord("???");

    // El impostor será el jugador 3 (índice 2) en el tutorial
    const impostor = 2;
    setImpostorIndex(impostor);

    const words = Array(4).fill(null).map((_, idx) =>
      idx === impostor ? "???" : randomWord
    );

    setSessionWordList(words);
    setCurrentPlayerIndex(0);

    // NO mostrar intersticial en modo tutorial
    setSetupMode(false);
    setShowingCard(true);
  };

  const startGame = () => {
    if (totalPlayers === '' || totalPlayers < 3 || isNaN(totalPlayers)) {
      toast.error("Se necesitan al menos 3 jugadores");
      return;
    }

    // Select random word
    const randomWord = palabras[Math.floor(Math.random() * palabras.length)];
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

    // Mostrar viñeta intersticial antes de mostrar la primera palabra
    setShowNewRoundInterstitial(true);
  };

  const handleStartInterstitialClose = () => {
    setShowNewRoundInterstitial(false);
    setSetupMode(false);
    setShowingCard(true);
  };

  // Mostrar el intersticial solo si NO estamos en modo tutorial
  const shouldShowInterstitial = showNewRoundInterstitial && !isTutorialMode;

  const handleNextPlayer = () => {
    // En modo tutorial, después del primer jugador, saltar directamente a discusión
    if (isTutorialMode && currentPlayerIndex === 0) {
      console.log("📘 Tutorial: Saltando directamente a discusión desde jugador 1...");
      const playersArray = Array(totalPlayers).fill(null).map((_, idx) => ({
        index: idx,
        isAlive: true,
        isImpostor: idx === impostorIndex
      }));
      setAlivePlayers(playersArray);
      setShowingCard(false);
      toast.success("¡Tutorial! Pasando a la fase de discusión.");
      return;
    }

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

  // Renderizar el botón de ayuda (disponible en todas las pantallas)
  const HelpButton = () => (
    <button
      onClick={startTutorial}
      className="absolute top-20 right-6 bg-blue-500/20 hover:bg-blue-500/30 px-4 py-2 rounded-lg transition-all flex items-center gap-2 border border-blue-500/50 z-50"
    >
      <HelpCircle size={20} />
      <span>¿Cómo jugar?</span>
    </button>
  );

  if (setupMode) {
    return (
      <>
        <AppHeader />

        {/* Joyride Tutorial Global - Funciona en todas las pantallas */}
        <Joyride
          steps={tutorialSteps}
          run={runTutorial && isTutorialMode}
          stepIndex={tutorialStepIndex}
          continuous
          showProgress
          showSkipButton
          callback={handleJoyrideCallback}
          styles={{
            options: {
              primaryColor: '#10b981',
              zIndex: 10000,
            },
          }}
          locale={{
            back: 'Atrás',
            close: 'Cerrar',
            last: 'Finalizar',
            next: 'Siguiente',
            skip: 'Saltar',
          }}
        />

        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 pt-20">

          <button
            onClick={() => navigate('/')}
            className="absolute top-20 left-6 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            <span>Volver</span>
          </button>

          {/* Botón de Ayuda */}
          <HelpButton />

          <h1 className="text-3xl font-bold mb-6">🎮 Pasa y Juega</h1>
          <p className="text-gray-400 mb-8 text-center max-w-md">
            Juega en un solo dispositivo. Cada jugador verá su palabra por turnos.
          </p>

          <div className="bg-gray-800/50 p-8 rounded-2xl max-w-md w-full space-y-6">
            <div className="pnp-player-counter">
              <label className="flex items-center gap-2 text-lg font-semibold mb-3">
                <Users size={24} />
                <span>Número de jugadores</span>
              </label>

              <div className="flex items-center gap-3">
                {/* Botón decrementar */}
                <button
                  onClick={() => {
                    const current = totalPlayers === '' ? 4 : totalPlayers;
                    setTotalPlayers(Math.max(3, current - 1));
                  }}
                  disabled={totalPlayers <= 3 && totalPlayers !== ''}
                  className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all active:scale-95"
                >
                  <ChevronDown size={24} />
                </button>

                {/* Input de número */}
                <input
                  type="number"
                  min="3"
                  max="12"
                  value={totalPlayers}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setTotalPlayers('');
                    } else {
                      const num = parseInt(val);
                      if (!isNaN(num)) {
                        setTotalPlayers(Math.min(12, Math.max(0, num)));
                      }
                    }
                  }}
                  className={`flex-1 bg-gray-700 text-white px-4 py-3 rounded-xl text-center text-2xl font-bold border-2 focus:outline-none transition-colors ${
                    totalPlayers < 3 || totalPlayers === ''
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-gray-600 focus:border-emerald-500'
                  }`}
                />

                {/* Botón incrementar */}
                <button
                  onClick={() => {
                    const current = totalPlayers === '' ? 3 : totalPlayers;
                    setTotalPlayers(Math.min(12, current + 1));
                  }}
                  disabled={totalPlayers >= 12}
                  className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all active:scale-95"
                >
                  <ChevronUp size={24} />
                </button>
              </div>

              {/* Mensaje de error o ayuda */}
              {(totalPlayers < 3 || totalPlayers === '') ? (
                <p className="text-sm text-red-400 mt-2 text-center font-semibold">
                  ⚠️ Mínimo 3 jugadores
                </p>
              ) : (
                <p className="text-sm text-gray-400 mt-2 text-center">
                  De 3 a 12 jugadores
                </p>
              )}
            </div>

            <button
              onClick={startGame}
              className="pnp-start-button w-full bg-emerald-500 hover:bg-emerald-600 px-6 py-4 rounded-xl text-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Play size={24} />
              <span>Iniciar Partida</span>
            </button>
          </div>

          {/* Banner Publicitario */}
          <div className="flex justify-center mt-6">
            <AdPlaceholder isPremium={isPremium} format="horizontal" />
          </div>

          {/* Viñeta Intersticial */}
          {shouldShowInterstitial && (
            <InterstitialAd
              isPremium={isPremium}
              isRoomPremium={isRoomPremium}
              onClose={handleStartInterstitialClose}
            />
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
        <AppHeader />

        {/* Joyride Tutorial Global */}
        <Joyride
          steps={tutorialSteps}
          run={runTutorial && isTutorialMode}
          stepIndex={tutorialStepIndex}
          continuous
          showProgress
          showSkipButton
          callback={handleJoyrideCallback}
          styles={{
            options: {
              primaryColor: '#10b981',
              zIndex: 10000,
            },
          }}
          locale={{
            back: 'Atrás',
            close: 'Cerrar',
            last: 'Finalizar',
            next: 'Siguiente',
            skip: 'Saltar',
          }}
        />

        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 pt-20">
          {/* Botón de Ayuda */}
          <HelpButton />

          <div className="max-w-md w-full space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                Jugador {currentPlayerIndex + 1} de {totalPlayers}
              </h2>
              <p className="text-gray-400">
                Raspa la tarjeta para ver tu palabra
              </p>
            </div>

            <div className="pnp-scratch-container relative flex justify-center">
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
                    : 'bg-gradient-to-br from-emerald-600 to-emerald-800'
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
              className="pnp-next-button w-full bg-blue-500 hover:bg-blue-600 px-6 py-4 rounded-xl text-xl font-bold transition-all active:scale-95"
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
        </div>
      </>
    );
  }

  // Game Over Screen
  if (gameOver) {
    return (
      <>
        <AppHeader />
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 pt-20">
          {/* Botón de Ayuda */}
          <HelpButton />

          <div className="max-w-md w-full text-center space-y-6">
            <div className={`p-8 rounded-2xl ${
              winner === 'IMPOSTOR'
                ? 'bg-gradient-to-br from-red-600/20 to-red-800/20 border-2 border-red-500'
                : 'bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 border-2 border-emerald-500'
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
                  <strong>Palabra secreta:</strong> {normalWord}<br/>
                  <strong>El impostor era:</strong> Jugador {impostorIndex + 1}
                </p>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="w-full bg-emerald-500 hover:bg-emerald-600 px-6 py-4 rounded-xl text-xl font-bold transition-all active:scale-95"
            >
              Nueva Partida
            </button>
          </div>
        </div>
      </>
    );
  }

  // Voting Screen
  if (votingMode) {
    const alivePlayersList = alivePlayers.filter(p => p.isAlive);

    return (
      <>
        <AppHeader />

        {/* Joyride Tutorial Global */}
        <Joyride
          steps={tutorialSteps}
          run={runTutorial && isTutorialMode}
          stepIndex={tutorialStepIndex}
          continuous
          showProgress
          showSkipButton
          callback={handleJoyrideCallback}
          styles={{
            options: {
              primaryColor: '#10b981',
              zIndex: 10000,
            },
          }}
          locale={{
            back: 'Atrás',
            close: 'Cerrar',
            last: 'Finalizar',
            next: 'Siguiente',
            skip: 'Saltar',
          }}
        />

        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 pt-20">
          {/* Botón de Ayuda */}
          <HelpButton />

          <div className="pnp-voting-container max-w-md w-full space-y-6">
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
                  className="w-full bg-purple-600 hover:bg-purple-700 px-6 py-4 rounded-xl text-lg font-semibold transition-all active:scale-95 flex items-center justify-between"
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
        </div>
      </>
    );
  }

  // Discussion Phase
  return (
    <>
      <AppHeader />

      {/* Joyride Tutorial Global */}
      <Joyride
        steps={tutorialSteps}
        run={runTutorial && isTutorialMode}
        stepIndex={tutorialStepIndex}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#10b981',
            zIndex: 10000,
          },
        }}
        locale={{
          back: 'Atrás',
          close: 'Cerrar',
          last: 'Finalizar',
          next: 'Siguiente',
          skip: 'Saltar',
        }}
      />

      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 pt-20">
        {/* Botón de Ayuda */}
        <HelpButton />

        <div className="max-w-md w-full text-center space-y-6">
          <h2 className="text-3xl font-bold">💬 Discusión</h2>
          <div className="bg-gray-800/50 p-6 rounded-2xl space-y-4">
            <p className="text-lg">
              Todos vieron su palabra. ¡Discutan!
            </p>

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
            className="pnp-vote-button w-full bg-purple-600 hover:bg-purple-700 px-6 py-4 rounded-xl text-xl font-bold transition-all active:scale-95"
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
      </div>
    </>
  );
}
