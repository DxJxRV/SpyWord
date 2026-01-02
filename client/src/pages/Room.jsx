import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { Eye, EyeOff, Share2, QrCode, Copy, ChevronDown, ChevronUp, Play, UserPlus, Crown, MoreVertical, UserMinus, UserCheck, X, PhoneOff } from "lucide-react";
import { api, buildImageUrl } from "../services/api";
import { toast } from "sonner";
import Joyride from "react-joyride";
import { useTutorial } from "../contexts/TutorialContext";
import { useAuth } from "../contexts/AuthContext";
import { tutorialStepsRoom } from "../data/tutorialSteps";
import TutorialButton from "../components/TutorialButton";
import VotingPanel from "../components/VotingPanel";
import GameOverPanel from "../components/GameOverPanel";
import AdPlaceholder from "../components/AdPlaceholder";
import InterstitialAd from "../components/InterstitialAd";
import AppHeader from "../components/AppHeader";
import VoicePanel from "../components/VoicePanel";
import VoiceParticipant from "../components/VoiceParticipant";
import * as voiceChat from "../services/voiceChat";
import { createHostPeer, connectToHost, closePeer, broadcastMessage, sendMessage, setLocalMuted, setSpeakersMuted as setSpeakersMutedP2P } from "../network/p2p";

