import { useState, useEffect, useRef } from "react";
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

  // Estados para el diseño holográfico de las tarjetas
  const [cardThemes, setCardThemes] = useState([]);
  const scratchCanvasRef = useRef(null);

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

  // Estados del tutorial
  const [runTutorial, setRunTutorial] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [isTutorialMode, setIsTutorialMode] = useState(false);

  // Definir los temas holográficos disponibles
  const holoThemes = [
    {
      name: 'Gold',
      gradients: ['#fbbf24', '#f59e0b', '#d97706', '#ea580c'],
      particleColor: '#fbbf24'
    },
    {
      name: 'Holo',
      gradients: ['#06b6d4', '#8b5cf6', '#ec4899', '#06b6d4'],
      particleColor: '#8b5cf6'
    },
    {
      name: 'Ruby',
      gradients: ['#ef4444', '#dc2626', '#ec4899', '#f43f5e'],
      particleColor: '#ef4444'
    }
  ];

  // Emojis disponibles para el patrón
  const availableEmojis = ['🎲', '🤐', '🕵️', '🎭', '👽', '💎'];

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

  // Función para generar canvas holográfico con patrón de emojis
  const generateHolographicCanvas = (theme, emoji) => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');

    // Crear gradiente holográfico
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    theme.gradients.forEach((color, idx) => {
      gradient.addColorStop(idx / (theme.gradients.length - 1), color);
    });

    // Aplicar gradiente de fondo
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Agregar patrón de emojis con baja opacidad
    ctx.globalAlpha = 0.15;
    ctx.font = '32px Arial';
    for (let y = 0; y < canvas.height; y += 50) {
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.fillText(emoji, x + (y % 100 === 0 ? 25 : 0), y);
      }
    }

    // Restaurar opacidad y agregar texto de instrucción
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Raspa aquí 👆', canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL();
  };

  // Función para generar temas aleatorios para todos los jugadores
  const generateCardThemesForPlayers = (numPlayers) => {
    const themes = [];
    for (let i = 0; i < numPlayers; i++) {
      const randomTheme = holoThemes[Math.floor(Math.random() * holoThemes.length)];
      const randomEmoji = availableEmojis[Math.floor(Math.random() * availableEmojis.length)];
      themes.push({
        theme: randomTheme,
        emoji: randomEmoji,
        canvasImage: generateHolographicCanvas(randomTheme, randomEmoji)
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

    // Generar temas holográficos para todos los jugadores
    setCardThemes(generateCardThemesForPlayers(4));

    // Generar avatares únicos para cada jugador
    setPlayerAvatars(generatePlayerAvatars(4));

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

    // Generar temas holográficos para todos los jugadores
    setCardThemes(generateCardThemesForPlayers(totalPlayers));

    // Los avatares ya están generados por el useEffect que escucha cambios en totalPlayers

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
    setPlayerAvatars([]);
    setCardThemes([]);
  };

  // Deshabilitar scroll cuando se muestra la tarjeta de raspado en mobile
  useEffect(() => {
    if (showingCard) {
      // Guardar el overflow actual
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;

      // Deshabilitar scroll
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      // Restaurar al desmontar o cuando showingCard cambie
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [showingCard]);

  // Agregar haptic feedback mientras se rasca
  useEffect(() => {
    if (!showingCard) return;

    let lastVibration = 0;
    const vibrationInterval = 100; // Vibrar cada 100ms mientras rasca

    const handleScratch = (e) => {
      // Verificar que el usuario está tocando/arrastrando
      if ((e.type === 'touchmove' || (e.type === 'mousemove' && e.buttons === 1))) {
        const now = Date.now();
        if (now - lastVibration > vibrationInterval) {
          if (navigator.vibrate) {
            navigator.vibrate(10); // Vibración corta y suave
          }
          lastVibration = now;
        }
      }
    };

    const scratchContainer = document.querySelector('.pnp-scratch-container');
    if (scratchContainer) {
      scratchContainer.addEventListener('touchmove', handleScratch, { passive: true });
      scratchContainer.addEventListener('mousemove', handleScratch, { passive: true });

      return () => {
        scratchContainer.removeEventListener('touchmove', handleScratch);
        scratchContainer.removeEventListener('mousemove', handleScratch);
      };
    }
  }, [showingCard, currentPlayerIndex]);

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

        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 pt-20">

          <button
            onClick={() => navigate('/')}
            className="absolute top-20 left-6 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all flex items-center gap-2 z-50"
          >
            <ArrowLeft size={20} />
            <span>Volver</span>
          </button>

          {/* Botón de Ayuda */}
          <HelpButton />

          <h1 className="text-3xl font-bold mb-4 mt-12">🎮 Pasa y Juega</h1>
          <p className="text-gray-400 mb-8 text-center max-w-md">
            Juega en un solo dispositivo. Cada jugador verá su palabra por turnos.
          </p>

          <div className="bg-gray-800/50 p-8 rounded-2xl max-w-lg w-full space-y-6">
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

            <button
              onClick={startGame}
              className="pnp-start-button w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 px-6 py-5 rounded-xl text-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/30 animate-breathe"
            >
              <Play size={28} />
              <span>EMPEZAR</span>
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
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                Jugador {currentPlayerIndex + 1} de {totalPlayers}
              </h2>
              <p className="text-gray-400">
                Raspa la tarjeta para ver tu palabra
              </p>
            </div>

            <div className="pnp-scratch-container relative flex justify-center" style={{ touchAction: 'none' }}>
              <div style={{ touchAction: 'none' }}>
                <ScratchCard
                  key={currentPlayerIndex}
                  width={320}
                  height={240}
                  image={cardThemes[currentPlayerIndex]?.canvasImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='240'%3E%3Crect width='320' height='240' fill='%23475569'/%3E%3C/svg%3E"}
                  finishPercent={50}
                  onComplete={() => {
                    if (navigator.vibrate) navigator.vibrate(100);
                  }}
                >
                  <div
                    className="flex flex-col items-center justify-center px-4"
                    style={{
                      width: '320px',
                      height: '240px',
                      margin: 0,
                      padding: '0 16px',
                      background: '#1a1a2e'
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
                      <div className="relative">
                        <p className={`font-black text-center ${
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
                  <strong>El impostor era:</strong> <span className="text-2xl">{playerAvatars[impostorIndex] || '👤'}</span> Jugador {impostorIndex + 1}
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

              {alivePlayersList.map((player) => {
                const playerEmoji = playerAvatars[player.index] || '👤';
                return (
                  <button
                    key={player.index}
                    onClick={() => handleVote(player.index)}
                    className="w-full bg-purple-600 hover:bg-purple-700 px-6 py-4 rounded-xl text-lg font-semibold transition-all active:scale-95 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{playerEmoji}</span>
                      <span>Jugador {player.index + 1}</span>
                    </div>
                    <span>👉</span>
                  </button>
                );
              })}
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
