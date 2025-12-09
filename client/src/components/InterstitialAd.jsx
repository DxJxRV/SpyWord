import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Componente de viñeta intersticial (pantalla completa)
 * @param {boolean} isRoomPremium - Premium Pass del Anfitrión: si el admin es premium, desactiva interstitials para todos
 * @param {function} onClose - Callback cuando se cierra el anuncio
 */
export default function InterstitialAd({
  isRoomPremium = false,
  onClose
}) {
  useEffect(() => {
    // Si el anfitrión es premium (Premium Pass), cerrar inmediatamente sin mostrar anuncio
    if (isRoomPremium) {
      onClose?.();
      return;
    }
  }, [isRoomPremium, onClose]);

  // Si el anfitrión es premium (Premium Pass), no renderizar nada
  if (isRoomPremium) return null;

  const handleClose = () => {
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/95 backdrop-blur-sm">
      {/* Botón de cerrar */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 p-2 rounded-lg transition-all bg-white/10 hover:bg-white/20 text-white cursor-pointer"
        aria-label="Cerrar anuncio"
      >
        <X size={24} />
      </button>

      {/* Contenedor del anuncio */}
      <div className="max-w-4xl w-full mx-4">
        {/* Placeholder para el anuncio intersticial */}
        <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl p-8 min-h-[400px] flex flex-col items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-pulse">
              <div className="w-20 h-20 bg-purple-600/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-12 h-12 bg-purple-600/40 rounded-full"></div>
              </div>
            </div>
            <p className="text-gray-400 text-lg font-medium">Espacio Publicitario</p>
            <p className="text-gray-500 text-sm">Viñeta Intersticial</p>
            <p className="text-gray-600 text-xs">
              Este espacio mostrará un anuncio de pantalla completa
            </p>
          </div>

          {/* Aquí iría el código real de AdSense Interstitial */}
          {/* El código de AdSense para interstitials se carga de forma diferente */}
        </div>

        {/* Información adicional */}
        <div className="mt-4 text-center">
          <p className="text-gray-500 text-xs">
            Haz clic en la X para continuar
          </p>
        </div>
      </div>
    </div>
  );
}
