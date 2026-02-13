import { useEffect, useRef } from "react";

export default function MatrixBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Check if mobile device
    const isMobile = window.innerWidth <= 768;
    
    const characters = '01';  // Simplified characters for better performance
    const maxChars = isMobile ? 15 : 50;  // Much fewer characters on mobile
    const interval_delay = isMobile ? 800 : 300;  // Slower creation on mobile
    
    const createMatrixChar = () => {
      // Skip creating new characters if there are too many
      if (container.children.length >= maxChars) return;

      const char = document.createElement('div');
      char.className = 'matrix-char';
      char.textContent = characters[Math.floor(Math.random() * characters.length)];
      char.style.left = Math.random() * 100 + '%';
      char.style.animationDelay = Math.random() * (isMobile ? 40 : 20) + 's';
      char.style.animationDuration = (Math.random() * (isMobile ? 20 : 10) + (isMobile ? 20 : 10)) + 's';
      container.appendChild(char);

      // Remove character after animation completes
      const animationDuration = isMobile ? 40000 : 20000;
      setTimeout(() => {
        if (container.contains(char)) {
          container.removeChild(char);
        }
      }, animationDuration);
    };

    // Create initial characters (fewer on mobile)
    const initialChars = isMobile ? 10 : 30;
    for (let i = 0; i < initialChars; i++) {
      setTimeout(createMatrixChar, i * (isMobile ? 500 : 200));
    }

    // Continue creating characters
    const interval = setInterval(createMatrixChar, interval_delay);

    return () => {
      clearInterval(interval);
      // Clean up any remaining characters
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, []);

  return <div ref={containerRef} className="matrix-bg" />;
}
