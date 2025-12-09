import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { api } from "../services/api";
import Joyride from "react-joyride";
import { useTutorial } from "../contexts/TutorialContext";
import { tutorialStepsHome } from "../data/tutorialSteps";
import TutorialButton from "../components/TutorialButton";
import UserNameBar from "../components/UserNameBar";
import { getUserName } from "../utils/nameGenerator";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { run, stopTutorial } = useTutorial();
  const [mode, setMode] = useState(null);
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [dontShowAgainChecked, setDontShowAgainChecked] = useState(false); // Checkbox del tutorial

  // Detectar si viene de un link compartido con parámetro ?join=CODIGO
  useEffect(() => {
    // Con hash routing, los parámetros están en location.hash, no en location.search
    const hash = location.hash; // Ej: "#/?join=8EBIRH"
    const queryStart = hash.indexOf('?');

    if (queryStart !== -1) {
      const queryString = hash.substring(queryStart + 1); // "join=8EBIRH"
      const searchParams = new URLSearchParams(queryString);
      const joinCode = searchParams.get('join');

      if (joinCode) {
        // Intentar unirse automáticamente
        const autoJoin = async () => {
          const roomId = joinCode.trim().toUpperCase();
          setLoading(true);
          try {
            const playerName = getUserName();
            await api.post(`/rooms/${roomId}/join`, { playerName });
            toast.success("¡Te uniste a la sala!");
            navigate(`/room/${roomId}`);
            if (navigator.vibrate) navigator.vibrate(40);
          } catch (error) {
            console.error("Error al unirse:", error);
            toast.error("No se pudo unir a la sala. Verifica el código.");
            // Limpiar el parámetro join del URL y volver al home
            navigate('/');
          } finally {
            setLoading(false);
          }
        };

        autoJoin();
      }
    }
  }, [location.hash, navigate]);

  const createRoom = async () => {
    setLoading(true);
    try {
      const playerName = getUserName();
      const response = await api.post('/rooms/create', { adminName: playerName });
      const roomId = response.data.roomId;
      toast.success(`¡Partida creada! Código: ${roomId}`);
      if (navigator.vibrate) navigator.vibrate(50);
      // Ir directo a la sala
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error("Error al crear sala:", error);
      toast.error("Error al crear la sala. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (code) => {
    const roomId = code.trim().toUpperCase();

    if (!roomId) {
      toast.error("Por favor ingresa el código");
      return;
    }

    setLoading(true);
    try {
      const playerName = getUserName();
      await api.post(`/rooms/${roomId}/join`, { playerName });
      toast.success("¡Te uniste a la sala!");
      navigate(`/room/${roomId}`);
      if (navigator.vibrate) navigator.vibrate(40);
    } catch (error) {
      console.error("Error al unirse:", error);
      toast.error("No se pudo unir a la sala. Verifica el código.");
    } finally {
      setLoading(false);
    }
  };

  const resetView = () => {
    setMode(null);
    setRoomCode("");
  };

  return (
    <>
      <UserNameBar />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 pt-20 text-center">
      <h1 className="text-3xl font-bold mb-6">Impostor<br/>Word 🕵️‍♂️</h1>
      {!mode && (
        <div className="flex flex-col gap-4 max-w-md w-full">
          <button
            data-tutorial="create-button"
            onClick={createRoom}
            disabled={loading}
            className="bg-emerald-500 px-6 py-3 rounded-xl text-lg font-semibold hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Play size={20} />
            <span>{loading ? "Creando..." : "Crear partida"}</span>
          </button>
          <button
            data-tutorial="join-button"
            onClick={() => setMode("join")}
            className="bg-blue-500 px-6 py-3 rounded-xl text-lg font-semibold hover:bg-blue-600 active:scale-95 transition-all"
          >
            🔗 Unirse a partida
          </button>
        </div>
      )}
      {mode === "join" && (
        <div className="flex flex-col items-center gap-4 mt-4 max-w-md w-full">
          <p className="text-xl font-semibold">Únete a una partida</p>

          <div className="bg-blue-500/20 px-4 py-3 rounded-lg border border-blue-500/30 w-full">
            <p className="text-xs text-blue-300 mb-1">💡 Tip</p>
            <p className="text-sm text-gray-300">Puedes escanear el código QR con tu cámara nativa y te llevará directo al juego</p>
          </div>

          <div className="flex flex-col gap-3 w-full mt-2">
            <input
              data-tutorial="join-code-input"
              className="bg-gray-800 px-6 py-4 rounded-xl text-center text-lg font-semibold uppercase border-2 border-gray-700 focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-500"
              placeholder="CÓDIGO (6 letras)"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              autoFocus
            />

            <button
              onClick={() => joinRoom(roomCode)}
              disabled={loading || !roomCode || roomCode.length !== 6}
              className="bg-emerald-500 px-6 py-4 rounded-xl text-lg font-semibold hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Play size={20} />
              <span>{loading ? "Uniéndose..." : "Unirse"}</span>
            </button>
          </div>

          <button onClick={resetView} className="bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-all mt-2">
            ← Volver
          </button>
        </div>
      )}

      {/* Tutorial */}
      <Joyride
        steps={tutorialStepsHome.map((step, idx) => {
          // Si es el último step, agregar checkbox
          if (idx === tutorialStepsHome.length - 1) {
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
        run={run}
        continuous
        showProgress={false}
        showSkipButton
        callback={(data) => {
          const { status } = data;

          if (status === "finished") {
            // Usar el valor del checkbox solo cuando se termina normalmente
            stopTutorial();
            // Resetear el checkbox para la próxima vez
            setDontShowAgainChecked(false);
          } else if (status === "skipped") {
            // Si se salta, siempre marcar como "no volver a mostrar"
            stopTutorial();
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
        <TutorialButton />
      </div>
    </>
  );
}
