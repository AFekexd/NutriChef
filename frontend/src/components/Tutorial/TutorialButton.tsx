// Tutorial disabled for now
// import { useTutorial } from "@/hooks/useTutorial";
// import { HelpCircle } from "lucide-react";

interface TutorialButtonProps {
  className?: string;
  text?: string;
}

export function TutorialButton(_props: TutorialButtonProps) {
  // Tutorial disabled for now
  return null;

  // const { startTutorial } = useTutorial();

  // return (
  //   <button
  //     onClick={startTutorial}
  //     className={`flex items-center gap-2 px-4 py-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all ${className}`}
  //     title="Start Tutorial"
  //   >
  //     <HelpCircle className="w-5 h-5" />
  //     {text && <span className="font-medium">{text}</span>}
  //   </button>
  // );
}
