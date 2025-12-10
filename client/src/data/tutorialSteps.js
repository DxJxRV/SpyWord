export const tutorialStepsHome = [
  {
    target: "body",
    content: "¡Bienvenido a Impostor Word! 🕵️‍♂️\n\nJuego de deducción social donde descubres quién es el impostor.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="user-name-bar"]',
    content: "Tu nombre de usuario.\n\nSe genera automáticamente, pero puedes hacer clic para editarlo cuando quieras.",
    placement: "bottom",
  },
  {
    target: '[data-tutorial="create-button"]',
    content: "Este botón CREA una partida.\n\nSerás el líder de la sala y entrarás directamente al juego.",
    placement: "bottom",
  },
  {
    target: '[data-tutorial="join-button"]',
    content: "Este botón te UNE a una partida existente.",
    placement: "bottom",
  },
  {
    target: '[data-tutorial="join-code-input"]',
    content: "Ingresa aquí el código de 6 letras.\n\nO escanea el QR con tu cámara para ir directo al juego.",
    placement: "bottom",
  },
  {
    target: "body",
    content: "Reglas básicas:\n\n1. Todos ven una palabra secreta\n\n2. El impostor ve '???'\n\n3. Hablen por turnos\n\n4. Descubran al impostor\n\n¡A jugar! 🎉",
    placement: "center",
  },
  {
    target: '[data-tutorial="tutorial-button"]',
    content: "¿Necesitas ver el tutorial de nuevo?\n\nPresiona este botón en cualquier momento para repetir el tutorial.",
    placement: "top",
  },
];

export const tutorialStepsRoom = [
  {
    target: "body",
    content: "¡Estás en la sala de juego! 🎮\n\nTe mostraré cada elemento.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="room-navbar-name"]',
    content: "Tu nombre de usuario en la sala.\n\nHaz clic para editarlo en cualquier momento.",
    placement: "bottom",
  },
  {
    target: '[data-tutorial="room-info"]',
    content: "Información de la partida.\n\nRonda actual y jugadores conectados.",
    placement: "bottom",
  },
  {
    target: '[data-tutorial="starter-name"]',
    content: "Jugador que inicia la ronda.\n\nEsta persona habla primero describiendo su palabra.",
    placement: "bottom",
  },
  {
    target: '[data-tutorial="word-card"]',
    content: "Tu palabra secreta.\n\nPalabra normal = Jugador\n'???' = IMPOSTOR 🕵️",
    placement: "bottom",
  },
  {
    target: '[data-tutorial="hide-word"]',
    content: "Oculta tu palabra.\n\nPara que nadie vea tu pantalla.",
    placement: "left",
  },
  {
    target: '[data-tutorial="restart-button"]',
    content: "Reinicia la partida.\n\nSolo el administrador puede usar este botón para empezar una nueva ronda.",
    placement: "top",
  },
  {
    target: '[data-tutorial="share-button"]',
    content: "Comparte la sala.\n\nInvita más jugadores con un link.",
    placement: "top",
  },
  {
    target: '[data-tutorial="qr-button"]',
    content: "Muestra el código QR.\n\nTus amigos pueden escanearlo con la cámara nativa de su dispositivo para unirse directamente.",
    placement: "top",
  },
  {
    target: "body",
    content: "¡Todo listo! 🎉\n\nCómo jugar:\n\n1. Hablen por turnos\n\n2. Describan su palabra\n\n3. Descubran al impostor\n\n¡Diviértete!",
    placement: "center",
  },
];
