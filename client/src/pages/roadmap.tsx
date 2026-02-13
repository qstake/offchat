import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Calendar, Target, Zap, Users, Shield, Globe, Smartphone, Network, Cpu, Rocket, Database, Cloud, Lock, Code, Activity, Server } from "lucide-react";
import MatrixBackground from "@/components/matrix-background";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
const offchatLogo = "/logo.png";

interface RoadmapPhase {
  id: string;
  phase: string;
  period: string;
  status: "completed" | "current" | "upcoming";
  title: string;
  description: string;
  objectives: string[];
  icon: any;
  color: string;
}

export default function RoadmapPage() {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = "Roadmap - Offchat | Development Timeline";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Explore Offchat\'s development roadmap. See upcoming features including $OFFC token launch, multi-chain expansion, and decentralized communication tools.');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', 'Roadmap - Offchat | Development Timeline');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', 'Explore Offchat\'s development roadmap. See upcoming features including $OFFC token launch, multi-chain expansion, and decentralized communication tools.');
  }, []);

  const [expandedPhase, setExpandedPhase] = useState<string>("phase1");

  const roadmapData: RoadmapPhase[] = [
    {
      id: "phase1",
      phase: t('roadmap.phase') + ' 1',
      period: "Q1 2026",
      status: "current",
      title: t('roadmap.phase1Title'),
      description: t('roadmap.phase1Desc'),
      objectives: [
        '🔄 ' + t('roadmap.phase1Obj1'),
        '🔄 ' + t('roadmap.phase1Obj2'),
        '🔄 ' + t('roadmap.phase1Obj3'),
        '🔄 ' + t('roadmap.phase1Obj4'),
        '🔄 ' + t('roadmap.phase1Obj5'),
        '🔄 ' + t('roadmap.phase1Obj6'),
        '🔄 ' + t('roadmap.phase1Obj7'),
        '🔄 ' + t('roadmap.phase1Obj8'),
        '🔄 ' + t('roadmap.phase1Obj9')
      ],
      icon: Rocket,
      color: "bg-yellow-500/20 border-yellow-500/40"
    },
    {
      id: "phase2",
      phase: t('roadmap.phase') + ' 2',
      period: "Q2 2026",
      status: "upcoming",
      title: t('roadmap.phase2Title'),
      description: t('roadmap.phase2Desc'),
      objectives: [
        '📈 ' + t('roadmap.phase2Obj1'),
        '🔒 ' + t('roadmap.phase2Obj2'),
        '📱 ' + t('roadmap.phase2Obj3'),
        '🔍 ' + t('roadmap.phase2Obj4'),
        '📱 ' + t('roadmap.phase2Obj5'),
        '📱 ' + t('roadmap.phase2Obj6'),
        '🌐 ' + t('roadmap.phase2Obj7'),
        '📊 ' + t('roadmap.phase2Obj8'),
        '🤝 ' + t('roadmap.phase2Obj9')
      ],
      icon: Shield,
      color: "bg-blue-500/20 border-blue-500/40"
    },
    {
      id: "phase3",
      phase: t('roadmap.phase') + ' 3',
      period: "Q3 2026",
      status: "upcoming",
      title: t('roadmap.phase3Title'),
      description: t('roadmap.phase3Desc'),
      objectives: [
        '📱 ' + t('roadmap.phase3Obj1'),
        '🌍 ' + t('roadmap.phase3Obj2'),
        '⛓️ ' + t('roadmap.phase3Obj3'),
        '🔗 ' + t('roadmap.phase3Obj4'),
        '📡 ' + t('roadmap.phase3Obj5'),
        '🤝 ' + t('roadmap.phase3Obj6'),
        '🌐 ' + t('roadmap.phase3Obj7'),
        '📊 ' + t('roadmap.phase3Obj8'),
        '🎯 ' + t('roadmap.phase3Obj9')
      ],
      icon: Globe,
      color: "bg-purple-500/20 border-purple-500/40"
    },
    {
      id: "phase4",
      phase: t('roadmap.phase') + ' 4',
      period: "Q4 2026",
      status: "upcoming",
      title: t('roadmap.phase4Title'),
      description: t('roadmap.phase4Desc'),
      objectives: [
        '🏛️ ' + t('roadmap.phase4Obj1'),
        '⛓️ ' + t('roadmap.phase4Obj2'),
        '🔗 ' + t('roadmap.phase4Obj3'),
        '🌍 ' + t('roadmap.phase4Obj4'),
        '🤝 ' + t('roadmap.phase4Obj5'),
        '📡 ' + t('roadmap.phase4Obj6'),
        '🔒 ' + t('roadmap.phase4Obj7'),
        '🎯 ' + t('roadmap.phase4Obj8'),
        '💰 ' + t('roadmap.phase4Obj9')
      ],
      icon: Rocket,
      color: "bg-green-500/20 border-green-500/40"
    }
  ];

  const milestones = [
    { date: "Q1 2026", achievement: t('roadmap.milestone1'), icon: Rocket },
    { date: "Q2 2026", achievement: t('roadmap.milestone2'), icon: Network },
    { date: "Q2 2026", achievement: t('roadmap.milestone3'), icon: Shield },
    { date: "Q3 2026", achievement: t('roadmap.milestone4'), icon: Smartphone },
    { date: "Q4 2026", achievement: t('roadmap.milestone5'), icon: Users }
  ];

  const togglePhase = (phaseId: string) => {
    setExpandedPhase(expandedPhase === phaseId ? "" : phaseId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-primary/20 text-primary border-primary/40 font-mono">{t('roadmap.completed')}</Badge>;
      case "current":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 font-mono animate-pulse">{t('roadmap.current')}</Badge>;
      case "upcoming":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40 font-mono">{t('roadmap.upcoming')}</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <MatrixBackground />
      
      <div className="relative z-10">
        {/* Back to Home Navigation */}
        <nav className="glass-card border-b border-primary/20 bg-black/95 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center">
            <a href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 font-mono text-sm transition-colors">
              <ChevronRight className="w-4 h-4 rotate-180" />
              {t('roadmap.backToHome')}
            </a>
          </div>
        </nav>

        {/* Header */}
        <header className="glass-card border-b border-primary/20 bg-black/95 backdrop-blur-md">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <img 
                src={offchatLogo} 
                alt="Offchat Logo" 
                className="w-12 h-12 matrix-logo"
              />
              <h1 className="text-3xl md:text-4xl font-bold text-white font-mono">
                {t('roadmap.title')}
              </h1>
            </div>
            <p className="text-center text-gray-300 font-mono text-sm">
              {t('roadmap.subtitle')}
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Mission Statement */}
          <section className="glass-card border border-primary/20 bg-black/95 backdrop-blur-md p-6 rounded-xl">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold text-white font-mono">{t('roadmap.missionStatement')}</h2>
              </div>
              <p className="text-lg text-gray-300 max-w-4xl mx-auto leading-relaxed">
                {t('roadmap.missionDesc')}
              </p>
            </div>
          </section>

          {/* Key Milestones */}
          <section className="glass-card border border-primary/20 bg-black/95 backdrop-blur-md p-6 rounded-xl">
            <h3 className="text-xl font-bold text-white font-mono mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {t('roadmap.keyMilestones')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {milestones.map((milestone, index) => {
                const IconComponent = milestone.icon;
                return (
                  <div key={index} className="text-center p-4 rounded-lg border border-primary/20 bg-black/40">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-xs font-mono text-gray-500 mb-1">{milestone.date}</div>
                    <div className="text-sm font-semibold text-primary">{milestone.achievement}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Development Phases */}
          <section className="space-y-4">
            <h3 className="text-2xl font-bold text-white font-mono mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              {t('roadmap.developmentPhases')}
            </h3>
            
            {roadmapData.map((phase) => {
              const IconComponent = phase.icon;
              const isExpanded = expandedPhase === phase.id;
              
              return (
                <div key={phase.id} className="glass-card border border-primary/20 bg-black/95 backdrop-blur-md rounded-xl overflow-hidden">
                  <button
                    onClick={() => togglePhase(phase.id)}
                    className="w-full p-6 text-left hover:bg-primary/5 transition-colors duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${phase.color}`}>
                          <IconComponent className="w-6 h-6 text-current" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-xl font-bold text-primary font-mono">{phase.phase}</h4>
                            <span className="text-sm font-mono text-gray-500">{phase.period}</span>
                            {getStatusBadge(phase.status)}
                          </div>
                          <h5 className="text-lg font-semibold text-gray-300 mb-1">{phase.title}</h5>
                          <p className="text-sm text-gray-500">{phase.description}</p>
                        </div>
                      </div>
                      <div className="text-primary">
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </div>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                      <div className="pt-4 space-y-3">
                        <h6 className="font-semibold text-primary font-mono uppercase tracking-wider text-sm">{t('roadmap.objectives')}</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {phase.objectives.map((objective, index) => (
                            <div key={index} className="flex items-start space-x-2 text-sm">
                              <span className="text-gray-500 font-mono">{objective}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          {/* Technical Architecture */}
          <section className="glass-card border border-primary/20 bg-black/95 backdrop-blur-md p-6 rounded-xl">
            <h3 className="text-xl font-bold text-white font-mono mb-6 flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              {t('roadmap.techArchEvolution')}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white font-mono">{t('roadmap.currentStack')}</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-black/40">
                    <span className="text-gray-300">{t('roadmap.frontend')}</span>
                    <span className="text-primary font-mono text-xs">React 18 + TypeScript + Tailwind</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-black/40">
                    <span className="text-gray-300">{t('roadmap.backend')}</span>
                    <span className="text-primary font-mono text-xs">Node.js + Express + WebSocket</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-black/40">
                    <span className="text-gray-300">{t('roadmap.database')}</span>
                    <span className="text-primary font-mono text-xs">PostgreSQL + Drizzle ORM</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-black/40">
                    <span className="text-gray-300">{t('roadmap.blockchain')}</span>
                    <span className="text-primary font-mono text-xs">Ethereum + BSC</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white font-mono">{t('roadmap.targetStack')}</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-black/40">
                    <span className="text-gray-300">{t('roadmap.webMobile')}</span>
                    <span className="text-primary font-mono text-xs">React + React Native + PWA</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-black/40">
                    <span className="text-gray-300">{t('roadmap.apiLayer')}</span>
                    <span className="text-primary font-mono text-xs">GraphQL + WebSocket + gRPC</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-black/40">
                    <span className="text-gray-300">{t('roadmap.storage')}</span>
                    <span className="text-primary font-mono text-xs">PostgreSQL + Redis + IPFS</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-black/40">
                    <span className="text-gray-300">{t('roadmap.p2pCrypto')}</span>
                    <span className="text-primary font-mono text-xs">libp2p + Multi-chain + ZK</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Performance & Security Specifications */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card border border-primary/20 bg-black/95 backdrop-blur-md p-6 rounded-xl">
              <h3 className="text-lg font-bold text-white font-mono mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                {t('roadmap.performanceSpecs')}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-black/40">
                  <span className="text-gray-300 text-sm">{t('roadmap.messageLatency')}</span>
                  <span className="text-primary font-mono text-xs">&lt;50ms</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-black/40">
                  <span className="text-gray-300 text-sm">{t('roadmap.concurrentUsers')}</span>
                  <span className="text-primary font-mono text-xs">1M+</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-black/40">
                  <span className="text-gray-300 text-sm">{t('roadmap.dbThroughput')}</span>
                  <span className="text-primary font-mono text-xs">100K ops/sec</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-black/40">
                  <span className="text-gray-300 text-sm">{t('roadmap.uptimeSla')}</span>
                  <span className="text-primary font-mono text-xs">99.99%</span>
                </div>
              </div>
            </div>
            
            <div className="glass-card border border-primary/20 bg-black/95 backdrop-blur-md p-6 rounded-xl">
              <h3 className="text-lg font-bold text-white font-mono mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                {t('roadmap.securityStandards')}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-black/40">
                  <span className="text-gray-300 text-sm">{t('roadmap.encryption')}</span>
                  <span className="text-primary font-mono text-xs">AES-256 + RSA-4096</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-black/40">
                  <span className="text-gray-300 text-sm">{t('roadmap.keyExchange')}</span>
                  <span className="text-primary font-mono text-xs">ECDH + Signal Protocol</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-black/40">
                  <span className="text-gray-300 text-sm">{t('roadmap.authentication')}</span>
                  <span className="text-primary font-mono text-xs">Multi-factor + Biometric</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-black/40">
                  <span className="text-gray-300 text-sm">{t('roadmap.auditCompliance')}</span>
                  <span className="text-primary font-mono text-xs">SOC2 + ISO27001</span>
                </div>
              </div>
            </div>
          </section>

          {/* Success Metrics */}
          <section className="glass-card border border-primary/20 bg-black/95 backdrop-blur-md p-6 rounded-xl">
            <h3 className="text-xl font-bold text-white font-mono mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              {t('roadmap.successMetrics')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center p-4 rounded-lg border border-primary/20 bg-black/40">
                <div className="text-xl font-bold text-primary mb-2">1M+</div>
                <div className="text-xs text-gray-500 font-mono">{t('roadmap.registeredUsers')}</div>
              </div>
              <div className="text-center p-4 rounded-lg border border-primary/20 bg-black/40">
                <div className="text-xl font-bold text-primary mb-2">100K+</div>
                <div className="text-xs text-gray-500 font-mono">{t('roadmap.dailyActive')}</div>
              </div>
              <div className="text-center p-4 rounded-lg border border-primary/20 bg-black/40">
                <div className="text-xl font-bold text-primary mb-2">2</div>
                <div className="text-xs text-gray-500 font-mono">{t('roadmap.mobilePlatforms')}</div>
              </div>
              <div className="text-center p-4 rounded-lg border border-primary/20 bg-black/40">
                <div className="text-xl font-bold text-primary mb-2">100%</div>
                <div className="text-xs text-gray-500 font-mono">{t('roadmap.offlineCapable')}</div>
              </div>
              <div className="text-center p-4 rounded-lg border border-primary/20 bg-black/40">
                <div className="text-xl font-bold text-primary mb-2">10</div>
                <div className="text-xs text-gray-500 font-mono">{t('roadmap.blockchainNetworks')}</div>
              </div>
              <div className="text-center p-4 rounded-lg border border-primary/20 bg-black/40">
                <div className="text-xl font-bold text-primary mb-2">$10M+</div>
                <div className="text-xs text-gray-500 font-mono">{t('roadmap.cryptoVolume')}</div>
              </div>
            </div>
          </section>

          {/* Call to Action */}
          <section className="text-center py-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white font-mono">{t('roadmap.joinRevolution')}</h3>
              <p className="text-gray-500 font-mono max-w-2xl mx-auto">
                {t('roadmap.joinRevolutionDesc')}
              </p>
              <Button 
                onClick={() => window.location.href = '/'}
                className="cyber-button bg-primary/20 hover:bg-primary/30 border-primary/50 hover:border-primary text-primary font-mono px-8 py-3 transition-all duration-150 neon-glow"
              >
                <Rocket className="w-4 h-4 mr-2" />
                {t('roadmap.returnToOffchat')}
              </Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}