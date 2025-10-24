import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import Voting from "./pages/Voting";
import Results from "./pages/Results";
import InstallPrompt from "./components/InstallPrompt";
import FullscreenButton from "./components/FullscreenButton";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
        {/* 🔹 Botón de pantalla completa (arriba a la derecha) */}
        <FullscreenButton />

        {/* 🔹 Menú de navegación superior */}
        <nav className="fixed top-4 left-0 right-0 flex justify-center gap-4 text-sm text-gray-400 z-40">
          <Link to="/" className="hover:text-emerald-400 transition-colors">Home</Link>
          <Link to="/lobby" className="hover:text-emerald-400 transition-colors">Lobby</Link>
          <Link to="/game" className="hover:text-emerald-400 transition-colors">Game</Link>
          <Link to="/voting" className="hover:text-emerald-400 transition-colors">Voting</Link>
          <Link to="/results" className="hover:text-emerald-400 transition-colors">Results</Link>
        </nav>

        {/* 🔹 Contenido de rutas */}
        <div className="pt-16"> {/* margen superior para no tapar el nav */}
          <Routes>
            <Route path="/" element={<Home />} />
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
