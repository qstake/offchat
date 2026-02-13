import React, { useEffect, useState, useRef, useCallback } from 'react';

// Japanese and Chinese characters for the matrix effect
const matrixChars = [
  // Japanese Hiragana
  'あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ',
  'さ', 'し', 'す', 'せ', 'そ', 'た', 'ち', 'つ', 'て', 'と',
  'な', 'に', 'ぬ', 'ね', 'の', 'は', 'ひ', 'ふ', 'へ', 'ほ',
  'ま', 'み', 'む', 'め', 'も', 'や', 'ゆ', 'よ', 'ら', 'り',
  'る', 'れ', 'ろ', 'わ', 'を', 'ん',
  
  // Japanese Katakana
  'ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク', 'ケ', 'コ',
  'サ', 'シ', 'ス', 'セ', 'ソ', 'タ', 'チ', 'ツ', 'テ', 'ト',
  'ナ', 'ニ', 'ヌ', 'ネ', 'ノ', 'ハ', 'ヒ', 'フ', 'ヘ', 'ホ',
  'マ', 'ミ', 'ム', 'メ', 'モ', 'ヤ', 'ユ', 'ヨ', 'ラ', 'リ',
  'ル', 'レ', 'ロ', 'ワ', 'ヲ', 'ン',
  
  // Chinese characters
  '中', '国', '人', '的', '一', '是', '在', '不', '了', '有',
  '和', '人', '这', '中', '大', '为', '上', '个', '国', '我',
  '以', '要', '他', '时', '来', '用', '们', '生', '到', '作',
  '地', '于', '出', '就', '分', '对', '成', '会', '可', '主',
  '发', '年', '动', '同', '工', '也', '能', '下', '过', '子',
  '说', '产', '种', '面', '而', '方', '后', '多', '定', '行',
  
  // Some English letters for variety
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
];

interface MatrixChar {
  element: HTMLDivElement | null;
  char: string;
  speed: number;
  position: number;
  opacity: number;
}

interface MatrixColumn {
  id: number;
  x: number;
  chars: MatrixChar[];
  element: HTMLDivElement | null;
}

interface AnimatedBackgroundProps {
  opacity?: number;
}

export function AnimatedBackground({ opacity = 0.1 }: AnimatedBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<MatrixColumn[]>([]);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Initialize columns with ref-based architecture
  const initializeColumns = useCallback(() => {
    if (!containerRef.current || dimensions.width === 0) return;

    // Clear existing columns
    columnsRef.current.forEach(column => {
      if (column.element?.parentNode) {
        column.element.parentNode.removeChild(column.element);
      }
    });
    columnsRef.current = [];

    // Reduce density on mobile for better performance
    const isMobile = window.innerWidth <= 768;
    const columnWidth = isMobile ? 45 : 30; // Even wider columns on mobile
    const maxColumns = isMobile ? 15 : 35; // Fewer columns on mobile
    const numColumns = Math.min(Math.floor(dimensions.width / columnWidth), maxColumns);
    
    for (let i = 0; i < numColumns; i++) {
      // Skip some columns randomly for more sparse effect
      if (Math.random() < 0.4) continue;
      
      const columnElement = document.createElement('div');
      columnElement.className = 'absolute top-0 font-mono text-sm';
      columnElement.style.left = `${i * columnWidth}px`;
      columnElement.style.willChange = 'transform';
      containerRef.current.appendChild(columnElement);

      const numChars = Math.floor(Math.random() * 6) + 2; // 2-7 characters per column (further reduced)
      const chars: MatrixChar[] = [];
      
      for (let j = 0; j < numChars; j++) {
        const charElement = document.createElement('div');
        charElement.className = 'absolute whitespace-nowrap text-green-500/40 matrix-char-optimized';
        charElement.style.textShadow = '0 0 2px rgba(34, 197, 94, 0.3)';
        charElement.style.willChange = 'transform';
        
        const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        const baseSpeed = isMobile ? 0.3 : 1.0; // Much slower on mobile for 60fps
        const speed = Math.random() * baseSpeed + 0.1;
        const position = Math.random() * dimensions.height - 100;
        const opacity = Math.random() * 0.3 + 0.4;
        
        charElement.textContent = char;
        charElement.style.opacity = opacity.toString();
        charElement.style.transform = `translateY(${position}px)`;
        
        columnElement.appendChild(charElement);
        
        chars.push({
          element: charElement,
          char,
          speed,
          position,
          opacity
        });
      }
      
      columnsRef.current.push({
        id: i,
        x: i * columnWidth,
        chars,
        element: columnElement
      });
    }
  }, [dimensions]);

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Initialize columns when dimensions change
  useEffect(() => {
    initializeColumns();
  }, [initializeColumns]);

  // 60fps animation loop using refs for direct DOM manipulation
  useEffect(() => {
    if (columnsRef.current.length === 0) return;
    
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    
    const isMobile = window.innerWidth <= 768;
    
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      
      // Target 60fps - update every ~16ms
      if (deltaTime >= 16) {
        const scaledDelta = deltaTime * (isMobile ? 0.6 : 1.0); // Slower on mobile
        
        // Update positions directly via DOM for maximum performance
        columnsRef.current.forEach(column => {
          column.chars.forEach(char => {
            if (!char.element) return;
            
            char.position += char.speed * scaledDelta * 0.05;
            
            // Reset position when character goes off screen
            if (char.position > dimensions.height + 50) {
              char.position = -100;
              // Occasionally change character for variety
              if (Math.random() < 0.1) {
                char.char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
                char.element.textContent = char.char;
              }
            }
            
            // Update transform directly - no React reconciliation
            char.element.style.transform = `translateY(${char.position}px)`;
          });
        });
        
        lastTimeRef.current = currentTime;
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dimensions.height]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      style={{ 
        opacity,
        contain: 'layout style paint' // Performance optimization
      }}
    >
    </div>
  );
}

export default AnimatedBackground;