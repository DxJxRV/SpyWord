import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Gamepad2, Loader2 } from "lucide-react";
import { api, buildImageUrl } from "../services/api";
import { getUserName } from "../utils/nameGenerator";
import AppHeader from "../components/AppHeader";

export default function SpecialModes() {
  const navigate = useNavigate();
  const [modes, setModes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingRoom, setCreatingRoom] = useState(false);

  useEffect(() => {
    document.title = "SpyWord - Modos Especiales";
    loadModes();
    return () => {
      document.title = "SpyWord";
    };
  }, []);

  async function loadModes() {
    try {
      const response = await api.get("/modes/active");
      setModes(response.data);
    } catch (error) {
      console.error("Error al cargar modos:", error);
      toast.error("Error al cargar modos especiales");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRoom(modeId) {
    setCreatingRoom(true);
    try {
      const playerName = getUserName();
      const response = await api.post("/rooms/create", {
        adminName: playerName,
        modeId: modeId
      });

      const { roomId } = response.data;
      toast.success("Sala creada correctamente");
      if (navigator.vibrate) navigator.vibrate(50);
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error("Error al crear sala:", error);
      toast.error(error.response?.data?.error || "Error al crear la sala");
    } finally {
      setCreatingRoom(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-purple-400" size={48} />
          <p className="text-gray-400">Cargando modos especiales...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-gray-950 text-white p-6 pt-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft size={20} />
              Volver
            </button>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Modos Especiales
          </h1>
          <p className="text-gray-400">
            Elige un modo de juego con imágenes temáticas
          </p>
        </div>

        {/* Grid de modos */}
        {modes.length === 0 ? (
          <div className="text-center py-16 bg-gray-900/50 rounded-2xl border border-gray-700">
            <Gamepad2 size={64} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-2xl font-bold mb-2">No hay modos disponibles</h3>
            <p className="text-gray-400">
              Los modos especiales se configuran desde el panel de administración
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modes.map((mode) => (
              <div key={mode.id} className="relative">
                <button
                  onClick={() => handleCreateRoom(mode.id)}
                  disabled={creatingRoom}
                  className="group relative bg-gray-900/50 backdrop-blur-sm rounded-2xl border-2 border-gray-700 hover:border-purple-500 transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                {/* Imagen/Color de fondo del botón */}
                <div
                  className="h-48 flex items-center justify-center text-white font-bold text-3xl relative overflow-hidden"
                  style={{
                    background: mode.buttonGradient
                      ? `linear-gradient(135deg, ${mode.buttonGradient.from}, ${mode.buttonGradient.to})`
                      : mode.buttonImage
                      ? `url(${buildImageUrl(mode.buttonImage)}) center/cover`
                      : mode.buttonColor || "#8B5CF6"
                  }}
                >
                  {!mode.buttonImage && (
                    <span className="relative z-10 drop-shadow-lg">
                      {mode.name.slice(0, 3).toUpperCase()}
                    </span>
                  )}
                  {/* Overlay hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      Crear Sala
                    </span>
                  </div>
                </div>

                {/* Información */}
                <div className="p-6 text-left">
                  <h3 className="text-xl font-bold mb-2">{mode.name}</h3>
                  {mode.description && (
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {mode.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{mode.items?.length || 0} items</span>
                    <span className="capitalize">{mode.type === "image" ? "Imágenes" : mode.type}</span>
                  </div>
                </div>
              </button>
            </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
