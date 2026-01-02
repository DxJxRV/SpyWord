import Peer from "peerjs";

let currentPeer = null;
let connections = [];
let activeCalls = []; // Llamadas de audio activas
let remoteAudios = {}; // {peerId: HTMLAudioElement}

// 🔊 Reproducir stream de audio remoto
function playRemoteStream(remoteStream, peerId) {
  // Si ya existe un audio para este peer, detenerlo primero
  if (remoteAudios[peerId]) {
    stopRemoteStream(peerId);
  }

  // Crear elemento de audio
  const audio = new Audio();
  audio.srcObject = remoteStream;
  audio.autoplay = true;
  audio.volume = 1.0;

  // IMPORTANTE: Forzar reproducción por bocina/speaker (no auricular de llamada)
  // En móviles, esto evita que salga por el earpiece
  audio.setAttribute('playsinline', '');
  audio.setAttribute('webkit-playsinline', '');

  // Intentar reproducir explícitamente (necesario en algunos navegadores)
  audio.play().catch(err => {
    console.warn("Advertencia al reproducir audio:", err);
  });

  // Guardar referencia
  remoteAudios[peerId] = audio;

  console.log("🔊 Reproduciendo audio de:", peerId);
}

// 🔇 Detener stream de audio remoto
function stopRemoteStream(peerId) {
  if (remoteAudios[peerId]) {
    remoteAudios[peerId].srcObject = null;
    delete remoteAudios[peerId];
    console.log("🔇 Audio detenido de:", peerId);
  }
}

// 🧩 Crear anfitrión - Retorna una promesa que se resuelve cuando el peer está listo
export function createHostPeer(onMessage, localStream) {
  return new Promise((resolve, reject) => {
    const peer = new Peer();

    peer.on("open", (id) => {
      console.log("🎤 Host listo con ID:", id);
      currentPeer = peer;
      resolve(id);
    });

    peer.on("error", (err) => {
      console.error("❌ Error al crear host:", err);
      reject(err);
    });

    // Manejar conexiones de data (metadata)
    peer.on("connection", (conn) => {
      console.log("📨 Nuevo jugador conectado (data):", conn.peer);
      connections.push(conn);

      conn.on("data", (data) => {
        onMessage?.(conn.peer, data);
        // Retransmitir a todos (broadcast)
        connections.forEach((c) => {
          if (c !== conn && c.open) c.send(data);
        });
      });

      conn.on("close", () => {
        console.log("❌ Jugador desconectado:", conn.peer);
        connections = connections.filter((c) => c !== conn);
      });
    });

    // Manejar llamadas de audio entrantes
    peer.on("call", (call) => {
      console.log("📞 Llamada de audio entrante de:", call.peer);

      // Responder con mi stream local
      call.answer(localStream);
      activeCalls.push(call);

      // Recibir el stream remoto
      call.on("stream", (remoteStream) => {
        console.log("🎵 Stream de audio recibido de:", call.peer);
        playRemoteStream(remoteStream, call.peer);
      });

      call.on("close", () => {
        console.log("📞 Llamada cerrada:", call.peer);
        activeCalls = activeCalls.filter((c) => c !== call);
        stopRemoteStream(call.peer);
      });

      call.on("error", (err) => {
        console.error("❌ Error en llamada:", err);
      });
    });
  });
}

// 🔗 Unirse a anfitrión - Retorna una promesa que se resuelve cuando está conectado
export function connectToHost(hostId, onMessage, localStream) {
  return new Promise((resolve, reject) => {
    const peer = new Peer();

    peer.on("open", () => {
      console.log("🔗 Peer abierto, conectando al host...");

      // 1. Establecer conexión de data
      const conn = peer.connect(hostId);

      conn.on("open", () => {
        console.log("✅ Conectado al host (data):", hostId);
        connections.push(conn);
        currentPeer = peer;

        // 2. Iniciar llamada de audio
        console.log("📞 Iniciando llamada de audio al host...");
        const call = peer.call(hostId, localStream);
        activeCalls.push(call);

        // Recibir el stream remoto del host
        call.on("stream", (remoteStream) => {
          console.log("🎵 Stream de audio del host recibido");
          playRemoteStream(remoteStream, hostId);
        });

        call.on("close", () => {
          console.log("📞 Llamada cerrada con host");
          activeCalls = activeCalls.filter((c) => c !== call);
          stopRemoteStream(hostId);
        });

        call.on("error", (err) => {
          console.error("❌ Error en llamada con host:", err);
        });

        resolve(conn);
      });

      conn.on("data", (data) => {
        onMessage?.(data);
      });

      conn.on("error", (err) => {
        console.error("❌ Error en conexión:", err);
        reject(err);
      });
    });

    peer.on("error", (err) => {
      console.error("❌ Error de PeerJS:", err);
      reject(err);
    });
  });
}

// 📡 Broadcast mensaje a todas las conexiones (solo para host)
export function broadcastMessage(message) {
  connections.forEach((conn) => {
    if (conn.open) {
      try {
        conn.send(message);
      } catch (e) {
        console.error("Error al enviar mensaje:", e);
      }
    }
  });
}

// 📤 Enviar mensaje a conexión específica
export function sendMessage(message) {
  // Para clientes, enviar al primer (y único) connection que es el host
  if (connections.length > 0 && connections[0].open) {
    try {
      connections[0].send(message);
    } catch (e) {
      console.error("Error al enviar mensaje:", e);
    }
  }
}

// 🔇 Silenciar/activar todos los streams locales (micrófono)
export function setLocalMuted(muted) {
  activeCalls.forEach((call) => {
    // Obtener todos los tracks de audio del stream local de la llamada
    if (call.peerConnection) {
      const senders = call.peerConnection.getSenders();
      senders.forEach((sender) => {
        if (sender.track && sender.track.kind === 'audio') {
          sender.track.enabled = !muted;
        }
      });
    }
  });
  console.log(`🎤 Micrófono ${muted ? 'silenciado' : 'activado'}`);
}

// 🔇 Silenciar/activar todos los streams remotos (audio/speakers)
export function setSpeakersMuted(muted) {
  Object.values(remoteAudios).forEach((audio) => {
    audio.muted = muted;
  });
  console.log(`🔊 Audio ${muted ? 'silenciado' : 'activado'}`);
}

// 🧹 Cerrar conexiones
export function closePeer() {
  // Cerrar todas las llamadas de audio
  activeCalls.forEach((call) => {
    try {
      call.close();
    } catch (e) {
      console.error("Error al cerrar llamada:", e);
    }
  });
  activeCalls = [];

  // Detener todos los audios remotos
  Object.keys(remoteAudios).forEach((peerId) => {
    stopRemoteStream(peerId);
  });

  // Cerrar peer
  currentPeer?.destroy();
  currentPeer = null;
  connections = [];

  console.log("🧹 Peer cerrado completamente");
}
