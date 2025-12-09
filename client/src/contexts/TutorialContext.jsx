import { createContext, useContext, useState, useEffect } from "react";

const TutorialContext = createContext();

export function TutorialProvider({ children }) {
  // Tutorial de Home (solo primera visita)
  const [run, setRun] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  // Tutorial de Room (siempre se muestra, a menos que marquen "no volver a mostrar")
  const [runRoom, setRunRoom] = useState(false);
  const [dontShowRoomTutorial, setDontShowRoomTutorial] = useState(false);

  // Verificar si el usuario ya vio el tutorial de Home (localStorage)
  useEffect(() => {
    const seen = localStorage.getItem("spyword_tutorial_seen");
    if (!seen) {
      // Primera visita - mostrar tutorial automáticamente después de 1 segundo
      setTimeout(() => {
        setRun(true);
      }, 1000);
    } else {
      setHasSeenTutorial(true);
    }

    // Verificar si marcaron "no volver a mostrar" para Room
    const dontShowRoom = localStorage.getItem("spyword_room_tutorial_disabled");
    if (dontShowRoom === "true") {
      setDontShowRoomTutorial(true);
    }
  }, []);

  const startTutorial = () => {
    setRun(true);
  };

  const stopTutorial = () => {
    setRun(false);
    // Marcar como visto
    localStorage.setItem("spyword_tutorial_seen", "true");
    setHasSeenTutorial(true);
  };

  const resetTutorial = () => {
    localStorage.removeItem("spyword_tutorial_seen");
    setHasSeenTutorial(false);
  };

  const startRoomTutorial = (force = false) => {
    // Si es forzado (click manual del botón), siempre mostrar
    // Si no, respetar la preferencia del usuario
    if (force || !dontShowRoomTutorial) {
      setRunRoom(true);
    }
  };

  const stopRoomTutorial = (dontShowAgain = false) => {
    setRunRoom(false);
    if (dontShowAgain) {
      localStorage.setItem("spyword_room_tutorial_disabled", "true");
      setDontShowRoomTutorial(true);
    }
  };

  const resetRoomTutorial = () => {
    localStorage.removeItem("spyword_room_tutorial_disabled");
    setDontShowRoomTutorial(false);
  };

  return (
    <TutorialContext.Provider
      value={{
        run,
        setRun,
        startTutorial,
        stopTutorial,
        resetTutorial,
        hasSeenTutorial,
        runRoom,
        setRunRoom,
        startRoomTutorial,
        stopRoomTutorial,
        resetRoomTutorial,
        dontShowRoomTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial debe usarse dentro de TutorialProvider");
  }
  return context;
}
