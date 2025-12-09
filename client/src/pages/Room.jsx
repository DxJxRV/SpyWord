import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { Eye, EyeOff, Share2, QrCode, RotateCw } from "lucide-react";
import { api } from "../services/api";
import { toast } from "sonner";
import Joyride from "react-joyride";
import { useTutorial } from "../contexts/TutorialContext";
import { tutorialStepsRoom } from "../data/tutorialSteps";
import TutorialButton from "../components/TutorialButton";
import VotingPanel from "../components/VotingPanel";

export default function Room() {
  const { roomId } = useParams(); // Solo necesitamos roomId
  const navigate = useNavigate();
  const { runRoom, startRoomTutorial, stopRoomTutorial, dontShowRoomTutorial } = useTutorial();
  const [word, setWord] = useState("");
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
  const [dontShowAgainChecked, setDontShowAgainChecked] = useState(false); // Checkbox del tutorial
  const nextRoundTimestamp = useRef(null); // Guardar el timestamp original

  // Estados para votación
  const [roomStatus, setRoomStatus] = useState("IN_GAME"); // Estado de la sala: IN_GAME, VOTING, RESULTS
  const [players, setPlayers] = useState({}); // Objeto con datos de jugadores {id: {name, isAlive, hasVoted}}
  const [votesTally, setVotesTally] = useState({}); // Conteo de votos {playerId: count}
  const [votersRemaining, setVotersRemaining] = useState(0); // Cuántos jugadores faltan por votar
  const [eliminatedPlayerId, setEliminatedPlayerId] = useState(null); // ID del jugador eliminado
  const [myId, setMyId] = useState(null); // ID del jugador actual

  // Referencia para rastrear IDs de jugadores previos
  const previousPlayerIds = useRef(new Set());

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

  // Iniciar tutorial automáticamente al entrar a la sala
  useEffect(() => {
    if (!dontShowRoomTutorial) {
      setTimeout(() => {
        startRoomTutorial();
      }, 1000);
    }
  }, [dontShowRoomTutorial, startRoomTutorial]);

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

  const handleRestart = async () => {
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 pt-20 text-center">
      <h2 className="text-3xl font-bold text-center mb-10">Impostor<br/>Word 🕵️‍♂️</h2>
      <div className="max-w-md w-full space-y-6">
        
        <div data-tutorial="room-info" className="bg-blue-500/20 px-4 py-2 rounded-lg border border-blue-500/30">
          <p className="text-xs text-gray-400">Ronda {currentRound} • {totalPlayers} jugadores</p>
        </div>

        {/* Mostrar siempre quién inicia (oculto durante votación) */}
        {starterName && roomStatus !== 'VOTING' && (
          <div data-tutorial="starter-name" className="bg-amber-500/20 px-4 py-2 rounded-lg border border-amber-500/30">
            <p className="text-xs text-amber-300 mb-1">Jugador que Inicia</p>
            {countdownActive || starterName === previousStarterName ? (
              // Skeleton durante el countdown - letras grises pulsantes
              <p className="text-lg font-bold text-amber-400 animate-pulse">
                <span className=" text-amber-400/30">Loading...</span>
              </p>
            ) : (
              // Mostrar nombre
              <p className="text-lg font-bold text-amber-400">{starterName}</p>
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
        ) : (
          <div
            data-tutorial="word-card"
            className={`relative bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl border-2 border-purple-500/50 transition-all ${
              roomStatus === 'VOTING'
                ? 'p-3 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                : 'p-8 shadow-[0_0_30px_rgba(168,85,247,0.4)]'
            }`}
          >
            {/* Botón para ocultar/mostrar palabra en esquina superior derecha */}
            <button
              data-tutorial="hide-word"
              onClick={() => setWordHidden(!wordHidden)}
              className={`absolute bg-purple-500/50 hover:bg-purple-600 rounded-lg transition-all font-semibold text-white ${
                roomStatus === 'VOTING'
                  ? 'top-2 right-2 px-2 py-1 text-xs'
                  : 'top-4 right-4 px-3 py-2 text-sm'
              }`}
              title={wordHidden ? "Mostrar palabra" : "Ocultar palabra"}
            >
              {wordHidden ? <EyeOff size={roomStatus === 'VOTING' ? 16 : 20} /> : <Eye size={roomStatus === 'VOTING' ? 16 : 20} />}
            </button>

            {roomStatus === 'VOTING' ? (
              // Vista colapsada durante votación
              <div className="flex items-center justify-center gap-2">
                <p className="text-xs text-purple-300">Tu palabra:</p>
                <h1 className="text-xl font-bold text-white">
                  {wordHidden ? "***" : word || "..."}
                </h1>
                {!wordHidden && word === "???" && (
                  <span className="text-amber-400 text-xs font-semibold">🕵️</span>
                )}
              </div>
            ) : (
              // Vista normal
              <>
                <p className="text-sm text-purple-300 mb-2">Tu palabra es:</p>
                <h1 className="text-5xl font-bold text-white mb-2">
                  {wordHidden ? "***" : word || "..."}
                </h1>
                {!wordHidden && word === "???" && (
                  <p className="text-amber-400 text-sm font-semibold animate-pulse">
                    🕵️ ¡Eres el impostor!
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Panel de votación */}
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
            // Forzar una actualización del polling
            setCurrentRound((prev) => prev);
          }}
        />

        <div className="w-full">
          {isAdmin ? (
            // Layout para admin: botón grande a la izquierda, QR y Compartir a la derecha
            <div className="grid grid-cols-3 grid-rows-2 gap-3">
              {/* Botón Volver a jugar (admin) - ocupa 1-2 horizontal, 1-2 vertical */}
              <button
                data-tutorial="restart-button"
                onClick={handleRestart}
                disabled={loading || countdown !== null}
                className="col-span-2 row-span-2 bg-emerald-500 px-4 py-6 rounded-lg font-semibold hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-3"
              >
                <RotateCw size={40} />
                <span className="text-sm">{loading ? "Reiniciando..." : countdown !== null ? "⏳ Esperando..." : "Volver a jugar"}</span>
              </button>

              {/* Botón Compartir link - 3 horizontal, 1 vertical */}
              <button data-tutorial="share-button" onClick={copyRoomLink} className="bg-blue-500/80 px-4 py-3 rounded-lg font-semibold hover:bg-blue-600 active:scale-95 transition-all flex flex-col items-center justify-center gap-2">
                <Share2 size={24} />
                <span className="text-xs">Compartir</span>
              </button>

              {/* Botón QR - 3 horizontal, 2 vertical */}
              <button data-tutorial="qr-button" onClick={() => setShowQRModal(true)} className="bg-purple-500/80 px-4 py-3 rounded-lg font-semibold hover:bg-purple-600 active:scale-95 transition-all flex flex-col items-center justify-center gap-2">
                <QrCode size={24} />
                <span className="text-xs">QR</span>
              </button>
            </div>
          ) : (
            // Layout para jugadores: QR y Compartir del mismo tamaño, cada uno ocupa mitad
            <div className="grid grid-cols-2 gap-3">
              <button onClick={copyRoomLink} className="bg-blue-500/80 px-4 py-4 rounded-lg font-semibold hover:bg-blue-600 active:scale-95 transition-all flex flex-col items-center justify-center gap-2">
                <Share2 size={28} />
                <span className="text-sm">Compartir</span>
              </button>

              <button onClick={() => setShowQRModal(true)} className="bg-purple-500/80 px-4 py-4 rounded-lg font-semibold hover:bg-purple-600 active:scale-95 transition-all flex flex-col items-center justify-center gap-2">
                <QrCode size={28} />
                <span className="text-sm">QR</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de QR */}
      {showQRModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50"
          onClick={() => setShowQRModal(false)}
        >
          <div
            className="bg-gray-900 rounded-2xl p-8 max-w-sm w-full border-2 border-purple-500/50 shadow-[0_0_40px_rgba(168,85,247,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-center mb-2">Impostor<br/>Word 🕵️‍♂️</h2>
            <p className="text-sm text-gray-400 text-center mb-6">Escanea para unirte</p>

            <div className="bg-white p-6 rounded-xl mb-6">
              <QRCodeCanvas
                value={`${import.meta.env.DEV ? (import.meta.env.VITE_DEV_HOST || window.location.origin) : import.meta.env.VITE_BASE_URL}/#/?join=${roomId}`}
                size={240}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
              />
            </div>

            <div className="bg-purple-500/20 px-6 py-3 rounded-lg border-2 border-purple-500/50 mb-6">
              <p className="text-xs text-purple-300 mb-1 text-center">Código de sala:</p>
              <p className="text-purple-400 font-mono text-3xl font-bold tracking-widest text-center">{roomId}</p>
            </div>

            <button
              onClick={() => setShowQRModal(false)}
              className="w-full bg-white/20 px-4 py-3 rounded-lg font-semibold hover:bg-white/30 active:scale-95 transition-all"
            >
              ✕ Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Tutorial */}
      <Joyride
        steps={tutorialStepsRoom.map((step, idx) => {
          // Si es el último step, agregar checkbox
          if (idx === tutorialStepsRoom.length - 1) {
            return {
              ...step,
              content: (
                <div>
                  <p style={{ marginBottom: '16px' }}>{step.content}</p>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={dontShowAgainChecked}
                      onChange={(e) => setDontShowAgainChecked(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>No volver a mostrar este tutorial automáticamente</span>
                  </label>
                </div>
              )
            };
          }
          return step;
        })}
        run={runRoom}
        continuous
        showProgress={false}
        showSkipButton
        callback={(data) => {
          const { status } = data;

          if (status === "finished") {
            // Usar el valor del checkbox cuando se termina normalmente
            stopRoomTutorial(dontShowAgainChecked);
            // Resetear el checkbox para la próxima vez
            setDontShowAgainChecked(false);
          } else if (status === "skipped") {
            // Si se salta, siempre marcar como "no volver a mostrar"
            stopRoomTutorial(true);
            setDontShowAgainChecked(false);
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
      <TutorialButton isRoom={true} />
    </div>
  );
}

