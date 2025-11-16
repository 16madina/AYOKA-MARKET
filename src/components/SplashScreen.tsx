import { useEffect, useState } from "react";
import djassaLogo from "@/assets/djassa-logo.png";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        onFinish();
      }, 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <img
          src={djassaLogo}
          alt="DJASSA Market Logo"
          className="w-64 md:w-80 animate-scale-in"
          style={{ animationDelay: "0.2s" }}
        />
      </div>
    </div>
  );
};

export default SplashScreen;
