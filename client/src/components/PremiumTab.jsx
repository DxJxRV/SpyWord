import { Crown, CircleDashed, ChevronRight, ChevronLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import PricingModal from "./PricingModal";

export default function PremiumTab() {
  const { isPremium, setShowRouletteModal } = useAuth();
  const [currentTab, setCurrentTab] = useState(0); // 0 = NO ADS, 1 = RULETA
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Alternar entre pestañas cada 5 segundos (solo si NO es premium)
  useEffect(() => {
    if (!isPremium) {
      const interval = setInterval(() => {
        setCurrentTab((prev) => (prev === 0 ? 1 : 0));
      }, 5000);

      return () => clearInterval(interval);
    } else {
      // Si es premium, fijar la tab de ruleta (tab 1)
      setCurrentTab(1);
    }
  }, [isPremium]);

  const handleClick = () => {
    if (currentTab === 0) {
      // Tab de Premium - Abrir modal
      setShowPricingModal(true);
    } else {
      // Tab de Ruleta
      setShowRouletteModal(true);
    }
  };

  if (isMinimized) {
    // Línea delgada cuando está minimizado
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-24 right-0 z-50 group hover:w-3 w-2 h-32 bg-gradient-to-b from-amber-500 via-red-500 to-yellow-500 rounded-l-lg shadow-lg transition-all duration-300"
        title="Expandir pestañas"
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronLeft size={12} className="text-white" />
        </div>
      </button>
    );
  }

  return (
    <>
      <div className="fixed bottom-24 right-0 z-50">
        {/* Botón de minimizar superpuesto en la esquina superior */}
        <button
          onClick={() => setIsMinimized(true)}
          className="absolute -top-2 -left-2 bg-gray-800/90 hover:bg-gray-700 text-white p-1 rounded-full shadow-lg z-10 transition-all duration-200 hover:scale-110"
          title="Minimizar"
        >
          <ChevronRight size={14} />
        </button>

        {/* Pestaña principal */}
        <button
          onClick={handleClick}
          className="group"
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
      </div>

      {/* Modal de Precios */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
      />
    </>
  );
}
