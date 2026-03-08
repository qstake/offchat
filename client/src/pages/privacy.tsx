import { useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useLocation } from "wouter";
import { Calendar, Shield, Eye, Lock, Database, Users, FileText, AlertTriangle, ArrowLeft } from "lucide-react";
import MatrixBackground from "@/components/matrix-background";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
const offchatLogo = "/logo.png";

export default function PrivacyPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const handleBackToChat = () => {
    setLocation("/chat");
  };

  useEffect(() => {
    document.title = "Privacy Policy - Offchat";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Read Offchat\'s Privacy Policy. Learn how we protect your data with end-to-end encryption and decentralized storage on our Web3 messaging platform.');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', 'Privacy Policy - Offchat');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', 'Read Offchat\'s Privacy Policy. Learn how we protect your data with end-to-end encryption and decentralized storage on our Web3 messaging platform.');
  }, []);

  const lastUpdated = "February 15, 2026";
  const effectiveDate = "February 15, 2026";

  const sections = [
    {
      id: "introduction",
      title: "1. INTRODUCTION AND SCOPE",
      content: `Offchat Protocol LLC ("Company", "we", "us", "our") is committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, process, store, and safeguard your information when you use the Offchat mobile application and web platform (collectively, the "Platform"), available on iOS, Android, and the web. This policy applies to all users of our messaging, cryptocurrency wallet, token swapping, NFT management, and related services. By using the Platform, you agree to the practices described in this Privacy Policy. If you do not agree, please do not use the Platform.`
    },
    {
      id: "information",
      title: "2. INFORMATION WE COLLECT",
      content: `We collect the following categories of information: (a) Contact Information: Email address provided during account creation or support requests; (b) Identifiers: Cryptocurrency wallet addresses, public keys, user IDs, and device identifiers used for authentication and account management; (c) Usage Data: App interaction data, feature usage patterns, session duration, crash logs, and performance diagnostics to improve the Platform; (d) Communications Data: Messages you send and receive through the Platform (encrypted end-to-end), message metadata such as timestamps and delivery status; (e) Transaction Data: Blockchain transaction hashes, token amounts, and wallet balances (publicly available on-chain data); (f) Account Data: Username, display name, profile image, and other profile information you choose to provide; (g) Technical Data: IP addresses, device type and model, operating system version, app version, browser type, and general location data (country/region level only).`
    },
    {
      id: "collection",
      title: "3. HOW WE COLLECT INFORMATION",
      content: `Information is collected through: (a) Direct input when you create an account, set up your profile, send messages, or use features such as token swapping or NFT uploads; (b) Automatic collection when you use the Platform, including device information, usage analytics, and crash reports; (c) Blockchain networks when you conduct cryptocurrency transactions (this data is publicly available on the blockchain); (d) Third-party services we use for infrastructure, including cloud hosting and data storage providers operating under strict data processing agreements. We do not purchase or obtain your personal information from third-party data brokers.`
    },
    {
      id: "usage",
      title: "4. HOW WE USE YOUR INFORMATION",
      content: `We use collected information solely for the following purposes: (a) Providing, operating, and maintaining the Platform and its features including messaging, wallet management, token swapping, and NFT collections; (b) Authenticating users and securing accounts; (c) Processing and facilitating cryptocurrency transactions you initiate; (d) Sending you important service notifications, security alerts, and account-related communications; (e) Diagnosing technical issues, analyzing crash reports, and improving Platform performance and reliability; (f) Complying with applicable laws, regulations, and legal processes; (g) Detecting, preventing, and addressing fraud, abuse, and security threats. We do not use your data for advertising, marketing profiling, or selling to third parties. We do not read the content of your encrypted messages.`
    },
    {
      id: "sharing",
      title: "5. INFORMATION SHARING AND DISCLOSURE",
      content: `We do not sell, rent, or trade your personal information to any third party. We may share data only in the following limited circumstances: (a) With your explicit consent; (b) With service providers who assist us in operating the Platform (such as cloud hosting and data storage), bound by strict confidentiality and data processing agreements; (c) To comply with legal obligations, court orders, subpoenas, or lawful government requests; (d) To protect our rights, property, safety, or the rights and safety of our users or the public; (e) In connection with a merger, acquisition, or sale of assets, in which case you will be notified of any change in data handling practices; (f) In anonymized or aggregated form that cannot be used to identify you.`
    },
    {
      id: "encryption",
      title: "6. ENCRYPTION AND SECURITY",
      content: `We implement robust security measures to protect your data: (a) End-to-end encryption for messages, ensuring only the sender and recipient can read message content; (b) AES-256 encryption for data stored on our servers; (c) TLS 1.3 encryption for all data transmitted between your device and our servers; (d) Secure key storage on your device for wallet private keys, which are never transmitted to or stored on our servers; (e) Regular security assessments and code reviews; (f) Access controls limiting employee access to user data on a need-to-know basis. While we strive to protect your information, no method of electronic transmission or storage is completely secure. We cannot guarantee absolute security.`
    },
    {
      id: "retention",
      title: "7. DATA RETENTION AND DELETION",
      content: `We retain your data only as long as necessary to provide our services and fulfill the purposes described in this policy: (a) Account data is retained until you delete your account, after which it is permanently removed within 30 days; (b) Message content is stored in encrypted form and deleted when you delete your account; (c) Message metadata (timestamps, delivery status) is retained for up to 90 days for operational purposes; (d) Transaction data recorded on public blockchains is permanent and immutable — we cannot delete blockchain records; (e) Technical logs and analytics data are anonymized or deleted within 12 months; (f) Data required for legal compliance is retained as mandated by applicable law. You may request deletion of your account and associated data at any time by contacting us at support@offchat.app. Upon receiving a verified deletion request, we will delete or anonymize your personal data within 30 days, except where retention is required by law or for legitimate business purposes (such as resolving disputes).`
    },
    {
      id: "rights",
      title: "8. YOUR PRIVACY RIGHTS",
      content: `Depending on your jurisdiction, you may have the following rights regarding your personal data: (a) Right of Access: Request a copy of the personal information we hold about you; (b) Right to Correction: Request that we correct inaccurate or incomplete data; (c) Right to Deletion: Request deletion of your personal data, subject to legal requirements and blockchain immutability; (d) Right to Data Portability: Request your data in a structured, machine-readable format where technically feasible; (e) Right to Object: Object to processing of your data for certain purposes; (f) Right to Withdraw Consent: Where processing is based on consent, you may withdraw it at any time; (g) Right to Non-Discrimination: We will not discriminate against you for exercising your privacy rights. To exercise any of these rights, contact us at support@offchat.app. We will respond to verified requests within 30 days.`
    },
    {
      id: "ccpa",
      title: "9. CALIFORNIA PRIVACY RIGHTS (CCPA/CPRA)",
      content: `If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA): (a) Right to Know: You may request disclosure of the categories and specific pieces of personal information we have collected about you, the sources of collection, the business purposes for collection, and the categories of third parties with whom we share it; (b) Right to Delete: You may request deletion of your personal information, subject to certain exceptions; (c) Right to Opt-Out of Sale: We do not sell your personal information. We do not share your personal information for cross-context behavioral advertising; (d) Right to Non-Discrimination: We will not deny you services, charge different prices, or provide different quality of service for exercising your CCPA rights; (e) Authorized Agents: You may designate an authorized agent to make requests on your behalf. To submit a CCPA request, contact us at support@offchat.app. We will verify your identity before processing your request.`
    },
    {
      id: "cookies",
      title: "10. COOKIES AND TRACKING",
      content: `On our web platform, we use cookies and similar technologies for: (a) Essential platform functionality and session management; (b) Security and fraud prevention; (c) Performance monitoring and diagnostics. We do not use third-party advertising or tracking cookies. We do not track you across third-party websites or apps. Our mobile applications do not use cookies but may collect similar functional data as described in Section 2. You can control cookie settings through your browser preferences, but disabling essential cookies may affect platform functionality.`
    },
    {
      id: "thirdparty",
      title: "11. THIRD-PARTY SERVICES AND SDKS",
      content: `The Platform may integrate with or rely on the following types of third-party services: (a) Blockchain Networks: Ethereum, BNB Smart Chain, Arbitrum, Polygon, Base, and Optimism for processing cryptocurrency transactions. Transactions on these networks are public and governed by their respective protocols; (b) Cloud Infrastructure: We use third-party cloud providers for hosting and data storage, operating under strict data processing agreements; (c) Market Data Providers: We display cryptocurrency price data from third-party APIs. These providers may receive your IP address when data is requested; (d) Bluetooth Low Energy: The Platform includes optional peer-to-peer Bluetooth messaging functionality that operates locally between devices without transmitting data to our servers. Each third-party service is governed by its own privacy policy. We encourage you to review their policies.`
    },
    {
      id: "international",
      title: "12. INTERNATIONAL DATA TRANSFERS",
      content: `As a global platform, your data may be processed in countries outside your country of residence. We ensure adequate protection for international transfers through: (a) Standard Contractual Clauses approved by relevant authorities for data transferred from the European Economic Area; (b) Encryption of data during transfer and at rest; (c) Data processing agreements with all service providers; (d) Regular compliance assessments. By using the Platform, you acknowledge and consent to the transfer of your data to the United States and other jurisdictions where our service providers operate.`
    },
    {
      id: "minors",
      title: "13. CHILDREN'S PRIVACY",
      content: `The Platform is not intended for use by anyone under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately at support@offchat.app. If we become aware that we have collected personal information from a child under 18, we will take steps to delete that information as soon as possible.`
    },
    {
      id: "blockchain",
      title: "14. BLOCKCHAIN AND CRYPTOCURRENCY PRIVACY",
      content: `Important information about blockchain privacy: (a) All cryptocurrency transactions are recorded on public blockchains and are permanently visible to anyone. We cannot modify, delete, or hide blockchain transaction records; (b) While wallet addresses are pseudonymous, they may potentially be linked to your identity through various means including blockchain analysis; (c) Your wallet private keys are generated and stored locally on your device. We never have access to your private keys; (d) Token balances and transaction histories associated with your wallet addresses are publicly accessible on the blockchain. Please consider these privacy implications before conducting cryptocurrency transactions through the Platform.`
    },
    {
      id: "updates",
      title: "15. POLICY UPDATES",
      content: `We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will: (a) Update the "Last Updated" date at the top of this policy; (b) Notify you through the Platform via an in-app notification; (c) For significant changes, provide notice at least 7 days before the changes take effect. Your continued use of the Platform after the updated Privacy Policy becomes effective constitutes your acceptance of the changes. If you do not agree with the updated policy, you should stop using the Platform and request deletion of your account.`
    },
    {
      id: "contact",
      title: "16. CONTACT INFORMATION",
      content: `For any privacy-related questions, concerns, data access requests, or deletion requests, please contact us at: Email: support@offchat.app. We will acknowledge your request within 48 hours and provide a substantive response within 30 days. If you are not satisfied with our response, you may have the right to lodge a complaint with your local data protection authority.`
    }
  ];

  const dataCategories = [
    { category: "Contact Info (Email)", purpose: "Account & support", retention: "Account lifetime", security: "Encrypted storage" },
    { category: "Identifiers (Wallet, User ID)", purpose: "Authentication", retention: "Account lifetime", security: "Public key cryptography" },
    { category: "Usage Data (Analytics)", purpose: "App improvement", retention: "12 months", security: "Anonymized & encrypted" },
    { category: "Messages (Encrypted)", purpose: "Messaging service", retention: "Account lifetime", security: "End-to-end encryption" },
    { category: "Transaction Data", purpose: "Blockchain operations", retention: "Permanent (on-chain)", security: "Blockchain consensus" },
    { category: "Profile Information", purpose: "User experience", retention: "User controlled", security: "Access controls" },
    { category: "Technical Logs", purpose: "Diagnostics & security", retention: "12 months", security: "Encrypted storage" }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative page-transition">
      <MatrixBackground />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="glass-card border-b border-primary/20 bg-black/95 backdrop-blur-md" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="container mx-auto px-4 py-8">
            <button
              onClick={handleBackToChat}
              className="flex items-center gap-2 text-primary/60 hover:text-primary transition-colors mb-4 font-mono text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Chat
            </button>
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
                  onClick={handleBackToChat}
                  className="cyber-button bg-primary/20 hover:bg-primary/30 border-primary/50 hover:border-primary text-primary font-mono px-6 py-2 text-sm transition-all duration-150 neon-glow"
                >
                  <ArrowLeft className="w-3 h-3 mr-2" />
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