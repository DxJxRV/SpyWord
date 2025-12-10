import { HelpCircle } from "lucide-react";
import { useTutorial } from "../contexts/TutorialContext";

export default function TutorialButton({ isRoom = false }) {
  const { startTutorial, startRoomTutorial } = useTutorial();

  const handleClick = () => {
    if (isRoom) {
      startRoomTutorial();
    } else {
      startTutorial();
    }
  };

  return (
    <button
      data-tutorial="tutorial-button"
      onClick={handleClick}
      className="fixed bottom-20 left-4 bg-blue-500/90 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 z-30 backdrop-blur-sm border-2 border-blue-400/50"
      title="¿Cómo jugar?"
      aria-label="Tutorial"
    >
      <HelpCircle size={24} />
    </button>
  );
}
