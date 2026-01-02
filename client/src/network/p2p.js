import Peer from "peerjs";

let currentPeer = null;
let connections = [];

// 🧩 Crear anfitrión - Retorna una promesa que se resuelve cuando el peer está listo
export function createHostPeer(onMessage) {
  return new Promise((resolve, reject) => {
    const peer = new Peer();

    peer.on("open", (id) => {
      console.log("Host listo con ID:", id);
      currentPeer = peer;
      resolve(id);
    });

    peer.on("error", (err) => {
      console.error("Error al crear host:", err);
      reject(err);
    });

    peer.on("connection", (conn) => {
      console.log("Nuevo jugador conectado:", conn.peer);
      connections.push(conn);

      conn.on("data", (data) => {
        console.log("Mensaje de", conn.peer, ":", data);
        onMessage?.(conn.peer, data);
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
  });
}

// 🔗 Unirse a anfitrión - Retorna una promesa que se resuelve cuando está conectado
export function connectToHost(hostId, onMessage) {
  return new Promise((resolve, reject) => {
    const peer = new Peer();

    peer.on("open", () => {
      const conn = peer.connect(hostId);

      conn.on("open", () => {
        console.log("Conectado al host:", hostId);
        connections.push(conn);
        currentPeer = peer;
        resolve(conn);
      });

      conn.on("data", (data) => {
        console.log("Mensaje del host:", data);
        onMessage?.(data);
      });

      conn.on("error", (err) => {
        console.error("Error en conexión:", err);
        reject(err);
      });
    });

    peer.on("error", (err) => {
      console.error("Error de PeerJS:", err);
      reject(err);
    });
  });
}

// 🧹 Cerrar conexiones
export function closePeer() {
  currentPeer?.destroy();
  currentPeer = null;
  connections = [];
}
