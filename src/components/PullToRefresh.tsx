import { ReactNode, useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export const PullToRefresh = ({ onRefresh, children }: PullToRefreshProps) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const PULL_THRESHOLD = 80;
  const MAX_PULL = 120;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        setStartY(e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY === 0 || isRefreshing) return;
      
      const currentY = e.touches[0].clientY;
      const distance = currentY - startY;
      
      if (distance > 0 && container.scrollTop === 0) {
        e.preventDefault();
        setPullDistance(Math.min(distance, MAX_PULL));
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        
        // Haptic feedback for mobile
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }

        try {
          await Promise.all([
            onRefresh(),
            new Promise(resolve => setTimeout(resolve, 800))
          ]);
          toast.success("Actualisé");
        } catch (error) {
          toast.error("Erreur lors de l'actualisation");
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
          setStartY(0);
        }
      } else {
        setPullDistance(0);
        setStartY(0);
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [startY, pullDistance, isRefreshing, onRefresh]);

  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const rotation = pullProgress * 360;

  return (
    <div ref={containerRef} className="relative h-full overflow-auto">
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 z-50"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
      >
        <div
          className="flex items-center justify-center w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm shadow-lg"
          style={{
            transform: `scale(${Math.min(pullProgress, 1)})`,
          }}
        >
          {isRefreshing ? (
            <Loader2 className="h-5 w-5 text-[#ea384c] animate-spin" />
          ) : (
            <Loader2
              className="h-5 w-5 text-[#ea384c]"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${isRefreshing ? PULL_THRESHOLD : pullDistance}px)`,
          transition: isRefreshing ? "transform 0.2s ease-out" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
};
