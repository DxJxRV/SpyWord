import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Crown, Sparkles, Zap } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { toast } from "sonner";

export default function PricingModal({ isOpen, onClose }) {
  const { user, setShowLoginModal } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('weekly'); // 'weekly' or 'lifetime'
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async (planType) => {
    if (!user) {
      onClose();
      setShowLoginModal(true);
      toast.info("Inicia sesión para comprar Premium");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/create-checkout-session', {
        planType: planType
      });

      // Redirigir a Stripe Checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error al crear sesión de pago:', error);
      toast.error('Error al procesar el pago. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-xl border border-gray-700 max-w-md w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
            Planes Premium
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 pb-2">
          <button
            onClick={() => setSelectedPlan('weekly')}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-all ${
              selectedPlan === 'weekly'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                : 'bg-gray-800/50 text-gray-400'
            }`}
          >
            <Zap size={16} className="inline mr-1" />
            Semanal
          </button>

          <button
            onClick={() => setSelectedPlan('lifetime')}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-all ${
              selectedPlan === 'lifetime'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg'
                : 'bg-gray-800/50 text-gray-400'
            }`}
          >
            <Crown size={16} className="inline mr-1" fill="currentColor" />
            Lifetime
          </button>
        </div>

        {/* Content */}
        <div className="p-4 pt-2">
          {selectedPlan === 'weekly' ? (
            // Plan Semanal
            <div className="space-y-3">
              {/* Precio */}
              <div className="text-center py-2">
                <span className="text-4xl font-bold text-white">$1.00</span>
                <span className="text-gray-400 text-lg ml-1">/semana</span>
              </div>

              {/* Beneficio especial - Ficha premium */}
              <div className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl flex-shrink-0">🎟️</span>
                  <p className="text-amber-100 text-sm">
                    <span className="font-bold">¡Bonus!</span> Incluye 1 ficha de ruleta premium
                  </p>
                </div>
              </div>

              {/* Características compactas */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                  <span>7 días sin anuncios</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                  <span>Todos los modos premium</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                  <span>Partidas ilimitadas</span>
                </div>
              </div>

              {/* Botón de compra */}
              <button
                onClick={() => handlePurchase('weekly')}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span className="text-sm">Procesando...</span>
                  </div>
                ) : (
                  <span className="text-sm">Comprar - $1.00</span>
                )}
              </button>
            </div>
          ) : (
            // Plan Lifetime
            <div className="space-y-3">
              {/* Precio */}
              <div className="text-center py-2">
                <span className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                  $9.99
                </span>
                <p className="text-amber-400 text-xs mt-1 font-semibold">Un solo pago para siempre</p>
              </div>

              {/* Badge especial */}
              <div className="bg-gradient-to-br from-amber-900/30 to-yellow-900/30 border border-amber-500 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Crown size={20} className="text-amber-400 flex-shrink-0" fill="currentColor" />
                  <p className="text-amber-100 text-sm">
                    <span className="font-bold">Premium de por vida</span> sin vencimiento
                  </p>
                </div>
              </div>

              {/* Características compactas */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" />
                  <span>Sin anuncios para siempre</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" />
                  <span>Todos los modos premium</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" />
                  <span>Partidas ilimitadas</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" />
                  <span>Apoya el proyecto</span>
                </div>
              </div>

              {/* Comparación de valor compacta */}
              <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700">
                <p className="text-center text-amber-400 text-xs font-semibold">
                  Equivale a 10 semanas • Mejor valor
                </p>
              </div>

              {/* Botón de compra */}
              <button
                onClick={() => handlePurchase('lifetime')}
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span className="text-sm">Procesando...</span>
                  </div>
                ) : (
                  <span className="text-sm">Comprar - $9.99</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
