export default function FullscreenButton() {
  const toggleFullscreen = async () => {
    const el = document.documentElement;
    const isFs = document.fullscreenElement || document.webkitFullscreenElement;

    try {
      if (!isFs) {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
      }
    } catch (err) {
      console.warn("⚠️ No se pudo cambiar a pantalla completa:", err);
    }
  };

  return (
    <button
      onClick={toggleFullscreen}
      title="Pantalla completa"
      className="fixed top-4 right-4 bg-slate-800/70 hover:bg-slate-700 text-white text-lg px-3 py-2 rounded-lg backdrop-blur border border-white/10 transition-all"
    >
      ⛶
    </button>
  );
}
