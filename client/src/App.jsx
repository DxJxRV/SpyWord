import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { useState, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import MainMenu from "./pages/MainMenu";
import Online from "./pages/Online";
import DailyMode from "./pages/DailyMode";
import PassAndPlay from "./pages/PassAndPlay";
import SpecialModes from "./pages/SpecialModes";
import Room from "./pages/Room";
import Admin from "./pages/Admin";
import LegalPages from "./pages/LegalPages";
import About from "./pages/About";
import Premium from "./pages/Premium";
import PremiumSuccess from "./pages/PremiumSuccess";
import FullscreenButton from "./components/FullscreenButton";
import Footer from "./components/Footer";
import PremiumTab from "./components/PremiumTab";
import RouletteModal from "./components/RouletteModal";
import { TutorialProvider } from "./contexts/TutorialContext";
import { AuthProvider } from "./contexts/AuthContext";
import { getUserName, setUserName as saveUserName } from "./utils/nameGenerator";

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}

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

function ConditionalFooter() {
  const location = useLocation();

  // Don't show footer in Room or Admin pages
  const hideFooter = location.pathname.startsWith('/room/') ||
                     location.pathname.startsWith('/admin');

  if (hideFooter) return null;

  return <Footer />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <TutorialProvider>
          <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden flex flex-col">
          {/* 🔹 Toaster para notificaciones */}
          <Toaster
            theme="dark"
            position="top-right"
            richColors
            closeButton
          />

          {/* 🔹 Botón de pantalla completa (arriba a la derecha) */}
          <FullscreenButton />

          {/* 🔹 Pestaña Premium para usuarios no premium */}
          <PremiumTab />

          {/* 🔹 Modal de Ruleta */}
          <RouletteModal />

          {/* 🔹 Navbar condicional de sala */}
          <RoomNavbar />

          {/* 🔹 Contenido de rutas */}
          <div className="pt-0 flex-1">
            <Routes>
              <Route path="/" element={<MainMenu />} />
              <Route path="/online" element={<Online />} />
              <Route path="/daily-mode" element={<DailyMode />} />
              <Route path="/pass-and-play" element={<PassAndPlay />} />
              <Route path="/special-modes" element={<SpecialModes />} />
              <Route path="/room/:roomId" element={<Room />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/premium" element={<Premium />} />
              <Route path="/premium/success" element={<PremiumSuccess />} />
              <Route path="/privacy" element={<LegalPages type="privacy" />} />
              <Route path="/terms" element={<LegalPages type="terms" />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </div>

          {/* 🔹 Footer condicional */}
          <ConditionalFooter />
          </div>
        </TutorialProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
