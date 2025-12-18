import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Crown, Check, Sparkles, Zap, Shield, X } from "lucide-react";
import { api } from "../services/api";
import { toast } from "sonner";

export default function Premium() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(null); // 'weekly' o 'lifetime'

  const canceled = searchParams.get("canceled");

  // Cambiar título de la página
  useEffect(() => {
    document.title = "SpyWord - Premium";
    return () => {
      document.title = "SpyWord";
    };
  }, []);

  const handlePurchase = async (planType) => {
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
    <div className="min-h-screen bg-gray-950 text-white pt-20 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="text-amber-400" size={48} />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Hazte Premium
            </h1>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Desbloquea la experiencia completa de ImpostorWord sin anuncios y
            con beneficios exclusivos
          </p>
        </div>

        {/* Mensaje de cancelación */}
        {canceled && (
          <div className="max-w-md mx-auto mb-8 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <X className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-400 font-medium">Pago cancelado</p>
              <p className="text-sm text-gray-400 mt-1">
                No se realizó ningún cargo. Puedes intentarlo de nuevo cuando
                quieras.
              </p>
            </div>
          </div>
        )}

        {/* Beneficios Premium */}
        <div className="bg-gradient-to-br from-amber-500/10 to-purple-500/10 border border-amber-500/30 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="text-amber-400" size={24} />
            Beneficios Premium
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-amber-500/20 p-2 rounded-lg">
                <Zap className="text-amber-400" size={20} />
              </div>
              <div>
                <h3 className="font-semibold">Sin anuncios</h3>
                <p className="text-sm text-gray-400">
                  Juega sin interrupciones ni banners publicitarios
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <Shield className="text-purple-400" size={20} />
              </div>
              <div>
                <h3 className="font-semibold">Premium Pass</h3>
                <p className="text-sm text-gray-400">
                  Cuando creas una sala, todos juegan sin anuncios
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <Crown className="text-emerald-400" size={20} />
              </div>
              <div>
                <h3 className="font-semibold">Insignia Premium</h3>
                <p className="text-sm text-gray-400">
                  Destaca con tu badge dorado en todas las partidas
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <Sparkles className="text-blue-400" size={20} />
              </div>
              <div>
                <h3 className="font-semibold">Acceso prioritario</h3>
                <p className="text-sm text-gray-400">
                  Nuevas funciones y modos de juego antes que nadie
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Planes de pago */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Plan Semanal */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Plan Semanal</h3>
              <p className="text-gray-400 text-sm mb-4">
                Perfecto para probar Premium
              </p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold">$1</span>
                <span className="text-gray-400">/ semana</span>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-2 text-sm">
                <Check className="text-emerald-400 flex-shrink-0" size={18} />
                <span>Sin anuncios por 7 días</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="text-emerald-400 flex-shrink-0" size={18} />
                <span>Premium Pass incluido</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="text-emerald-400 flex-shrink-0" size={18} />
                <span>Insignia Premium</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="text-emerald-400 flex-shrink-0" size={18} />
                <span>Cancela cuando quieras</span>
              </div>
            </div>

            <button
              onClick={() => handlePurchase("weekly")}
              disabled={loading !== null}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

          {/* Plan Lifetime */}
          <div className="bg-gradient-to-br from-amber-500/10 to-purple-500/10 border-2 border-amber-500 rounded-2xl p-8 relative overflow-hidden">
            {/* Badge de "Mejor Valor" */}
            <div className="absolute top-4 right-4 bg-amber-500 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
              MEJOR VALOR
            </div>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Plan Lifetime</h3>
              <p className="text-gray-400 text-sm mb-4">
                Pago único, acceso de por vida
              </p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">
                  $9.99
                </span>
                <span className="text-gray-400">una sola vez</span>
              </div>
              <p className="text-xs text-emerald-400 mt-2 font-medium">
                Ahorra más del 90% a largo plazo
              </p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-2 text-sm">
                <Check className="text-amber-400 flex-shrink-0" size={18} />
                <span className="font-medium">
                  Sin anuncios para siempre
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="text-amber-400 flex-shrink-0" size={18} />
                <span className="font-medium">Premium Pass de por vida</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="text-amber-400 flex-shrink-0" size={18} />
                <span className="font-medium">Insignia Premium dorada</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="text-amber-400 flex-shrink-0" size={18} />
                <span className="font-medium">
                  Acceso a todas las futuras funciones
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="text-amber-400 flex-shrink-0" size={18} />
                <span className="font-medium">Soporte prioritario</span>
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
        </div>

        {/* Footer Info */}
        <div className="text-center mt-12 space-y-4">
          <p className="text-sm text-gray-400">
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
  );
}
