import { useState, useRef } from "react";
import { createHostPeer, connectToHost } from "../network/p2p";
import { QRCodeCanvas } from "qrcode.react";
import { useZxing } from "react-zxing";

export default function Home() {
  const [mode, setMode] = useState(null); // "host" | "join"
  const [host, setHost] = useState(null);
  const [peerId, setPeerId] = useState("");
  const [conn, setConn] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [scanResult, setScanResult] = useState("");
  const [scanActive, setScanActive] = useState(false);
  const [qrDetected, setQrDetected] = useState(false);
  const [validQr, setValidQr] = useState(""); // ← guarda el texto del QR válido detectado





  // ✅ Hook dentro del componente (correcto)
  const { ref } = useZxing({
    onDecodeResult(result) {
      if (result?.getText) {
        const text = result.getText().trim();
        if (text && text !== validQr) {
          setValidQr(text); // 👈 lo guarda aunque no haya hecho join aún
          setQrDetected(true);
          if (navigator.vibrate) navigator.vibrate(50);

          // Si quieres que se una automáticamente al detectar:
          // joinHost(text);
          // setScanResult(text);
          // setScanActive(false);
        }
      }
    },
    timeBetweenDecodingAttempts: 200,
    constraints: scanActive
      ? {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      }
      : false,
  });




  // 🧩 Crear partida (host)
  const startHost = () => {
    const h = createHostPeer((data) => {
      setMessages((m) => [...m, "Jugador: " + data]);
    });
    h.peer.on("open", (id) => setPeerId(id));
    setHost(h);
    setMode("host");
    if (navigator.vibrate) navigator.vibrate(50);
  };

  // 🔗 Unirse a partida (guest)
  const joinHost = (id) => {
    const c = connectToHost(id, (data) => {
      setMessages((m) => [...m, "Host: " + data]);
    });
    setConn(c);
    setMode("joined");
    if (navigator.vibrate) navigator.vibrate(40);
  };

  // ✉️ Enviar mensaje (temporal)
  const sendMsg = () => {
    const msg = text.trim();
    if (!msg) return;
    setMessages((m) => [...m, "Yo: " + msg]);
    if (host) host.broadcast(msg);
    if (conn) conn.send(msg);
    setText("");
  };

  // 🔙 Reiniciar vista
  const resetView = () => {
    setMode(null);
    setHost(null);
    setConn(null);
    setPeerId("");
    setScanResult("");
    setMessages([]);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 text-center">
      <h1 className="text-3xl font-bold mb-6">🕵️‍♂️ SpyWord</h1>

      {/* Menú principal */}
      {!mode && (
        <div className="flex flex-col gap-4">
          <button
            onClick={startHost}
            className="bg-emerald-500 px-6 py-3 rounded-xl text-lg font-semibold hover:bg-emerald-600 active:scale-95 transition-all"
          >
            🧩 Crear partida
          </button>
          <button
            onClick={() => setMode("join")}
            className="bg-blue-500 px-6 py-3 rounded-xl text-lg font-semibold hover:bg-blue-600 active:scale-95 transition-all"
          >
            🔗 Unirse a partida
          </button>
        </div>
      )}

      {/* Vista de host */}
      {mode === "host" && (
        <div className="flex flex-col items-center gap-4 mt-6">
          <p className="text-lg">Comparte este código o QR para que se unan:</p>
          {peerId ? (
            <>
              <div className="bg-black/30 p-4 rounded-xl">
                <QRCodeCanvas
                  value={peerId}
                  size={180}
                  bgColor="#000000"
                  fgColor="#00ff99"
                />
              </div>
              <p className="mt-2 text-amber-400 font-mono text-sm break-all">
                {peerId}
              </p>
              <button
                onClick={() => navigator.clipboard.writeText(peerId)}
                className="text-xs underline hover:text-amber-300"
              >
                Copiar código
              </button>
            </>
          ) : (
            <p className="animate-pulse text-gray-400">Generando ID...</p>
          )}

          <button
            onClick={resetView}
            className="mt-6 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-all"
          >
            🔙 Volver
          </button>
        </div>
      )}

      {/* Vista de unir */}
      {mode === "join" && (
        <div className="flex flex-col items-center gap-4 mt-4">
          <p className="text-lg">Escanea el QR del anfitrión:</p>

          <div
            className={`relative w-[250px] h-[250px] rounded-xl overflow-hidden flex items-center justify-center border-4 transition-all duration-300 ${qrDetected
                ? "border-green-400 shadow-[0_0_20px_2px_rgba(0,255,100,0.6)]"
                : "border-emerald-400"
              }`}
          >
            {/* Cámara activa */}
            {scanActive && !scanResult && (
              <video
                ref={ref}
                className="absolute w-full h-full object-cover rounded-lg"
                autoPlay
                muted
              />
            )}

            {/* Botón Escanear */}
            {!scanActive && !scanResult && (
              <button
                onClick={() => {
                  setScanActive(true);
                  setScanResult("");
                  setQrDetected(false);
                  setValidQr("");
                }}
                className="z-10 bg-emerald-500 px-5 py-2 rounded-full font-semibold hover:bg-emerald-600 active:scale-95 transition-all animate-pulse"
              >
                📷 Escanear
              </button>
            )}

            {/* Estado conectado */}
            {scanResult && (
              <p className="text-emerald-400 text-sm z-10 font-semibold text-center p-2">
                ✅ Conectado con:
                <br /> {scanResult}
              </p>
            )}
          </div>

          {/* Botón “Unirse” manual */}
          {!scanResult && (
            <button
              disabled={!validQr}
              onClick={() => {
                if (validQr) {
                  joinHost(validQr);
                  setScanResult(validQr);
                  setScanActive(false);
                  if (navigator.vibrate) navigator.vibrate(80);
                }
              }}
              className={`mt-3 px-6 py-2 rounded-lg font-semibold transition-all ${validQr
                  ? "bg-green-500 hover:bg-green-600 active:scale-95"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
            >
              🔗 Unirse
            </button>
          )}

          <p className="text-sm mt-2">O ingresa el código manualmente:</p>
          <div className="flex gap-2 mt-1">
            <input
              className="bg-gray-800 px-3 py-2 rounded-lg w-40 text-sm"
              placeholder="Código de partida"
              value={peerId}
              onChange={(e) => {
                setPeerId(e.target.value);
                setValidQr(e.target.value.trim());
              }}
            />
            <button
              onClick={() => joinHost(peerId)}
              className="bg-emerald-500 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-600"
            >
              Unirse
            </button>
          </div>

          <button
            onClick={resetView}
            className="mt-6 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-all"
          >
            🔙 Volver
          </button>
        </div>
      )}




      {/* Vista de mensajes (debug/test) */}
      {(mode === "host" || mode === "joined") && (
        <div className="w-full max-w-sm bg-black/30 rounded-lg p-4 mt-8 text-left">
          <h3 className="font-semibold mb-2">Chat de prueba:</h3>
          <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
            {messages.map((m, i) => (
              <p key={i}>{m}</p>
            ))}
          </div>

          <div className="flex gap-2 mt-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Mensaje"
              className="bg-gray-800 px-3 py-2 rounded w-full"
            />
            <button
              onClick={sendMsg}
              className="bg-amber-500 px-3 py-2 rounded font-semibold hover:bg-amber-400"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
