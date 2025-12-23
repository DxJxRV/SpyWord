import { useEffect, useRef } from 'react';

/**
 * Componente de placeholder para anuncios de AdSense
 * @param {boolean} isPremium - Si es true, no muestra anuncios
 * @param {string} format - Formato del anuncio: 'rectangle' | 'horizontal' | 'vertical'
 * @param {string} slot - ID del slot de AdSense (opcional por ahora)
 */
export default function AdPlaceholder({ isPremium = false, format = 'rectangle', slot = '' }) {
  const adRef = useRef(null);

  useEffect(() => {
    // Si es premium, no cargar anuncios
    if (isPremium) return;

    // Aquí se cargaría el script de AdSense
    // Por ahora solo mostramos el placeholder
    try {
      // (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('Error al cargar anuncio:', err);
    }
  }, [isPremium]);

  // Si es premium, no renderizar nada
  if (isPremium || true) return null;

  // Determinar dimensiones según formato
  const dimensions = {
    rectangle: { width: '300px', height: '250px' },
    horizontal: { width: '728px', height: '90px', maxWidth: '100%' },
    vertical: { width: '160px', height: '600px' }
  };

  const { width, height, maxWidth } = dimensions[format] || dimensions.rectangle;

  return (
    <div
      ref={adRef}
      className="ad-container my-4 flex items-center justify-center"
      style={{
        minWidth: width,
        minHeight: height,
        maxWidth: maxWidth || width
      }}
    >
      {/* Placeholder mientras se carga AdSense */}
      <div
        className="bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center"
        style={{
          width: '100%',
          height: height
        }}
      >
        <div className="text-center p-4">
          <p className="text-gray-500 text-sm font-medium">Espacio Publicitario</p>
          <p className="text-gray-600 text-xs mt-1">{format}</p>
        </div>
      </div>

      {/* Aquí iría el código real de AdSense */}
      {/* <ins className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client="ca-pub-8947474348361670"
           data-ad-slot={slot}
           data-ad-format="auto"
           data-full-width-responsive="true"></ins> */}
    </div>
  );
}
