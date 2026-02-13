import { useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Calendar, Scale, Shield, AlertTriangle, FileText, Users, Gavel } from "lucide-react";
import MatrixBackground from "@/components/matrix-background";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
const offchatLogo = "/logo.png";

export default function TermsPage() {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = "Terms of Service - Offchat";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Read Offchat\'s Terms of Service. Understand the rules and guidelines for using the Offchat Web3 messaging and cryptocurrency platform.');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', 'Terms of Service - Offchat');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', 'Read Offchat\'s Terms of Service. Understand the rules and guidelines for using the Offchat Web3 messaging and cryptocurrency platform.');
  }, []);

  const lastUpdated = "September 11, 2025";
  const effectiveDate = "January 1, 2026";

  const sections = [
    {
      id: "acceptance",
      title: "1. ACCEPTANCE OF TERMS",
      content: `By accessing, using, or registering for Offchat ("the Platform"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service ("Terms"). These Terms constitute a legally binding agreement between you and Offchat Protocol LLC ("Company", "we", "us"). If you do not agree to these Terms, you must not use the Platform.`
    },
    {
      id: "platform",
      title: "2. PLATFORM DESCRIPTION",
      content: `Offchat is a decentralized cryptocurrency-enabled messaging platform that allows users to communicate and conduct blockchain transactions. The Platform integrates with various blockchain networks and cryptocurrency wallets to facilitate secure, peer-to-peer communications and digital asset transfers.`
    },
    {
      id: "eligibility",
      title: "3. USER ELIGIBILITY",
      content: `You must be at least 18 years old and have the legal capacity to enter into binding agreements. By using Offchat, you represent and warrant that: (a) you are of legal age in your jurisdiction; (b) you have not been previously suspended or removed from the Platform; (c) your use of the Platform complies with all applicable laws and regulations; (d) you have not been identified on any government sanctions list.`
    },
    {
      id: "wallet",
      title: "4. CRYPTOCURRENCY WALLET INTEGRATION",
      content: `The Platform integrates with third-party cryptocurrency wallets. You acknowledge that: (a) we do not control your wallet or private keys; (b) you are solely responsible for securing your wallet credentials; (c) we cannot recover lost wallets or private keys; (d) all cryptocurrency transactions are irreversible; (e) you bear all risks associated with cryptocurrency holdings and transactions.`
    },
    {
      id: "prohibited",
      title: "5. PROHIBITED ACTIVITIES",
      content: `You agree not to: (a) violate any applicable laws or regulations; (b) infringe upon intellectual property rights; (c) transmit malware, viruses, or harmful code; (d) engage in harassment, abuse, or hate speech; (e) manipulate market prices or engage in market manipulation; (f) use the Platform for money laundering or terrorist financing; (g) attempt to circumvent security measures; (h) create multiple accounts to evade restrictions.`
    },
    {
      id: "content",
      title: "6. USER CONTENT AND CONDUCT",
      content: `You retain ownership of content you create on the Platform. By posting content, you grant us a non-exclusive, worldwide license to use, modify, and distribute your content in connection with the Platform. You are solely responsible for the accuracy, legality, and appropriateness of your content. We reserve the right to remove content that violates these Terms.`
    },
    {
      id: "privacy",
      title: "7. PRIVACY AND DATA PROTECTION",
      content: `Your privacy is important to us. Our Privacy Policy, incorporated by reference, explains how we collect, use, and protect your information. By using the Platform, you consent to our data practices as described in the Privacy Policy. We implement industry-standard security measures but cannot guarantee absolute security.`
    },
    {
      id: "disclaimer",
      title: "8. DISCLAIMERS AND LIMITATIONS",
      content: `THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT GUARANTEE UNINTERRUPTED SERVICE, SECURITY, OR ACCURACY OF INFORMATION.`
    },
    {
      id: "liability",
      title: "9. LIMITATION OF LIABILITY",
      content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOST PROFITS, DATA LOSS, OR CRYPTOCURRENCY LOSSES. OUR TOTAL LIABILITY SHALL NOT EXCEED $100 OR THE AMOUNT YOU PAID TO USE THE PLATFORM IN THE PRECEDING 12 MONTHS.`
    },
    {
      id: "indemnification",
      title: "10. INDEMNIFICATION",
      content: `You agree to indemnify, defend, and hold harmless the Company and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from: (a) your use of the Platform; (b) your violation of these Terms; (c) your violation of applicable laws; (d) your cryptocurrency transactions; (e) your content or conduct.`
    },
    {
      id: "termination",
      title: "11. TERMINATION",
      content: `We may terminate or suspend your access to the Platform at any time, with or without cause, with or without notice. You may terminate your account at any time by ceasing to use the Platform. Upon termination, your right to use the Platform ceases immediately, but your obligations under these Terms survive.`
    },
    {
      id: "governing",
      title: "12. GOVERNING LAW AND DISPUTES",
      content: `These Terms are governed by the laws of Delaware, United States, without regard to conflict of law principles. Any disputes arising from these Terms or your use of the Platform shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.`
    },
    {
      id: "changes",
      title: "13. MODIFICATIONS TO TERMS",
      content: `We reserve the right to modify these Terms at any time. Material changes will be notified through the Platform or via email. Continued use after notification constitutes acceptance of the modified Terms. We recommend reviewing these Terms periodically for updates.`
    },
    {
      id: "contact",
      title: "14. CONTACT INFORMATION",
      content: `For questions about these Terms, please contact us at: legal@offchatapp.com or Offchat Protocol LLC, Legal Department, 1234 Blockchain Avenue, Crypto City, CC 12345, United States.`
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <MatrixBackground />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="glass-card border-b border-primary/20 bg-black/95 backdrop-blur-md">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img 
                src={offchatLogo} 
                alt="Offchat Logo" 
                className="w-8 h-8 matrix-logo"
              />
              <h1 className="text-2xl md:text-3xl font-bold gradient-text font-mono">
                {t('terms.title')}
              </h1>
            </div>
            <div className="text-center space-y-2">
              <p className="text-primary/80 font-mono text-sm">
                › OFFCHAT PROTOCOL LLC • LEGAL FRAMEWORK • USER AGREEMENT
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-primary/60">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{t('terms.lastUpdated')}: {lastUpdated}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Scale className="w-3 h-3" />
                  <span>{t('terms.effectiveDate')}: {effectiveDate}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Important Notice */}
          <section className="glass-card border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-md p-4 rounded-lg mb-8">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-bold text-yellow-400 font-mono text-sm">IMPORTANT LEGAL NOTICE</h3>
                <p className="text-yellow-300/80 text-sm leading-relaxed">
                  This is a legally binding agreement. Please read carefully before using Offchat. 
                  By accessing the platform, you agree to these terms and our arbitration clause. 
                  Cryptocurrency transactions are irreversible and high-risk.
                </p>
              </div>
            </div>
          </section>

          {/* Terms Sections */}
          <div className="space-y-6">
            {sections.map((section, index) => (
              <section key={section.id} className="glass-card border border-primary/20 bg-black/95 backdrop-blur-md p-6 rounded-lg">
                <h2 className="text-lg font-bold text-primary font-mono mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs">
                    {index + 1}
                  </div>
                  {section.title}
                </h2>
                <div className="prose prose-sm max-w-none">
                  <p className="text-primary/70 leading-relaxed text-sm">
                    {section.content}
                  </p>
                </div>
              </section>
            ))}
          </div>

          {/* Legal Footer */}
          <section className="glass-card border border-primary/20 bg-black/95 backdrop-blur-md p-6 rounded-lg mt-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Gavel className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-primary font-mono">AGREEMENT ACKNOWLEDGMENT</h3>
              </div>
              <p className="text-primary/70 text-sm max-w-3xl mx-auto leading-relaxed">
                By using Offchat, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. 
                These terms may be updated from time to time, and continued use constitutes acceptance of any modifications.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
                <Button 
                  onClick={() => window.close()}
                  className="cyber-button bg-primary/20 hover:bg-primary/30 border-primary/50 hover:border-primary text-primary font-mono px-6 py-2 text-sm transition-all duration-150 neon-glow"
                >
                  <FileText className="w-3 h-3 mr-2" />
                  {t('terms.backToChat')}
                </Button>
                <Button 
                  onClick={() => window.open('/privacy', '_blank')}
                  variant="outline"
                  className="cyber-button bg-black/40 border-primary/30 hover:bg-primary/10 text-primary font-mono px-6 py-2 text-sm transition-all duration-150"
                >
                  VIEW PRIVACY POLICY
                </Button>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="glass-card border-t border-primary/20 bg-black/95 backdrop-blur-md">
          <div className="container mx-auto px-4 py-6 text-center">
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                <span className="text-primary/60 font-mono text-xs">
                  OFFCHAT PROTOCOL LLC • LEGAL DEPARTMENT
                </span>
                <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
              </div>
              <p className="text-xs text-primary/40 font-mono">
                › DECENTRALIZED COMMUNICATION • BLOCKCHAIN COMPLIANCE • CRYPTO REGULATION
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}