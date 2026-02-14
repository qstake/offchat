import { useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Shield, Zap, Globe, Users, Cpu, Lock, ArrowRight, Star, Rocket, Network, Coins, MessageSquare, Twitter, ExternalLink, Send } from "lucide-react";
import MatrixBackground from "@/components/matrix-background";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
const offchatLogo = "/logo.png";

export default function AboutPage() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = "About Offchat - Web3 Crypto Messaging Platform";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Learn about Offchat, the next-generation Web3 messaging platform combining end-to-end encryption, multi-chain wallet integration, and cryptocurrency transfers.');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', 'About Offchat - Web3 Crypto Messaging Platform');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', 'Learn about Offchat, the next-generation Web3 messaging platform combining end-to-end encryption, multi-chain wallet integration, and cryptocurrency transfers.');
  }, []);

  const features = [
    {
      icon: Shield,
      title: t('about.featureSecurity'),
      description: t('about.featureSecurityDesc'),
      highlight: t('about.featureSecurityHighlight')
    },
    {
      icon: Coins,
      title: t('about.featureCrypto'),
      description: t('about.featureCryptoDesc'),
      highlight: t('about.featureCryptoHighlight')
    },
    {
      icon: Globe,
      title: t('about.featureOffline'),
      description: t('about.featureOfflineDesc'),
      highlight: t('about.featureOfflineHighlight')
    },
    {
      icon: Zap,
      title: t('about.featurePerformance'),
      description: t('about.featurePerformanceDesc'),
      highlight: t('about.featurePerformanceHighlight')
    },
    {
      icon: Users,
      title: t('about.featureCommunities'),
      description: t('about.featureCommunitiesDesc'),
      highlight: t('about.featureCommunitiesHighlight')
    },
    {
      icon: Cpu,
      title: t('about.featureWeb3'),
      description: t('about.featureWeb3Desc'),
      highlight: t('about.featureWeb3Highlight')
    }
  ];

  const stats = [
    { number: "∞", label: t('about.unlimitedMessages'), description: t('about.noArtificialLimits') },
    { number: "24/7", label: t('about.alwaysOnline'), description: t('about.uptimeGuarantee') },
    { number: "0ms", label: t('about.nearInstant'), description: t('about.realTimeDelivery') },
    { number: "256", label: t('about.bitEncryption'), description: t('about.militaryGrade') }
  ];

  const useCases = [
    {
      title: t('about.cryptoTraders'),
      description: t('about.cryptoTradersDesc'),
      icon: Coins
    },
    {
      title: t('about.defiCommunities'),
      description: t('about.defiCommunitiesDesc'),
      icon: Network
    },
    {
      title: t('about.privacyAdvocates'),
      description: t('about.privacyAdvocatesDesc'),
      icon: Shield
    },
    {
      title: t('about.web3Developers'),
      description: t('about.web3DevelopersDesc'),
      icon: Cpu
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <MatrixBackground />
      
      <div className="relative z-10">
        {/* Back to Home Navigation */}
        <nav className="glass-card border-b border-primary/20 bg-black/95 backdrop-blur-md sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="container mx-auto px-4 py-3 flex items-center">
            <a href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 font-mono text-sm transition-colors">
              <ArrowRight className="w-4 h-4 rotate-180" />
              {t('about.backToHome')}
            </a>
          </div>
        </nav>

        {/* Professional Hero Section */}
        <header className="relative overflow-hidden bg-gradient-to-br from-black via-black/95 to-primary/5 border-b border-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,255,0,0.05)_50%,transparent_100%)] pointer-events-none"></div>
          <div className="container mx-auto px-6 py-20 lg:py-32 relative z-10">
            <div className="max-w-6xl mx-auto">
              <div className="text-center space-y-8">
                <div className="relative inline-block">
                  <div className="relative">
                    <img 
                      src={offchatLogo} 
                      alt="Offchat Logo" 
                      className="w-24 h-24 lg:w-32 lg:h-32 matrix-logo mx-auto"
                    />
                    <div className="absolute -inset-4 bg-gradient-to-r from-transparent via-primary/20 to-transparent rounded-full blur-xl"></div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white font-mono tracking-wider">
                    OFFCHAT
                  </h1>
                  
                  <div className="space-y-4 max-w-4xl mx-auto">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white font-mono tracking-wide">
                      {t('about.subtitle')}
                    </h2>
                    <p className="text-lg md:text-xl text-gray-200 leading-relaxed font-light max-w-3xl mx-auto">
                      {t('about.heroDescription')}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
                    <Badge className="bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-primary/40 font-mono px-4 py-2 text-sm font-semibold">
                      🔒 {t('about.militaryGradeSecurity')}
                    </Badge>
                    <Badge className="bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-primary/40 font-mono px-4 py-2 text-sm font-semibold">
                      ⚡ {t('about.web3Native')}
                    </Badge>
                    <Badge className="bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-primary/40 font-mono px-4 py-2 text-sm font-semibold">
                      🌐 {t('about.fullyDecentralized')}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                    <Button 
                      onClick={() => window.location.href = '/chat'}
                      className="cyber-button bg-gradient-to-r from-primary/30 to-primary/20 hover:from-primary/40 hover:to-primary/30 border-primary/50 hover:border-primary text-primary font-mono px-10 py-4 text-lg transition-all duration-150 neon-glow font-bold"
                    >
                      <Rocket className="w-5 h-5 mr-3" />
                      {t('about.startChatting')}
                    </Button>
                    <Button 
                      onClick={() => window.open('/whitepaper', '_blank')}
                      variant="outline"
                      className="cyber-button bg-black/60 border-primary/40 hover:bg-primary/10 text-primary font-mono px-10 py-4 text-lg transition-all duration-150 font-bold"
                    >
                      {t('about.readWhitepaper')}
                      <ExternalLink className="w-5 h-5 ml-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Professional Vision Statement */}
        <section className="py-20 lg:py-32 bg-gradient-to-b from-black/95 to-black">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white font-mono mb-6 tracking-wide">
                  {t('about.redefiningComms')}
                </h2>
                <p className="text-xl md:text-2xl text-gray-200 leading-relaxed max-w-4xl mx-auto font-light">
                  {t('about.redefiningDesc')}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                <div className="group text-center p-8 glass-card border border-primary/20 bg-gradient-to-b from-black/95 to-black/80 backdrop-blur-md rounded-2xl hover:border-primary/40 transition-all duration-150">
                  <div className="relative mb-6">
                    <MessageSquare className="w-16 h-16 text-primary mx-auto group-hover:scale-110 transition-transform duration-150" />
                    <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>
                  </div>
                  <h3 className="text-xl font-bold text-primary font-mono mb-4 tracking-wider">{t('about.messagingReimagined')}</h3>
                  <p className="text-gray-400 leading-relaxed">{t('about.messagingReimaginedDesc')}</p>
                </div>
                
                <div className="group text-center p-8 glass-card border border-primary/20 bg-gradient-to-b from-black/95 to-black/80 backdrop-blur-md rounded-2xl hover:border-primary/40 transition-all duration-150">
                  <div className="relative mb-6">
                    <Shield className="w-16 h-16 text-primary mx-auto group-hover:scale-110 transition-transform duration-150" />
                    <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>
                  </div>
                  <h3 className="text-xl font-bold text-primary font-mono mb-4 tracking-wider">{t('about.privacyByDesign')}</h3>
                  <p className="text-gray-400 leading-relaxed">{t('about.privacyByDesignDesc')}</p>
                </div>
                
                <div className="group text-center p-8 glass-card border border-primary/20 bg-gradient-to-b from-black/95 to-black/80 backdrop-blur-md rounded-2xl hover:border-primary/40 transition-all duration-150">
                  <div className="relative mb-6">
                    <Globe className="w-16 h-16 text-primary mx-auto group-hover:scale-110 transition-transform duration-150" />
                    <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>
                  </div>
                  <h3 className="text-xl font-bold text-primary font-mono mb-4 tracking-wider">{t('about.globalAccessibility')}</h3>
                  <p className="text-gray-400 leading-relaxed">{t('about.globalAccessibilityDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Professional Key Features */}
        <section className="py-20 lg:py-32 bg-gradient-to-b from-black to-primary/5">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-black text-white font-mono mb-6 tracking-wide">
                  {t('about.revolutionaryFeatures')}
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  {t('about.revolutionaryFeaturesDesc')}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => {
                  const IconComponent = feature.icon;
                  return (
                    <div key={index} className="group relative glass-card border border-primary/20 bg-gradient-to-b from-black/95 to-black/80 backdrop-blur-md p-8 rounded-2xl hover:border-primary/40 transition-all duration-200 hover:transform hover:scale-105">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl"></div>
                      <div className="relative z-10">
                        <div className="flex items-center space-x-4 mb-6">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-150">
                            <IconComponent className="w-7 h-7 text-primary" />
                          </div>
                          <Badge className="bg-gradient-to-r from-primary/30 to-primary/20 text-primary border-primary/50 font-mono text-xs px-3 py-1 font-bold">
                            {feature.highlight}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-primary font-mono mb-4 tracking-wider">{feature.title}</h3>
                        <p className="text-gray-300 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Professional Stats Section */}
        <section className="py-20 lg:py-32 bg-gradient-to-b from-primary/5 to-black">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-black text-white font-mono mb-6 tracking-wide">
                  {t('about.performanceMetrics')}
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  {t('about.performanceMetricsDesc')}
                </p>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                  <div key={index} className="group text-center p-8 glass-card border border-primary/20 bg-gradient-to-b from-black/95 to-black/80 backdrop-blur-md rounded-2xl hover:border-primary/40 transition-all duration-150 hover:transform hover:scale-105">
                    <div className="relative">
                      <div className="text-4xl lg:text-5xl font-black text-primary font-mono mb-4 group-hover:scale-110 transition-transform duration-150">
                        {stat.number}
                      </div>
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-150"></div>
                    </div>
                    <div className="text-lg font-bold text-gray-200 font-mono mb-2 tracking-wider">
                      {stat.label}
                    </div>
                    <div className="text-sm text-gray-400">
                      {stat.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Professional Use Cases */}
        <section className="py-20 lg:py-32 bg-gradient-to-b from-black to-primary/5">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-black text-white font-mono mb-6 tracking-wide">
                  {t('about.whoUsesOffchat')}
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  {t('about.whoUsesDesc')}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {useCases.map((useCase, index) => {
                  const IconComponent = useCase.icon;
                  return (
                    <div key={index} className="group glass-card border border-primary/20 bg-gradient-to-br from-black/95 to-black/80 backdrop-blur-md p-8 rounded-2xl hover:border-primary/40 transition-all duration-200 hover:transform hover:scale-105">
                      <div className="flex items-center space-x-6 mb-6">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-150">
                          <IconComponent className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-primary font-mono tracking-wider">{useCase.title}</h3>
                      </div>
                      <p className="text-gray-300 text-lg leading-relaxed">{useCase.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Professional Technology Stack */}
        <section className="py-20 lg:py-32 bg-gradient-to-b from-primary/5 to-black">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-black text-white font-mono mb-6 tracking-wide">
                  {t('about.cuttingEdgeTech')}
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  {t('about.cuttingEdgeTechDesc')}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="group text-center p-8 glass-card border border-primary/20 bg-gradient-to-b from-black/95 to-black/80 backdrop-blur-md rounded-2xl hover:border-primary/40 transition-all duration-150 hover:transform hover:scale-105">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-150">
                    <Cpu className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="text-lg font-bold text-primary font-mono mb-3 tracking-wider">{t('about.frontend')}</h4>
                  <p className="text-gray-400">{t('about.frontendDesc')}</p>
                </div>
                <div className="group text-center p-8 glass-card border border-primary/20 bg-gradient-to-b from-black/95 to-black/80 backdrop-blur-md rounded-2xl hover:border-primary/40 transition-all duration-150 hover:transform hover:scale-105">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-150">
                    <Network className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="text-lg font-bold text-primary font-mono mb-3 tracking-wider">{t('about.blockchain')}</h4>
                  <p className="text-gray-400">{t('about.blockchainDesc')}</p>
                </div>
                <div className="group text-center p-8 glass-card border border-primary/20 bg-gradient-to-b from-black/95 to-black/80 backdrop-blur-md rounded-2xl hover:border-primary/40 transition-all duration-150 hover:transform hover:scale-105">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-150">
                    <Globe className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="text-lg font-bold text-primary font-mono mb-3 tracking-wider">{t('about.networkLabel')}</h4>
                  <p className="text-gray-400">{t('about.networkDesc')}</p>
                </div>
                <div className="group text-center p-8 glass-card border border-primary/20 bg-gradient-to-b from-black/95 to-black/80 backdrop-blur-md rounded-2xl hover:border-primary/40 transition-all duration-150 hover:transform hover:scale-105">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-150">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="text-lg font-bold text-primary font-mono mb-3 tracking-wider">{t('about.security')}</h4>
                  <p className="text-gray-400">{t('about.securityDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Professional Call to Action */}
        <section className="py-20 lg:py-32 bg-gradient-to-br from-black via-primary/10 to-black relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,0,0.1),transparent_70%)] pointer-events-none"></div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              <div className="space-y-8">
                <div className="relative inline-block">
                  <Star className="w-20 h-20 text-primary mx-auto animate-pulse" />
                  <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl"></div>
                </div>
                
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white font-mono tracking-wider">
                  {t('about.joinRevolution')}
                </h2>
                
                <p className="text-xl md:text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed font-light">
                  {t('about.joinRevolutionDesc')}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
                  <Button 
                    onClick={() => window.location.href = '/chat'}
                    className="cyber-button bg-gradient-to-r from-primary/40 to-primary/30 hover:from-primary/50 hover:to-primary/40 border-primary/60 hover:border-primary text-primary font-mono px-12 py-5 text-xl transition-all duration-150 neon-glow font-bold"
                  >
                    <Rocket className="w-6 h-6 mr-3" />
                    {t('about.startChatting')}
                  </Button>
                  <Button 
                    onClick={() => window.open('/roadmap', '_blank')}
                    variant="outline"
                    className="cyber-button bg-black/60 border-primary/40 hover:bg-primary/10 text-primary font-mono px-12 py-5 text-xl transition-all duration-150 font-bold"
                  >
                    {t('about.viewRoadmap')}
                    <ArrowRight className="w-6 h-6 ml-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Professional Footer */}
        <footer className="bg-gradient-to-b from-black to-primary/5 border-t border-primary/20">
          <div className="container mx-auto px-6 py-16">
            <div className="max-w-6xl mx-auto">
              {/* Main Footer Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                {/* Brand Section */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center gap-4">
                    <img src={offchatLogo} alt="Offchat" className="w-12 h-12" />
                    <h3 className="text-2xl font-black text-primary font-mono tracking-wider">OFFCHAT</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed max-w-md">
                    {t('about.revolutionizing')}
                  </p>
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={() => window.open('https://x.com/OFFCHAT_app', '_blank')}
                      variant="outline"
                      size="sm"
                      className="cyber-button bg-black/60 border-primary/40 hover:bg-primary/10 text-primary p-3 transition-all duration-150"
                      data-testid="button-twitter"
                    >
                      <Twitter className="w-5 h-5" />
                    </Button>
                    <Button
                      onClick={() => window.open('https://t.me/OFCCHAT_app', '_blank')}
                      variant="outline"
                      size="sm"
                      className="cyber-button bg-black/60 border-primary/40 hover:bg-primary/10 text-primary p-3 transition-all duration-150"
                      data-testid="button-telegram"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                
                {/* Quick Links */}
                <div className="space-y-6">
                  <h4 className="text-lg font-bold text-primary font-mono tracking-wider">{t('about.quickLinks')}</h4>
                  <div className="space-y-3">
                    <a href="/whitepaper" className="block text-gray-400 hover:text-primary transition-colors font-mono">Whitepaper</a>
                    <a href="/roadmap" className="block text-gray-400 hover:text-primary transition-colors font-mono">Roadmap</a>
                    <a href="/chat" className="block text-gray-400 hover:text-primary transition-colors font-mono">Launch App</a>
                  </div>
                </div>
                
                {/* Legal */}
                <div className="space-y-6">
                  <h4 className="text-lg font-bold text-primary font-mono tracking-wider">LEGAL</h4>
                  <div className="space-y-3">
                    <a href="/privacy" className="block text-gray-400 hover:text-primary transition-colors font-mono">Privacy Policy</a>
                    <a href="/terms" className="block text-gray-400 hover:text-primary transition-colors font-mono">Terms of Service</a>
                  </div>
                </div>
              </div>
              
              {/* Bottom Section */}
              <div className="border-t border-primary/20 pt-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-gray-400 font-mono text-sm font-bold tracking-wider">
                        OFFCHAT PROTOCOL
                      </span>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="text-center md:text-right">
                    <p className="text-gray-500 font-mono text-sm">
                      © 2024 Offchat. All rights reserved.
                    </p>
                    <p className="text-gray-600 font-mono text-xs mt-1">
                      DECENTRALIZED • CRYPTO-NATIVE • PRIVACY-FIRST • WEB3 COMMUNICATION
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}