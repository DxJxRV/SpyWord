import { useEffect, useRef, useState } from "react";

/**
 * Componente que muestra un nombre con animación de carrusel si es muy largo
 * Si el nombre es corto, lo muestra estático
 * Si es largo, hace un efecto marquee con pausa al inicio
 */
export default function PlayerNameCarousel({ name, className = "", isCurrentUser = false }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [needsAnimation, setNeedsAnimation] = useState(false);

  useEffect(() => {
    if (containerRef.current && textRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const textWidth = textRef.current.scrollWidth;

      // Si el texto es más ancho que el contenedor, activar animación
      setNeedsAnimation(textWidth > containerWidth);
    }
  }, [name]);

  const fullName = name + (isCurrentUser ? ' (tú)' : '');

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden ${className}`}
    >
      {needsAnimation ? (
        <div
          className="flex whitespace-nowrap"
          style={{
            animation: 'player-name-marquee 6s linear 1s infinite',
          }}
        >
          <span ref={textRef} className="inline-block" style={{ paddingRight: '3.5rem' }}>
            {name}
            {isCurrentUser && <span className="text-amber-400"> (tú)</span>}
          </span>
          <span className="inline-block" style={{ paddingRight: '3.5rem' }}>
            {name}
            {isCurrentUser && <span className="text-amber-400"> (tú)</span>}
          </span>
          <span className="inline-block" style={{ paddingRight: '3.5rem' }}>
            {name}
            {isCurrentUser && <span className="text-amber-400"> (tú)</span>}
          </span>
        </div>
      ) : (
        <span ref={textRef} className="block text-center whitespace-nowrap truncate">
          {name}
          {isCurrentUser && <span className="text-amber-400"> (tú)</span>}
        </span>
      )}
    </div>
  );
}
