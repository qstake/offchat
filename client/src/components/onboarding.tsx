import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight, ChevronLeft, X } from "lucide-react";

const ONBOARDING_KEY = "offchat_onboarding_completed";

function MatrixRainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const chars = 'ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンヴ日月火水木金土天地人心道力光闇風雷電雨雲海山川空星花夢影命魂龍鬼神';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(0).map(() => Math.random() * -50);

    let animId: number;
    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        if (Math.random() > 0.4) continue;
        const char = chars[Math.floor(Math.random() * chars.length)];
        const alpha = 0.08 + Math.random() * 0.12;
        ctx.fillStyle = `rgba(0, 255, 65, ${alpha})`;
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.97) {
          drops[i] = 0;
        }
        drops[i] += 0.3 + Math.random() * 0.2;
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

function AnimatedIcon({ step, isActive }: { step: number; isActive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 120;
    canvas.width = size;
    canvas.height = size;

    let animId: number;
    let frame = 0;

    const drawStep0 = () => {
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;

      for (let ring = 0; ring < 3; ring++) {
        const r = 20 + ring * 14;
        const segments = 8 + ring * 4;
        for (let i = 0; i < segments; i++) {
          const angle = (i / segments) * Math.PI * 2 + frame * 0.02 * (ring % 2 === 0 ? 1 : -1);
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          const alpha = 0.3 + Math.sin(frame * 0.05 + i) * 0.3;
          ctx.fillStyle = `rgba(0, 255, 65, ${alpha})`;
          ctx.font = '10px monospace';
          const chars = 'OFFCHAT';
          ctx.fillText(chars[i % chars.length], x - 3, y + 3);
        }
      }

      ctx.strokeStyle = `rgba(0, 255, 65, ${0.4 + Math.sin(frame * 0.03) * 0.2})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(0, 255, 65, ${0.6 + Math.sin(frame * 0.04) * 0.3})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawStep1 = () => {
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const matrixChars = 'ァアカサタナハマヤラワ日月火水';

      for (let i = 0; i < 6; i++) {
        const startY = ((frame * 1.5 + i * 30) % (size + 20)) - 10;
        const x = 15 + i * 18;
        for (let j = 0; j < 5; j++) {
          const y = startY + j * 14;
          if (y < 0 || y > size) continue;
          const alpha = j === 0 ? 0.8 : 0.15 + (4 - j) * 0.1;
          ctx.fillStyle = `rgba(0, 255, 65, ${alpha})`;
          ctx.font = '11px monospace';
          ctx.fillText(matrixChars[Math.floor(Math.random() * matrixChars.length)], x, y);
        }
      }

      ctx.strokeStyle = `rgba(0, 255, 65, ${0.5 + Math.sin(frame * 0.05) * 0.3})`;
      ctx.lineWidth = 1.5;
      const bubbleW = 40;
      const bubbleH = 20;
      const bx = cx - bubbleW / 2;
      const by = cy - bubbleH / 2 + Math.sin(frame * 0.04) * 3;
      ctx.beginPath();
      ctx.roundRect(bx, by, bubbleW, bubbleH, 8);
      ctx.stroke();

      const dotY = by + bubbleH / 2;
      for (let d = 0; d < 3; d++) {
        const delay = d * 15;
        const pulse = Math.sin((frame + delay) * 0.1);
        const r = 2 + pulse * 0.5;
        ctx.fillStyle = `rgba(0, 255, 65, ${0.5 + pulse * 0.3})`;
        ctx.beginPath();
        ctx.arc(bx + 12 + d * 8, dotY, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawStep2 = () => {
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;

      ctx.strokeStyle = `rgba(0, 255, 65, ${0.4 + Math.sin(frame * 0.03) * 0.2})`;
      ctx.lineWidth = 1.5;
      const w = 44;
      const h = 30;
      ctx.beginPath();
      ctx.roundRect(cx - w / 2, cy - h / 2 + Math.sin(frame * 0.03) * 2, w, h, 6);
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(cx - w / 2 + 10, cy - h / 2 - 5 + Math.sin(frame * 0.03) * 2, w - 20, 8, 3);
      ctx.stroke();

      const chainCount = 6;
      for (let i = 0; i < chainCount; i++) {
        const angle = (i / chainCount) * Math.PI * 2 + frame * 0.015;
        const r = 40 + Math.sin(frame * 0.02 + i) * 3;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        const nodeAlpha = 0.4 + Math.sin(frame * 0.04 + i * 1.2) * 0.3;
        ctx.fillStyle = `rgba(0, 255, 65, ${nodeAlpha})`;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(0, 255, 65, ${nodeAlpha * 0.5})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    };

    const drawStep3 = () => {
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;

      for (let ring = 0; ring < 3; ring++) {
        const r = 25 + ring * 12;
        const dashLen = 6;
        const alpha = 0.2 + Math.sin(frame * 0.03 + ring) * 0.15;
        ctx.strokeStyle = `rgba(0, 255, 65, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([dashLen, dashLen]);
        ctx.lineDashOffset = frame * (ring % 2 === 0 ? 0.5 : -0.5);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      const shieldH = 28;
      const shieldW = 22;
      const sy = cy - shieldH / 2 + Math.sin(frame * 0.03) * 2;
      ctx.fillStyle = `rgba(0, 255, 65, ${0.15 + Math.sin(frame * 0.04) * 0.1})`;
      ctx.strokeStyle = `rgba(0, 255, 65, ${0.6 + Math.sin(frame * 0.04) * 0.2})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, sy);
      ctx.lineTo(cx + shieldW / 2, sy + shieldH * 0.3);
      ctx.lineTo(cx + shieldW / 2, sy + shieldH * 0.7);
      ctx.lineTo(cx, sy + shieldH);
      ctx.lineTo(cx - shieldW / 2, sy + shieldH * 0.7);
      ctx.lineTo(cx - shieldW / 2, sy + shieldH * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const checkAlpha = 0.7 + Math.sin(frame * 0.06) * 0.3;
      ctx.strokeStyle = `rgba(0, 255, 65, ${checkAlpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 6, sy + shieldH * 0.5);
      ctx.lineTo(cx - 1, sy + shieldH * 0.65);
      ctx.lineTo(cx + 7, sy + shieldH * 0.35);
      ctx.stroke();
    };

    const drawFunctions = [drawStep0, drawStep1, drawStep2, drawStep3];
    const drawFn = drawFunctions[step] || drawStep0;

    const animate = () => {
      frame++;
      drawFn();
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animId);
  }, [step, isActive]);

  return (
    <canvas
      ref={canvasRef}
      className="w-[120px] h-[120px]"
      style={{ imageRendering: 'auto' }}
    />
  );
}

const steps = [
  {
    title: "Welcome to Offchat",
    subtitle: "WEB3 MESSAGING PROTOCOL",
    description: "A secure, decentralized messaging platform with built-in crypto wallet. Communicate freely — even offline via Bluetooth mesh networking.",
  },
  {
    title: "Encrypted Messaging",
    subtitle: "END-TO-END ENCRYPTION",
    description: "Send messages with military-grade encryption. Create direct chats or group conversations. Your messages stay private — always.",
  },
  {
    title: "Multi-Chain Wallet",
    subtitle: "6 NETWORKS SUPPORTED",
    description: "Create a wallet with a 12-word recovery phrase. Send and receive tokens across Ethereum, BSC, Polygon, Arbitrum, Base, and Optimism.",
  },
  {
    title: "Privacy & Security",
    subtitle: "NON-CUSTODIAL ARCHITECTURE",
    description: "Your keys, your crypto. Zero data on servers. Non-custodial design means only you control your funds and messages.",
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleNext = useCallback(() => {
    if (isAnimating) return;
    if (currentStep < steps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep((s) => s + 1);
        setIsAnimating(false);
      }, 200);
    }
  }, [isAnimating, currentStep]);

  const handlePrev = useCallback(() => {
    if (isAnimating || currentStep === 0) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep((s) => s - 1);
      setIsAnimating(false);
    }, 200);
  }, [isAnimating, currentStep]);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    onComplete();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    setTouchStart(null);
  };

  const isLast = currentStep === steps.length - 1;
  const step = steps[currentStep];

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <MatrixRainCanvas />

      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-end px-5 pt-4" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
          <button
            onClick={handleComplete}
            className="text-green-400/40 hover:text-green-400/70 transition-colors text-xs font-mono tracking-wider px-3 py-1.5"
          >
            SKIP
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div
            className={`flex flex-col items-center text-center transition-all duration-200 ease-out w-full max-w-sm ${
              isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            }`}
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-green-500/5 blur-2xl scale-150" />
              <div className="relative w-[120px] h-[120px] rounded-full border border-green-500/20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <AnimatedIcon step={currentStep} isActive={!isAnimating} />
              </div>
            </div>

            <div className="text-green-400/50 text-[10px] font-mono tracking-[0.3em] mb-2">
              {step.subtitle}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-green-400 mb-3 font-mono leading-tight">
              {step.title}
            </h2>

            <div className="w-8 h-px bg-green-500/30 mb-4" />

            <p className="text-green-100/50 text-sm leading-relaxed max-w-[280px]">
              {step.description}
            </p>
          </div>
        </div>

        <div className="px-6 pb-8" style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center justify-center gap-3 mb-6">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  if (!isAnimating && i !== currentStep) {
                    setIsAnimating(true);
                    setTimeout(() => {
                      setCurrentStep(i);
                      setIsAnimating(false);
                    }, 200);
                  }
                }}
                className="p-1"
              >
                <div
                  className={`rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? "w-7 h-1.5 bg-green-400"
                      : i < currentStep
                      ? "w-1.5 h-1.5 bg-green-400/40"
                      : "w-1.5 h-1.5 bg-green-400/15"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="flex gap-3 w-full max-w-sm mx-auto">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="h-12 px-5 rounded-xl border border-green-500/20 bg-green-500/5 text-green-400 font-mono text-sm flex items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}

            {isLast ? (
              <button
                onClick={handleComplete}
                className="flex-1 h-12 rounded-xl bg-green-500 text-black font-bold font-mono text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-green-500/20"
              >
                Get Started
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex-1 h-12 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 font-mono text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-center mt-4">
            <span className="text-green-400/20 text-[10px] font-mono tracking-widest">
              {currentStep + 1} / {steps.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);

  return {
    showOnboarding,
    completeOnboarding: () => setShowOnboarding(false),
  };
}
