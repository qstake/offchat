import { useState, useEffect } from "react";
import { MessageCircle, Wallet, ArrowUpDown } from "lucide-react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

interface MobileBottomNavProps {
  unreadCount?: number;
  className?: string;
  onOpenSidebar?: () => void;
}

export default function MobileBottomNav({ 
  unreadCount = 0, 
  className,
  onOpenSidebar
}: MobileBottomNavProps) {
  const [location] = useLocation();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("chat");

  useEffect(() => {
    if (location.startsWith("/chat")) {
      setActiveTab("chat");
    } else if (location.startsWith("/swap")) {
      setActiveTab("swap");
    } else if (location.startsWith("/crypto-market") || location.startsWith("/crypto") || location.startsWith("/offc-transfers")) {
      setActiveTab("crypto");
    }
  }, [location]);

  const handleChatPress = () => {
    onOpenSidebar?.();
    setActiveTab('chat');
    if (navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <div className={cn("mobile-bottom-nav", className)}>
      <div className="mobile-bottom-nav-content">
        <button
          className={cn("mobile-nav-item", activeTab === "chat" && "active")}
          onClick={handleChatPress}
        >
          <div className="mobile-nav-icon-container">
            <MessageCircle className="mobile-nav-icon" strokeWidth={activeTab === "chat" ? 2.5 : 1.5} />
            {unreadCount > 0 && (
              <div className="mobile-nav-badge">
                <span className="mobile-nav-badge-text">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              </div>
            )}
          </div>
          <span className="mobile-nav-label">{t('nav.chat')}</span>
        </button>

        <Link
          href="/crypto-market"
          className={cn("mobile-nav-item", activeTab === "crypto" && "active")}
          onClick={() => { setActiveTab("crypto"); if (navigator.vibrate) navigator.vibrate(10); }}
        >
          <div className="mobile-nav-icon-container">
            <Wallet className="mobile-nav-icon" strokeWidth={activeTab === "crypto" ? 2.5 : 1.5} />
          </div>
          <span className="mobile-nav-label">{t('nav.crypto')}</span>
        </Link>

        <Link
          href="/swap"
          className={cn("mobile-nav-item", activeTab === "swap" && "active")}
          onClick={() => { setActiveTab("swap"); if (navigator.vibrate) navigator.vibrate(10); }}
        >
          <div className="mobile-nav-icon-container">
            <ArrowUpDown className="mobile-nav-icon" strokeWidth={activeTab === "swap" ? 2.5 : 1.5} />
          </div>
          <span className="mobile-nav-label">{t('nav.swap')}</span>
        </Link>
      </div>
    </div>
  );
}