export default function Room() {
  const { roomId } = useParams(); // Solo necesitamos roomId
  const navigate = useNavigate();
  const { runRoom, stopRoomTutorial } = useTutorial();
  const { isPremium } = useAuth();
  const [word, setWord] = useState("");
  const [itemImageUrl, setItemImageUrl] = useState(null); // URL de la imagen del item (modos especiales)
  const [modeType, setModeType] = useState(null); // Tipo de modo: 'word', 'image', 'hybrid'
  const [modeName, setModeName] = useState(null); // Nombre del modo especial
  const [currentRound, setCurrentRound] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null); // Countdown en segundos
  const [countdownActive, setCountdownActive] = useState(false); // Flag para activar el countdown
  const [showQRModal, setShowQRModal] = useState(false); // Estado para modal de QR
  const [starterName, setStarterName] = useState(null); // Nombre del jugador que inicia
  const [previousStarterName, setPreviousStarterName] = useState(null); // Nombre anterior para comparar
  const [previousWord, setPreviousWord] = useState(null); // Palabra anterior para comparar
  const [wordHidden, setWordHidden] = useState(false); // Estado para ocultar/mostrar la palabra
  const nextRoundTimestamp = useRef(null); // Guardar el timestamp original

  // Estados para votación
  const [roomStatus, setRoomStatus] = useState("IN_GAME"); // Estado de la sala: IN_GAME, VOTING, RESULTS
  const [players, setPlayers] = useState({}); // Objeto con datos de jugadores {id: {name, isAlive, hasVoted}}
  const [votesTally, setVotesTally] = useState({}); // Conteo de votos {playerId: count}
  const [votersRemaining, setVotersRemaining] = useState(0); // Cuántos jugadores faltan por votar
  const [eliminatedPlayerId, setEliminatedPlayerId] = useState(null); // ID del jugador eliminado
  const [myId, setMyId] = useState(null); // ID del jugador actual

  // Estados para game over
  const [winner, setWinner] = useState(null); // 'IMPOSTOR' o 'PLAYERS'
  const [winReason, setWinReason] = useState(null); // 'impostor_eliminated' o 'impostor_survived'

  // Cambiar título de la página según el modo de juego
  useEffect(() => {
    if (modeName) {
      document.title = `ImpostorWord - Modo ${modeName}`;
    } else {
      document.title = "ImpostorWord - Juego Online";
    }

    return () => {
      document.title = "ImpostorWord";
    };
  }, [modeName]);
  const [impostorId, setImpostorId] = useState(null); // ID del impostor (solo revelado en game over)

  // Estados para anuncios
  const [isRoomPremium, setIsRoomPremium] = useState(false); // Premium Pass del Anfitrión
  const [showRestartInterstitial, setShowRestartInterstitial] = useState(false);

  // Estado para grid de usuarios (nuevo)
  const [showPlayersGrid, setShowPlayersGrid] = useState(true); // Mostrar por defecto

  // Estado para opciones de invitación
  const [showInviteOptions, setShowInviteOptions] = useState(false);

  // Estado para menú de configuración de jugadores
  const [playerMenuOpen, setPlayerMenuOpen] = useState(null); // ID del jugador con menú abierto

  // Estado para posición del tooltip de invitación
  const [inviteMenuPosition, setInviteMenuPosition] = useState('top');

  // Referencia para rastrear IDs de jugadores previos
  const previousPlayerIds = useRef(new Set());

  // Referencia para el botón de añadir
  const addButtonRef = useRef(null);

  // ===== ESTADOS DE VOZ =====
  const [voiceEnabled, setVoiceEnabled] = useState(false); // Sistema de voz activado (auto-connect)
  const [micMuted, setMicMuted] = useState(false); // Micrófono silenciado (sin desconectar)
  const [speakersMuted, setSpeakersMuted] = useState(false); // Audio silenciado (sin desconectar)
  const [isConnectingMic, setIsConnectingMic] = useState(false); // Conectando micrófono
  const [voiceStatus, setVoiceStatus] = useState('disconnected'); // Estado: disconnected, connecting, connected, error
  const [audioLevel, setAudioLevel] = useState(0); // Nivel de audio local (0-100)
  const [speakersData, setSpeakersData] = useState({}); // {playerId: {isSpeaking, audioLevel}}
  const [voicePeerId, setVoicePeerId] = useState(null); // ID del peer local
  const [voiceHostId, setVoiceHostId] = useState(null); // ID del peer host (admin)

  // Referencias para gestión de voz
  const localStreamRef = useRef(null);
  const peerRef = useRef(null);
  const peerConnectionsRef = useRef({}); // {playerId: connection}
  const audioLevelIntervalRef = useRef(null);
  const retryTimeoutRef = useRef(null); // Para retry automático
  const retryCountRef = useRef(0); // Contador de intentos

  // Detectar nuevos jugadores y mostrar toast
  useEffect(() => {
    if (Object.keys(players).length === 0) return;

    const currentPlayerIds = new Set(Object.keys(players));

    // Si es la primera carga, solo inicializar
    if (previousPlayerIds.current.size === 0) {
      previousPlayerIds.current = currentPlayerIds;
      return;
    }

    // Encontrar nuevos jugadores
    const newPlayerIds = [...currentPlayerIds].filter(id =>
      !previousPlayerIds.current.has(id) && id !== myId
    );

    // Mostrar toast para cada nuevo jugador
    newPlayerIds.forEach(id => {
      const playerName = players[id]?.name || "Jugador";
      toast.success(`${playerName} se unió a la sala`, {
        icon: "👋",
      });
    });

    // Actualizar la referencia
    previousPlayerIds.current = currentPlayerIds;
  }, [players, myId]);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedMenuContainer = event.target.closest('.player-menu-container');

      if (playerMenuOpen && !clickedMenuContainer) {
        setPlayerMenuOpen(null);
      }

      if (showInviteOptions && !clickedMenuContainer) {
        setShowInviteOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [playerMenuOpen, showInviteOptions]);

  // Calcular posición óptima del tooltip de invitación (preferir arriba)
  useEffect(() => {
    if (showInviteOptions && addButtonRef.current) {
      const rect = addButtonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Preferir arriba: si hay más de 120px arriba, mostrar arriba
      if (spaceAbove > 120) {
        setInviteMenuPosition('top');
      } else if (spaceBelow > 120) {
        setInviteMenuPosition('bottom');
      } else {
        // Si no hay espacio suficiente en ningún lado, preferir arriba
        setInviteMenuPosition(spaceAbove > spaceBelow ? 'top' : 'bottom');
      }
    }
  }, [showInviteOptions]);

  useEffect(() => {
    let isActive = true;

    const poll = async () => {
      if (!isActive) return;

      console.log(`📡 [POLL] Enviando petición → round=${currentRound} nextRoundAt=${nextRoundTimestamp.current || 0}`);

      try {
        const res = await api.get(`/rooms/${roomId}/state`, {
          params: {
            round: currentRound || 0,
            nextRoundAt: nextRoundTimestamp.current || 0,
            status: roomStatus || 'IN_GAME',
            totalPlayers: totalPlayers || 0,
          },
          timeout: 35000, // un poco mayor al timeout del server
        });

        console.log("📩 [POLL] Respuesta recibida:", res.data);

        // 🚫 Jugador eliminado de la sala
        if (res.data.kicked) {
          console.log("🚫 [POLL] Jugador eliminado de la sala → redirigiendo a home");
          toast.error("Has sido eliminado de la sala");
          navigate("/");
          return;
        }

        // 🔁 Sin cambios
        if (res.data.unchanged) {
          console.log("⏳ [POLL] Sin cambios — esperará 2 segundos antes de volver a consultar");
          setTimeout(poll, 2000);
          return;
        }

        // ✅ Cambios detectados
        console.log("🔄 [POLL] Cambios detectados → actualizando estado...");

        setCurrentRound(res.data.round);
        setWord(res.data.word);
        setItemImageUrl(res.data.itemImageUrl || null); // Capturar URL de imagen (modos especiales)
        setModeType(res.data.modeType || null); // Capturar tipo de modo
        setModeName(res.data.modeName || null); // Capturar nombre del modo
        setTotalPlayers(res.data.totalPlayers);
        setIsAdmin(res.data.isAdmin);
        setStarterName(res.data.starterName);

        // Actualizar datos de votación
        setRoomStatus(res.data.status || "IN_GAME");
        setPlayers(res.data.players || {});
        setVotesTally(res.data.votesTally || {});
        setVotersRemaining(res.data.votersRemaining || 0);
        setEliminatedPlayerId(res.data.eliminatedPlayerId || null);
        setMyId(res.data.myId || null);

        // Actualizar datos de game over
        setWinner(res.data.winner || null);
        setWinReason(res.data.winReason || null);
        setImpostorId(res.data.impostorId || null);

        // Actualizar estado de anuncios (isRoomPremium = Premium Pass del Anfitrión)
        setIsRoomPremium(res.data.isRoomPremium || false);

        if (res.data.nextRoundAt && !nextRoundTimestamp.current) {
          nextRoundTimestamp.current = res.data.nextRoundAt;
          setCountdownActive(true); // Activar el countdown
          console.log(`📡 Countdown recibido, starterName: ${res.data.starterName}`);
        }


        console.log("✅ [POLL] Estado actualizado, volverá a esperar 2 segundos antes de la siguiente consulta...");
        setTimeout(poll, 2000); // ⚠️ evita spam inmediato
      } catch (err) {
        console.error("💥 [POLL] Error en long polling:", err.message || err);
        console.log("🔁 [POLL] Reintentará en 3 segundos...");
        setTimeout(poll, 3000);
      }
    };


    poll();

    return () => { isActive = false; };
  }, [roomId, currentRound, roomStatus, totalPlayers]);


  // Efecto separado para actualizar el countdown cada segundo
  useEffect(() => {
    if (!countdownActive || !nextRoundTimestamp.current) return;

    const updateCountdown = () => {
      const timeLeft = Math.ceil((nextRoundTimestamp.current - Date.now()) / 1000);
      if (timeLeft <= 0) {
        // Countdown terminado
        setCountdown(null);
        setCountdownActive(false);
        nextRoundTimestamp.current = null;
      } else {
        setCountdown(timeLeft);
      }
    };

    // Actualizar inmediatamente
    updateCountdown();

    // Actualizar cada segundo
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [countdownActive]);

  const handleRestart = () => {
    // Mostrar viñeta intersticial antes de reiniciar
    setShowRestartInterstitial(true);
  };

  const handleRestartInterstitialClose = async () => {
    setShowRestartInterstitial(false);
    setLoading(true);
    setWord(null); // Limpiar la palabra al reiniciar
    try {
      await api.post(`/rooms/${roomId}/restart`); // Ya no necesita adminId
      if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
    } catch (err) {
      console.error("Error al reiniciar:", err);
      alert("Solo el administrador puede reiniciar la partida");
    } finally {
      setLoading(false);
    }
  };

  const copyRoomLink = async () => {
    const baseUrl = import.meta.env.DEV
      ? (import.meta.env.VITE_DEV_HOST || window.location.origin)
      : import.meta.env.VITE_BASE_URL;
    const link = `${baseUrl}/#/?join=${roomId}`;

    // Copiar al portapapeles
    navigator.clipboard.writeText(link);
    if (navigator.vibrate) navigator.vibrate(30);

    // Abrir el modal nativo de compartir si está disponible
    if (navigator.share) {
      try {
        await navigator.share({
          title: "🕵️‍♂️ Impostor Word",
          text: `¡Únete a mi partida de Impostor Word!`,
          url: link
        });
      } catch (err) {
        // Usuario canceló el compartir o hubo un error
        console.log("Compartir cancelado o error:", err);
      }
    } else {
      // Fallback: mostrar alerta si el navegador no soporta Web Share API
      alert(`Link copiado: ${link}`);
    }
  };

  const handleKickPlayer = async (playerId, playerName) => {
    if (!isAdmin) {
      toast.error("Solo el administrador puede eliminar jugadores");
      return;
    }

    if (playerId === myId) {
      toast.error("No puedes eliminarte a ti mismo");
      return;
    }

    try {
      await api.post(`/rooms/${roomId}/kick`, { playerId });
      toast.success(`${playerName} fue eliminado de la sala`);
      if (navigator.vibrate) navigator.vibrate(50);
    } catch (err) {
      console.error("Error al eliminar jugador:", err);
      toast.error("Error al eliminar el jugador");
    }
  };

  const handleCancelVote = async () => {
    try {
      await api.post(`/rooms/${roomId}/cancel_vote`);
      toast.success("Votación cancelada");
      if (navigator.vibrate) navigator.vibrate(50);
    } catch (err) {
      console.error("Error al cancelar votación:", err);
      toast.error(err.response?.data?.error || "Error al cancelar la votación");
    }
  };

  // ===== FUNCIONES DE VOZ =====

  // Limpiar recursos de voz
  const cleanupVoice = () => {
    console.log("🧹 Limpiando recursos de voz...");

    // Limpiar retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Detener intervalo de nivel de audio
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }

    // Cerrar peer (esto cierra todas las conexiones automáticamente)
    if (peerRef.current) {
      closePeer();
      peerRef.current = null;
    }

    // Detener micrófono
    if (localStreamRef.current) {
      voiceChat.stopMicrophone();
      localStreamRef.current = null;
    }

    // Limpiar referencias
    peerConnectionsRef.current = {};
    retryCountRef.current = 0;

    // Resetear estados
    setVoiceEnabled(false);
    setMicMuted(false);
    setSpeakersMuted(false);
    setIsConnectingMic(false);
    setVoiceStatus('disconnected');
    setAudioLevel(0);
    setSpeakersData({});
    setVoicePeerId(null);
  };

  // Manejar mensajes de otros peers (niveles de audio)
  const handlePeerMessage = (_senderId, data) => {
    if (data.type === 'audioLevel' && data.playerId) {
      // Usar playerId del mensaje (player ID de la sala), no senderId (peer ID)
      setSpeakersData(prev => ({
        ...prev,
        [data.playerId]: {
          isSpeaking: data.isSpeaking,
          audioLevel: data.level
        }
      }));
    }
  };

  // Inicializar peer (host o cliente) con retry automático
  const initializeVoicePeer = async (retryAttempt = 0) => {
    try {
      setVoiceStatus('connecting');
      retryCountRef.current = retryAttempt;

      if (!localStreamRef.current) {
        throw new Error("No hay stream de audio local");
      }

      if (isAdmin) {
        // Admin: crear peer host
        console.log("🎤 Inicializando como HOST...");
        const peerId = await createHostPeer(
          (senderId, data) => handlePeerMessage(senderId, data),
          localStreamRef.current
        );
        setVoicePeerId(peerId);
        setVoiceHostId(peerId);
        peerRef.current = peerId;

        // Enviar el peer ID al servidor para que otros jugadores puedan conectarse
        await api.post(`/rooms/${roomId}/voice_host`, { peerId });

        console.log("✅ Host peer creado:", peerId);
      } else {
        // Jugador: conectar al host
        console.log("🎤 Inicializando como CLIENTE...");

        // Obtener el peer ID del host desde el servidor
        const response = await api.get(`/rooms/${roomId}/voice_host`);
        const hostPeerId = response.data.hostPeerId;

        if (!hostPeerId) {
          throw new Error("El host no ha activado el chat de voz");
        }

        setVoiceHostId(hostPeerId);

        // Conectar al host
        await connectToHost(
          hostPeerId,
          (data) => handlePeerMessage(hostPeerId, data),
          localStreamRef.current
        );

        console.log("✅ Conectado al host:", hostPeerId);
      }

      setVoiceStatus('connected');
      retryCountRef.current = 0; // Reset contador al conectar exitosamente
    } catch (error) {
      console.error(`❌ Error al inicializar peer (intento ${retryAttempt + 1}):`, error);
      setVoiceStatus('error');

      // Retry automático hasta 5 intentos
      if (retryAttempt < 5) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryAttempt), 10000); // Exponential backoff
        console.log(`🔄 Reintentando en ${retryDelay / 1000}s...`);

        retryTimeoutRef.current = setTimeout(() => {
          initializeVoicePeer(retryAttempt + 1);
        }, retryDelay);
      } else {
        toast.error("No se pudo conectar al chat de voz después de varios intentos");
        throw error;
      }
    }
  };

  // Inicializar voz automáticamente cuando hay 2+ jugadores
  useEffect(() => {
    if (voiceEnabled) return; // Ya está activado
    if (totalPlayers < 2) return; // Necesita 2+ jugadores

    // Auto-inicializar
    const initVoice = async () => {
      try {
        setIsConnectingMic(true);

        // 1. Inicializar micrófono
        const stream = await voiceChat.initMicrophone();
        localStreamRef.current = stream;

        // 2. Inicializar peer con retry automático
        await initializeVoicePeer(0);

        // 3. Comenzar a monitorear el nivel de audio
        audioLevelIntervalRef.current = setInterval(() => {
          const level = voiceChat.getAudioLevel();
          const speaking = voiceChat.isSpeaking(15);
          setAudioLevel(level);

          // Enviar nivel de audio a otros peers
          if (peerRef.current && myId) {
            const message = {
              type: 'audioLevel',
              playerId: myId, // IMPORTANTE: Enviar el player ID, no el peer ID
              level: level,
              isSpeaking: speaking
            };

            if (isAdmin) {
              broadcastMessage(message);
            } else {
              sendMessage(message);
            }
          }
        }, 100); // Actualizar cada 100ms

        setVoiceEnabled(true);
        console.log("✅ Chat de voz activado automáticamente");
      } catch (error) {
        console.error("Error al auto-inicializar voz:", error);
        if (!retryTimeoutRef.current) {
          cleanupVoice();
        }
      } finally {
        setIsConnectingMic(false);
      }
    };

    initVoice();
  }, [isAdmin, totalPlayers, voiceEnabled]);

  // Toggle mute micrófono (sin desconectar)
  const handleToggleMuteMic = () => {
    if (!voiceEnabled) return;

    const newMutedState = !micMuted;
    setMicMuted(newMutedState);
    setLocalMuted(newMutedState);

    toast.success(newMutedState ? "Micrófono silenciado" : "Micrófono activado");
  };

  // Toggle mute speakers (sin desconectar)
  const handleToggleMuteSpeakers = () => {
    if (!voiceEnabled) return;

    const newMutedState = !speakersMuted;
    setSpeakersMuted(newMutedState);
    setSpeakersMutedP2P(newMutedState); // Llamar a la función de p2p

    toast.success(newMutedState ? "Audio silenciado" : "Audio activado");
  };

  // Efecto: Detectar cambio de admin y transferir host
  useEffect(() => {
    if (!voiceEnabled || !voiceHostId) return;

    // Si el admin actual no está en la sala, necesitamos transferir
    const adminPlayer = Object.entries(players).find(([, p]) => p.isAdmin);
    const newAdminId = adminPlayer?.[0];

    if (!newAdminId) return;

    // Si cambió el admin y yo soy el nuevo admin
    if (newAdminId === myId && !isAdmin) {
      console.log("🔄 Transferencia de admin detectada. Convirtiéndome en host...");

      // Limpiar conexión anterior
      cleanupVoice();

      // El auto-connect se encargará de reinicializar
    }
  }, [isAdmin, myId, players, voiceEnabled, voiceHostId]);

  // Efecto: Cleanup al desmontar componente o salir de la sala
  useEffect(() => {
    return () => {
      cleanupVoice();
    };
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 pt-20">
        <h1 className="text-2xl font-bold mb-4 text-red-400">❌ {error}</h1>
        <button onClick={() => navigate("/")} className="bg-white/20 px-6 py-3 rounded-lg hover:bg-white/30 transition-all">
          🔙 Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Barra de redes sociales - Arriba del header */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-gray-900/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-1.5 flex items-center justify-between">
          {/* Enlaces de feedback - Izquierda */}
          <div className="flex items-center gap-4">
            {/* Insultos - Instagram */}
            <a
              href="https://www.instagram.com/impostorword"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all hover:scale-110 active:scale-95 flex items-center gap-1.5"
              title="@impostorword"
            >
              <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span className="text-xs text-purple-400">Insultos</span>
            </a>

            {/* Halagos - TikTok */}
            <a
              href="https://www.tiktok.com/@impostorword.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all hover:scale-110 active:scale-95 flex items-center gap-1.5"
              title="@impostorword.com"
            >
              <svg className="w-4 h-4 text-rose-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
              <span className="text-xs text-rose-400">Halagos</span>
            </a>
          </div>

          {/* Versión - Derecha */}
          <div className="text-[10px] text-gray-500">
            <span>Alpha 1.2.2</span>
          </div>
        </div>
      </div>

      <AppHeader />

      {/* Bottom bar con código de room y botón salir */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-sm border-t border-gray-800 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Código del room - clickeable para copiar */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(roomId);
              toast.success("¡Código copiado!");
              if (navigator.vibrate) navigator.vibrate(30);
            }}
            className="flex items-center gap-2 hover:bg-white/5 px-3 py-2 rounded-lg transition-all group cursor-pointer"
            title="Click para copiar código"
          >
            <p className="text-xs text-gray-400">Sala:</p>
            <p className="text-amber-400 font-mono text-lg font-bold tracking-wider">{roomId}</p>
            <Copy size={16} className="text-gray-400 group-hover:text-amber-400 transition-colors" />
          </button>

          {/* Botón salir */}
          <button
            onClick={() => navigate('/')}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 text-sm font-medium"
          >
            <span>✕</span>
            <span>Salir</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 pt-24 pb-24 text-center">
        <div className="max-w-md w-full space-y-6">

        {/* Banner Publicitario - Top */}
        {roomStatus !== 'GAME_OVER' && (
          <div className="flex justify-center">
            <AdPlaceholder isPremium={isPremium} format="horizontal" />
          </div>
        )}

        {/* Mostrar siempre quién inicia (oculto durante votación) */}
        {starterName && roomStatus !== 'GAME_OVER' && (
          <div data-tutorial="starter-name" className="relative bg-gradient-to-br from-amber-500/20 to-orange-500/20 px-4 py-3 rounded-xl border border-amber-500/40 shadow-lg">
            {/* Badge de ronda en esquina superior derecha */}
            <div className="absolute top-2 right-2">
              <p className="text-[10px] text-amber-200/80 font-bold">Ronda {currentRound}</p>
            </div>

            <p className="text-xs text-amber-300 mb-2 text-center font-semibold">Jugador que Inicia</p>
            {countdownActive || starterName === previousStarterName ? (
              // Skeleton durante el countdown
              <div className="flex items-center justify-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-amber-400/30"></div>
                <p className="text-lg font-bold text-amber-400/30">Loading...</p>
              </div>
            ) : (
              // Mostrar nombre y foto
              <div className="flex items-center justify-center gap-3">
                {/* Foto de perfil del jugador que inicia */}
                {(() => {
                  const starterPlayer = Object.entries(players).find(([, p]) => p.name === starterName);
                  const starterProfilePic = starterPlayer?.[1]?.profilePicture;

                  return starterProfilePic ? (
                    <img
                      src={starterProfilePic}
                      alt={starterName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow-md"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-md border-2 border-amber-400">
                      {starterName.charAt(0).toUpperCase()}
                    </div>
                  );
                })()}

                <div className="flex flex-col items-start">
                  <p className="text-lg font-bold text-amber-400">
                    {starterName}
                  </p>
                  {myId && players[myId] && players[myId].name === starterName && (
                    <span className="text-amber-300 text-xs">(tú)</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mostrar countdown si está activo */}
        {(countdown !== null && countdown > 0) ? (
          <div className="bg-gradient-to-br from-orange-600/30 to-red-600/30 p-8 rounded-2xl border-2 border-orange-500/50 shadow-[0_0_40px_rgba(251,146,60,0.5)] animate-pulse min-h-[180px] flex flex-col justify-center items-center">
            <p className="text-sm text-orange-300 mb-2">⏳ Inicia en:</p>
            <h1 className="text-5xl font-bold text-white mb-2">{countdown}</h1>
            <p className="text-xs text-gray-300">Todos se actualizarán al mismo tiempo</p>
          </div>
        ) : roomStatus !== 'GAME_OVER' && roomStatus !== 'VOTING' && roomStatus !== 'RESULTS' && (
          <div
            data-tutorial="word-card"
            className="relative bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/40 shadow-lg transition-all p-6"
          >
            {/* Botón para ocultar/mostrar palabra en esquina superior derecha */}
            <button
              data-tutorial="hide-word"
              onClick={() => setWordHidden(!wordHidden)}
              className="absolute bg-purple-500/30 hover:bg-purple-500/50 rounded-full transition-all text-white top-3 right-3 p-2"
              title={wordHidden ? "Mostrar palabra" : "Ocultar palabra"}
            >
              {wordHidden ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>

            {/* Vista normal */}
            <div className="text-center">
              <p className="text-xs text-purple-300 mb-3 font-semibold">{modeType === 'image' ? 'Tu imagen es:' : 'Tu palabra es:'}</p>
              {wordHidden ? (
                <h1 className="text-5xl font-bold text-white mb-2">***</h1>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  {itemImageUrl && word !== "???" && (
                    <img
                      src={buildImageUrl(itemImageUrl)}
                      alt={word}
                      className="max-h-48 max-w-full object-contain rounded-xl border-2 border-purple-400 shadow-lg"
                    />
                  )}
                  {(modeType !== 'image' || !itemImageUrl || word === "???") && (
                    <h1 className="text-5xl font-bold text-white">
                      {word || "..."}
                    </h1>
                  )}
                </div>
              )}
              {!wordHidden && word === "???" && (
                <div className="mt-3 bg-amber-500/20 px-4 py-2 rounded-lg border border-amber-500/40 inline-block">
                  <p className="text-amber-400 text-sm font-semibold animate-pulse">
                    🕵️ ¡Eres el impostor!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Panel de game over */}
        {roomStatus === 'GAME_OVER' && (
          <GameOverPanel
            roomState={{
              winner,
              winReason,
              players,
              impostorId,
              isAdmin,
            }}
            roomId={roomId}
            myId={myId}
            onRestart={handleRestart}
            isPremium={isPremium}
          />
        )}

        {/* Panel de votación cuando hay votación activa (VOTING o RESULTS) */}
        {(roomStatus === 'VOTING' || roomStatus === 'RESULTS') && (
          <VotingPanel
            roomState={{
              status: roomStatus,
              players,
              votesTally,
              votersRemaining,
              eliminatedPlayerId,
              isAdmin,
            }}
            roomId={roomId}
            myId={myId}
            word={word}
            wordHidden={wordHidden}
            setWordHidden={setWordHidden}
            modeType={modeType}
            itemImageUrl={itemImageUrl}
            onUpdate={() => {
              setCurrentRound((prev) => prev);
            }}
          />
        )}

        {/* Grid de usuarios e invitación (ocultos en game over) */}
        {roomStatus !== 'GAME_OVER' && (
        <div className="w-full relative">
          {/* Layout común: Grid de usuarios (70%) + Columna de botones (30%) */}
          <div className="flex gap-3">
            {/* Grid de usuarios colapsable */}
            <div className={`flex-[0.7] bg-gray-800/50 rounded-lg border border-gray-700/50 ${showPlayersGrid ? 'overflow-visible' : 'overflow-hidden'}`}>
              {/* Header del grid con toggle */}
              <button
                onClick={() => setShowPlayersGrid(!showPlayersGrid)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700/30 transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">👥 Jugadores</span>
                  <span className="bg-purple-500/30 text-purple-300 text-xs px-2 py-0.5 rounded-full font-bold">{totalPlayers}</span>
                </div>
                <span className="text-gray-400">
                  {showPlayersGrid ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </button>

              {/* Grid de avatares de jugadores */}
              <div className="p-4 pt-0">
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(players).slice(0, showPlayersGrid ? 5 : 3).map(([playerId, player]) => (
                      <div
                        key={playerId}
                        className="relative flex flex-col items-center gap-1"
                        title={player.name}
                      >
                        {/* Coronita para el admin */}
                        {player.isAdmin && (
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
                            <Crown size={14} className="text-amber-400 fill-amber-400" />
                          </div>
                        )}

                        {/* Botón de configuración superpuesto al avatar (solo para otros jugadores) */}
                        {playerId !== myId && (
                          <div className="absolute right-[15px] z-20 player-menu-container">
                            <button
                              onClick={() => setPlayerMenuOpen(playerMenuOpen === playerId ? null : playerId)}
                              className="bg-gray-900/80 hover:bg-gray-800 rounded-full p-1 text-gray-300 hover:text-white transition-colors shadow-lg"
                            >
                              <MoreVertical size={14} />
                            </button>

                            {/* Menú desplegable */}
                            {playerMenuOpen === playerId && (
                              <div className="absolute top-full mt-1 right-0 bg-gray-900 rounded-lg border border-gray-700 shadow-xl z-50 min-w-[140px] overflow-hidden">
                                {/* Opción: Eliminar jugador (solo admin) */}
                                <button
                                  onClick={() => {
                                    if (isAdmin) {
                                      handleKickPlayer(playerId, player.name);
                                      setPlayerMenuOpen(null);
                                    }
                                  }}
                                  disabled={!isAdmin}
                                  className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                                    isAdmin
                                      ? 'text-red-400 hover:bg-red-500/20 cursor-pointer'
                                      : 'text-gray-600 cursor-not-allowed'
                                  }`}
                                  title={!isAdmin ? 'Solo el admin puede eliminar jugadores' : ''}
                                >
                                  <UserMinus size={14} />
                                  <span>Eliminar</span>
                                </button>

                                {/* Opción: Añadir a amigos (deshabilitado) */}
                                <button
                                  disabled
                                  className="w-full px-3 py-2 text-left text-sm text-gray-500 cursor-not-allowed flex flex-col gap-1"
                                  title="Próximamente"
                                >
                                  <div className="flex items-center gap-2">
                                    <UserCheck size={14} />
                                    <span>Añadir amigo</span>
                                  </div>
                                  <span className="text-[9px] text-gray-600 italic">Próximamente</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Avatar */}
                        <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br ${
                          playerId === myId
                            ? 'from-amber-500 to-orange-600 ring-2 ring-amber-400'
                            : 'from-purple-500 to-pink-600'
                        } flex items-center justify-center text-white font-bold text-base shadow-lg`}>
                          {player.name ? player.name.charAt(0).toUpperCase() : '?'}

                          {/* Badge de voz */}
                          {voiceEnabled && (
                            <VoiceParticipant
                              isSpeaking={speakersData[playerId]?.isSpeaking || (playerId === myId && voiceChat.isSpeaking(15))}
                              micEnabled={playerId === myId ? voiceEnabled : speakersData[playerId]?.audioLevel > 0}
                              audioLevel={playerId === myId ? audioLevel : (speakersData[playerId]?.audioLevel || 0)}
                              position="bottom-right"
                            />
                          )}
                        </div>

                        {/* Nombre */}
                        <span className="text-[10px] text-gray-300 truncate w-full text-center">
                          {player.name.split(' ')[0]}
                          {playerId === myId && <span className="text-amber-400"> (tú)</span>}
                        </span>
                      </div>
                    ))}

                    {/* Burbuja de Añadir amigos */}
                    <div className="relative flex flex-col items-center gap-1 player-menu-container" ref={addButtonRef}>
                      <button
                        data-tutorial="add-friends-button"
                        onClick={() => setShowInviteOptions(!showInviteOptions)}
                        className="w-12 h-12 rounded-full bg-gray-800/50 border-2 border-dashed border-gray-600 hover:border-purple-500 hover:bg-gray-700/50 flex items-center justify-center text-gray-400 hover:text-white shadow-lg transition-all active:scale-95 relative"
                      >
                        <UserPlus size={20} className="absolute" />
                      </button>

                      <span className="text-[10px] text-gray-300 text-center">
                        Añadir
                      </span>

                      {/* Menú desplegable de opciones de invitación */}
                      {showInviteOptions && (
                        <div className={`absolute left-1/2 -translate-x-1/2 bg-gray-900 rounded-lg border border-gray-700 shadow-xl z-50 min-w-[120px] overflow-hidden ${
                          inviteMenuPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
                        }`}>
                          {/* Opción: Compartir link */}
                          <button
                            data-tutorial="share-button"
                            onClick={() => {
                              copyRoomLink();
                              setShowInviteOptions(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                          >
                            <Share2 size={14} />
                            <span>Compartir</span>
                          </button>

                          {/* Opción: Mostrar QR */}
                          <button
                            data-tutorial="qr-button"
                            onClick={() => {
                              setShowQRModal(true);
                              setShowInviteOptions(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-purple-400 hover:bg-purple-500/20 transition-colors flex items-center gap-2"
                          >
                            <QrCode size={14} />
                            <span>QR</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
            </div>

            {/* Columna de botones (30%) */}
            <div className="flex-[0.3] flex flex-col gap-3">
              {isAdmin ? (
                // Admin: Siguiente palabra arriba (80%) + Votación abajo (20%)
                <>
                  {/* Botón Siguiente palabra (80% del alto) */}
                  <button
                    data-tutorial="restart-button"
                    onClick={handleRestart}
                    disabled={loading || countdown !== null}
                    className="flex-[0.8] bg-emerald-500 px-3 py-6 rounded-lg font-semibold hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-2"
                  >
                    <Play size={32} fill="white" />
                    <span className="text-xs text-center leading-tight">{loading ? "Cargando..." : countdown !== null ? "⏳ Esperando..." : "Siguiente palabra"}</span>
                  </button>

                  {/* Botón Llamar a Votación / Cancelar votación (20% del alto) */}
                  <div className="flex-[0.2]">
                    {roomStatus === 'IN_GAME' ? (
                      <VotingPanel
                        roomState={{
                          status: roomStatus,
                          players,
                          votesTally,
                          votersRemaining,
                          eliminatedPlayerId,
                          isAdmin,
                        }}
                        roomId={roomId}
                        myId={myId}
                        onUpdate={() => {
                          setCurrentRound((prev) => prev);
                        }}
                      />
                    ) : (
                      <button
                        onClick={handleCancelVote}
                        className="w-full h-full bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg font-semibold transition-all active:scale-95 flex items-center justify-center gap-1"
                      >
                        <PhoneOff size={16} />
                        <span className="text-[10px]">Cancelar</span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                // Jugador: Solo botón de votación (100% del alto)
                <div className="flex-1 h-full flex flex-col">
                  {roomStatus === 'IN_GAME' ? (
                    <VotingPanel
                      roomState={{
                        status: roomStatus,
                        players,
                        votesTally,
                        votersRemaining,
                        eliminatedPlayerId,
                        isAdmin,
                      }}
                      roomId={roomId}
                      myId={myId}
                      onUpdate={() => {
                        setCurrentRound((prev) => prev);
                      }}
                    />
                  ) : (
                    <button
                      onClick={handleCancelVote}
                      className="w-full h-full bg-red-500 hover:bg-red-600 px-6 py-3 rounded-xl font-semibold transition-all active:scale-95 flex flex-col items-center justify-center gap-2"
                    >
                      <PhoneOff size={28} />
                      <span className="text-sm">Cancelar votación</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Panel de control de voz (solo mostrar cuando no hay votación activa) */}
        {roomStatus !== 'GAME_OVER' && roomStatus !== 'VOTING' && roomStatus !== 'RESULTS' && (
          <VoicePanel
            voiceEnabled={voiceEnabled}
            micMuted={micMuted}
            speakersMuted={speakersMuted}
            onToggleMuteMic={handleToggleMuteMic}
            onToggleMuteSpeakers={handleToggleMuteSpeakers}
            audioLevel={micMuted ? 0 : audioLevel}
            isConnecting={isConnectingMic}
            voiceStatus={voiceStatus}
            speakersData={speakersData}
            players={players}
            myId={myId}
          />
        )}

        {/* Banner Publicitario - Bottom */}
        {roomStatus !== 'GAME_OVER' && (
          <div className="flex justify-center">
            <AdPlaceholder isPremium={isPremium} format="horizontal" />
          </div>
        )}
      </div>

      {/* Modal de QR */}
      {showQRModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50"
          onClick={() => setShowQRModal(false)}
        >
          <div
            className="relative bg-gray-900 rounded-2xl p-6 max-w-sm w-full border-2 border-purple-500/50 shadow-[0_0_40px_rgba(168,85,247,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón cerrar flotante */}
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-3 right-3 bg-gray-800 hover:bg-gray-700 rounded-full p-2 transition-all active:scale-95"
            >
              <X size={16} className="text-gray-400 hover:text-white" />
            </button>

            <h2 className="text-xl font-bold text-center mb-1">Impostor Word</h2>
            <p className="text-xs text-gray-400 text-center mb-4">Escanea para unirte</p>

            <div className="flex justify-center mb-4">
              <div className="bg-gray-800 p-4 rounded-xl inline-block border border-purple-500/30">
                <QRCodeCanvas
                  value={`${import.meta.env.DEV ? (import.meta.env.VITE_DEV_HOST || window.location.origin) : import.meta.env.VITE_BASE_URL}/#/?join=${roomId}`}
                  size={200}
                  bgColor="#1f2937"
                  fgColor="#c084fc"
                  level="H"
                />
              </div>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(roomId);
                toast.success("¡Código copiado!");
                if (navigator.vibrate) navigator.vibrate(30);
              }}
              className="w-full bg-purple-500/20 px-4 py-2 rounded-lg border border-purple-500/50 hover:bg-purple-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <div className="flex flex-col items-center flex-1">
                <p className="text-[10px] text-purple-300">Código de sala:</p>
                <p className="text-purple-400 font-mono text-2xl font-bold tracking-widest">{roomId}</p>
              </div>
              <Copy size={18} className="text-purple-400" />
            </button>
          </div>
        </div>
      )}

      {/* Tutorial */}
      <Joyride
        steps={tutorialStepsRoom}
        run={runRoom}
        continuous
        showProgress={false}
        showSkipButton
        callback={(data) => {
          const { status } = data;

          if (status === "finished" || status === "skipped") {
            stopRoomTutorial();
          }
        }}
        styles={{
          options: {
            primaryColor: "#10b981",
            backgroundColor: "#1f2937",
            textColor: "#ffffff",
            overlayColor: "rgba(0, 0, 0, 0.85)",
            arrowColor: "#1f2937",
            zIndex: 1000,
          },
          tooltip: {
            borderRadius: 16,
            padding: 24,
            fontSize: 15,
            lineHeight: 1.6,
          },
          tooltipTitle: {
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 8,
          },
          tooltipContent: {
            padding: "12px 0",
          },
          buttonNext: {
            backgroundColor: "#10b981",
            borderRadius: 10,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
          },
          buttonBack: {
            color: "#9ca3af",
            marginRight: 12,
            fontSize: 14,
          },
          buttonSkip: {
            color: "#ef4444",
            fontSize: 13,
          },
        }}
        locale={{
          back: "Atrás",
          close: "Cerrar",
          last: "Finalizar",
          next: "Siguiente",
          skip: "Saltar tutorial",
        }}
      />

      {/* Botón flotante para reiniciar tutorial */}
      {/* <TutorialButton isRoom={true} /> */}

      {/* Viñeta Intersticial */}
      {showRestartInterstitial && (
        <InterstitialAd
          isPremium={isPremium}
          isRoomPremium={isRoomPremium}
          onClose={handleRestartInterstitialClose}
        />
      )}
      </div>
    </>
  );
}

