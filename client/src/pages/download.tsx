import { useEffect, useState } from "react";
import { Download, Star, Shield, MessageCircle, Wallet, ChevronDown, ChevronUp } from "lucide-react";

const APP_VERSION = "1.0.0";
const APK_SIZE = "19.7 MB";
const APK_URL = "/OFFCHAT.apk";

function MatrixRain() {
  useEffect(() => {
    const canvas = document.getElementById("matrix-rain-download") as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン田由甲申丰力月片竹戈十大中人火山口女子日";
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ff4120";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      id="matrix-rain-download"
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.3 }}
    />
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? "fill-green-400 text-green-400" : "text-gray-600"}`}
        />
      ))}
    </div>
  );
}

export default function DownloadPage() {
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  useEffect(() => {
    document.title = "Download Offchat for Android | Offchat";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "Download Offchat APK for Android. Web3 encrypted messaging with multi-chain crypto wallet, token swapping, and NFT management.");
    }
  }, []);

  const handleDownload = () => {
    setDownloadStarted(true);
    const link = document.createElement("a");
    link.href = APK_URL;
    link.download = "OFFCHAT.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloadStarted(false), 3000);
  };

  const screenshots = [
    "/appexample/example1.png",
    "/appexample/example2.png",
    "/appexample/example3.png",
    "/appexample/example4.png",
    "/appexample/example5.png",
    "/appexample/example6.png",
    "/appexample/example7.png",
    "/appexample/example8.png",
    "/appexample/example9.png",
  ];

  const features = [
    { icon: MessageCircle, title: "Encrypted Messaging", desc: "End-to-end encrypted real-time chat with Telegram-style UX" },
    { icon: Wallet, title: "Multi-Chain Wallet", desc: "Built-in HD wallet supporting ETH, BSC, Arbitrum, Polygon, Base, Optimism" },
    { icon: Shield, title: "Secure & Private", desc: "Your keys, your crypto. No third-party access to your data" },
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <MatrixRain />

      <div className="relative z-10">
        <header className="border-b border-green-900/30 bg-black/80 backdrop-blur-md sticky top-0 z-20">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/applogo.png" alt="Offchat" className="w-8 h-8 rounded-lg" />
              <span className="font-mono text-green-400 text-lg font-bold tracking-wider">OFFCHAT</span>
            </div>
            <a
              href="/"
              className="text-green-400/70 hover:text-green-400 font-mono text-sm transition-colors"
            >
              offchat.app
            </a>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="w-full rounded-2xl overflow-hidden mb-8 border border-green-900/20">
            <img
              src="/feature-graphic.png"
              alt="Offchat Feature Graphic"
              className="w-full h-auto object-cover"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-shrink-0">
              <img
                src="/applogo.png"
                alt="Offchat App Icon"
                className="w-24 h-24 md:w-28 md:h-28 rounded-[22px] shadow-2xl shadow-green-500/20 border-2 border-green-900/30"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold mb-1">Offchat</h1>
              <p className="text-green-400 font-mono text-sm mb-3">Web3 Messaging & Crypto Wallet</p>

              <div className="flex items-center gap-4 mb-3 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <StarRating rating={5} />
                  <span className="ml-1">5.0</span>
                </div>
                <span className="text-gray-600">|</span>
                <span>Communication</span>
                <span className="text-gray-600">|</span>
                <span>Free</span>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
                <div className="flex flex-col items-center">
                  <span className="text-white font-semibold text-sm">{APK_SIZE}</span>
                  <span>Size</span>
                </div>
                <div className="w-px bg-gray-700 self-stretch" />
                <div className="flex flex-col items-center">
                  <span className="text-white font-semibold text-sm">v{APP_VERSION}</span>
                  <span>Version</span>
                </div>
                <div className="w-px bg-gray-700 self-stretch" />
                <div className="flex flex-col items-center">
                  <span className="text-white font-semibold text-sm">Android 7+</span>
                  <span>Requires</span>
                </div>
                <div className="w-px bg-gray-700 self-stretch" />
                <div className="flex flex-col items-center">
                  <span className="text-white font-semibold text-sm">Everyone</span>
                  <span>Rated</span>
                </div>
              </div>

              <button
                onClick={handleDownload}
                className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-300 ${
                  downloadStarted
                    ? "bg-green-900/50 text-green-300 border border-green-500/30"
                    : "bg-green-500 hover:bg-green-400 text-black hover:shadow-lg hover:shadow-green-500/30"
                }`}
              >
                {downloadStarted ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-green-300 border-t-transparent rounded-full" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Install APK
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
              {screenshots.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Offchat screenshot ${i + 1}`}
                  className="flex-shrink-0 w-44 h-auto rounded-2xl border border-green-900/30 shadow-lg shadow-black/50 snap-center object-cover"
                />
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">About this app</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Offchat is a next-generation Web3 messaging platform that combines end-to-end encrypted messaging 
              with a powerful multi-chain cryptocurrency wallet. Send messages, transfer crypto, swap tokens, 
              and manage NFTs — all in one app.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-green-950/20 border border-green-900/20 hover:border-green-500/30 transition-colors"
                >
                  <f.icon className="w-8 h-8 text-green-400 mb-3" />
                  <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowMoreInfo(!showMoreInfo)}
              className="flex items-center gap-1 text-green-400 text-sm font-mono hover:text-green-300 transition-colors"
            >
              {showMoreInfo ? "Show less" : "Show more"}
              {showMoreInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showMoreInfo && (
              <div className="mt-4 space-y-3 text-sm text-gray-400 animate-in slide-in-from-top-2">
                <div>
                  <h4 className="text-white font-semibold mb-1">Supported Networks</h4>
                  <p>Ethereum, BNB Smart Chain, Arbitrum, Polygon, Base, Optimism</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Key Features</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Telegram-style direct messaging (no friend requests)</li>
                    <li>Embedded HD wallet with multi-chain support</li>
                    <li>In-chat crypto transfers (ETH & tokens)</li>
                    <li>Integrated DEX token swapping</li>
                    <li>NFT collection management</li>
                    <li>Live crypto market tracking</li>
                    <li>$OFFC token economy</li>
                    <li>Bluetooth mesh networking (offline messaging)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">What's New</h4>
                  <p>v{APP_VERSION} — Initial release with encrypted messaging, multi-chain wallet, token swap, and NFT support.</p>
                </div>
              </div>
            )}
          </div>

          <div className="mb-8 p-4 rounded-xl bg-green-950/10 border border-green-900/20">
            <h2 className="text-lg font-bold mb-3">Data Safety</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-300">No data shared with third parties</p>
                  <p className="text-gray-500 text-xs">Your data is never sold or shared with advertisers</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-300">Messages are encrypted end-to-end</p>
                  <p className="text-gray-500 text-xs">Only you and the recipient can read your messages</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-300">Your wallet keys stay on your device</p>
                  <p className="text-gray-500 text-xs">Private keys are generated and stored locally</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">How to Install</h2>
            <div className="space-y-3">
              {[
                { step: 1, text: "Tap the \"Install APK\" button above to download the file" },
                { step: 2, text: "Open the downloaded OFFCHAT.apk file" },
                { step: 3, text: "If prompted, enable \"Install from unknown sources\" in your settings" },
                { step: 4, text: "Follow the on-screen instructions to complete installation" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-400 font-mono text-xs font-bold">{item.step}</span>
                  </div>
                  <p className="text-gray-300 text-sm pt-1">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center py-8 border-t border-green-900/20">
            <div className="flex items-center justify-center gap-2 mb-3">
              <img src="/applogo.png" alt="Offchat" className="w-6 h-6 rounded-lg" />
              <span className="font-mono text-green-400 font-bold">OFFCHAT</span>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
              <a href="/privacy" className="hover:text-green-400 transition-colors">Privacy Policy</a>
              <span>·</span>
              <a href="/terms" className="hover:text-green-400 transition-colors">Terms of Service</a>
              <span>·</span>
              <a href="/about" className="hover:text-green-400 transition-colors">About</a>
            </div>
            <p className="text-gray-700 text-xs mt-2 font-mono">© 2026 Offchat. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}