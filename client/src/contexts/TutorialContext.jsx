import { createContext, useContext, useState, useEffect } from "react";

const TutorialContext = createContext();

export function TutorialProvider({ children }) {
  // Tutorial de Home (solo primera visita)
  const [run, setRun] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  // Tutorial de Room (solo se muestra cuando el usuario hace clic en el botón de ayuda)
  const [runRoom, setRunRoom] = useState(false);

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

  const startRoomTutorial = () => {
    setRunRoom(true);
  };

  const stopRoomTutorial = () => {
    setRunRoom(false);
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
