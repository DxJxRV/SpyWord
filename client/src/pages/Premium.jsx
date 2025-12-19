import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Crown, Check, Sparkles, Zap, Shield, X } from "lucide-react";
import { api } from "../services/api";
import { toast } from "sonner";
import AppHeader from "../components/AppHeader";
import { useAuth } from "../contexts/AuthContext";

export default function Premium() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, setShowLoginModal } = useAuth();
  const [loading, setLoading] = useState(null); // 'weekly' o 'lifetime'
  const [selectedPlan, setSelectedPlan] = useState('weekly'); // 'weekly' o 'lifetime'

  const canceled = searchParams.get("canceled");

  // Cambiar título de la página
  useEffect(() => {
    document.title = "SpyWord - Premium";
    return () => {
      document.title = "SpyWord";
    };
  }, []);

  const handlePurchase = async (planType) => {
    // Verificar si el usuario está loggeado
    if (!user) {
      setShowLoginModal(true);
      toast.info("Inicia sesión para continuar con tu compra");
      return;
    }

    setLoading(planType);

    try {
      const response = await api.post("/create-checkout-session", {
        planType: planType,
      });

      // Redirigir a Stripe Checkout
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Error al crear sesión de checkout:", error);
      toast.error(
        error.response?.data?.error || "Error al iniciar el proceso de pago"
      );
      setLoading(null);
    }
  };

  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-gray-950 text-white pt-20 pb-12 px-6">
        <div className="max-w-2xl mx-auto">
        {/* Header Compacto */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Crown className="text-amber-400" size={36} />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">
              Premium
            </h1>
          </div>
          <p className="text-gray-400">
            Sin anuncios • Premium Pass • Insignia exclusiva
          </p>
        </div>

        {/* Mensaje de cancelación */}
        {canceled && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <X className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-400 font-medium">Pago cancelado</p>
              <p className="text-sm text-gray-400 mt-1">
                No se realizó ningún cargo. Puedes intentarlo de nuevo.
              </p>
            </div>
          </div>
        )}

        {/* Tabs de Planes */}
        <div className="flex gap-2 mb-6 bg-gray-900/50 p-1.5 rounded-xl border border-gray-800">
          <button
            onClick={() => setSelectedPlan('weekly')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all relative ${
              selectedPlan === 'weekly'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Plan Semanal
            {selectedPlan === 'weekly' && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                MEJOR VALUADA
              </span>
            )}
          </button>
          <button
            onClick={() => setSelectedPlan('lifetime')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
              selectedPlan === 'lifetime'
                ? 'bg-amber-600 text-gray-900'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Plan Lifetime
          </button>
        </div>

        {/* Card del Plan Seleccionado */}
        {selectedPlan === 'weekly' ? (
          // Plan Semanal
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500 rounded-2xl p-8 relative overflow-hidden">
            {/* Badge superior */}
            <div className="absolute top-4 right-4 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              NOCHE PERFECTA
            </div>

            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-2">Plan Semanal</h3>
              <p className="text-gray-400 text-sm mb-6">
                Perfecto para probar Premium
              </p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex flex-col items-center justify-end">
                  <span className="text-2xl mb-1 font-bold leading-none">$</span>
                  <span className="text-[10px] text-gray-400 font-semibold -mt-1">USD</span>
                </div>
                <span className="text-6xl font-bold">1.00</span>
                <span className="text-gray-400 text-lg self-end pb-2">/ semana</span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/20 p-2 rounded-lg">
                  <Zap className="text-purple-400" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Sin anuncios por 7 días</p>
                  <p className="text-xs text-gray-400">Juega sin interrupciones</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-purple-500/20 p-2 rounded-lg">
                  <Shield className="text-purple-400" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Premium Pass incluido</p>
                  <p className="text-xs text-gray-400">Todos juegan sin ads en tu sala</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-purple-500/20 p-2 rounded-lg">
                  <Crown className="text-purple-400" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Insignia Premium</p>
                  <p className="text-xs text-gray-400">Badge dorado exclusivo</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-purple-500/20 p-2 rounded-lg">
                  <Check className="text-purple-400" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Cancela cuando quieras</p>
                  <p className="text-xs text-gray-400">Sin compromisos a largo plazo</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => handlePurchase("weekly")}
              disabled={loading !== null}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {loading === "weekly" ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Redirigiendo...
                </>
              ) : (
                <>
                  <Crown size={20} />
                  Obtener Semanal
                </>
              )}
            </button>
          </div>
        ) : (
          // Plan Lifetime
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500 rounded-2xl p-8 relative overflow-hidden">
            {/* Badge superior */}
            <div className="absolute top-4 right-4 bg-amber-500 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
              PAGO ÚNICO
            </div>

            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-2">Plan Lifetime</h3>
              <p className="text-gray-400 text-sm mb-6">
                Acceso de por vida con un solo pago
              </p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="flex flex-col items-center justify-end">
                  <span className="text-2xl mb-1 font-bold leading-none bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">$</span>
                  <span className="text-[10px] text-amber-400 font-semibold -mt-1">USD</span>
                </div>
                <span className="text-6xl font-bold bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">
                  9.99
                </span>
                <span className="text-gray-400 text-lg self-end pb-2">una vez</span>
              </div>
              <p className="text-sm text-emerald-400 font-medium">
                Ahorra más del 90% vs. semanal
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/20 p-2 rounded-lg">
                  <Zap className="text-amber-400" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Sin anuncios para siempre</p>
                  <p className="text-xs text-gray-400">Nunca vuelvas a ver un ad</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-amber-500/20 p-2 rounded-lg">
                  <Shield className="text-amber-400" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Premium Pass de por vida</p>
                  <p className="text-xs text-gray-400">Todos disfrutan sin ads en tus salas</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-amber-500/20 p-2 rounded-lg">
                  <Crown className="text-amber-400" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Insignia Premium dorada</p>
                  <p className="text-xs text-gray-400">Destaca en cada partida</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-amber-500/20 p-2 rounded-lg">
                  <Sparkles className="text-amber-400" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Futuras funciones incluidas</p>
                  <p className="text-xs text-gray-400">Acceso prioritario a nuevos modos</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => handlePurchase("lifetime")}
              disabled={loading !== null}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30"
            >
              {loading === "lifetime" ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-900"></div>
                  Redirigiendo...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Obtener Lifetime
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer Info */}
        <div className="text-center mt-8 space-y-4">
          <p className="text-xs text-gray-500">
            💳 Pagos seguros procesados por Stripe
          </p>
          <button
            onClick={() => navigate("/")}
            className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
          >
            ← Volver al inicio
          </button>
        </div>
        </div>
      </div>
    </>
  );
}
