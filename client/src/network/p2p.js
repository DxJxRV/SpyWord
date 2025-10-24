import Peer from "peerjs";

let currentPeer = null;
let connections = [];

// 🧩 Crear anfitrión
export function createHostPeer(onMessage) {
  const peer = new Peer();

  peer.on("open", (id) => {
    console.log("Host listo con ID:", id);
  });

  peer.on("connection", (conn) => {
    console.log("Nuevo jugador conectado:", conn.peer);
    connections.push(conn);

    conn.on("data", (data) => {
      console.log("Mensaje de", conn.peer, ":", data);
      onMessage?.(data);
      // Retransmitir a todos (broadcast)
      connections.forEach((c) => {
        if (c !== conn && c.open) c.send(data);
      });
    });

    conn.on("close", () => {
      console.log("Jugador desconectado:", conn.peer);
      connections = connections.filter((c) => c !== conn);
    });
  });

  currentPeer = peer;
  return { peer, broadcast: (msg) => connections.forEach((c) => c.open && c.send(msg)) };
}

// 🔗 Unirse a anfitrión
export function connectToHost(hostId, onMessage) {
  const peer = new Peer();

  peer.on("open", () => {
    const conn = peer.connect(hostId);
    conn.on("open", () => {
      console.log("Conectado al host:", hostId);
      connections.push(conn);
    });

    conn.on("data", (data) => {
      console.log("Mensaje del host:", data);
      onMessage?.(data);
    });
  });

  peer.on("error", (err) => {
    console.error("Error de PeerJS:", err);
  });

  currentPeer = peer;
  return {
    peer,
    send: (msg) => {
      connections.forEach((c) => c.open && c.send(msg));
    },
  };
}

// 🧹 Cerrar conexiones
export function closePeer() {
  currentPeer?.destroy();
  currentPeer = null;
  connections = [];
}
