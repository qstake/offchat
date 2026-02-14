import { useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Calendar, Shield, Eye, Lock, Database, Users, FileText, AlertTriangle } from "lucide-react";
import MatrixBackground from "@/components/matrix-background";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
const offchatLogo = "/logo.png";

export default function PrivacyPage() {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = "Privacy Policy - Offchat";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Read Offchat\'s Privacy Policy. Learn how we protect your data with end-to-end encryption and decentralized storage on our Web3 messaging platform.');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', 'Privacy Policy - Offchat');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', 'Read Offchat\'s Privacy Policy. Learn how we protect your data with end-to-end encryption and decentralized storage on our Web3 messaging platform.');
  }, []);

  const lastUpdated = "September 11, 2025";
  const effectiveDate = "January 1, 2026";

  const sections = [
    {
      id: "introduction",
      title: "1. INTRODUCTION AND SCOPE",
      content: `Offchat Protocol LLC ("Company", "we", "us") is committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, process, and safeguard your information when you use the Offchat platform ("Platform"). This policy applies to all users of our decentralized messaging and cryptocurrency transaction services.`
    },
    {
      id: "information",
      title: "2. INFORMATION WE COLLECT",
      content: `We collect minimal information necessary to provide our services: (a) Wallet Information: Cryptocurrency wallet addresses and public keys for authentication; (b) Communications Data: Message metadata (not content), timestamps, and delivery confirmations; (c) Technical Data: IP addresses, device information, browser type, and usage analytics; (d) Transaction Data: Blockchain transaction hashes and amounts (publicly available on-chain); (e) Account Data: Username, profile information you choose to provide.`
    },
    {
      id: "collection",
      title: "3. HOW WE COLLECT INFORMATION",
      content: `Information is collected through: (a) Direct input when you register or use features; (b) Automatic collection through cookies and similar technologies; (c) Blockchain networks when you conduct transactions; (d) Third-party wallet providers during authentication; (e) Analytics services to improve platform performance. We use industry-standard encryption for all data transmission and storage.`
    },
    {
      id: "usage",
      title: "4. HOW WE USE YOUR INFORMATION",
      content: `We use collected information to: (a) Provide and maintain platform services; (b) Authenticate users and prevent fraud; (c) Process cryptocurrency transactions; (d) Improve platform security and functionality; (e) Comply with legal obligations; (f) Communicate platform updates and security alerts; (g) Analyze usage patterns for optimization. We do not read private message content or sell personal data.`
    },
    {
      id: "sharing",
      title: "5. INFORMATION SHARING AND DISCLOSURE",
      content: `We do not sell your personal information. We may share data only in these limited circumstances: (a) With your explicit consent; (b) To comply with legal obligations or court orders; (c) To protect our rights, property, or safety; (d) With service providers under strict confidentiality agreements; (e) In connection with business transfers or mergers; (f) Anonymized data for research or analytics purposes.`
    },
    {
      id: "encryption",
      title: "6. ENCRYPTION AND SECURITY",
      content: `We implement military-grade security measures: (a) End-to-end encryption using Signal Protocol for messages; (b) AES-256 encryption for data at rest; (c) TLS 1.3 for data in transit; (d) Zero-knowledge architecture where possible; (e) Regular security audits and penetration testing; (f) Multi-factor authentication options; (g) Hardware security modules for key management. However, no system is 100% secure.`
    },
    {
      id: "retention",
      title: "7. DATA RETENTION AND DELETION",
      content: `We retain data only as long as necessary: (a) Account data: Until account deletion plus 30 days for security; (b) Message metadata: 90 days for operational purposes; (c) Transaction data: Permanently (blockchain records are immutable); (d) Analytics data: Anonymized after 12 months; (e) Legal compliance data: As required by applicable law. You can request data deletion through your account settings.`
    },
    {
      id: "rights",
      title: "8. YOUR PRIVACY RIGHTS",
      content: `You have the right to: (a) Access your personal information we hold; (b) Correct inaccurate or incomplete data; (c) Request deletion of your data (subject to legal requirements); (d) Object to processing for marketing purposes; (e) Data portability where technically feasible; (f) Withdraw consent where processing is based on consent; (g) Lodge complaints with supervisory authorities. Contact us to exercise these rights.`
    },
    {
      id: "cookies",
      title: "9. COOKIES AND TRACKING",
      content: `We use cookies and similar technologies for: (a) Essential platform functionality; (b) Security and fraud prevention; (c) Analytics and performance monitoring; (d) User preference storage. You can control cookie settings through your browser, but this may affect platform functionality. We do not use third-party advertising cookies.`
    },
    {
      id: "international",
      title: "10. INTERNATIONAL DATA TRANSFERS",
      content: `As a global platform, your data may be transferred to countries with different privacy laws. We ensure adequate protection through: (a) Standard Contractual Clauses for EU transfers; (b) Adequacy decisions where available; (c) Encryption during transfer and storage; (d) Regular compliance assessments. By using the platform, you consent to these transfers.`
    },
    {
      id: "minors",
      title: "11. CHILDREN'S PRIVACY",
      content: `The Platform is not designed for children under 18. We do not knowingly collect personal information from minors. If we discover we have collected information from a minor, we will delete it immediately. Parents who believe their child has provided information should contact us immediately.`
    },
    {
      id: "blockchain",
      title: "12. BLOCKCHAIN AND CRYPTOCURRENCY PRIVACY",
      content: `Blockchain transactions are inherently public and permanent. While wallet addresses are pseudonymous, they may be linked to your identity through various means. We cannot control or delete blockchain records. Consider privacy implications before conducting transactions. Use privacy coins or mixing services if enhanced anonymity is required.`
    },
    {
      id: "updates",
      title: "13. POLICY UPDATES",
      content: `We may update this Privacy Policy to reflect changes in our practices, technology, or legal requirements. Material changes will be notified through the Platform or via email. Continued use after notification constitutes acceptance. We recommend reviewing this policy periodically.`
    },
    {
      id: "contact",
      title: "14. CONTACT INFORMATION",
      content: `For privacy-related questions or requests, contact our Data Protection Officer at: privacy@offchatapp.com or Offchat Protocol LLC, Privacy Department, 1234 Blockchain Avenue, Crypto City, CC 12345, United States. We will respond to legitimate requests within 30 days.`
    }
  ];

  const dataCategories = [
    { category: "Wallet Addresses", purpose: "Authentication", retention: "Account lifetime", security: "Public key cryptography" },
    { category: "Message Metadata", purpose: "Delivery & routing", retention: "90 days", security: "AES-256 encryption" },
    { category: "Transaction Data", purpose: "Blockchain operations", retention: "Permanent (immutable)", security: "Blockchain consensus" },
    { category: "Technical Logs", purpose: "Security & optimization", retention: "12 months", security: "Encrypted storage" },
    { category: "Profile Information", purpose: "User experience", retention: "User controlled", security: "Access controls" }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <MatrixBackground />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="glass-card border-b border-primary/20 bg-black/95 backdrop-blur-md" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img 
                src={offchatLogo} 
                alt="Offchat Logo" 
                className="w-8 h-8 matrix-logo"
              />
              <h1 className="text-2xl md:text-3xl font-bold gradient-text font-mono">
                {t('privacy.title')}
              </h1>
            </div>
            <div className="text-center space-y-2">
              <p className="text-primary/80 font-mono text-sm">
                › OFFCHAT PROTOCOL LLC • DATA PROTECTION • USER PRIVACY
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-primary/60">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{t('privacy.lastUpdated')}: {lastUpdated}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>{t('privacy.effectiveDate')}: {effectiveDate}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Privacy Notice */}
          <section className="glass-card border border-blue-500/30 bg-blue-500/10 backdrop-blur-md p-4 rounded-lg mb-8">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-bold text-blue-400 font-mono text-sm">PRIVACY COMMITMENT</h3>
                <p className="text-blue-300/80 text-sm leading-relaxed">
                  Your privacy is fundamental to our mission. We use zero-knowledge principles, 
                  end-to-end encryption, and minimal data collection to protect your communications 
                  and cryptocurrency activities.
                </p>
              </div>
            </div>
          </section>

          {/* Data Overview Table */}
          <section className="glass-card border border-primary/20 bg-black/95 backdrop-blur-md p-6 rounded-lg mb-8">
            <h2 className="text-lg font-bold text-primary font-mono mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              DATA COLLECTION OVERVIEW
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary/20">
                    <th className="text-left p-3 font-mono text-primary/80">DATA TYPE</th>
                    <th className="text-left p-3 font-mono text-primary/80">PURPOSE</th>
                    <th className="text-left p-3 font-mono text-primary/80">RETENTION</th>
                    <th className="text-left p-3 font-mono text-primary/80">SECURITY</th>
                  </tr>
                </thead>
                <tbody>
                  {dataCategories.map((item, index) => (
                    <tr key={index} className="border-b border-primary/10 hover:bg-primary/5">
                      <td className="p-3 font-mono text-primary">{item.category}</td>
                      <td className="p-3 text-primary/70">{item.purpose}</td>
                      <td className="p-3 text-primary/70">{item.retention}</td>
                      <td className="p-3 text-primary/70">{item.security}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Privacy Sections */}
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

          {/* Privacy Rights */}
          <section className="glass-card border border-primary/20 bg-black/95 backdrop-blur-md p-6 rounded-lg mt-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-primary font-mono">YOUR PRIVACY RIGHTS</h3>
              </div>
              <p className="text-primary/70 text-sm max-w-3xl mx-auto leading-relaxed">
                You have comprehensive rights over your personal data. Contact our Data Protection Officer 
                to exercise your rights, request data access, or ask questions about our privacy practices.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
                <Button 
                  onClick={() => window.close()}
                  className="cyber-button bg-primary/20 hover:bg-primary/30 border-primary/50 hover:border-primary text-primary font-mono px-6 py-2 text-sm transition-all duration-150 neon-glow"
                >
                  <FileText className="w-3 h-3 mr-2" />
                  {t('privacy.backToChat')}
                </Button>
                <Button 
                  onClick={() => window.open('/terms', '_blank')}
                  variant="outline"
                  className="cyber-button bg-black/40 border-primary/30 hover:bg-primary/10 text-primary font-mono px-6 py-2 text-sm transition-all duration-150"
                >
                  VIEW TERMS OF SERVICE
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
                  OFFCHAT PROTOCOL LLC • DATA PROTECTION DEPARTMENT
                </span>
                <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
              </div>
              <p className="text-xs text-primary/40 font-mono">
                › ZERO-KNOWLEDGE • END-TO-END ENCRYPTION • PRIVACY BY DESIGN
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}