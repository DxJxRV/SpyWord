import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * Banner de anuncios fijo en la parte inferior de todas las pantallas
 * Se recarga automáticamente cada vez que cambia la ruta
 */
export default function BottomAdBanner() {
  const location = useLocation();
  const { isPremium } = useAuth();
  const adContainerRef = useRef(null);
  const adLoadedRef = useRef(false);

  useEffect(() => {
    // Si es premium, no mostrar anuncios
    if (isPremium) {
      console.log('👑 Usuario premium - Banner de anuncios desactivado');
      return;
    }

    // Cargar el script de AdSense solo una vez
    if (!adLoadedRef.current) {
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8947474348361670';
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
      adLoadedRef.current = true;
      console.log('📢 Script de AdSense cargado');
    }

    // Esperar un momento para asegurar que el DOM está listo
    const timer = setTimeout(() => {
      try {
        // Push del anuncio
        if (window.adsbygoogle) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          console.log('📢 Anuncio bottom banner cargado para ruta:', location.pathname);
        }
      } catch (error) {
        console.error('Error al cargar anuncio:', error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname, isPremium]); // Recargar cuando cambie la ruta

  // No mostrar si es premium
  if (isPremium) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 border-t border-gray-700/50 backdrop-blur-sm z-40">
      <div className="max-w-screen-xl mx-auto px-4 py-2">
        <div ref={adContainerRef} className="flex justify-center items-center min-h-[90px]">
          {/* Bottom Bar Ad */}
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-8947474348361670"
            data-ad-slot="9227089419"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    </div>
  );
}
