import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { ChevronRight, Loader2 } from "lucide-react";

interface SwipeSliderProps {
  onSwipeComplete: () => void;
  isLoading?: boolean;
  variant?: "primary" | "destructive";
  text?: string;
  className?: string;
  "data-testid"?: string;
}

export function SwipeSlider({ 
  onSwipeComplete, 
  isLoading = false, 
  variant = "primary",
  text = "Slide to confirm",
  className,
  "data-testid": testId
}: SwipeSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const resetSlider = () => {
    setDragOffset(0);
    setIsComplete(false);
  };

  useEffect(() => {
    if (!isLoading) {
      resetSlider();
    }
  }, [isLoading]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isLoading || isComplete) return;
    setIsDragging(true);
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isLoading || isComplete) return;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || !containerRef.current || !handleRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const handleWidth = handleRef.current.offsetWidth;
    const maxOffset = containerRect.width - handleWidth - 8; // 8px for padding

    let newOffset = clientX - containerRect.left - handleWidth / 2;
    newOffset = Math.max(0, Math.min(newOffset, maxOffset));

    setDragOffset(newOffset);

    // Check if swiped far enough (80% of container width)
    if (newOffset > maxOffset * 0.8) {
      setIsComplete(true);
      setIsDragging(false);
      onSwipeComplete();
    }
  };

  const handleMouseUp = () => {
    if (!isComplete) {
      resetSlider();
    }
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    if (!isComplete) {
      resetSlider();
    }
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => handleMove(e.clientX);
      const handleGlobalTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
      
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleGlobalTouchMove);
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleGlobalTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging]);

  const bgColorClass = variant === "destructive" 
    ? "bg-destructive/10" 
    : "bg-primary/10";
  
  const handleColorClass = variant === "destructive" 
    ? "bg-destructive text-destructive-foreground" 
    : "bg-primary text-primary-foreground";

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative rounded-full p-2",
        bgColorClass,
        className
      )}
      data-testid={testId}
    >
      <div className="relative flex items-center">
        <div
          ref={handleRef}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shadow-lg cursor-grab transition-all duration-300 select-none z-10",
            handleColorClass,
            isDragging && "cursor-grabbing scale-105"
          )}
          style={{
            transform: `translateX(${dragOffset}px)`,
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </div>
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-medium pointer-events-none">
          {isComplete ? "Complete!" : text}
        </div>
      </div>
    </div>
  );
}
