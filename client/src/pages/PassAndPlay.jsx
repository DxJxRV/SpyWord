import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Play, HelpCircle, ChevronUp, ChevronDown } from "lucide-react";
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

  // Estados para la Sala de Guerra
  const [votingEnabled, setVotingEnabled] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [discussionTimer, setDiscussionTimer] = useState(120); // 2 minutos en segundos
  const [speakerIndex, setSpeakerIndex] = useState(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const { isPremium } = useAuth();
  const isRoomPremium = false; // Premium Pass - false porque es modo local
  const [showNewRoundInterstitial, setShowNewRoundInterstitial] = useState(false);

  // Estados para el diseño holográfico de las tarjetas
  const [cardThemes, setCardThemes] = useState([]);
  const scratchCardContainerRef = useRef(null);

  // Estados para los avatares de jugadores
  const [playerAvatars, setPlayerAvatars] = useState([]);

  // Cambiar título de la página
  useEffect(() => {
    document.title = "ImpostorWord - Pasa y Juega";
    return () => {
      document.title = "ImpostorWord";
    };
  }, []);

  // Generar avatares cuando cambia el número de jugadores
  useEffect(() => {
    if (totalPlayers >= 3 && totalPlayers <= 12) {
      setPlayerAvatars(generatePlayerAvatars(totalPlayers));
    }
  }, [totalPlayers]);

  // Cronómetro de discusión
  useEffect(() => {
    if (votingMode && !votingEnabled && discussionTimer > 0) {
      const interval = setInterval(() => {
        setDiscussionTimer(prev => prev - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [votingMode, votingEnabled, discussionTimer]);

  // Estados del tutorial
  const [runTutorial, setRunTutorial] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [isTutorialMode, setIsTutorialMode] = useState(false);

  // Definir colores neón vibrantes para las tarjetas rascables
  const neonColors = [
    { name: 'Cyan', start: '#06b6d4', end: '#0891b2', border: '#22d3ee' },      // cyan
    { name: 'Purple', start: '#a855f7', end: '#7c3aed', border: '#c084fc' },   // purple
    { name: 'Pink', start: '#ec4899', end: '#db2777', border: '#f472b6' },     // pink
    { name: 'Green', start: '#10b981', end: '#059669', border: '#34d399' },    // green
    { name: 'Orange', start: '#f97316', end: '#ea580c', border: '#fb923c' },  // orange
    { name: 'Blue', start: '#3b82f6', end: '#2563eb', border: '#60a5fa' },    // blue
    { name: 'Yellow', start: '#eab308', end: '#ca8a04', border: '#fde047' }, // yellow
    { name: 'Red', start: '#ef4444', end: '#dc2626', border: '#f87171' },    // red
  ];

  // Emojis para avatares de jugadores (personas y objetos)
  const playerEmojiPool = [
    '👨', '👩', '🧑', '👴', '👵', '🧔', '👱', '👨‍🦰', '👩‍🦰', '🧑‍🦱', '👨‍🦱', '👩‍🦱',
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'
  ];

  // Función para generar avatares únicos para cada jugador
  const generatePlayerAvatars = (numPlayers) => {
    const shuffled = [...playerEmojiPool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, numPlayers);
  };

  // Función para obtener mensaje dinámico según cantidad de jugadores
  const getPlayerCountMessage = (count) => {
    if (count < 3) return "⚠️ Mínimo 3 jugadores";
    if (count === 3) return "El trío dinámico";
    if (count >= 4 && count <= 6) return "Grupo estándar - Ideal para empezar";
    if (count >= 7 && count <= 9) return "¡Fiesta grande!";
    if (count >= 10 && count <= 12) return "¡Caos total! Va a haber gritos";
    return "De 3 a 12 jugadores";
  };

  // Función para generar canvas con color neón
  const generateHolographicCanvas = (color) => {
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');

    // Crear gradiente con el color neón asignado
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, color.start);
    gradient.addColorStop(1, color.end);

    // Aplicar gradiente de fondo
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Agregar texto de instrucción centrado
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Raspa aquí 👆', canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL();
  };

  // Función para generar temas para todos los jugadores con colores aleatorios
  const generateCardThemesForPlayers = (numPlayers, avatars) => {
    const themes = [];
    for (let i = 0; i < numPlayers; i++) {
      const randomColor = neonColors[Math.floor(Math.random() * neonColors.length)];
      const playerEmoji = avatars[i] || '👤'; // Usar el emoji del jugador
      themes.push({
        color: randomColor,
        emoji: playerEmoji,
        canvasImage: generateHolographicCanvas(randomColor)
      });
    }
    return themes;
  };

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
      content: '✨ Este es el contenedor de raspado. Cada jugador debe raspar con el dedo (o mouse) para revelar su palabra. Si eres el impostor te saldrá "IMPOSTOR"',
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
    // Paso 4: Sala de Guerra (se mostrará cuando votingMode sea true)
    {
      target: '.pnp-voting-container',
      content: '⚔️ ¡Bienvenidos a la Sala de Guerra! Aquí discuten y votan. Primero hablan, luego abren votaciones y seleccionan al impostor. Si eliminan al impostor, ¡los jugadores ganan! Si solo quedan 2 jugadores y uno es el impostor, ¡el impostor gana!',
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

    // PASO 3: Botón "Listo/Siguiente" - Pasar a la Sala de Guerra
    if (index === 3 && action === ACTIONS.NEXT) {
      console.log(`📘 Tutorial: Paso 3 → Activando siguiente jugador (modo tutorial saltará directamente a la Sala de Guerra)...`);

      // Llamar handleNextPlayer una sola vez - la lógica del tutorial dentro de la función
      // se encargará de saltar directamente a la Sala de Guerra
      handleNextPlayer();

      // Esperar un momento para que el estado se actualice y avanzar al paso 4
      setTimeout(() => {
        console.log("📘 Tutorial: Avanzando al paso 4 (Sala de Guerra)");
        setTutorialStepIndex(4);
      }, 600);
      return;
    }

    // PASO 4: Sala de Guerra - Finalizar tutorial
    if (index === 4 && action === ACTIONS.NEXT) {
      console.log("📘 Tutorial: Paso 4 → Finalizando...");
      setRunTutorial(false);
      setIsTutorialMode(false);
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

    // Generar avatares únicos para cada jugador
    const tutorialAvatars = generatePlayerAvatars(4);
    setPlayerAvatars(tutorialAvatars);

    // Generar temas holográficos para todos los jugadores con sus avatares
    setCardThemes(generateCardThemesForPlayers(4, tutorialAvatars));

    // NO mostrar intersticial en modo tutorial
    setSetupMode(false);
    setShowingCard(true);
  };

  const startGame = () => {
    if (totalPlayers === '' || totalPlayers < 3 || isNaN(totalPlayers)) {
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

    // Generar temas holográficos para todos los jugadores con sus avatares
    // Los avatares ya están generados por el useEffect que escucha cambios en totalPlayers
    setCardThemes(generateCardThemesForPlayers(totalPlayers, playerAvatars));

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
    // En modo tutorial, después del primer jugador, saltar directamente a la Sala de Guerra
    if (isTutorialMode && currentPlayerIndex === 0) {
      console.log("📘 Tutorial: Saltando directamente a la Sala de Guerra desde jugador 1...");
      const playersArray = Array(totalPlayers).fill(null).map((_, idx) => ({
        index: idx,
        isAlive: true,
        isImpostor: idx === impostorIndex
      }));
      setAlivePlayers(playersArray);
      setShowingCard(false);

      // Iniciar Sala de Guerra directamente
      const randomSpeaker = playersArray[Math.floor(Math.random() * playersArray.length)];
      setSpeakerIndex(randomSpeaker.index);
      setVotingMode(true);
      setVotingEnabled(false);
      setSelectedPlayer(null);
      setDiscussionTimer(120);
      return;
    }

    if (currentPlayerIndex < totalPlayers - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setShowingCard(true);
    } else {
      // All players saw their words - ir directamente a la Sala de Guerra
      const playersArray = Array(totalPlayers).fill(null).map((_, idx) => ({
        index: idx,
        isAlive: true,
        isImpostor: idx === impostorIndex
      }));
      setAlivePlayers(playersArray);
      setShowingCard(false);

      // Iniciar votación directamente (Sala de Guerra)
      // Elegir aleatoriamente un jugador vivo como speaker
      const randomSpeaker = playersArray[Math.floor(Math.random() * playersArray.length)];
      setSpeakerIndex(randomSpeaker.index);

      setVotingMode(true);
      setVotingEnabled(false);
      setSelectedPlayer(null);
      setDiscussionTimer(120);
    }
  };

  const handleVote = (votedPlayerIndex) => {
    const votedPlayer = alivePlayers.find(p => p.index === votedPlayerIndex);

    if (votedPlayer.isImpostor) {
      // ¡Ganaron los jugadores!
      setWinner('PLAYERS');
      setGameOver(true);

      // Reset war room al terminar el juego
      setVotingMode(false);
      setVotingEnabled(false);
      setSelectedPlayer(null);
      setDiscussionTimer(120);
      setSpeakerIndex(null);
    } else {
      // Eliminaron a un jugador normal
      const newAlivePlayers = alivePlayers.map(p =>
        p.index === votedPlayerIndex ? { ...p, isAlive: false } : p
      );

      const remainingAlive = newAlivePlayers.filter(p => p.isAlive);

      if (remainingAlive.length === 2) {
        // Solo quedan 2: el impostor gana
        setWinner('IMPOSTOR');
        setGameOver(true);

        // Reset war room al terminar el juego
        setVotingMode(false);
        setVotingEnabled(false);
        setSelectedPlayer(null);
        setDiscussionTimer(120);
        setSpeakerIndex(null);
      } else {
        // El juego continúa - nueva ronda en la Sala de Guerra
        setAlivePlayers(newAlivePlayers);
        setRoundNumber(prev => prev + 1);

        // Elegir nuevo speaker aleatorio de los jugadores vivos
        const randomSpeaker = remainingAlive[Math.floor(Math.random() * remainingAlive.length)];
        setSpeakerIndex(randomSpeaker.index);

        // Resetear estado de votación para nueva ronda (pero mantener votingMode true)
        setVotingEnabled(false);
        setSelectedPlayer(null);
        setDiscussionTimer(120);
      }
    }
  };

  const enableVoting = () => {
    setVotingEnabled(true);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const selectPlayer = (playerIndex) => {
    if (!votingEnabled) return;
    setSelectedPlayer(playerIndex);
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const confirmVote = () => {
    if (selectedPlayer !== null) {
      handleVote(selectedPlayer);
    }
  };

  const skipVote = () => {
    setVotingMode(false);
    setVotingEnabled(false);
    setSelectedPlayer(null);
    setDiscussionTimer(120);
    setSpeakerIndex(null);
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
    setPlayerAvatars([]);
    setCardThemes([]);
    // Reset war room states
    setVotingEnabled(false);
    setSelectedPlayer(null);
    setDiscussionTimer(120);
    setSpeakerIndex(null);
    setRoundNumber(1);
  };

  const restartGame = () => {
    // Volver a jugar con los mismos jugadores
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

    // Generar nuevos temas holográficos pero mantener los mismos avatares
    setCardThemes(generateCardThemesForPlayers(totalPlayers, playerAvatars));

    // Reset game states y volver a mostrar tarjetas
    setGameOver(false);
    setWinner(null);
    setVotingMode(false);
    setAlivePlayers([]);
    setVotingEnabled(false);
    setSelectedPlayer(null);
    setDiscussionTimer(120);
    setSpeakerIndex(null);
    setRoundNumber(1);

    // Ir directamente a mostrar la primera tarjeta
    setShowingCard(true);
  };

  // Deshabilitar scroll y centrar la card cuando se muestra
  useEffect(() => {
    if (showingCard) {
      // Deshabilitar scroll
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      // Centrar la card en la pantalla
      setTimeout(() => {
        if (scratchCardContainerRef.current) {
          scratchCardContainerRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 100);

      return () => {
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
      };
    }
  }, [showingCard, currentPlayerIndex]);

  // Renderizar el botón de ayuda (disponible en todas las pantallas)
  const HelpButton = () => (
    <button
      onClick={startTutorial}
      className="fixed top-20 right-6 bg-blue-500/10 hover:bg-blue-500/20 p-3 rounded-lg transition-all flex items-center justify-center border border-blue-500/30 z-[100]"
      title="¿Cómo jugar?"
    >
      <HelpCircle size={20} />
    </button>
  );

  if (setupMode) {
    return (
      <>
        <style>{`
          @keyframes bounce-in {
            0% {
              opacity: 0;
              transform: scale(0) translateY(-20px);
            }
            50% {
              transform: scale(1.2);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          @keyframes breathe {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.02);
            }
          }

          .animate-bounce-in {
            animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }

          .animate-breathe {
            animation: breathe 3s ease-in-out infinite;
          }
        `}</style>
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

        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 pt-20 pb-28">

          <button
            onClick={() => navigate('/')}
            className="fixed top-20 left-6 bg-white/5 hover:bg-white/10 p-3 rounded-lg transition-all flex items-center justify-center z-[100]"
            title="Volver"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Botón de Ayuda */}
          <HelpButton />

          <h1 className="text-3xl font-bold mb-4 mt-12">🎮 Pasa y Juega</h1>
          <p className="text-gray-400 mb-8 text-center max-w-md">
            Juega en un solo dispositivo. Cada jugador verá su palabra por turnos.
          </p>

          <div className="bg-gray-800/50 p-8 rounded-2xl max-w-lg w-full space-y-6 mb-6">
            <div className="pnp-player-counter">
              <label className="flex items-center justify-center gap-2 text-lg font-semibold mb-4">
                <Users size={24} className="text-purple-400" />
                <span>Reúne a tu tripulación</span>
              </label>

              {/* Selector horizontal grande */}
              <div className="flex items-center gap-4 mb-4">
                {/* Botón decrementar */}
                <button
                  onClick={() => {
                    const current = totalPlayers === '' ? 4 : totalPlayers;
                    const newValue = Math.max(3, current - 1);
                    setTotalPlayers(newValue);
                    if (navigator.vibrate) navigator.vibrate(10);
                  }}
                  disabled={totalPlayers <= 3 && totalPlayers !== ''}
                  className="flex-shrink-0 bg-red-500/20 hover:bg-red-500/30 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 disabled:text-gray-600 p-4 rounded-xl transition-all active:scale-95 border-2 border-red-500/50 disabled:border-gray-700"
                >
                  <ChevronDown size={28} strokeWidth={3} />
                </button>

                {/* Número grande en el centro */}
                <div className="flex-1 bg-gradient-to-br from-purple-600/30 to-pink-600/30 border-2 border-purple-500/50 rounded-xl p-6 text-center">
                  <div className="text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {totalPlayers || 0}
                  </div>
                  <p className="text-xs text-purple-300 mt-1 font-semibold">jugadores</p>
                </div>

                {/* Botón incrementar */}
                <button
                  onClick={() => {
                    const current = totalPlayers === '' ? 3 : totalPlayers;
                    const newValue = Math.min(12, current + 1);
                    setTotalPlayers(newValue);
                    if (navigator.vibrate) navigator.vibrate(10);
                  }}
                  disabled={totalPlayers >= 12}
                  className="flex-shrink-0 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-400 disabled:text-gray-600 p-4 rounded-xl transition-all active:scale-95 border-2 border-emerald-500/50 disabled:border-gray-700"
                >
                  <ChevronUp size={28} strokeWidth={3} />
                </button>
              </div>

              {/* Mensaje dinámico */}
              <p className={`text-sm text-center font-semibold mb-4 transition-all ${
                totalPlayers < 3 || totalPlayers === ''
                  ? 'text-red-400'
                  : totalPlayers >= 10
                  ? 'text-orange-400'
                  : 'text-purple-300'
              }`}>
                {getPlayerCountMessage(totalPlayers || 0)}
              </p>

              {/* Grid de avatares de la tripulación */}
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                <p className="text-xs text-gray-400 mb-3 text-center">Tu tripulación:</p>
                <div className="grid grid-cols-6 gap-2 justify-items-center">
                  {playerAvatars.map((emoji, idx) => {
                    return (
                      <div
                        key={idx}
                        className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-lg animate-bounce-in border-2 border-gray-700"
                        style={{
                          animationDelay: `${idx * 50}ms`,
                          animationFillMode: 'backwards'
                        }}
                      >
                        {emoji}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Botón EMPEZAR fijo en el bottom */}
          <div className="fixed bottom-0 left-0 right-0 pt-6 pb-4 px-4 bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent z-40">
            <div className="max-w-lg mx-auto">
              <button
                onClick={startGame}
                className="pnp-start-button w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 px-6 py-5 rounded-xl text-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/50 animate-breathe"
              >
                <Play size={28} />
                <span>EMPEZAR</span>
              </button>
            </div>
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
        <style>{`
          @keyframes glitch {
            0% { transform: translate(0); }
            20% { transform: translate(-2px, 2px); }
            40% { transform: translate(-2px, -2px); }
            60% { transform: translate(2px, 2px); }
            80% { transform: translate(2px, -2px); }
            100% { transform: translate(0); }
          }
        `}</style>
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
            {/* Banner del jugador actual con emoji */}
            <div
              className="rounded-xl p-4 text-center"
              style={{
                background: `linear-gradient(to right, ${cardThemes[currentPlayerIndex]?.color?.start}20, ${cardThemes[currentPlayerIndex]?.color?.end}20)`,
                border: `2px solid ${cardThemes[currentPlayerIndex]?.color?.border || '#22d3ee'}`
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl animate-bounce">{playerAvatars[currentPlayerIndex]}</span>
                <div>
                  <p className="text-xl font-bold text-white">Jugador {currentPlayerIndex + 1}/{totalPlayers}</p>
                </div>
              </div>
            </div>

            <div
              ref={scratchCardContainerRef}
              className="pnp-scratch-container w-full"
            >
              <div
                className="rounded-xl overflow-hidden w-full"
                style={{
                  border: `3px solid ${cardThemes[currentPlayerIndex]?.color?.border || '#22d3ee'}`
                }}
              >
                <ScratchCard
                  key={currentPlayerIndex}
                  width={360}
                  height={240}
                  image={cardThemes[currentPlayerIndex]?.canvasImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='360' height='240'%3E%3Crect width='360' height='240' fill='%23475569'/%3E%3C/svg%3E"}
                  finishPercent={50}
                  onComplete={() => {
                    if (navigator.vibrate) navigator.vibrate(100);
                  }}
                >
                  <div
                    className="flex flex-col items-center justify-center px-6"
                    style={{
                      width: '360px',
                      height: '240px',
                      margin: 0,
                      background: 'linear-gradient(to bottom right, #1f2937, #111827)'
                    }}
                  >
                    {isImpostor ? (
                      <div className="text-center">
                        <p className="text-6xl font-black text-red-500 animate-pulse" style={{
                          textShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
                          animation: 'glitch 0.3s infinite'
                        }}>
                          IMPOSTOR
                        </p>
                        <p className="text-sm font-semibold text-red-400 mt-3">
                          🎭 Descubre la palabra secreta
                        </p>
                      </div>
                    ) : (
                      <div className="text-center w-full">
                        <p className={`font-black ${
                          currentWord.length > 15 ? 'text-3xl' : currentWord.length > 10 ? 'text-4xl' : 'text-5xl'
                        }`} style={{
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          filter: 'drop-shadow(0 0 20px rgba(167, 139, 250, 0.5))'
                        }}>
                          {currentWord}
                        </p>
                      </div>
                    )}
                  </div>
                </ScratchCard>
              </div>
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

  // Game Over Screen - PANTALLA DE GLORIA
  if (gameOver) {
    const impostorEmoji = playerAvatars[impostorIndex] || '👤';
    const picantePhrases = [
      "¿Fue suerte o habilidad?",
      `El Jugador ${impostorIndex + 1} suda mucho al mentir...`,
      "Otro round, otra oportunidad",
      "La venganza es un plato que se sirve frío",
      "¿Quién será el próximo impostor?",
      "Eso estuvo cerca...",
    ];
    const randomPhrase = picantePhrases[Math.floor(Math.random() * picantePhrases.length)];

    return (
      <>
        <style>{`
          @keyframes stamp-appear {
            0% {
              transform: scale(0) rotate(-15deg);
              opacity: 0;
            }
            50% {
              transform: scale(1.2) rotate(-12deg);
            }
            100% {
              transform: scale(1) rotate(-15deg);
              opacity: 1;
            }
          }

          @keyframes float-in {
            0% {
              transform: translateY(50px);
              opacity: 0;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes confetti-fall {
            0% {
              transform: translateY(-100vh) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }

          .stamp {
            animation: stamp-appear 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.5s forwards;
            opacity: 0;
          }

          .float-in {
            animation: float-in 0.6s ease-out;
          }

          .confetti {
            position: absolute;
            width: 10px;
            height: 10px;
            animation: confetti-fall 3s linear infinite;
          }
        `}</style>

        <AppHeader />

        {/* Fondo Full Screen con degradado */}
        <div
          className="relative flex flex-col items-center justify-center min-h-screen text-white p-6 pt-20 overflow-hidden"
          style={{
            background: winner === 'IMPOSTOR'
              ? 'radial-gradient(circle at center, #7f1d1d 0%, #450a0a 50%, #000000 100%)'
              : 'radial-gradient(circle at center, #065f46 0%, #064e3b 50%, #000000 100%)'
          }}
        >
          {/* Confeti animado (solo si ganaron jugadores) */}
          {winner === 'PLAYERS' && (
            <>
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    backgroundColor: ['#fbbf24', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'][Math.floor(Math.random() * 5)],
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                />
              ))}
            </>
          )}

          {/* Botón de Ayuda */}
          <HelpButton />

          <div className="max-w-md w-full text-center space-y-8 relative z-10">
            {/* Encabezado */}
            <div className="float-in">
              <h1 className="text-6xl font-black mb-2">
                {winner === 'IMPOSTOR' ? '🎭' : '🎉'}
              </h1>
              <h2 className="text-5xl font-black tracking-tight">
                {winner === 'IMPOSTOR' ? '¡VICTORIA!' : '¡VICTORIA!'}
              </h2>
              <p className="text-xl text-gray-300 mt-2">
                {winner === 'IMPOSTOR' ? 'El impostor sobrevivió' : 'Impostor eliminado'}
              </p>
            </div>

            {/* Hero Section - Avatar del Impostor */}
            <div className="relative float-in" style={{ animationDelay: '0.2s' }}>
              {/* Avatar Gigante */}
              <div className="relative inline-block">
                <div className="text-9xl mb-4 filter drop-shadow-2xl">
                  {impostorEmoji}
                </div>

                {/* Sello de CAPTURADO o Corona */}
                {winner === 'PLAYERS' ? (
                  <div
                    className="stamp absolute top-0 right-0 bg-red-600 text-white px-6 py-3 rounded-lg font-black text-2xl border-4 border-red-800 shadow-2xl"
                    style={{
                      transform: 'rotate(-15deg)',
                    }}
                  >
                    ¡CAPTURADO!
                  </div>
                ) : (
                  <div className="stamp absolute -top-4 left-1/2 -translate-x-1/2 text-6xl filter drop-shadow-lg">
                    👑
                  </div>
                )}
              </div>

              <p className="text-3xl font-bold mt-4">
                Jugador {impostorIndex + 1}
              </p>
              <p className="text-sm text-gray-400">
                {winner === 'IMPOSTOR' ? 'Maestro del engaño' : 'Fue descubierto'}
              </p>
            </div>

            {/* Badge de Palabra Secreta */}
            <div
              className="float-in inline-block px-6 py-4 rounded-2xl backdrop-blur-md border-2 shadow-xl"
              style={{
                animationDelay: '0.4s',
                background: 'rgba(255, 255, 255, 0.1)',
                borderColor: winner === 'IMPOSTOR' ? '#f87171' : '#6ee7b7'
              }}
            >
              <p className="text-sm text-gray-300 mb-1">🔓 La palabra era:</p>
              <p className="text-3xl font-black uppercase tracking-wider">
                {normalWord}
              </p>
            </div>

            {/* Frase Picante */}
            <p className="float-in text-lg italic text-gray-400" style={{ animationDelay: '0.6s' }}>
              "{randomPhrase}"
            </p>

            {/* Botones */}
            <div className="space-y-4 float-in" style={{ animationDelay: '0.8s' }}>
              {/* Botón Primario - REVANCHA */}
              <button
                onClick={restartGame}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-6 rounded-2xl text-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-4 shadow-2xl shadow-purple-500/50"
              >
                <span className="text-3xl">🔄</span>
                <span>REVANCHA RÁPIDA</span>
              </button>

              {/* Botón Secundario - Cambiar Config */}
              <button
                onClick={resetGame}
                className="w-full text-gray-400 hover:text-white transition-all text-sm py-2"
              >
                ⚙️ Cambiar configuración
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // LA SALA DE GUERRA - Pantalla unificada de discusión y votación
  if (votingMode) {
    const alivePlayersList = alivePlayers.filter(p => p.isAlive);
    const minutes = Math.floor(discussionTimer / 60);
    const seconds = discussionTimer % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    const isTimeRunningOut = discussionTimer <= 10;

    return (
      <>
        <style>{`
          @keyframes pulse-speaker {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 0 0 10px rgba(251, 191, 36, 0);
            }
          }

          @keyframes bounce-speaker {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-5px);
            }
          }

          @keyframes flash-red {
            0%, 100% {
              background-color: rgba(17, 24, 39, 1);
            }
            50% {
              background-color: rgba(153, 27, 27, 0.3);
            }
          }

          .speaker-card {
            animation: pulse-speaker 2s infinite;
          }

          .speaker-emoji {
            animation: bounce-speaker 1s infinite;
          }

          .time-running-out {
            animation: flash-red 1s infinite;
          }

          .player-card-dead {
            filter: grayscale(100%);
            opacity: 0.5;
          }

          .player-card-selected {
            background: linear-gradient(135deg, #dc2626, #991b1b) !important;
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(220, 38, 38, 0.6);
          }
        `}</style>

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

        <div className={`min-h-screen bg-gray-950 text-white p-4 pt-32 pb-28 ${isTimeRunningOut && !votingEnabled ? 'time-running-out' : ''}`}>
          {/* Botón de Ayuda */}
          <HelpButton />

          <div className="pnp-voting-container max-w-2xl w-full mx-auto space-y-4 relative">
            {/* HEADER: Cronómetro y Ronda */}
            <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-2 border-purple-500/50 rounded-xl p-4 text-center">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-purple-300">
                  RONDA {roundNumber}
                </div>
                <div className={`text-3xl font-black ${isTimeRunningOut && !votingEnabled ? 'text-red-400' : 'text-white'}`}>
                  ⏱️ {timeString}
                </div>
                <div className="text-sm font-semibold text-purple-300">
                  {alivePlayersList.length} vivos
                </div>
              </div>
            </div>

            {/* MENSAJE DEL SPEAKER */}
            {!votingEnabled && speakerIndex !== null && (
              <div className="bg-amber-500/20 border-2 border-amber-500/50 rounded-xl p-4 text-center">
                <p className="text-sm text-amber-300 mb-1">📣 Empieza hablando:</p>
                <p className="text-xl font-bold flex items-center justify-center gap-2">
                  <span className="text-3xl speaker-emoji">{playerAvatars[speakerIndex]}</span>
                  <span>Jugador {speakerIndex + 1}</span>
                </p>
              </div>
            )}

            {/* GRID DE JUGADORES */}
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
              <div className={`grid gap-3 ${alivePlayersList.length <= 4 ? 'grid-cols-2' : alivePlayersList.length <= 6 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                {alivePlayers.map((player) => {
                  const playerEmoji = playerAvatars[player.index] || '👤';
                  const isAlive = player.isAlive;
                  const isSpeaker = speakerIndex === player.index && !votingEnabled;
                  const isSelected = selectedPlayer === player.index;

                  return (
                    <button
                      key={player.index}
                      onClick={() => selectPlayer(player.index)}
                      disabled={!isAlive || !votingEnabled}
                      className={`
                        relative aspect-square rounded-xl p-3 transition-all active:scale-95
                        flex flex-col items-center justify-center gap-2
                        ${!isAlive ? 'player-card-dead cursor-not-allowed' : ''}
                        ${isSelected ? 'player-card-selected' : 'bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800'}
                        ${isSpeaker ? 'speaker-card border-2 border-amber-500' : 'border border-gray-700'}
                        ${votingEnabled && isAlive ? 'cursor-pointer' : 'cursor-default'}
                      `}
                    >
                      {/* Emoji del jugador */}
                      <div className="text-4xl md:text-5xl">
                        {playerEmoji}
                      </div>

                      {/* Nombre del jugador */}
                      <div className="text-xs font-semibold text-gray-300">
                        J{player.index + 1}
                      </div>

                      {/* Megáfono para el speaker */}
                      {isSpeaker && (
                        <div className="absolute -top-2 -right-2 text-2xl speaker-emoji">
                          📣
                        </div>
                      )}

                      {/* X roja para jugadores muertos */}
                      {!isAlive && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-6xl text-red-500 font-black">✕</div>
                        </div>
                      )}

                      {/* Indicador de selección */}
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                          ¿?
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FOOTER: Acciones */}
            <div className="space-y-3 pb-safe">
              {!votingEnabled ? (
                // Modo Debate - Botón fijo en el bottom
                <div className="fixed bottom-0 left-0 right-0 pt-6 pb-4 px-4 bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent z-40">
                  <div className="max-w-2xl mx-auto">
                    <button
                      onClick={enableVoting}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-6 py-4 rounded-xl text-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-purple-500/50"
                    >
                      <span>🗳️</span>
                      <span>ABRIR VOTACIONES</span>
                    </button>
                  </div>
                </div>
              ) : (
                // Modo Votación
                <>
                  {selectedPlayer !== null ? (
                    <button
                      onClick={confirmVote}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-6 py-5 rounded-xl text-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-red-500/30 animate-pulse"
                    >
                      <span>⚠️</span>
                      <span>CONFIRMAR VOTO CONTRA {playerAvatars[selectedPlayer]} J{selectedPlayer + 1}</span>
                    </button>
                  ) : (
                    <div className="w-full bg-gray-800/50 border-2 border-dashed border-gray-600 px-6 py-5 rounded-xl text-center">
                      <p className="text-gray-400 font-semibold">
                        👆 Selecciona un jugador para votar
                      </p>
                    </div>
                  )}

                  <button
                    onClick={skipVote}
                    className="w-full bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg transition-all text-sm font-semibold"
                  >
                    Saltar votación
                  </button>
                </>
              )}

              <button
                onClick={resetGame}
                className="w-full bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all text-xs"
              >
                Cancelar partida
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Esta pantalla ya no debería mostrarse nunca porque vamos directamente a la Sala de Guerra
  return null;
}
