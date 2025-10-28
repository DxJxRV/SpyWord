import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Room from "./pages/Room";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import Voting from "./pages/Voting";
import Results from "./pages/Results";
import InstallPrompt from "./components/InstallPrompt";
import FullscreenButton from "./components/FullscreenButton";

function RoomNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Solo mostrar si estamos en una ruta de room
  const isInRoom = location.pathname.startsWith('/room/');
  
  if (!isInRoom) return null;
  
  // Extraer roomId directamente del pathname
  const pathParts = location.pathname.split('/');
  const roomId = pathParts[2] || '';
  
  const handleExit = () => {
    if (window.confirm('¿Salir de la sala?')) {
      navigate('/');
    }
  };
  
  return (
    <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-purple-900/80 to-blue-900/80 backdrop-blur-md border-b border-purple-500/30 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-300 hidden sm:inline">Sala:</span>
          <div className="bg-amber-500/20 px-3 py-1 rounded-lg border border-amber-500/50">
            <span className="text-amber-400 font-mono font-bold text-sm">{roomId}</span>
          </div>
        </div>
        
        <button
          onClick={handleExit}
          className="bg-red-500/80 hover:bg-red-600 px-3 py-1 rounded-lg transition-all flex items-center gap-2"
        >
          <span className="hidden sm:inline text-sm">Salir</span>
          <span className="text-lg">✕</span>
        </button>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
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
            <Route path="/lobby" element={<Lobby />} />
            <Route path="/game" element={<Game />} />
            <Route path="/voting" element={<Voting />} />
            <Route path="/results" element={<Results />} />
          </Routes>
        </div>

        {/* 🔹 Botón de instalación flotante (abajo a la derecha) */}
        <InstallPrompt />
      </div>
    </BrowserRouter>
  );
}
