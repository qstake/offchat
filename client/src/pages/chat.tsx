import { useState, useEffect, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import ChatSidebar from "@/components/chat-sidebar";
import ChatArea from "@/components/chat-area";
import CryptoPricesGrid from "@/components/crypto-prices-grid";
import OffchatFooter from "@/components/offchat-footer";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import { useWallet } from "@/hooks/use-wallet";
import { useWebSocket } from "@/hooks/use-websocket";
import { useQuery } from "@tanstack/react-query";
import { Menu, Shield, Zap, Lock, Twitter, Send, Star, Rocket, Globe, Users, ArrowUpDown } from "lucide-react";
const offchatLogo = "/logo.png";

function ChatMatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const matrixChars = 'ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンヴ日月火水木金土天地人心道力光闇風雷電雨雲海山川空星花夢影命魂龍鬼神';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const activeColumns = Math.floor(columns * 0.3);
    const columnIndices: number[] = [];
    while (columnIndices.length < activeColumns) {
      const idx = Math.floor(Math.random() * columns);
      if (!columnIndices.includes(idx)) columnIndices.push(idx);
    }
    const drops: number[] = Array(columns).fill(0).map(() => Math.random() * -40);
    const speeds: number[] = Array(columns).fill(0).map(() => 0.12 + Math.random() * 0.2);
    const brightness: number[] = Array(columns).fill(0).map(() => Math.random());
    const activeSet = new Set(columnIndices);
    let animId: number;
    let frameCount = 0;
    const draw = () => {
      frameCount++;
      if (frameCount % 2 === 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = `${fontSize}px "MS Gothic", "Hiragino Kaku Gothic Pro", monospace`;
        for (let i = 0; i < drops.length; i++) {
          if (!activeSet.has(i)) continue;
          const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
          const y = drops[i] * fontSize;
          ctx.shadowBlur = 0;
          const alpha = 0.04 + brightness[i] * 0.15;
          ctx.fillStyle = `rgba(0, 255, 65, ${alpha})`;
          ctx.fillText(char, i * fontSize, y);
          if (y > canvas.height && Math.random() > 0.99) {
            drops[i] = 0;
            speeds[i] = 0.12 + Math.random() * 0.2;
            brightness[i] = Math.random();
          }
          drops[i] += speeds[i];
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} />;
}

interface ChatPageProps {
  currentUser: {
    id: string;
    username: string;
    walletAddress: string;
    avatar?: string | null;
    bio?: string | null;
    isOnline: boolean;
    createdAt: string;
  };
}

export default function ChatPage({ currentUser }: ChatPageProps) {
  const { t } = useTranslation();
  const params = useParams();
  const [, setLocation] = useLocation();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [shouldHighlightFriends, setShouldHighlightFriends] = useState(false);
  const [showWalletSection, setShowWalletSection] = useState(false);
  const isMobile = useIsMobile();
  const { disconnectWallet, walletAddress, balance, isConnected } = useWallet();
  const { socket, sendMessage, messages, typingUsers, removeMessage, refetchMessages } = useWebSocket(selectedChatId, currentUser.id);

  // Calculate actual badge count from user chats
  const { data: userChats = [] } = useQuery({
    queryKey: ['/api/chats', currentUser.id],
    queryFn: async () => {
      const response = await fetch(`/api/chats/${currentUser.id}`);
      if (!response.ok) throw new Error('Failed to fetch chats');
      return response.json();
    }
  });
  
  const unreadCount = userChats.length; // Show chat count for now
  const friendRequestCount = 0; // Would come from friends API

  // Callback functions for mobile navigation
  const handleOpenSidebar = () => {
    setIsMobileMenuOpen(true);
  };

  const handleHighlightFriends = () => {
    setShouldHighlightFriends(true);
    // Reset highlight after a delay
    setTimeout(() => {
      setShouldHighlightFriends(false);
    }, 3000);
  };

  const handleOpenWallet = () => {
    setShowWalletSection(true);
    // You can navigate to wallet page or open a wallet modal here
    // For now, we'll just set a state that can be used to highlight wallet section
    setTimeout(() => {
      setShowWalletSection(false);
    }, 5000);
  };

  // Extract chatId from URL parameters and set as selected chat
  useEffect(() => {
    if (params.chatId) {
      setSelectedChatId(params.chatId);
      setIsMobileMenuOpen(false); // Close mobile menu when selecting chat
    }
  }, [params.chatId]);

  useEffect(() => {
    document.title = "Offchat - Crypto Chat Application";
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile && isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, isMobileMenuOpen]);

  const handleSendMessage = (content: string, messageType: string = "text", transactionData?: any) => {
    sendMessage({
      chatId: selectedChatId,
      senderId: currentUser.id,
      content,
      messageType,
      ...transactionData
    });
  };

  return (
    <div className="min-h-screen bg-black text-foreground">
      
      <div className={`${isMobile ? 'flex min-h-screen relative' : 'h-screen relative'}`}>
        {/* Professional Mobile Sidebar */}
        <div className={`
          ${isMobile ? `fixed inset-y-0 left-0 z-[60] mobile-sidebar ${isMobileMenuOpen ? 'entering' : 'exiting'}` : 'fixed inset-y-0 left-0 z-30'}
          ${isMobile && !isMobileMenuOpen ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
          ${isMobile ? 'w-full max-w-sm' : 'w-80'} flex-shrink-0
        `}>
          <div className="mobile-sidebar-content">
            <ChatSidebar
              selectedChatId={selectedChatId}
              onChatSelect={setSelectedChatId}
              onCloseMobile={() => setIsMobileMenuOpen(false)}
              isMobile={isMobile}
              walletAddress={walletAddress}
              balance={balance}
              isWalletConnected={isConnected}
              onConnectWallet={null}
              onDisconnectWallet={disconnectWallet}
              shouldHighlightFriends={shouldHighlightFriends}
              showWalletSection={showWalletSection}
              currentUser={{
                ...currentUser,
                avatar: currentUser.avatar || null,
                bio: currentUser.bio || null,
                isOnline: true,
                createdAt: currentUser.createdAt || new Date().toISOString()
              }}
            />
          </div>
        </div>

        {/* Enhanced Mobile Overlay */}
        {isMobile && isMobileMenuOpen && (
          <div 
            className={`fixed inset-0 z-55 mobile-sidebar-overlay ${isMobileMenuOpen ? 'entering' : 'exiting'}`}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${isMobile ? '' : 'ml-80 h-screen overflow-hidden'}`}>
          {selectedChatId ? (
            <ChatArea
              chatId={selectedChatId}
              messages={messages}
              typingUsers={typingUsers}
              onSendMessage={handleSendMessage}
              onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              isMobile={isMobile}
              walletAddress={walletAddress}
              isWalletConnected={isConnected}
              currentUserId={currentUser.id}
              onMessageDeleted={removeMessage}
              onRefetchMessages={refetchMessages}
              onChatDeleted={() => {
                setSelectedChatId(null);
                refetchMessages();
              }}
            />
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {isMobile && (
                <div className="fixed top-0 left-0 right-0 z-40 px-4 py-3 bg-gradient-to-b from-black via-black/98 to-black/95 backdrop-blur-xl border-b border-green-500/8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img src={offchatLogo} alt="Offchat" className="w-7 h-7 rounded-lg shadow-lg shadow-green-500/10" />
                      <div>
                        <span className="text-sm font-bold text-white tracking-tight">Offchat</span>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                          <span className="text-[10px] text-emerald-400/70 font-medium">{t('common.online')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => window.open('https://x.com/Offchat_App', '_blank')} className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-green-400/60 hover:text-green-400 hover:bg-green-500/10 transition-all">
                        <Twitter className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => window.open('https://t.me/offchat_app', '_blank')} className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-green-400/60 hover:text-green-400 hover:bg-green-500/10 transition-all">
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className={`flex-1 overflow-y-auto bg-black text-green-400 ${isMobile ? 'pt-16 pb-16' : ''}`}>
                <div className="relative">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <ChatMatrixRain />
                    <div className="absolute top-20 left-1/4 w-64 h-64 bg-green-500/3 rounded-full blur-3xl"></div>
                    <div className="absolute top-60 right-1/4 w-48 h-48 bg-emerald-500/3 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-40 left-1/3 w-56 h-56 bg-green-600/2 rounded-full blur-3xl"></div>
                  </div>

                  <div className="relative z-10 text-center pt-8 md:pt-12 pb-6 px-4">
                    <div className="max-w-lg mx-auto space-y-5">
                      <div className="relative inline-block">
                        <div className="absolute -inset-3 bg-gradient-to-r from-green-500/20 via-emerald-500/10 to-green-500/20 rounded-2xl blur-xl"></div>
                        <img src={offchatLogo} alt="Offchat" className="relative w-16 h-16 md:w-20 md:h-20 mx-auto rounded-2xl shadow-2xl shadow-green-500/20 border border-green-500/10" />
                      </div>
                      <div className="space-y-2">
                        <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
                          Offchat
                        </h1>
                        <p className="text-sm md:text-base text-green-300/60 max-w-md mx-auto leading-relaxed">
                          {t('chat.web3Description')}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-center gap-3 pt-1">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/8 border border-green-500/15">
                          <Shield className="w-3 h-3 text-emerald-400" />
                          <span className="text-[11px] font-medium text-emerald-300/80">{t('chat.e2eEncrypted')}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/8 border border-green-500/15">
                          <Globe className="w-3 h-3 text-emerald-400" />
                          <span className="text-[11px] font-medium text-emerald-300/80">{t('chat.multiChain')}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/8 border border-green-500/15">
                          <Zap className="w-3 h-3 text-emerald-400" />
                          <span className="text-[11px] font-medium text-emerald-300/80">{t('chat.realTime')}</span>
                        </div>
                      </div>

                      {!isMobile && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <button onClick={() => window.open('https://x.com/Offchat_App', '_blank')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-green-300/70 hover:text-green-300 hover:bg-green-500/10 hover:border-green-500/20 transition-all text-xs font-medium">
                            <Twitter className="w-3.5 h-3.5" />
                            {t('nav.twitter', 'Twitter')}
                          </button>
                          <button onClick={() => window.open('https://t.me/offchat_app', '_blank')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-green-300/70 hover:text-green-300 hover:bg-green-500/10 hover:border-green-500/20 transition-all text-xs font-medium">
                            <Send className="w-3.5 h-3.5" />
                            {t('nav.telegram', 'Telegram')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative z-10 px-4 pb-5">
                    <div className="max-w-3xl mx-auto">
                      <div className="rounded-2xl bg-gradient-to-b from-green-500/5 to-transparent border border-green-500/10 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-green-500/8">
                          <div className="flex items-center gap-2.5">
                            <div className="relative">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                              <div className="absolute inset-0 w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-40"></div>
                            </div>
                            <span className="text-xs font-semibold text-white/90 tracking-wide">{t('chat.liveMarket')}</span>
                          </div>
                          <Button onClick={() => setLocation('/crypto-market')} variant="ghost" size="sm" className="h-7 px-3 text-[11px] text-green-400/70 hover:text-green-400 hover:bg-green-500/10 rounded-lg font-medium">
                            {t('chat.viewAll')}
                          </Button>
                        </div>
                        <div className="p-3">
                          <CryptoPricesGrid limit={6} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {!isMobile && (
                    <div className="relative z-10 px-4 pb-4">
                      <div className="max-w-3xl mx-auto">
                        <button
                          onClick={() => setLocation('/swap')}
                          className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-gradient-to-r from-green-600/90 to-emerald-600/90 hover:from-green-500 hover:to-emerald-500 text-white font-semibold text-sm border border-green-500/20 shadow-lg shadow-green-500/10 transition-all hover:shadow-green-500/20"
                        >
                          <ArrowUpDown className="w-4 h-4" />
                          {t('swap.swapTokens')}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="relative z-10 px-4 pb-5">
                    <div className="max-w-3xl mx-auto">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                        <div className="group rounded-xl bg-gradient-to-br from-green-500/8 to-emerald-500/4 border border-green-500/10 p-3.5 hover:border-green-500/25 transition-all">
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center mb-2.5 group-hover:bg-green-500/15 transition-colors">
                            <Shield className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="text-xs font-semibold text-white/90 mb-0.5">{t('chat.secure')}</div>
                          <div className="text-[10px] text-green-300/50 leading-relaxed">{t('chat.secureDesc')}</div>
                        </div>
                        <div className="group rounded-xl bg-gradient-to-br from-green-500/8 to-emerald-500/4 border border-green-500/10 p-3.5 hover:border-green-500/25 transition-all">
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center mb-2.5 group-hover:bg-green-500/15 transition-colors">
                            <Zap className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="text-xs font-semibold text-white/90 mb-0.5">{t('chat.instant')}</div>
                          <div className="text-[10px] text-green-300/50 leading-relaxed">{t('chat.instantDesc')}</div>
                        </div>
                        <div className="group rounded-xl bg-gradient-to-br from-green-500/8 to-emerald-500/4 border border-green-500/10 p-3.5 hover:border-green-500/25 transition-all">
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center mb-2.5 group-hover:bg-green-500/15 transition-colors">
                            <Lock className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="text-xs font-semibold text-white/90 mb-0.5">{t('chat.web3Native')}</div>
                          <div className="text-[10px] text-green-300/50 leading-relaxed">{t('chat.web3NativeDesc')}</div>
                        </div>
                        <div className="group rounded-xl bg-gradient-to-br from-green-500/8 to-emerald-500/4 border border-green-500/10 p-3.5 hover:border-green-500/25 transition-all">
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center mb-2.5 group-hover:bg-green-500/15 transition-colors">
                            <Users className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="text-xs font-semibold text-white/90 mb-0.5">{t('chat.communityLabel')}</div>
                          <div className="text-[10px] text-green-300/50 leading-relaxed">{t('chat.communityDesc')}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 px-4 pb-5">
                    <div className="max-w-3xl mx-auto">
                      <div className="rounded-xl bg-gradient-to-r from-green-500/5 via-emerald-500/3 to-green-500/5 border border-green-500/8 px-4 py-3">
                        <div className="text-[10px] font-semibold text-white/60 mb-2 tracking-wide">{t('chat.supportedNetworks')}</div>
                        <div className="flex flex-wrap items-center gap-2">
                          {['Ethereum', 'BSC', 'Arbitrum', 'Polygon', 'Base', 'Optimism'].map((chain) => (
                            <div key={chain} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/3 border border-white/5">
                              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                              <span className="text-[10px] text-white/70 font-medium">{chain}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 px-4 py-5 border-t border-green-500/6">
                    <div className="max-w-3xl mx-auto">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <img src={offchatLogo} alt="Offchat" className="w-5 h-5 rounded-md opacity-60" />
                          <span className="text-white/30 text-[11px] font-medium">Offchat Protocol</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4 text-[11px] text-white/25">
                          <a href="/about" className="hover:text-green-400 transition-colors">{t('nav.about')}</a>
                          <a href="/whitepaper" className="hover:text-green-400 transition-colors">{t('nav.whitepaper')}</a>
                          <a href="/roadmap" className="hover:text-green-400 transition-colors">{t('nav.roadmap')}</a>
                          <a href="/privacy" className="hover:text-green-400 transition-colors">{t('nav.privacy')}</a>
                          <a href="/terms" className="hover:text-green-400 transition-colors">{t('nav.terms')}</a>
                        </div>
                      </div>
                      <p className="text-center text-white/15 text-[10px] mt-3">&copy; 2026 Offchat. All rights reserved.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modern Mobile Bottom Navigation - Only show on home page and crypto market */}
      {isMobile && !isMobileMenuOpen && !selectedChatId && (
        <MobileBottomNav 
          unreadCount={unreadCount}
          onOpenSidebar={handleOpenSidebar}
        />
      )}
    </div>
  );
}
