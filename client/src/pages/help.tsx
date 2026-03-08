import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  ChevronDown, ChevronUp, ArrowLeft, MessageCircle, Wallet, Shield, 
  HelpCircle, Send, Lock, Smartphone, RefreshCw, Globe, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const offchatLogo = "/logo.png";

interface FAQItem {
  question: string;
  answer: string;
  icon: typeof HelpCircle;
}

const faqCategories = [
  {
    title: "Getting Started",
    items: [
      {
        question: "How do I create an account?",
        answer: "Tap 'Create Wallet' on the login screen. A 12-word recovery phrase will be generated for you. Write it down and keep it safe — this is your only way to recover your account. No email or password needed.",
        icon: Smartphone,
      },
      {
        question: "What is a 12-word recovery phrase?",
        answer: "It's a set of 12 random words that acts as your master key. It generates your wallet address and identity. Never share it with anyone. If you lose it, you lose access to your account and funds permanently.",
        icon: Lock,
      },
      {
        question: "How do I send a message?",
        answer: "Go to the Chat tab, tap the + button to start a new conversation. Enter the recipient's wallet address or find them in your contacts. Type your message and hit send. Messages are encrypted end-to-end.",
        icon: MessageCircle,
      },
    ],
  },
  {
    title: "Wallet & Crypto",
    items: [
      {
        question: "How do I use the built-in wallet?",
        answer: "Your wallet is created automatically when you set up your account. Go to any chat and tap the wallet icon to send crypto. You can also view your balances in the Crypto tab. Your wallet supports Ethereum, BSC, Polygon, Arbitrum, Base, and Optimism.",
        icon: Wallet,
      },
      {
        question: "How do I swap tokens?",
        answer: "Go to the Swap tab in the bottom navigation. Select the tokens you want to swap, enter the amount, and confirm. Swaps are processed through PancakeSwap's decentralized protocol — safe and transparent.",
        icon: RefreshCw,
      },
      {
        question: "Are my funds safe?",
        answer: "Yes. Offchat is non-custodial — your private keys never leave your device and are never sent to our servers. We cannot access, freeze, or move your funds. You have full control at all times.",
        icon: Shield,
      },
    ],
  },
  {
    title: "Privacy & Security",
    items: [
      {
        question: "Is my data stored on servers?",
        answer: "Minimal data is stored. Messages are encrypted end-to-end, meaning only you and the recipient can read them. Your private keys and wallet credentials are stored only on your device. We follow a zero-knowledge architecture.",
        icon: Lock,
      },
      {
        question: "What is Bluetooth mesh messaging?",
        answer: "Offchat can send messages via Bluetooth when there's no internet connection. Your device connects directly to nearby Offchat users, creating a mesh network. This is useful in emergencies, remote areas, or when networks are restricted.",
        icon: Globe,
      },
      {
        question: "Can Offchat read my messages?",
        answer: "No. All messages are encrypted end-to-end using your wallet keys. Only the sender and recipient can decrypt and read message content. Our servers only relay encrypted data — we cannot see the content.",
        icon: Shield,
      },
    ],
  },
];

export default function HelpPage() {
  const [, setLocation] = useLocation();
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Help & Support - Offchat";
  }, []);

  const toggleItem = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSendFeedback = () => {
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    setFeedbackText("");
    toast({
      title: "Feedback Sent",
      description: "Thank you for your feedback! We'll review it soon.",
    });
    setTimeout(() => setFeedbackSent(false), 3000);
  };

  return (
    <div className="min-h-screen bg-black text-white page-transition">
      <header 
        className="border-b border-green-500/20 bg-black/95 backdrop-blur-md"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => setLocation("/chat")}
            className="p-2 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-green-400" />
          </button>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-green-400" />
            <h1 className="text-lg font-bold text-white font-mono">Help & Support</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-32">
        <div className="flex items-center gap-3 mb-6">
          <img src={offchatLogo} alt="Offchat" className="w-10 h-10" />
          <div>
            <h2 className="text-white font-bold">How can we help?</h2>
            <p className="text-white/40 text-sm">Find answers to common questions below</p>
          </div>
        </div>

        {faqCategories.map((category, catIdx) => (
          <div key={catIdx} className="mb-6">
            <h3 className="text-green-400 font-mono text-sm font-bold mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              {category.title.toUpperCase()}
            </h3>

            <div className="space-y-2">
              {category.items.map((item, itemIdx) => {
                const key = `${catIdx}-${itemIdx}`;
                const isOpen = openItems.has(key);
                const Icon = item.icon;

                return (
                  <div
                    key={key}
                    className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    <button
                      onClick={() => toggleItem(key)}
                      className="w-full flex items-center gap-3 p-4 text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-green-400" />
                      </div>
                      <span className="flex-1 text-white/90 text-sm font-medium">
                        {item.question}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-white/30 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-white/30 shrink-0" />
                      )}
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-200 ${
                        isOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="px-4 pb-4 pl-[60px]">
                        <p className="text-white/50 text-sm leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="mt-8 border border-white/10 rounded-xl p-5 bg-white/[0.02]">
          <h3 className="text-white font-bold mb-1 flex items-center gap-2">
            <Send className="w-4 h-4 text-green-400" />
            Send Feedback
          </h3>
          <p className="text-white/40 text-xs mb-4">
            Have a suggestion or found a bug? Let us know.
          </p>

          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Type your feedback here..."
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-green-500/50 resize-none h-24 mb-3"
          />

          <Button
            onClick={handleSendFeedback}
            disabled={!feedbackText.trim() || feedbackSent}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-bold font-mono h-10 disabled:opacity-40"
          >
            {feedbackSent ? "Sent!" : "Send Feedback"}
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-white/30 text-xs">
            Contact us: support@offchat.app
          </p>
        </div>
      </main>
    </div>
  );
}
