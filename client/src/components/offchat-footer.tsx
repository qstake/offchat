import { ExternalLink, Book, Map, FileText, Shield, ScrollText, Trophy, Twitter, Send, Github, Globe, Zap, Star, Rocket, Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from "./language-switcher";
const offchatLogo = "/logo.png";

export default function OffchatFooter() {
  const { t } = useTranslation();
  const footerLinks = [
    {
      label: t('nav.about'),
      icon: Book,
      url: "/about",
      description: t('footer.aboutDesc')
    },
    {
      label: t('nav.roadmap'),
      icon: Map,
      url: "/roadmap",
      description: t('footer.roadmapDesc')
    },
    {
      label: t('nav.whitepaper'),
      icon: FileText,
      url: "/whitepaper",
      description: t('footer.whitepaperDesc')
    },
    {
      label: t('nav.transfers'),
      icon: Trophy,
      url: "/offc-transfers",
      description: t('footer.transfersDesc')
    },
    {
      label: t('nav.terms'),
      icon: ScrollText,
      url: "/terms",
      description: t('footer.termsDesc')
    },
    {
      label: t('nav.privacy'),
      icon: Shield,
      url: "/privacy",
      description: t('footer.privacyDesc')
    }
  ];

  const socialLinks = [
    {
      label: "Twitter",
      icon: Twitter,
      url: "https://x.com/OFFCHAT_app",
      color: "hover:text-blue-400"
    },
    {
      label: "Telegram",
      icon: Send,
      url: "https://t.me/OFCCHAT_app",
      color: "hover:text-blue-500"
    },
    {
      label: "GitHub",
      icon: Github,
      url: "https://github.com/offchatapp",
      color: "hover:text-gray-300"
    },
    {
      label: "Website",
      icon: Globe,
      url: "https://offchat.app",
      color: "hover:text-green-400"
    }
  ];

  const handleLinkClick = (url: string) => {
    if (url.startsWith('/')) {
      // Internal routes - open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // External links - open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <footer className="relative bg-gradient-to-b from-black/95 via-green-950/10 to-black border-t border-green-400/20 backdrop-blur-md mt-auto overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-t from-green-950/10 via-transparent to-transparent"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto p-6 lg:p-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <img 
                src={offchatLogo} 
                alt="Offchat Logo" 
                className="w-12 h-12 rounded-lg" 
              />
              <div className="absolute -inset-1 bg-green-400/20 rounded-lg blur animate-pulse"></div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-2xl font-black text-green-400 font-mono tracking-wider">
              OFFCHAT
            </h3>
            <p className="text-green-300/80 font-mono text-sm tracking-wide max-w-lg mx-auto">
              › {t('footer.description')}
            </p>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent mx-auto"></div>
          </div>
        </div>

        {/* Navigation Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {footerLinks.map((link) => {
            const IconComponent = link.icon;
            return (
              <Button
                key={link.label}
                variant="outline"
                onClick={() => handleLinkClick(link.url)}
                className="h-16 bg-black/40 border-green-400/30 hover:bg-green-400/10 hover:border-green-400/50 text-green-400 font-mono transition-all duration-300 group flex flex-col gap-1 p-3 hover:shadow-lg hover:shadow-green-400/10"
                title={link.description}
                data-testid={`footer-link-${link.label.toLowerCase()}`}
              >
                <IconComponent className="w-5 h-5 group-hover:scale-110 transition-all duration-300" />
                <span className="text-xs tracking-wider leading-tight">{link.label}</span>
                <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-all duration-300" />
              </Button>
            );
          })}
        </div>

        {/* Social Media & Features */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Social Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-green-400 font-mono tracking-wider flex items-center gap-2">
              <Star className="w-5 h-5" />
              {t('footer.connectWithUs')}
            </h4>
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <Button
                    key={social.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleLinkClick(social.url)}
                    className={`bg-black/60 border-green-400/30 text-green-400 hover:bg-green-400/10 font-mono transition-all duration-300 ${social.color} hover:scale-110 hover:shadow-lg`}
                    title={social.label}
                    data-testid={`social-${social.label.toLowerCase()}`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </Button>
                );
              })}
              <LanguageSwitcher variant="footer" />
            </div>
            <p className="text-green-300/60 text-xs font-mono">
              {t('footer.communityDesc')}
            </p>
          </div>

          {/* Key Features */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-green-400 font-mono tracking-wider flex items-center gap-2">
              <Zap className="w-5 h-5" />
              {t('footer.coreFeatures')}
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-300/80 text-sm font-mono">
                <Lock className="w-4 h-4 text-green-400" />
                <span>{t('footer.e2eMessaging')}</span>
              </div>
              <div className="flex items-center gap-2 text-green-300/80 text-sm font-mono">
                <Rocket className="w-4 h-4 text-green-400" />
                <span>{t('footer.instantTransfers')}</span>
              </div>
              <div className="flex items-center gap-2 text-green-300/80 text-sm font-mono">
                <Users className="w-4 h-4 text-green-400" />
                <span>{t('footer.decentralizedIdentity')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-black/40 border border-green-400/30 rounded-lg p-4 text-center hover:bg-green-400/5 transition-all duration-300">
            <div className="text-green-400 text-xl font-bold font-mono mb-1">∞</div>
            <div className="text-green-300/70 text-xs font-mono tracking-wide">{t('common.messages')}</div>
          </div>
          <div className="bg-black/40 border border-green-400/30 rounded-lg p-4 text-center hover:bg-green-400/5 transition-all duration-300">
            <div className="text-green-400 text-xl font-bold font-mono mb-1">24/7</div>
            <div className="text-green-300/70 text-xs font-mono tracking-wide">{t('common.uptime')}</div>
          </div>
          <div className="bg-black/40 border border-green-400/30 rounded-lg p-4 text-center hover:bg-green-400/5 transition-all duration-300">
            <div className="text-green-400 text-xl font-bold font-mono mb-1">256</div>
            <div className="text-green-300/70 text-xs font-mono tracking-wide">{t('common.bitEncryption')}</div>
          </div>
          <div className="bg-black/40 border border-green-400/30 rounded-lg p-4 text-center hover:bg-green-400/5 transition-all duration-300">
            <div className="text-green-400 text-xl font-bold font-mono mb-1">0ms</div>
            <div className="text-green-300/70 text-xs font-mono tracking-wide">{t('common.latency')}</div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-green-400/20 pt-6 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-mono text-green-300/60">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>{t('footer.allRightsReserved')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400/50 rounded-full"></div>
              <span>{t('footer.blockchainSecured')}</span>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-xs font-mono text-green-300/40">
              › {t('footer.matrixPowered')}
            </p>
          </div>
          
          {/* Animated Matrix Code Effect */}
          <div className="text-center pt-4">
            <div className="inline-flex items-center gap-1 text-green-400/30 font-mono text-xs">
              <span className="animate-pulse">01001000</span>
              <span className="animate-pulse delay-100">01100101</span>
              <span className="animate-pulse delay-200">01101100</span>
              <span className="animate-pulse delay-300">01101100</span>
              <span className="animate-pulse delay-400">01101111</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}