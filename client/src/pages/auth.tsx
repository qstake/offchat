import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Wallet, Shield, Users, MessageCircle, Plus, Download, Unlock, Eye, EyeOff, Copy, Twitter, Send, ExternalLink, Star, Rocket } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { handleAuthError, handleError, showSuccessMessage } from "@/lib/error-handler";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AnimatedBackground from "@/components/animated-background";
import ProfileSetup from "./profile-setup";
import { generateNewWallet, importWalletFromMnemonic, saveWalletToStorage, loadWalletFromStorage, hasStoredWallet, type CustomWallet } from "@/lib/walletconnect";
const offchatLogo = "/logo.png";

type WalletStep = 'choose' | 'create' | 'import' | 'unlock' | 'verify' | 'profile';

function MatrixRainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    const matrixChars = 'ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンヴ日月火水木金土天地人心道力光闇風雷電雨雲海山川空星花夢影命魂龍鬼神';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(0).map(() => Math.random() * -30);
    const speeds: number[] = Array(columns).fill(0).map(() => 0.3 + Math.random() * 0.5);
    const brightness: number[] = Array(columns).fill(0).map(() => Math.random());

    let animId: number;
    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px "MS Gothic", "Hiragino Kaku Gothic Pro", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        const y = drops[i] * fontSize;
        const headGlow = brightness[i] > 0.7;
        if (headGlow) {
          ctx.shadowColor = '#00ff41';
          ctx.shadowBlur = 8;
          ctx.fillStyle = '#aaffaa';
        } else {
          ctx.shadowBlur = 0;
          const alpha = 0.15 + brightness[i] * 0.6;
          ctx.fillStyle = `rgba(0, 255, 65, ${alpha})`;
        }
        ctx.fillText(char, i * fontSize, y);
        ctx.shadowBlur = 0;

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
          speeds[i] = 0.3 + Math.random() * 0.5;
          brightness[i] = Math.random();
        }
        drops[i] += speeds[i];
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }} />;
}

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<WalletStep>('choose');
  const [currentWallet, setCurrentWallet] = useState<CustomWallet | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [mnemonicCopied, setMnemonicCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verifyPositions, setVerifyPositions] = useState<number[]>([]);
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const { setWalletData } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Check if user has stored wallet on mount
  useEffect(() => {
    if (hasStoredWallet()) {
      setCurrentStep('unlock');
    }
  }, []);

  // Check if user exists when wallet is ready
  const { data: existingUser, isLoading: userLoading, refetch: refetchUser } = useQuery({
    queryKey: ['/api/users/wallet', currentWallet?.address],
    queryFn: async () => {
      if (!currentWallet?.address) return null;
      const response = await fetch(`/api/users/wallet/${currentWallet.address}`);
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) throw new Error('Failed to fetch user');
      const userData = await response.json();
      return userData;
    },
    enabled: !!currentWallet?.address && currentStep === 'profile',
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (currentStep === 'profile' && currentWallet) {
      if (userLoading) {
        return;
      }
      
      if (existingUser) {
        setWalletData(currentWallet.address, '0.0000');
        setLocation("/chat");
      } else {
        // User will create profile in this same component
      }
    }
  }, [currentStep, currentWallet, existingUser, userLoading, setWalletData]);

  // Wallet generation functions
  const handleCreateWallet = async () => {
    try {
      setIsLoading(true);
      const newWallet = generateNewWallet();
      setCurrentWallet(newWallet);
      setMnemonic(newWallet.mnemonic);
      setCurrentStep('create');
      toast({
        title: t('auth.walletCreated'),
        description: t('auth.keepSeedPhraseSafe'),
        duration: 1000,
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('auth.walletCouldNotBeCreated'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportWallet = async () => {
    if (!mnemonic.trim()) {
      toast({
        title: t('common.error'),
        description: t('auth.enterSeedPhrase'),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const importedWallet = importWalletFromMnemonic(mnemonic);
      setCurrentWallet(importedWallet);
      toast({
        title: t('auth.walletImported'),
        description: `Address: ${importedWallet.address.slice(0, 6)}...${importedWallet.address.slice(-4)}`,
      });
      setCurrentStep('create'); // Use same step to set password
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('auth.walletCouldNotBeImported'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWallet = async () => {
    if (!password || password.length < 4) {
      toast({
        title: t('common.error'),
        description: t('auth.passwordMinLength'),
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('auth.passwordsNoMatch'),
        variant: "destructive",
      });
      return;
    }

    if (!currentWallet) {
      toast({
        title: t('common.error'),
        description: t('auth.walletDataNotFound'),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      saveWalletToStorage(currentWallet, password);
      // Generate verification positions and shuffled words
      generateVerificationChallenge();
      setCurrentStep('verify');
      toast({
        title: t('auth.walletSaved'),
        description: t('auth.nowVerifySeed'),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('auth.walletCouldNotBeSaved'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlockWallet = async () => {
    if (!password) {
      toast({
        title: t('common.error'),
        description: t('auth.enterPassword'),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const loadedWallet = loadWalletFromStorage(password);
      if (loadedWallet) {
        localStorage.setItem('walletAddress', loadedWallet.address);
        localStorage.setItem('walletConnected', 'true');
        setWalletData(loadedWallet.address, '0.0000');

        const cachedUser = localStorage.getItem('offchat_current_user');
        if (cachedUser) {
          try {
            const user = JSON.parse(cachedUser);
            if (user.walletAddress === loadedWallet.address) {
              queryClient.setQueryData(['/api/users/wallet', loadedWallet.address], user);
            }
          } catch (e) {
            console.warn('Could not parse cached user:', e);
          }
        }

        try {
          const response = await fetch(`/api/users/wallet/${loadedWallet.address}`);
          if (response.ok) {
            const user = await response.json();
            queryClient.setQueryData(['/api/users/wallet', loadedWallet.address], user);
            localStorage.setItem('offchat_current_user', JSON.stringify(user));
          }
        } catch (e) {
          console.warn('Could not fetch user from API, using cached data:', e);
        }

        setLocation("/chat");
        return;
      }
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('auth.walletCouldNotBeOpened'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyMnemonic = () => {
    navigator.clipboard.writeText(mnemonic);
    setMnemonicCopied(true);
    toast({
      title: t('common.copied'),
      description: t('auth.wordsCopied'),
    });
    setTimeout(() => setMnemonicCopied(false), 2000);
  };

  const generateVerificationChallenge = () => {
    const words = mnemonic.split(' ');
    
    // Select 3 random positions (1-indexed for display)
    const positions: number[] = [];
    while (positions.length < 3) {
      const randomPos = Math.floor(Math.random() * 12) + 1;
      if (!positions.includes(randomPos)) {
        positions.push(randomPos);
      }
    }
    
    // Sort positions for easier user experience
    positions.sort((a, b) => a - b);
    setVerifyPositions(positions);
    
    // Shuffle all words for selection
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    
    // Reset selections
    setSelectedWords([]);
    setVerificationAttempts(0);
  };

  const handleWordSelection = (word: string) => {
    if (selectedWords.length < 3 && !selectedWords.includes(word)) {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const removeSelectedWord = (index: number) => {
    const newSelected = selectedWords.filter((_, i) => i !== index);
    setSelectedWords(newSelected);
  };

  const handleVerificationSubmit = () => {
    if (selectedWords.length !== 3) {
      toast({
        title: t('common.error'),
        description: t('auth.selectThreeWords'),
        variant: "destructive",
      });
      return;
    }

    const words = mnemonic.split(' ');
    const correctWords = verifyPositions.map(pos => words[pos - 1]);
    
    // Check if selected words match the correct positions in order
    const isCorrect = selectedWords.every((word, index) => word === correctWords[index]);
    
    if (isCorrect) {
      toast({
        title: t('auth.verificationSuccess'),
        description: t('auth.seedVerified'),
      });
      setCurrentStep('profile');
    } else {
      setVerificationAttempts(prev => prev + 1);
      
      if (verificationAttempts >= 2) {
        toast({
          title: t('auth.tooManyAttempts'),
          description: t('auth.reviewSeedPhrase'),
          variant: "destructive",
        });
        setCurrentStep('create');
        setVerificationAttempts(0);
      } else {
        toast({
          title: t('auth.incorrectSelection'),
          description: t('auth.attemptsRemaining', { remaining: 2 - verificationAttempts }),
          variant: "destructive",
        });
        setSelectedWords([]);
      }
    }
  };

  const handleProfileComplete = (user: any) => {
    console.log('Profile completed for user:', user);
    if (currentWallet) {
      setWalletData(currentWallet.address, '0.0000');
      queryClient.setQueryData(['/api/users/wallet', currentWallet.address], user);
      localStorage.setItem('offchat_current_user', JSON.stringify(user));
    }
    toast({
      title: t('auth.registrationComplete'), 
      description: t('auth.welcomeToMatrix'),
    });
    
    setLocation("/chat");
  };

  // Profile setup step
  if (currentStep === 'profile' && currentWallet && !existingUser && !userLoading) {
    return (
      <ProfileSetup 
        walletData={currentWallet} 
        onComplete={handleProfileComplete} 
      />
    );
  }

  const renderContent = () => {
    switch (currentStep) {
      case 'choose':
        return (
          <>
            {/* Matrix-Style Header */}
            <div className="text-center space-y-2 mb-4">
              <div className="space-y-1 md:space-y-2">
                <h1 className="text-sm md:text-xl font-mono text-green-400 tracking-widest">
                  {t('auth.walletInitialization')}
                </h1>
                <div className="w-24 md:w-32 h-px bg-gradient-to-r from-transparent via-green-400 to-transparent mx-auto"></div>
                <p className="text-green-300/80 font-mono text-[10px] md:text-xs tracking-wide">
                  {t('auth.selectAccessMethod')}
                </p>
              </div>
            </div>

            {/* Matrix-Style Action Buttons */}
            <div className="space-y-4">
              <Button
                onClick={handleCreateWallet}
                disabled={isLoading}
                className="w-full h-10 md:h-12 bg-black border-2 border-green-400/50 text-green-400 hover:bg-green-400/5 hover:border-green-400 font-mono text-sm md:text-base tracking-wide transition-all duration-150 hover:shadow-lg hover:shadow-green-400/20 backdrop-blur-sm touch-manipulation"
              >
                <div className="flex items-center justify-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <div className="text-left">
                    <div className="font-semibold text-xs md:text-sm">{t('auth.createNewWallet')}</div>
                    <div className="text-xs text-green-300/70">{t('auth.generateFreshKeys')}</div>
                  </div>
                </div>
              </Button>
              
              <Button
                onClick={() => setCurrentStep('import')}
                disabled={isLoading}
                className="w-full h-10 md:h-12 bg-black border-2 border-green-400/30 text-green-300 hover:bg-green-400/5 hover:border-green-400/50 font-mono text-sm md:text-base tracking-wide transition-all duration-150 hover:shadow-lg hover:shadow-green-400/10 backdrop-blur-sm touch-manipulation"
              >
                <div className="flex items-center justify-center space-x-2">
                  <Download className="w-4 h-4" />
                  <div className="text-left">
                    <div className="font-semibold text-xs md:text-sm">{t('auth.importExisting')}</div>
                    <div className="text-xs text-green-300/70">{t('auth.restoreFromSeed')}</div>
                  </div>
                </div>
              </Button>
            </div>

            {/* Matrix-Style Security Info */}
            <div className="mt-4 space-y-2">
              <div className="bg-black/80 border border-green-400/20 rounded p-2.5">
                <div className="flex items-center space-x-2 mb-1.5">
                  <Shield className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400 font-mono text-xs md:text-sm tracking-wide">{t('auth.securityProtocol')}</span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-green-300/70">{t('auth.encryption')}</span>
                    <span className="text-green-400">AES-256</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-300/70">{t('auth.storage')}</span>
                    <span className="text-green-400">{t('auth.localOnly')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-300/70">{t('auth.backup')}</span>
                    <span className="text-green-400">{t('auth.twelveWordSeed')}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-xs font-mono text-green-300/50 tracking-wide">
                  {t('auth.yourKeysYourCrypto')}
                </p>
              </div>
            </div>
          </>
        );

      case 'create':
        return (
          <>
            {/* Matrix Seed Phrase Header */}
            <div className="text-center space-y-2 mb-3">
              <div className="w-6 h-6 md:w-8 md:h-8 mx-auto bg-black border border-green-400/50 rounded flex items-center justify-center">
                <Shield className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
              </div>
              <div>
                <h3 className="text-sm font-mono text-green-400 tracking-widest mb-1">{t('auth.seedPhrase')}</h3>
                <div className="w-24 h-px bg-green-400/50 mx-auto mb-2"></div>
                <p className="text-xs text-green-300/70 font-mono tracking-wide">
                  {t('auth.backupRecoveryKeys')}
                </p>
              </div>
            </div>

            {/* Matrix-Style Mnemonic Grid */}
            <div className="space-y-3">
              <div className="bg-black/90 border border-green-400/30 p-2.5">
                <div className="text-center mb-4">
                  <span className="text-xs font-mono text-green-400 tracking-widest">{t('auth.recoveryPhrase')}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {mnemonic.split(' ').map((word, index) => (
                    <div key={index} className="bg-black border border-green-400/20 p-1 md:p-1.5 text-center hover:border-green-400/40 transition-colors">
                      <div className="text-[10px] md:text-xs text-green-400/60 mb-0.5 font-mono">{String(index + 1).padStart(2, '0')}</div>
                      <div className="text-green-300 font-mono text-xs md:text-sm font-medium">
                        {showMnemonic ? word : '•••••'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowMnemonic(!showMnemonic)}
                  className="flex-1 bg-black border-2 border-green-400/30 text-green-400 hover:bg-green-400/5 font-mono text-sm tracking-wide h-9"
                >
                  {showMnemonic ? <><EyeOff className="w-4 h-4 mr-2" />{t('auth.hide')}</> : <><Eye className="w-4 h-4 mr-2" />{t('auth.show')}</>}
                </Button>
                
                <Button
                  onClick={copyMnemonic}
                  className="flex-1 bg-black border-2 border-green-400/30 text-green-400 hover:bg-green-400/5 font-mono text-sm tracking-wide h-9"
                  disabled={!showMnemonic}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {mnemonicCopied ? t('common.copied') : t('auth.copy')}
                </Button>
              </div>
            </div>

            {/* Password Setup */}
            <div className="space-y-2.5 mt-2">
              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-mono text-green-400 tracking-wide">{t('auth.walletPassword')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="bg-black/90 border-2 border-green-400/30 text-green-300 placeholder:text-green-500/50 font-mono p-2.5 h-9 tracking-wide focus:border-green-400 focus:ring-1 focus:ring-green-400/20"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-sm font-mono text-green-400 tracking-wide">{t('auth.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="bg-black/90 border-2 border-green-400/30 text-green-300 placeholder:text-green-500/50 font-mono p-2.5 h-9 tracking-wide focus:border-green-400 focus:ring-1 focus:ring-green-400/20"
                />
              </div>
            </div>

            <Button
              onClick={handleSaveWallet}
              disabled={isLoading || !password || !confirmPassword}
              className="w-full h-10 md:h-14 bg-black border-2 border-green-400 text-green-400 hover:bg-green-400/10 font-mono text-sm md:text-base tracking-wide mt-3 md:mt-6 disabled:border-green-600/30 disabled:text-green-600/50"
            >
              {isLoading ? t('auth.savingWallet') : t('auth.secureWallet')}
            </Button>

            <div className="text-center mt-2 md:mt-6">
              <div className="bg-black/80 border border-red-400/30 p-2 md:p-3">
                <p className="text-xs text-red-400 font-mono tracking-wide">
                  ⚠ {t('auth.criticalBackup')}
                </p>
                <p className="text-xs text-red-300/70 font-mono mt-1">
                  {t('auth.lostPhrase')}
                </p>
              </div>
            </div>
          </>
        );

      case 'import':
        return (
          <>
            {/* Matrix Header */}
            <div className="text-center space-y-2 md:space-y-4 mb-3 md:mb-6">
              <div className="w-8 h-8 md:w-12 md:h-12 mx-auto bg-black border border-green-400/50 rounded flex items-center justify-center">
                <Download className="w-4 h-4 md:w-6 md:h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-sm md:text-xl font-mono text-green-400 tracking-widest mb-1">{t('auth.walletImport')}</h3>
                <div className="w-24 h-px bg-green-400/50 mx-auto mb-2"></div>
                <p className="text-xs text-green-300/70 font-mono tracking-wide">
                  {t('auth.enterRecoveryPhrase')}
                </p>
              </div>
            </div>

            <div className="space-y-3 md:space-y-6">
              <div className="space-y-3">
                <Label htmlFor="mnemonic" className="text-sm font-mono text-green-400 tracking-wide">{t('auth.twelveWordSeedPhrase')}</Label>
                <Textarea
                  id="mnemonic"
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  placeholder="word1 word2 word3 word4 word5 word6\nword7 word8 word9 word10 word11 word12"
                  className="bg-black/90 border-2 border-green-400/30 text-green-300 placeholder:text-green-500/50 font-mono text-sm resize-none focus:border-green-400 focus:ring-1 focus:ring-green-400/20 p-4 h-20 md:h-24"
                  rows={4}
                />
                <p className="text-xs text-green-300/60 font-mono">
                  → {t('auth.separateWords')}
                </p>
              </div>
            </div>

            <div className="flex gap-2 md:gap-4 mt-4 md:mt-8">
              <Button
                onClick={() => setCurrentStep('choose')}
                className="flex-1 bg-black border-2 border-green-400/30 text-green-400 hover:bg-green-400/5 font-mono tracking-wide h-10 md:h-12"
              >
                ← {t('common.back')}
              </Button>
              
              <Button
                onClick={handleImportWallet}
                disabled={isLoading || !mnemonic.trim()}
                className="flex-1 bg-black border-2 border-green-400 text-green-400 hover:bg-green-400/10 font-mono tracking-wide h-10 md:h-12 disabled:border-green-600/30 disabled:text-green-600/50"
              >
                {isLoading ? t('auth.importing') : t('auth.import') + ' →'}
              </Button>
            </div>
          </>
        );

      case 'verify':
        return (
          <>
            {/* Matrix Verification Header */}
            <div className="text-center space-y-2 mb-3 md:space-y-4 md:mb-6">
              <div className="w-8 h-8 md:w-12 md:h-12 mx-auto bg-black border border-green-400/50 rounded flex items-center justify-center">
                <Shield className="w-4 h-4 md:w-6 md:h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-sm md:text-xl font-mono text-green-400 tracking-widest mb-1">{t('auth.seedVerification')}</h3>
                <div className="w-24 h-px bg-green-400/50 mx-auto mb-2"></div>
                <p className="text-xs text-green-300/70 font-mono tracking-wide">
                  {t('auth.confirmBackupPhrase')}
                </p>
              </div>
            </div>

            {/* Challenge Display */}
            <div className="space-y-3 md:space-y-6">
              <div className="bg-black/90 border border-green-400/30 p-2.5 md:p-4">
                <div className="text-center mb-2 md:mb-4">
                  <span className="text-xs font-mono text-green-400 tracking-widest">{t('auth.selectWordsInOrder')}</span>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-mono text-green-300">
                    {t('auth.chooseWordsAtPositions')}
                  </p>
                  <div className="flex justify-center gap-4">
                    {verifyPositions.map((position, index) => (
                      <div key={position} className="bg-black border border-green-400/40 px-2 py-1.5 md:px-3 md:py-2 rounded">
                        <span className="text-green-400 font-mono font-bold">#{position}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selected Words Display */}
              <div className="bg-black/90 border border-green-400/20 p-2.5 md:p-4">
                <div className="text-center mb-3">
                  <span className="text-xs font-mono text-green-400 tracking-widest">{t('auth.selectedWords')}</span>
                </div>
                <div className="flex gap-2 justify-center min-h-[40px] items-center">
                  {selectedWords.map((word, index) => (
                    <div 
                      key={index} 
                      className="bg-green-400/10 border border-green-400/50 px-2 py-1.5 md:px-3 md:py-2 rounded cursor-pointer hover:bg-red-400/10 hover:border-red-400/50 transition-colors"
                      onClick={() => removeSelectedWord(index)}
                      data-testid={`selected-word-${index}`}
                    >
                      <span className="text-green-300 font-mono text-sm">
                        {verifyPositions[index]}. {word}
                      </span>
                    </div>
                  ))}
                  {Array.from({ length: 3 - selectedWords.length }).map((_, index) => (
                    <div key={`empty-${index}`} className="bg-black border border-green-400/20 px-2 py-1.5 md:px-3 md:py-2 rounded">
                      <span className="text-green-600/50 font-mono text-sm">
                        {verifyPositions[selectedWords.length + index] || '?'}. ---
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-green-300/60 font-mono text-center mt-2">
                  {t('auth.clickToRemove')}
                </p>
              </div>

              {/* Word Selection Grid */}
              <div className="bg-black/90 border border-green-400/30 p-2.5 md:p-4">
                <div className="text-center mb-2 md:mb-4">
                  <span className="text-xs font-mono text-green-400 tracking-widest">{t('auth.chooseFromWords')}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {shuffledWords.map((word, index) => (
                    <button
                      key={index}
                      onClick={() => handleWordSelection(word)}
                      disabled={selectedWords.includes(word) || selectedWords.length >= 3}
                      className={`p-2 md:p-3 text-center border font-mono text-sm transition-colors ${
                        selectedWords.includes(word)
                          ? 'bg-green-400/20 border-green-400/50 text-green-400 cursor-not-allowed'
                          : selectedWords.length >= 3
                          ? 'bg-black border-green-400/10 text-green-600/50 cursor-not-allowed'
                          : 'bg-black border-green-400/20 text-green-300 hover:border-green-400/40 hover:bg-green-400/5 cursor-pointer'
                      }`}
                      data-testid={`word-option-${word}`}
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 md:gap-4 mt-3 md:mt-6">
              <Button
                onClick={() => setCurrentStep('create')}
                className="flex-1 bg-black border-2 border-green-400/30 text-green-400 hover:bg-green-400/5 font-mono tracking-wide h-10 md:h-12"
                data-testid="button-back-to-seed"
              >
                ← {t('auth.backToSeed')}
              </Button>
              
              <Button
                onClick={handleVerificationSubmit}
                disabled={selectedWords.length !== 3}
                className="flex-1 bg-black border-2 border-green-400 text-green-400 hover:bg-green-400/10 font-mono tracking-wide h-10 md:h-12 disabled:border-green-600/30 disabled:text-green-600/50"
                data-testid="button-verify-submit"
              >
                {t('auth.verify')} →
              </Button>
            </div>

            {/* Attempts Info */}
            {verificationAttempts > 0 && (
              <div className="text-center mt-4">
                <div className="bg-red-400/10 border border-red-400/30 p-3 rounded">
                  <p className="text-xs text-red-400 font-mono">
                    {t('auth.attempts')} {verificationAttempts}/3
                  </p>
                </div>
              </div>
            )}
          </>
        );

      case 'unlock':
        return (
          <>
            {/* Matrix Unlock Header */}
            <div className="text-center space-y-3 mb-4 md:space-y-6 md:mb-8">
              <div className="w-10 h-10 md:w-16 md:h-16 mx-auto bg-black border-2 border-green-400/50 rounded flex items-center justify-center">
                <Unlock className="w-5 h-5 md:w-8 md:h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-base md:text-xl font-mono text-green-400 tracking-widest mb-2">{t('auth.walletAccess')}</h3>
                <div className="w-24 h-px bg-green-400/50 mx-auto mb-3"></div>
                <p className="text-xs text-green-300/70 font-mono tracking-wide">
                  {t('auth.enterSecurityPassphrase')}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="unlockPassword" className="text-sm font-mono text-green-400 tracking-wide">{t('auth.password')}</Label>
                <Input
                  id="unlockPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="bg-black/90 border-2 border-green-400/30 text-green-300 placeholder:text-green-500/50 font-mono text-base p-3 h-10 md:text-lg md:p-4 md:h-14 tracking-widest focus:border-green-400 focus:ring-1 focus:ring-green-400/20"
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlockWallet()}
                />
              </div>
            </div>

            <div className="space-y-4 mt-4 md:mt-8">
              <Button
                onClick={handleUnlockWallet}
                disabled={isLoading || !password}
                className="w-full h-10 md:h-14 bg-black border-2 border-green-400 text-green-400 hover:bg-green-400/10 font-mono text-base tracking-wide disabled:border-green-600/30 disabled:text-green-600/50"
              >
                {isLoading ? t('auth.accessing') : t('auth.unlockWallet')}
              </Button>
              
              <div className="text-center pt-2 md:pt-4">
                <Button
                  onClick={() => setCurrentStep('choose')}
                  className="text-green-300/50 hover:text-green-400 font-mono text-xs tracking-wide bg-transparent border-none hover:bg-transparent"
                >
                  → {t('auth.useDifferentWallet')}
                </Button>
              </div>
            </div>
          </>
        );

      case 'profile':
        return (
          <div className="text-center py-12">
            <div className="animate-spin w-10 h-10 border-2 border-green-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-green-400 font-mono tracking-wide text-lg">{t('auth.accessingWallet')}</p>
            <p className="text-green-300/50 font-mono text-[10px] mt-2">{t('auth.decryptingData')}</p>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <div className="animate-spin w-10 h-10 border-2 border-green-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-green-400 font-mono tracking-wide text-lg">{t('auth.initializing')}</p>
            <p className="text-green-300/50 font-mono text-[10px] mt-2">{t('auth.loadingProtocol')}</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-950/20 via-black to-green-950/10"></div>
      
      {/* Auth Card Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-2 md:p-4">
          <div className="w-full max-w-sm md:max-w-md mx-auto">
          {/* Matrix Main Card */}
          <div className="bg-black/95 border-2 border-green-400/30 backdrop-blur-sm relative">
            {/* Matrix-style borders */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-px bg-green-400/20"></div>
            
            {/* Matrix Logo Section */}
            <div className="text-center py-2 md:py-6 border-b border-green-400/20">
              <div className="relative mb-2 md:mb-4">
                <div className="w-10 h-10 md:w-14 md:h-14 mx-auto relative">
                  <img 
                    src={offchatLogo} 
                    alt="Offchat Logo" 
                    className="w-full h-full object-contain"
                    style={{
                      filter: 'brightness(0) saturate(100%) invert(64%) sepia(98%) saturate(454%) hue-rotate(92deg) brightness(98%) contrast(92%)'
                    }}
                  />
                </div>
              </div>
              
              <div className="space-y-2 md:space-y-3">
                <h1 className="text-lg md:text-2xl font-mono text-green-400 tracking-widest">
                  OFFCHAT
                </h1>
                <div className="w-12 md:w-16 h-px bg-green-400 mx-auto"></div>
                <p className="text-green-300/70 font-mono text-xs md:text-sm tracking-wide">
                  {t('auth.secureMatrixProtocol')}
                </p>
              </div>
            </div>
            
            {/* Content Area */}
            <div className="p-3 md:p-6">
              {renderContent()}
            </div>
            
            {/* Matrix Footer */}
            <div className="text-center py-2 md:py-4 border-t border-green-400/20">
              <div className="flex items-center justify-center space-x-2 md:space-x-4">
                <div className="w-6 md:w-8 h-px bg-green-400/50"></div>
                <span className="text-xs font-mono text-green-400/70 tracking-widest">{t('auth.matrixProtocol')}</span>
                <div className="w-6 md:w-8 h-px bg-green-400/50"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}