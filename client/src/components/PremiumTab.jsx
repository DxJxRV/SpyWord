import { useNavigate } from "react-router-dom";
import { Crown, CircleDashed } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";

export default function PremiumTab() {
  const navigate = useNavigate();
  const { isPremium, setShowRouletteModal } = useAuth();
  const [currentTab, setCurrentTab] = useState(0); // 0 = NO ADS, 1 = RULETA

  // Alternar entre pestañas cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTab((prev) => (prev === 0 ? 1 : 0));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // No mostrar si el usuario ya es premium
  if (isPremium) return null;

  const handleClick = () => {
    if (currentTab === 0) {
      // Tab de Premium
      navigate("/premium");
    } else {
      // Tab de Ruleta
      setShowRouletteModal(true);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed top-1/2 right-0 -translate-y-1/2 z-50 group"
      style={{
        transformOrigin: "right center"
      }}
    >
      {currentTab === 0 ? (
        // Tab de NO ADS (Premium)
        <div className="relative bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white px-4 py-6 rounded-l-2xl shadow-2xl transition-all duration-300 hover:pr-6 flex flex-col items-center gap-2">
          {/* Brillo animado */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-l-2xl" />

          {/* Icono */}
          <div className="relative flex flex-col items-center gap-1">
            <Crown size={24} className="text-white animate-bounce" fill="currentColor" />
          </div>

          {/* Texto vertical */}
          <div className="relative flex flex-col items-center">
            <span className="text-xs font-bold tracking-widest" style={{ writingMode: "vertical-rl" }}>
              NO ADS
            </span>
          </div>

          {/* Pulso de brillo */}
          <div className="absolute inset-0 rounded-l-2xl animate-pulse bg-yellow-300/20" />
        </div>
      ) : (
        // Tab de RULETA
        <div className="relative bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-6 rounded-l-2xl shadow-2xl transition-all duration-300 hover:pr-6 flex flex-col items-center gap-2">
          {/* Brillo animado */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-l-2xl" />

          {/* Icono de ruleta */}
          <div className="relative flex flex-col items-center gap-1">
            <CircleDashed size={24} className="text-white animate-spin" style={{ animationDuration: "3s" }} />
          </div>

          {/* Texto vertical */}
          <div className="relative flex flex-col items-center">
            <span className="text-xs font-bold tracking-widest" style={{ writingMode: "vertical-rl" }}>
              RULETA
            </span>
          </div>

          {/* Pulso de brillo */}
          <div className="absolute inset-0 rounded-l-2xl animate-pulse bg-red-300/20" />
        </div>
      )}
    </button>
  );
}
