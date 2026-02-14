import { Download, FileText, Calendar, Users, Shield, Zap, Network, Database, Lock, Code, ChevronRight, Hash, ArrowUp } from "lucide-react";
import { useTranslation } from 'react-i18next';
import MatrixBackground from "@/components/matrix-background";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
const offchatLogo = "/logo.png";
import { useState, useEffect } from "react";

export default function WhitepaperPage() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<string>("executive-summary");
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
  const whitepaperVersion = "v1.0";
  const lastUpdated = "February 13, 2026";
  const pageCount = "12 pages";

  useEffect(() => {
    document.title = "Whitepaper - Offchat | Technical Documentation";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Read the Offchat whitepaper. Technical documentation covering the $OFFC token economy, multi-chain architecture, end-to-end encryption, and decentralized messaging protocol.');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', 'Whitepaper - Offchat | Technical Documentation');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', 'Read the Offchat whitepaper. Technical documentation covering the $OFFC token economy, multi-chain architecture, end-to-end encryption, and decentralized messaging protocol.');
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  const handleDownloadPdf = () => {
    window.open('/offchat-whitepaper.html', '_blank');
  };

  const handlePrintPdf = () => {
    const pdfWindow = window.open('/offchat-whitepaper.html', '_blank');
    if (pdfWindow) {
      pdfWindow.onload = () => {
        setTimeout(() => {
          pdfWindow.print();
        }, 1000);
      };
    }
  };

  const sections = [
    {
      id: "executive-summary",
      title: t('whitepaper.secExecutiveSummary'),
      description: t('whitepaper.secExecutiveSummaryDesc'),
      page: "3"
    },
    {
      id: "technical-architecture",
      title: t('whitepaper.secTechArch'),
      description: t('whitepaper.secTechArchDesc'),
      page: "6"
    },
    {
      id: "cryptographic-security",
      title: t('whitepaper.secCryptoSecurity'),
      description: t('whitepaper.secCryptoSecurityDesc'),
      page: "10"
    },
    {
      id: "tokenomics-governance",
      title: t('whitepaper.secTokenomics'),
      description: t('whitepaper.secTokenomicsDesc'),
      page: "14"
    },
    {
      id: "protocol-specifications",
      title: t('whitepaper.secProtocolSpecs'),
      description: t('whitepaper.secProtocolSpecsDesc'),
      page: "18"
    },
    {
      id: "roadmap-milestones",
      title: t('whitepaper.secRoadmapMilestones'),
      description: t('whitepaper.secRoadmapMilestonesDesc'),
      page: "22"
    }
  ];

  const keyFeatures = [
    {
      icon: Shield,
      title: t('whitepaper.featureMilitaryEncryption'),
      description: t('whitepaper.featureMilitaryEncryptionDesc')
    },
    {
      icon: Network,
      title: t('whitepaper.featureMultiChain'),
      description: t('whitepaper.featureMultiChainDesc')
    },
    {
      icon: Zap,
      title: t('whitepaper.featureRealTime'),
      description: t('whitepaper.featureRealTimeDesc')
    },
    {
      icon: Database,
      title: t('whitepaper.featureDecentralizedStorage'),
      description: t('whitepaper.featureDecentralizedStorageDesc')
    },
    {
      icon: Lock,
      title: t('whitepaper.featureZeroKnowledge'),
      description: t('whitepaper.featureZeroKnowledgeDesc')
    },
    {
      icon: Code,
      title: t('whitepaper.featureOpenSource'),
      description: t('whitepaper.featureOpenSourceDesc')
    }
  ];

  const stats = [
    { label: t('whitepaper.protocolVersion'), value: "1.0", description: t('whitepaper.currentRelease') },
    { label: t('whitepaper.supportedChains'), value: "10+", description: t('whitepaper.blockchainNetworks') },
    { label: t('whitepaper.securityAudits'), value: "3", description: t('whitepaper.professionalReviews') },
    { label: t('whitepaper.technicalPages'), value: "12", description: t('whitepaper.comprehensiveGuide') }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <MatrixBackground />
      
      <div className="relative z-10">
        {/* Back to Home Navigation */}
        <nav className="glass-card border-b border-primary/20 bg-black/95 backdrop-blur-md sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="container mx-auto px-4 py-3 flex items-center">
            <a href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 font-mono text-sm transition-colors">
              <ChevronRight className="w-4 h-4 rotate-180" />
              {t('whitepaper.backToHome')}
            </a>
          </div>
        </nav>

        {/* Header */}
        <header className="glass-card border-b border-primary/20 bg-black/95 backdrop-blur-md">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="relative">
                  <img 
                    src={offchatLogo} 
                    alt="Offchat Logo" 
                    className="w-16 h-16 matrix-logo float-animation"
                  />
                  <div className="absolute -inset-2 rounded-full border border-primary/20 animate-pulse"></div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-3xl md:text-5xl font-bold text-white font-mono">
                  {t('whitepaper.title')}
                </h1>
                <h2 className="text-xl md:text-2xl text-primary font-mono">
                  {t('whitepaper.subtitle')}
                </h2>
                <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  {t('whitepaper.headerDesc')}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Badge className="bg-primary/20 text-primary border-primary/40 font-mono px-3 py-1">
                  {t('whitepaper.version')}: {whitepaperVersion}
                </Badge>
                <Badge className="bg-primary/20 text-primary border-primary/40 font-mono px-3 py-1">
                  {t('whitepaper.pages')}: {pageCount}
                </Badge>
                <Badge className="bg-primary/20 text-primary border-primary/40 font-mono px-3 py-1">
                  {t('whitepaper.lastUpdated')}: {lastUpdated}
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          {/* Download Section */}
          <section className="glass-card border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur-md rounded-xl p-8 mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white font-mono">
                    {t('whitepaper.downloadWhitepaper')}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {t('whitepaper.downloadDesc')}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {stats.map((stat, index) => (
                      <div key={index} className="text-center p-3 rounded-lg border border-primary/20 bg-black/40">
                        <div className="text-lg font-bold text-primary mb-1">{stat.value}</div>
                        <div className="text-xs text-gray-500 font-mono">{stat.label}</div>
                        <div className="text-xs text-gray-600">{stat.description}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleDownloadPdf}
                      className="cyber-button bg-primary/20 hover:bg-primary/30 border-primary/50 hover:border-primary text-primary font-mono px-6 py-3 transition-all duration-150 neon-glow flex-1"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {t('whitepaper.downloadPdf')}
                    </Button>
                    <Button 
                      onClick={handlePrintPdf}
                      className="cyber-button bg-primary/20 hover:bg-primary/30 border-primary/50 hover:border-primary text-primary font-mono px-6 py-3 transition-all duration-150 neon-glow flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {t('whitepaper.printPdf')}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <div className="relative group w-64 h-80 rounded-lg border border-primary/30 shadow-lg overflow-hidden bg-gradient-to-br from-black via-green-950/30 to-black group-hover:scale-105 transition-transform duration-150 flex flex-col items-center justify-center">
                  <img src={offchatLogo} alt="Offchat" className="w-16 h-16 mb-4 opacity-80" />
                  <div className="text-xl font-bold text-primary font-mono tracking-wider">OFFCHAT</div>
                  <div className="text-sm text-gray-500 font-mono mt-1">{t('whitepaper.title')}</div>
                  <div className="absolute bottom-4 left-4 right-4 text-center">
                    <div className="text-sm font-mono text-gray-300">{whitepaperVersion}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Navigation & Table of Contents */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
            {/* Sticky Navigation */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="glass-card border border-primary/20 bg-black/95 backdrop-blur-md p-6 rounded-xl">
                  <h3 className="text-lg font-bold text-white font-mono mb-6 text-center">
                    {t('whitepaper.navigation')}
                  </h3>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {sections.map((section, index) => (
                        <button
                          key={index}
                          onClick={() => scrollToSection(section.id)}
                          data-testid={`nav-${section.id}`}
                          className={`w-full text-left p-3 rounded-lg transition-all duration-200 border ${
                            activeSection === section.id
                              ? 'bg-primary/20 border-primary/50 text-primary'
                              : 'bg-black/40 border-primary/20 text-gray-400 hover:bg-primary/10 hover:border-primary/30'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-mono ${
                              activeSection === section.id
                                ? 'bg-primary/30 border-primary/60 text-primary'
                                : 'bg-primary/10 border-primary/30 text-gray-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-bold font-mono text-xs">{section.title}</div>
                              <div className="text-xs opacity-60">{t('whitepaper.page')} {section.page}</div>
                            </div>
                            <ChevronRight className="w-3 h-3 opacity-50" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Table of Contents Overview */}
              <section className="glass-card border border-primary/20 bg-black/95 backdrop-blur-md p-8 rounded-xl mb-8">
                <h3 className="text-2xl font-bold text-white font-mono mb-8 text-center">
                  {t('whitepaper.tableOfContents')}
                </h3>
                <div className="space-y-4">
                  {sections.map((section, index) => (
                    <button
                      key={index}
                      onClick={() => scrollToSection(section.id)}
                      data-testid={`toc-${section.id}`}
                      className="w-full flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-black/40 hover:bg-primary/5 transition-colors group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-sm font-mono text-primary group-hover:bg-primary/30 transition-colors">
                          {index + 1}
                        </div>
                        <div className="text-left">
                          <h4 className="font-bold text-white font-mono text-sm group-hover:text-gray-200">{section.title}</h4>
                          <p className="text-gray-500 text-sm">{section.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-gray-500 font-mono text-sm">
                          {t('whitepaper.page')} {section.page}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-500 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {/* Key Features */}
          <section className="mb-12">
            <h3 className="text-2xl font-bold text-white font-mono text-center mb-8">
              {t('whitepaper.protocolHighlights')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {keyFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="glass-card border border-primary/20 bg-black/95 backdrop-blur-md p-6 rounded-xl hover:bg-primary/5 transition-all duration-150">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                        <IconComponent className="w-5 h-5 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-white font-mono text-sm">{feature.title}</h4>
                        <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Whitepaper Content Sections */}
          <div className="space-y-12">
            {/* Executive Summary */}
            <section id="executive-summary" className="glass-card border border-primary/20 bg-black/95 backdrop-blur-md p-8 rounded-xl">
              <div className="flex items-center space-x-3 mb-6">
                <Hash className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold text-white font-mono">
                  {'1. ' + t('whitepaper.secExecutiveSummary')}
                </h3>
              </div>
              <div className="max-w-4xl space-y-6 text-gray-400 leading-relaxed">
                <p className="text-lg font-medium text-gray-200">
                  {t('whitepaper.execSummaryP1')}
                </p>
                <p>
                  {t('whitepaper.execSummaryP2')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 border border-primary/20 rounded-lg bg-black/40">
                    <h4 className="font-bold text-white font-mono text-sm mb-2">{t('whitepaper.keyInnovation')}</h4>
                    <p className="text-sm text-gray-500">{t('whitepaper.keyInnovationDesc')}</p>
                  </div>
                  <div className="p-4 border border-primary/20 rounded-lg bg-black/40">
                    <h4 className="font-bold text-white font-mono text-sm mb-2">{t('whitepaper.securityModel')}</h4>
                    <p className="text-sm text-gray-500">{t('whitepaper.securityModelDesc')}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Technical Architecture */}
            <section id="technical-architecture" className="glass-card border border-primary/20 bg-black/95 backdrop-blur-md p-8 rounded-xl">
              <div className="flex items-center space-x-3 mb-6">
                <Hash className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold text-white font-mono">
                  {'2. ' + t('whitepaper.secTechArch')}
                </h3>
              </div>
              <div className="max-w-4xl space-y-6 text-gray-400 leading-relaxed">
                <p>
                  {t('whitepaper.techArchP1')}
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                  <div className="p-6 border border-primary/20 rounded-lg bg-black/40">
                    <Network className="w-8 h-8 text-primary mb-3" />
                    <h4 className="font-bold text-white font-mono text-sm mb-2">{t('whitepaper.networkLayer')}</h4>
                    <ul className="text-sm text-gray-500 space-y-1">
                      {(t('whitepaper.networkLayerItems', { returnObjects: true }) as string[]).map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-6 border border-primary/20 rounded-lg bg-black/40">
                    <Shield className="w-8 h-8 text-primary mb-3" />
                    <h4 className="font-bold text-white font-mono text-sm mb-2">{t('whitepaper.protocolLayer')}</h4>
                    <ul className="text-sm text-gray-500 space-y-1">
                      {(t('whitepaper.protocolLayerItems', { returnObjects: true }) as string[]).map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-6 border border-primary/20 rounded-lg bg-black/40">
                    <Code className="w-8 h-8 text-primary mb-3" />
                    <h4 className="font-bold text-white font-mono text-sm mb-2">{t('whitepaper.applicationLayer')}</h4>
                    <ul className="text-sm text-gray-500 space-y-1">
                      {(t('whitepaper.applicationLayerItems', { returnObjects: true }) as string[]).map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Cryptographic Security */}
            <section id="cryptographic-security" className="glass-card border border-primary/20 bg-black/95 backdrop-blur-md p-8 rounded-xl">
              <div className="flex items-center space-x-3 mb-6">
                <Hash className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold text-white font-mono">
                  {'3. ' + t('whitepaper.secCryptoSecurity')}
                </h3>
              </div>
              <div className="max-w-4xl space-y-6 text-gray-400 leading-relaxed">
                <p>
                  {t('whitepaper.cryptoSecurityP1')}
                </p>
                <div className="space-y-4">
                  <div className="p-4 border border-primary/20 rounded-lg bg-black/40">
                    <h4 className="font-bold text-white font-mono text-sm mb-3">{t('whitepaper.encryptionStack')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-primary font-mono">{t('whitepaper.messageEncryption')}</span>
                        <span className="text-gray-500 ml-2">ChaCha20-Poly1305</span>
                      </div>
                      <div>
                        <span className="text-primary font-mono">{t('whitepaper.keyExchangeLabel')}</span>
                        <span className="text-gray-500 ml-2">X25519 ECDH</span>
                      </div>
                      <div>
                        <span className="text-primary font-mono">{t('whitepaper.digitalSignatures')}</span>
                        <span className="text-gray-500 ml-2">Ed25519</span>
                      </div>
                      <div>
                        <span className="text-primary font-mono">{t('whitepaper.hashFunction')}</span>
                        <span className="text-gray-500 ml-2">BLAKE3</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border border-primary/20 rounded-lg bg-black/40">
                    <h4 className="font-bold text-white font-mono text-sm mb-3">{t('whitepaper.privacyFeatures')}</h4>
                    <ul className="text-sm text-gray-500 space-y-2">
                      <li>• {t('whitepaper.privacyFeature1')}</li>
                      <li>• {t('whitepaper.privacyFeature2')}</li>
                      <li>• {t('whitepaper.privacyFeature3')}</li>
                      <li>• {t('whitepaper.privacyFeature4')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Tokenomics & Governance */}
            <section id="tokenomics-governance" className="glass-card border border-primary/20 bg-black/95 backdrop-blur-md p-8 rounded-xl">
              <div className="flex items-center space-x-3 mb-6">
                <Hash className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold text-white font-mono">
                  {'4. ' + t('whitepaper.secTokenomics')}
                </h3>
              </div>
              <div className="max-w-4xl space-y-6 text-gray-400 leading-relaxed">
                <p>
                  {t('whitepaper.tokenomicsP1')}
                </p>
                <p>
                  {t('whitepaper.tokenomicsP2')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-bold text-white font-mono text-lg">{t('whitepaper.tokenDistribution')}</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 border border-primary/20 rounded-lg bg-black/40">
                        <span className="text-sm font-mono">{t('whitepaper.flapLiquidity')}</span>
                        <span className="text-primary font-mono font-bold">95%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 border border-primary/20 rounded-lg bg-black/40">
                        <span className="text-sm font-mono">{t('whitepaper.teamAllocation')}</span>
                        <span className="text-primary font-mono font-bold">5%</span>
                      </div>
                    </div>
                    <div className="p-3 border border-green-400/30 rounded-lg bg-green-400/5 mt-4">
                      <div className="font-mono text-green-400 text-sm mb-1">{t('whitepaper.fairLaunchModel')}</div>
                      <div className="text-gray-500 text-xs">{t('whitepaper.fairLaunchDesc')}</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-bold text-white font-mono text-lg">{t('whitepaper.transactionTax')}</h4>
                    <div className="space-y-3 text-sm">
                      <div className="p-3 border border-primary/20 rounded-lg bg-black/40">
                        <div className="font-mono text-primary mb-1">{t('whitepaper.taxRate')}</div>
                        <div className="text-gray-500">{t('whitepaper.taxRateDesc')}</div>
                      </div>
                      <div className="p-3 border border-primary/20 rounded-lg bg-black/40">
                        <div className="font-mono text-primary mb-1">{t('whitepaper.taxUsage')}</div>
                        <div className="text-gray-500">{t('whitepaper.taxUsageDesc')}</div>
                      </div>
                      <div className="p-3 border border-primary/20 rounded-lg bg-black/40">
                        <div className="font-mono text-primary mb-1">{t('whitepaper.expansionGoals')}</div>
                        <div className="text-gray-500">{t('whitepaper.expansionGoalsDesc')}</div>
                      </div>
                      <div className="p-3 border border-primary/20 rounded-lg bg-black/40">
                        <div className="font-mono text-primary mb-1">{t('whitepaper.liquidityPlatform')}</div>
                        <div className="text-gray-500">{t('whitepaper.liquidityPlatformDesc')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Protocol Specifications */}
            <section id="protocol-specifications" className="glass-card border border-primary/20 bg-black/95 backdrop-blur-md p-8 rounded-xl">
              <div className="flex items-center space-x-3 mb-6">
                <Hash className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold text-white font-mono">
                  {'5. ' + t('whitepaper.secProtocolSpecs')}
                </h3>
              </div>
              <div className="max-w-4xl space-y-6 text-gray-400 leading-relaxed">
                <p>
                  {t('whitepaper.protocolSpecsP1')}
                </p>
                <div className="space-y-6">
                  <div className="p-6 border border-primary/20 rounded-lg bg-black/40">
                    <h4 className="font-bold text-white font-mono text-lg mb-4">{t('whitepaper.messageFormat')}</h4>
                    <div className="bg-black/60 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <div className="text-gray-300">
                        <div className="text-green-400">interface</div> <span className="text-blue-400">OffchatMessage</span> {'{'}
                      </div>
                      <div className="pl-4 space-y-1">
                        <div><span className="text-purple-400">id</span>: <span className="text-yellow-400">string</span>;</div>
                        <div><span className="text-purple-400">sender</span>: <span className="text-yellow-400">PublicKey</span>;</div>
                        <div><span className="text-purple-400">recipient</span>: <span className="text-yellow-400">PublicKey</span>;</div>
                        <div><span className="text-purple-400">timestamp</span>: <span className="text-yellow-400">number</span>;</div>
                        <div><span className="text-purple-400">content</span>: <span className="text-yellow-400">EncryptedPayload</span>;</div>
                        <div><span className="text-purple-400">signature</span>: <span className="text-yellow-400">Signature</span>;</div>
                        <div><span className="text-purple-400">networkId</span>: <span className="text-yellow-400">ChainId</span>;</div>
                      </div>
                      <div className="text-gray-300">{'}'}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-primary/20 rounded-lg bg-black/40">
                      <h5 className="font-bold text-primary font-mono text-sm mb-3">{t('whitepaper.networkConstants')}</h5>
                      <div className="space-y-2 text-sm font-mono">
                        <div><span className="text-primary">MAX_MESSAGE_SIZE:</span> <span className="text-gray-500">64KB</span></div>
                        <div><span className="text-primary">HEARTBEAT_INTERVAL:</span> <span className="text-gray-500">30s</span></div>
                        <div><span className="text-primary">CONNECTION_TIMEOUT:</span> <span className="text-gray-500">60s</span></div>
                        <div><span className="text-primary">MAX_PEERS:</span> <span className="text-gray-500">128</span></div>
                      </div>
                    </div>
                    <div className="p-4 border border-primary/20 rounded-lg bg-black/40">
                      <h5 className="font-bold text-primary font-mono text-sm mb-3">{t('whitepaper.supportedChainsTitle')}</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Ethereum</span>
                          <span className="text-gray-500 font-mono">Chain ID: 1</span>
                        </div>
                        <div className="flex justify-between">
                          <span>BSC</span>
                          <span className="text-gray-500 font-mono">Chain ID: 56</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Polygon</span>
                          <span className="text-gray-500 font-mono">Chain ID: 137</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Arbitrum</span>
                          <span className="text-gray-500 font-mono">Chain ID: 42161</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Roadmap & Milestones */}
            <section id="roadmap-milestones" className="glass-card border border-primary/20 bg-black/95 backdrop-blur-md p-8 rounded-xl">
              <div className="flex items-center space-x-3 mb-6">
                <Hash className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold text-white font-mono">
                  {'6. ' + t('whitepaper.secRoadmapMilestones')}
                </h3>
              </div>
              <div className="max-w-4xl space-y-6 text-gray-400 leading-relaxed">
                <p>
                  {t('whitepaper.roadmapMilestonesP1')}
                </p>
                <div className="space-y-6">
                  <div className="relative">
                    <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-primary/30"></div>
                    <div className="space-y-8">
                      {[
                        {
                          phase: t('roadmap.phase') + ' 1',
                          title: t('whitepaper.wpPhase1Title'),
                          date: "Q1 2026",
                          status: t('whitepaper.inProgress'),
                          items: t('whitepaper.wpPhase1Items', { returnObjects: true }) as string[]
                        },
                        {
                          phase: t('roadmap.phase') + ' 2',
                          title: t('whitepaper.wpPhase2Title'),
                          date: "Q2 2026",
                          status: t('whitepaper.planned'),
                          items: t('whitepaper.wpPhase2Items', { returnObjects: true }) as string[]
                        },
                        {
                          phase: t('roadmap.phase') + ' 3',
                          title: t('whitepaper.wpPhase3Title'),
                          date: "Q3 2026",
                          status: t('whitepaper.planned'),
                          items: t('whitepaper.wpPhase3Items', { returnObjects: true }) as string[]
                        },
                        {
                          phase: t('roadmap.phase') + ' 4',
                          title: t('whitepaper.wpPhase4Title'),
                          date: "Q4 2026",
                          status: t('whitepaper.planned'),
                          items: t('whitepaper.wpPhase4Items', { returnObjects: true }) as string[]
                        }
                      ].map((milestone, index) => (
                        <div key={index} className="relative flex items-start space-x-6">
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center relative z-10">
                            <span className="text-primary font-mono text-sm font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1 pb-8">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                              <div>
                                <div className="text-gray-500 font-mono text-xs mb-1">{milestone.phase}</div>
                                <h4 className="font-bold text-white font-mono text-lg">{milestone.title}</h4>
                              </div>
                              <div className="flex items-center space-x-3 mt-2 md:mt-0">
                                <Badge className={`font-mono text-xs ${
                                  milestone.status === t('whitepaper.inProgress')
                                    ? 'bg-green-500/20 text-green-400 border-green-500/40' 
                                    : 'bg-primary/20 text-primary border-primary/40'
                                }`}>
                                  {milestone.status}
                                </Badge>
                                <span className="text-gray-500 font-mono text-sm">{milestone.date}</span>
                              </div>
                            </div>
                            <ul className="space-y-2">
                              {milestone.items.map((item, itemIndex) => (
                                <li key={itemIndex} className="flex items-center space-x-2 text-sm">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60"></div>
                                  <span className="text-gray-400">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Call to Action */}
          <section className="text-center py-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white font-mono">
                {t('whitepaper.joinProtocolRevolution')}
              </h3>
              <p className="text-gray-500 font-mono max-w-2xl mx-auto">
                {t('whitepaper.joinProtocolDesc')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="flex gap-3">
                  <Button 
                    onClick={handleDownloadPdf}
                    className="cyber-button bg-primary/20 hover:bg-primary/30 border-primary/50 hover:border-primary text-primary font-mono px-6 py-2 transition-all duration-150 neon-glow"
                  >
                    <FileText className="w-3 h-3 mr-2" />
                    {t('whitepaper.viewPdf')}
                  </Button>
                  <Button 
                    onClick={handlePrintPdf}
                    className="cyber-button bg-primary/20 hover:bg-primary/30 border-primary/50 hover:border-primary text-primary font-mono px-6 py-2 transition-all duration-150 neon-glow"
                  >
                    <Download className="w-3 h-3 mr-2" />
                    {t('whitepaper.printPdf')}
                  </Button>
                </div>
                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="cyber-button bg-black/40 border-primary/30 hover:bg-primary/10 text-primary font-mono px-8 py-3 transition-all duration-150"
                >
                  {t('whitepaper.returnToOffchat')}
                </Button>
              </div>
            </div>
          </section>
        </main>

        {/* Scroll to Top Button */}
        {showScrollToTop && (
          <Button
            onClick={scrollToTop}
            data-testid="scroll-to-top"
            className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-primary/20 hover:bg-primary/30 border-primary/50 hover:border-primary text-primary transition-all duration-150 neon-glow z-50"
          >
            <ArrowUp className="w-5 h-5" />
          </Button>
        )}

        {/* Footer */}
        <footer className="glass-card border-t border-primary/20 bg-black/95 backdrop-blur-md mt-16">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
              <div className="space-y-4">
                <h4 className="font-bold text-white font-mono text-lg">{t('whitepaper.footerProtocol')}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {t('whitepaper.footerProtocolDesc')}
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-white font-mono text-lg">{t('whitepaper.quickLinks')}</h4>
                <div className="space-y-2">
                  <button onClick={() => scrollToSection('executive-summary')} className="block text-gray-500 hover:text-primary transition-colors text-sm">
                    {t('whitepaper.executiveSummaryLink')}
                  </button>
                  <button onClick={() => scrollToSection('technical-architecture')} className="block text-gray-500 hover:text-primary transition-colors text-sm">
                    {t('whitepaper.techArchLink')}
                  </button>
                  <button onClick={() => scrollToSection('cryptographic-security')} className="block text-gray-500 hover:text-primary transition-colors text-sm">
                    {t('whitepaper.securityModelLink')}
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-white font-mono text-lg">{t('whitepaper.documentInfo')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <span className="text-gray-500">{t('whitepaper.version')}:</span>
                    <Badge className="bg-primary/20 text-primary border-primary/40 font-mono">{whitepaperVersion}</Badge>
                  </div>
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <span className="text-gray-500">{t('whitepaper.lastUpdated')}:</span>
                    <span className="text-gray-300 font-mono">{lastUpdated}</span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <span className="text-gray-500">{t('whitepaper.pages')}:</span>
                    <span className="text-gray-300 font-mono">{pageCount}</span>
                  </div>
                </div>
              </div>
            </div>
            <Separator className="my-8 bg-primary/20" />
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-gray-500 font-mono text-sm">
                  {t('whitepaper.footerTechDoc')}
                </span>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              </div>
              <p className="text-xs text-gray-600 font-mono">
                › {t('whitepaper.footerTagline')}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}