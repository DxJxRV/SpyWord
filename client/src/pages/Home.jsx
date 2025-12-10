import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Play, Link2, QrCode, Camera } from "lucide-react";
import { toast } from "sonner";
import { api } from "../services/api";
import Joyride from "react-joyride";
import { useTutorial } from "../contexts/TutorialContext";
import { tutorialStepsHome } from "../data/tutorialSteps";
import TutorialButton from "../components/TutorialButton";
import UserNameBar from "../components/UserNameBar";
import QRScanner from "../components/QRScanner";
import { getUserName } from "../utils/nameGenerator";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { run, stopTutorial } = useTutorial();
  const [mode, setMode] = useState(null);
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [dontShowAgainChecked, setDontShowAgainChecked] = useState(false); // Checkbox del tutorial
  const [showQRScanner, setShowQRScanner] = useState(false);

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

  const handleScanQR = () => {
    setShowQRScanner(true);
  };

  const handleQRScanResult = async (roomCode) => {
    setShowQRScanner(false);
    toast.success(`Código detectado: ${roomCode}`);

    // Unirse automáticamente
    setLoading(true);
    try {
      const playerName = getUserName();
      await api.post(`/rooms/${roomCode}/join`, { playerName });
      toast.success("¡Te uniste a la sala!");
      navigate(`/room/${roomCode}`);
      if (navigator.vibrate) navigator.vibrate(40);
    } catch (error) {
      console.error("Error al unirse:", error);
      toast.error("No se pudo unir a la sala. Verifica el código.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <UserNameBar />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 pt-20 text-center">
      <h1 className="text-3xl font-bold mb-6">Impostor<br/>Word 🕵️‍♂️</h1>
      {!mode && (
        <div className="flex flex-col gap-4 max-w-md w-full">
          {/* Botón Crear Partida */}
          <button
            data-tutorial="create-button"
            onClick={createRoom}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-5 rounded-xl hover:from-emerald-600 hover:to-emerald-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-4 shadow-lg"
          >
            <div className="bg-white/20 p-3 rounded-lg">
              <Play size={28} />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-xl font-bold">{loading ? "Creando..." : "Crear partida"}</span>
              <span className="text-sm text-emerald-100 opacity-90">Inicia un nuevo juego como anfitrión</span>
            </div>
          </button>

          {/* Botón Unirse a Partida */}
          <button
            data-tutorial="join-button"
            onClick={() => setMode("join")}
            className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5 rounded-xl hover:from-blue-600 hover:to-blue-700 active:scale-95 transition-all flex items-center gap-4 shadow-lg"
          >
            <div className="bg-white/20 p-3 rounded-lg">
              <Link2 size={28} />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-xl font-bold">Unirse a partida</span>
              <span className="text-sm text-blue-100 opacity-90">Entra con código o escanea QR</span>
            </div>
          </button>
        </div>
      )}
      {mode === "join" && (
        <div className="flex flex-col items-center gap-4 mt-4 max-w-md w-full">
          <p className="text-xl font-semibold">Únete a una partida</p>

          {/* Botón Escanear QR con Cámara */}
          <button
            onClick={handleScanQR}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 rounded-xl hover:from-purple-600 hover:to-purple-700 active:scale-95 transition-all flex items-center gap-4 shadow-lg"
          >
            <div className="bg-white/20 p-2.5 rounded-lg">
              <Camera size={24} />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-lg font-bold">Escanear QR</span>
              <span className="text-xs text-purple-100 opacity-90">Usa tu cámara para unirte rápido</span>
            </div>
          </button>

          {/* Separador */}
          <div className="flex items-center gap-3 w-full my-2">
            <div className="flex-1 h-px bg-gray-700"></div>
            <span className="text-sm text-gray-500 font-medium">O</span>
            <div className="flex-1 h-px bg-gray-700"></div>
          </div>

          <div className="flex flex-col gap-3 w-full">
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

        {/* Scanner QR */}
        {showQRScanner && (
          <QRScanner
            onScan={handleQRScanResult}
            onClose={() => setShowQRScanner(false)}
          />
        )}
      </div>
    </>
  );
}
