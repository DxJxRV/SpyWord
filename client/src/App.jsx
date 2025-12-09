import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import Home from "./pages/Home";
import Room from "./pages/Room";
import Admin from "./pages/Admin";
import InstallPrompt from "./components/InstallPrompt";
import FullscreenButton from "./components/FullscreenButton";
import { TutorialProvider } from "./contexts/TutorialContext";
import { getUserName, setUserName as saveUserName } from "./utils/nameGenerator";

function RoomNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState(getUserName());
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(name);

  // Solo mostrar si estamos en una ruta de room
  const isInRoom = location.pathname.startsWith('/room/');

  if (!isInRoom) return null;

  // Extraer roomId directamente del pathname
  const pathParts = location.pathname.split('/');
  const roomId = pathParts[2] || '';

  const handleEdit = () => {
    setTempName(name);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (tempName.trim()) {
      setName(tempName.trim());
      saveUserName(tempName.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setTempName(name);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleExit = () => {
    // Navegar inmediatamente a home
    navigate('/');

    // Mostrar toast con opción de regresar
    toast.error("Saliste de la sala", {
      description: "Ya estás en el inicio",
      action: {
        label: "Regresar a sala",
        onClick: () => {
          navigate(`/room/${roomId}`);
        }
      },
      duration: 5000
    });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-md border-b border-purple-500/20 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        <div data-tutorial="room-navbar-name" className="flex items-center gap-3">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-gray-800/80 text-white px-2 py-1 rounded-lg border border-purple-500/50 focus:border-purple-500 focus:outline-none text-xs max-w-[120px]"
                maxLength={25}
                autoFocus
              />
              <button
                onClick={handleSave}
                className="bg-emerald-500/80 hover:bg-emerald-600 p-1 rounded transition-all"
                title="Guardar"
              >
                <Check size={14} />
              </button>
              <button
                onClick={handleCancel}
                className="bg-red-500/80 hover:bg-red-600 p-1 rounded transition-all"
                title="Cancelar"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleEdit}
              className="group flex items-center gap-1.5 hover:bg-white/10 px-2 py-1 rounded transition-all"
            >
              <span className="text-xs font-medium text-white border-b border-dashed border-gray-400 group-hover:border-white transition-colors">
                {name}
              </span>
              <Pencil size={12} className="text-gray-400 group-hover:text-white transition-colors" />
            </button>
          )}

          <span className="text-sm text-gray-400 hidden sm:inline">•</span>
          <span className="text-xs text-gray-400 hidden sm:inline">Sala:</span>
          <div className="bg-amber-500/20 px-2 py-1 rounded border border-amber-500/50">
            <span className="text-amber-400 font-mono font-bold text-xs">{roomId}</span>
          </div>
        </div>

        <button
          onClick={handleExit}
          className="bg-red-500/80 hover:bg-red-600 px-2 py-1 rounded transition-all flex items-center gap-1.5"
        >
          <span className="hidden sm:inline text-xs">Salir</span>
          <span className="text-sm">✕</span>
        </button>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TutorialProvider>
        <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
        {/* 🔹 Toaster para notificaciones */}
        <Toaster 
          theme="dark" 
          position="top-right"
          richColors
          closeButton
        />

        {/* 🔹 Botón de pantalla completa (arriba a la derecha) */}
        <FullscreenButton />

        {/* 🔹 Navbar condicional de sala */}
        <RoomNavbar />

        {/* 🔹 Contenido de rutas */}
        <div className="pt-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:roomId" element={<Room />} />
            <Route path="/join/:roomId" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </div>

        {/* 🔹 Botón de instalación flotante (abajo a la derecha) */}
        <InstallPrompt />
        </div>
      </TutorialProvider>
    </BrowserRouter>
  );
}
