import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import { Button } from "./ui/button";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <Button
      onClick={scrollToTop}
      className={
        "fixed bottom-24 md:bottom-8 right-8 z-50 w-12 h-12 rounded-full" +
        " bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700" +
        " hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 p-0" +
        ` ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`
      }
    >
      <ChevronUp className="w-6 h-6" />
    </Button>
  );
}
