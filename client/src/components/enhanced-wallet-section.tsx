import { useState, useEffect, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Copy, Network, RefreshCw, TrendingUp, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  getMultiNetworkWalletBalance, 
  switchWalletNetwork, 
  getCurrentWalletNetwork, 
  getAllWalletNetworks,
  sendWalletConnectTransaction,
  getAllTokenBalances,
  type WalletBalance,
  type NetworkConfig,
  type TokenConfig
} from "@/lib/walletconnect";
import QRCode from "qrcode";

// OFFC Token Display Component  
function OFFCTokenDisplay({ tokenBalances }: { tokenBalances: Array<{token: TokenConfig, balance: string}> }) {
  const [offcPrice, setCrxPrice] = useState<number>(0);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [realCrxBalance, setRealCrxBalance] = useState<string>('40000'); // Default to 40k tokens
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Find OFFC token in balances or use our custom balance
  const offcToken = tokenBalances.find(item => item.token.symbol === 'OFFC');
  const actualBalance = offcToken?.balance && parseFloat(offcToken.balance) > 0 ? offcToken.balance : realCrxBalance;
  const offcBalanceNum = parseFloat(actualBalance);
  const offcValueUSD = offcBalanceNum * offcPrice;

  // Load real OFFC balance directly from BSC
  useEffect(() => {
    const loadOFFCBalance = async () => {
      setIsLoadingBalance(true);
      try {
        const walletManager = (window as any).walletManager;
        if (walletManager) {
          let address = null;
          
          // Try different methods to get wallet address
          if (walletManager.getConnectedAddress) {
            address = walletManager.getConnectedAddress();
          } else if (walletManager.wallet && walletManager.wallet.address) {
            address = walletManager.wallet.address;
          }
          
          // If still no address, try localStorage (where use-wallet stores it)
          if (!address) {
            const savedAddress = localStorage.getItem('walletAddress');
            if (savedAddress) {
              address = savedAddress;
              console.log('Using saved wallet address from localStorage:', address);
            }
          }
          
          if (address) {
            console.log('Loading OFFC balance for address:', address);
            
            // Try to get OFFC balance directly from BSC
            const balance = await walletManager.getTokenBalance(address, {
              address: '0xaf62c16e46238c14ab8eda78285feb724e7d4444',
              symbol: 'OFFC',
              name: 'Offchat Token',
              decimals: 18,
              logoUrl: '/logo.png'
            }, 'bsc');
            
            console.log('Raw OFFC balance from contract:', balance);
            
            if (balance) {
              const balanceNum = parseFloat(balance);
              if (balanceNum > 0) {
                setRealCrxBalance(balance);
                console.log('Real OFFC balance loaded:', balance);
              } else {
                console.log('OFFC balance is 0 or invalid');
                setRealCrxBalance('0');
              }
            } else {
              console.log('No OFFC balance returned');
              setRealCrxBalance('0');
            }
          } else {
            console.log('No wallet address available');
            setRealCrxBalance('0');
          }
        } else {
          console.log('Wallet manager not available');
          setRealCrxBalance('0');
        }
      } catch (error) {
        console.error('Failed to load OFFC balance:', error);
        setRealCrxBalance('0');
      } finally {
        setIsLoadingBalance(false);
      }
    };

    loadOFFCBalance();
    
    // Reload balance every 30 seconds
    const interval = setInterval(loadOFFCBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('OFFC Debug:', {
      tokenBalances: tokenBalances.length,
      offcToken: offcToken ? 'found' : 'not found',
      offcTokenBalance: offcToken?.balance,
      realCrxBalance,
      finalBalance: actualBalance,
      price: offcPrice,
      valueUSD: offcValueUSD.toFixed(2)
    });
  }, [tokenBalances, offcToken, actualBalance, offcPrice, realCrxBalance, offcValueUSD]);

  useEffect(() => {
    const fetchOFFCPrice = async () => {
      setIsLoadingPrice(true);
      try {
        // Try multiple APIs for OFFC price
        let price = 0;
        
        // Try DEXScreener API first (BSC) - using correct pair address
        try {
          const dsResponse = await fetch('https://api.dexscreener.com/latest/dex/pairs/bsc/0xb8c3cd64fc8ff7220506c9f576b6bdcb8c271bfb');
          const dsData = await dsResponse.json();
          console.log('DEXScreener response:', dsData);
          
          if (dsData?.pairs && dsData.pairs[0] && dsData.pairs[0].priceUsd) {
            price = parseFloat(dsData.pairs[0].priceUsd);
            console.log('OFFC price from DEXScreener (correct pair):', price);
          } else {
            console.log('No valid price data from DEXScreener pair');
          }
        } catch (e) {
          console.log('DEXScreener pair API failed, trying token endpoint...');
          
          // Fallback to token endpoint
          try {
            const dsTokenResponse = await fetch('https://api.dexscreener.com/latest/dex/tokens/0xaf62c16e46238c14ab8eda78285feb724e7d4444');
            const dsTokenData = await dsTokenResponse.json();
            if (dsTokenData?.pairs && dsTokenData.pairs.length > 0) {
              // Use the pair with highest volume/liquidity
              const bestPair = dsTokenData.pairs.find((pair: any) => 
                pair.priceUsd && 
                parseFloat(pair.priceUsd) > 0 &&
                pair.pairAddress === '0xb8c3cd64fc8ff7220506c9f576b6bdcb8c271bfb'
              ) || dsTokenData.pairs.find((pair: any) => pair.priceUsd && parseFloat(pair.priceUsd) > 0);
              
              if (bestPair) {
                price = parseFloat(bestPair.priceUsd);
                console.log('OFFC price from DEXScreener token endpoint:', price);
              }
            }
          } catch (e2) {
            console.log('DEXScreener token endpoint also failed');
          }
        }
        
        // Try PancakeSwap API as backup
        if (price === 0) {
          try {
            const psResponse = await fetch('https://api.pancakeswap.info/api/v2/tokens/0xaf62c16e46238c14ab8eda78285feb724e7d4444');
            const psData = await psResponse.json();
            if (psData?.data?.price) {
              price = parseFloat(psData.data.price);
              console.log('OFFC price from PancakeSwap:', price);
            }
          } catch (e) {
            console.log('PancakeSwap API also failed');
          }
        }
        
        // Try CoinGecko as last resort
        if (price === 0) {
          try {
            const cgResponse = await fetch('https://api.coingecko.com/api/v3/simple/token_price/binance-smart-chain?contract_addresses=0xaf62c16e46238c14ab8eda78285feb724e7d4444&vs_currencies=usd');
            const cgData = await cgResponse.json();
            const contractAddress = '0xaf62c16e46238c14ab8eda78285feb724e7d4444';
            if (cgData[contractAddress]?.usd) {
              price = cgData[contractAddress].usd;
              console.log('OFFC price from CoinGecko:', price);
            }
          } catch (e) {
            console.log('CoinGecko API also failed');
          }
        }
        
        // Set final price - use realistic estimate if APIs fail
        if (price === 0) {
          price = 0.00006; // More realistic fallback price based on market
          console.log('Using fallback OFFC price:', price);
        }
        
        setCrxPrice(price);
        console.log('Final OFFC price set:', price);
        
      } catch (error) {
        console.error('Failed to fetch OFFC price:', error);
        setCrxPrice(0.00012); // Fallback price
      } finally {
        setIsLoadingPrice(false);
      }
    };

    fetchOFFCPrice();
    
    // Refresh price every 2 minutes for better responsiveness
    const interval = setInterval(fetchOFFCPrice, 120000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-black/40 border-primary/20 hover:bg-black/60 hover:border-primary/30 transition-all duration-150 group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full border bg-black/60 border-primary/20 flex items-center justify-center">
          <img src="/logo.png" alt="OFFC" className="w-5 h-5 rounded-full" />
        </div>
        <div className="min-w-0">
          <div className="font-mono font-medium text-sm text-primary group-hover:text-primary/80 transition-colors">
            OFFC Token
          </div>
          <div className="text-xs text-primary/60 font-mono">
            › {offcBalanceNum.toLocaleString()} OFFC
          </div>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-mono font-semibold text-sm text-primary">
          {isLoadingPrice || isLoadingBalance ? '...' : `$${offcValueUSD.toFixed(2)}`}
        </div>
        <div className="text-[10px] text-primary/60 font-mono flex items-center gap-1">
          <TrendingUp className="h-2 w-2" />
          {isLoadingPrice ? '...' : `$${offcPrice.toFixed(6)}`}
        </div>
      </div>
    </div>
  );
}

interface EnhancedWalletSectionProps {
  walletAddress: string | null;
  isConnected: boolean;
  onConnect?: () => Promise<void>;
  onDisconnect: () => void;
}

export default function EnhancedWalletSection({
  walletAddress,
  isConnected,
  onConnect,
  onDisconnect
}: EnhancedWalletSectionProps) {
  const { t } = useTranslation();
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [tokenBalances, setTokenBalances] = useState<Array<{token: TokenConfig, balance: string}>>([]);
  const [currentNetwork, setCurrentNetwork] = useState<NetworkConfig | null>(null);
  const [availableNetworks, setAvailableNetworks] = useState<NetworkConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const { toast } = useToast();

  // Load network data on mount
  useEffect(() => {
    if (isConnected) {
      const networks = getAllWalletNetworks();
      setAvailableNetworks(networks);
      const current = getCurrentWalletNetwork();
      setCurrentNetwork(current);
      
      loadBalances();
    }
  }, [isConnected]);

  const loadBalances = async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      // Load traditional network balances
      const balanceData = await getMultiNetworkWalletBalance(walletAddress);
      setBalances(balanceData);
      
      // Load token balances for current network
      if (currentNetwork) {
        const tokenData = await getAllTokenBalances(walletAddress, currentNetwork.id);
        setTokenBalances(tokenData);
      }
    } catch (error) {
      console.error('Failed to load balances:', error);
      toast({
        title: t('common.error'),
        description: "Could not load balances.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNetworkSwitch = (networkId: string) => {
    try {
      switchWalletNetwork(networkId);
      const newNetwork = getCurrentWalletNetwork();
      setCurrentNetwork(newNetwork);
      
      // Reload balances for new network
      loadBalances();
      
      toast({
        title: t('wallet.networkChanged'),
        description: `Switched to ${newNetwork.name} network.`,
      });
    } catch (error) {
      console.error('Failed to switch network:', error);
      toast({
        title: t('common.error'),
        description: "Network could not be changed.",
        variant: "destructive",
      });
    }
  };

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast({
        title: t('wallet.addressCopied'),
        description: t('wallet.addressCopiedDesc'),
      });
    }
  };


  const getTotalBalanceUSD = async () => {
    let total = balances.reduce((sum, balance) => sum + parseFloat(balance.balanceUSD), 0);
    
    // Add token balances in USD
    for (const { token, balance } of tokenBalances) {
      if (token.address === 'native' || parseFloat(balance) === 0) continue;
      
      try {
        // Use walletconnect function to get token price
        const { getWalletConnectProvider } = await import('@/lib/walletconnect');
        const manager = getWalletConnectProvider();
        const price = await manager.getTokenPrice(token.symbol);
        const tokenValueUSD = parseFloat(balance) * price;
        total += tokenValueUSD;
      } catch (error) {
        console.error(`Failed to get price for ${token.symbol}:`, error);
      }
    }
    
    return total.toFixed(2);
  };

  // Helper for synchronous display 
  const getTotalBalanceUSDSync = () => {
    let total = balances.reduce((sum, balance) => sum + parseFloat(balance.balanceUSD), 0);
    
    // Add OFFC value if available
    const offcToken = tokenBalances.find(item => item.token.symbol === 'OFFC');
    if (offcToken && parseFloat(offcToken.balance) > 0) {
      // Estimate OFFC value (you could fetch real price here too)
      total += parseFloat(offcToken.balance) * 0.001; // Fallback price
    }
    
    return total.toFixed(2);
  };

  const generateQRCode = async () => {
    if (!walletAddress) return;
    
    try {
      // Generate QR code with green color
      const qrCodeDataUrl = await QRCode.toDataURL(walletAddress, {
        color: {
          dark: '#00ff00',  // Green color
          light: '#000000'  // Black background
        },
        width: 256,
        margin: 2
      });
      
      setQrDataUrl(qrCodeDataUrl);
      setShowQrDialog(true);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast({
        title: t('common.error'),
        description: "QR code could not be created.",
        variant: "destructive",
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="glass-card border-primary/20 backdrop-blur-md p-6 rounded-xl bg-black/95">
        <div className="text-center space-y-4">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-16 h-16 rounded-full border-2 border-primary/30 bg-black/60 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-primary font-mono text-lg tracking-wider uppercase flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                WALLET MATRIX
              </h3>
              <p className="text-xs text-primary/60 font-mono">
                › INITIALIZE NETWORK CONNECTION • ENABLE CRYPTO FUNCTIONS
              </p>
            </div>
          </div>
          <Button 
            onClick={onConnect} 
            className="cyber-button w-full bg-primary/20 hover:bg-primary/30 border-primary/50 hover:border-primary text-primary font-mono px-6 py-3 transition-all duration-150 neon-glow"
          >
            <Wallet className="w-4 h-4 mr-2" />
            CONNECT MATRIX
          </Button>
          <p className="text-[10px] font-mono text-primary/40">
            › SECURE BLOCKCHAIN INTERFACE REQUIRED FOR TRANSACTIONS
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-full">
      {/* Matrix Wallet Terminal Header */}
      <div className="glass-card border-primary/20 backdrop-blur-md p-4 rounded-xl bg-black/95">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-semibold text-primary tracking-wider uppercase">
                WALLET MATRIX
              </h3>
              <p className="text-[10px] text-primary/60 font-mono">› BLOCKCHAIN INTERFACE</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadBalances}
              disabled={isLoading}
              className="cyber-button h-8 w-8 p-0 bg-black/40 border-primary/30 hover:bg-primary/10 text-primary"
            >
              <RefreshCw className={`h-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDisconnect}
              className="cyber-button h-8 px-3 text-[10px] bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-400 font-mono"
            >
              {t('wallet.disconnect').toUpperCase()}
            </Button>
          </div>
        </div>
        
        {/* Matrix Address Display */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-primary/80 font-mono uppercase tracking-wider flex items-center gap-1">
              <div className="w-1 h-1 bg-primary rounded-full"></div>
              {t('wallet.networkAddress')}
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyAddress}
                className="cyber-button h-7 w-7 p-0 bg-primary/10 border-primary/30 hover:bg-primary/20 text-primary"
                title={t('wallet.copyAddress')}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={generateQRCode}
                className="cyber-button h-7 w-7 p-0 bg-primary/10 border-primary/30 hover:bg-primary/20 text-primary"
                data-testid="button-qr-code"
                title="QR Matrix"
              >
                <QrCode className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="bg-black/60 border border-primary/20 rounded-lg p-3">
            <code className="text-xs font-mono text-primary/70 break-all">
              {walletAddress}
            </code>
          </div>
        </div>
        
        {/* Total Balance Matrix */}
        <div className="mt-4 text-center p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20 neon-glow">
          <div className="text-2xl font-bold text-primary font-mono">${getTotalBalanceUSDSync()}</div>
          <div className="text-xs text-primary/60 font-mono mt-1 flex items-center justify-center gap-1">
            <div className="w-1 h-1 bg-primary/60 rounded-full"></div>
            TOTAL NETWORK VALUE (USD)
          </div>
        </div>
      </div>

      {/* Matrix Network Balances */}
      <div className="glass-card border-primary/20 backdrop-blur-md p-4 rounded-xl bg-black/95">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
            <Network className="w-3 h-3 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-mono font-medium text-primary tracking-wider uppercase">
              NETWORK MATRIX
            </h4>
            <p className="text-[10px] text-primary/60 font-mono">› MULTI-CHAIN BALANCES</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {/* Network Balances */}
          {balances.map((balance) => {
            const network = availableNetworks.find(n => n.id === balance.networkId);
            if (!network) return null;
            
            return (
              <div
                key={balance.networkId}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-150 group ${
                  currentNetwork?.id === balance.networkId 
                    ? 'bg-primary/15 border-primary/40 neon-glow' 
                    : 'bg-black/40 border-primary/20 hover:bg-black/60 hover:border-primary/30'
                }`}
                onClick={() => handleNetworkSwitch(balance.networkId)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                    currentNetwork?.id === balance.networkId
                      ? 'bg-primary/20 border-primary/40'
                      : 'bg-black/60 border-primary/20'
                  }`}>
                    {network.logoUrl ? (
                      <img src={network.logoUrl} alt={network.symbol} className="w-5 h-5 rounded-full" />
                    ) : (
                      <span className={`font-mono text-xs font-bold ${
                        currentNetwork?.id === balance.networkId ? 'text-primary' : 'text-primary/70'
                      }`}>
                        {network.symbol.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono font-medium text-sm text-primary group-hover:text-primary/80 transition-colors">
                      {network.name}
                    </div>
                    <div className="text-xs text-primary/60 font-mono">
                      › {balance.balance} {balance.symbol}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-semibold text-sm text-primary">${balance.balanceUSD}</div>
                  <div className="text-[10px] text-primary/60 font-mono flex items-center gap-1">
                    <TrendingUp className="h-2 w-2" />
                    VALUATION
                  </div>
                </div>
                {currentNetwork?.id === balance.networkId && (
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse ml-2"></div>
                )}
              </div>
            );
          })}
          
          {/* OFFC Token Balance (show prominently) */}
          <OFFCTokenDisplay tokenBalances={tokenBalances} />
        </div>
        
        {/* Token Balances for Current Network */}
        {tokenBalances.length > 1 && currentNetwork && (
          <div className="mt-4 space-y-2">
            <h5 className="text-xs font-mono font-medium text-primary/80 uppercase tracking-wider flex items-center gap-1">
              <div className="w-1 h-1 bg-primary/60 rounded-full"></div>
              {currentNetwork.name} Tokens
            </h5>
            <div className="space-y-2">
              {tokenBalances.filter(item => item.token.address !== 'native').map(({ token, balance }) => {
                const balanceNum = parseFloat(balance);
                if (balanceNum === 0) return null;
                
                return (
                  <div
                    key={token.symbol}
                    className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-primary/20"
                  >
                    <div className="flex items-center gap-2">
                      {token.logoUrl && (
                        <img 
                          src={token.logoUrl} 
                          alt={token.symbol} 
                          className="w-5 h-5 rounded-full"
                        />
                      )}
                      <div>
                        <div className="text-xs font-mono text-primary/90">{token.symbol}</div>
                        <div className="text-[10px] text-primary/60">{token.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-primary">{balance}</div>
                      <div className="text-[9px] text-primary/50">{t('wallet.tokens').toUpperCase()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      
      {/* Matrix QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="max-w-[85vw] sm:max-w-md mx-auto max-h-[85vh] overflow-hidden bg-black/95 border-primary/20 backdrop-blur-md p-0 rounded-xl">
          <div className="glass-card border-primary/10">
            <DialogHeader className="p-4 pb-3 border-b border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <DialogTitle className="text-primary font-mono flex items-center gap-2 text-lg tracking-wider justify-center">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <QrCode className="w-4 h-4" />
                WALLET QR MATRIX
              </DialogTitle>
              <DialogDescription className="text-xs text-primary/60 font-mono text-center mt-1">
                › SCAN MATRIX CODE FOR ADDRESS TRANSFER
              </DialogDescription>
            </DialogHeader>
            
            <div className="p-6 space-y-6">
              {/* QR Matrix Display */}
              <div className="flex flex-col items-center space-y-4">
                {qrDataUrl && (
                  <div className="p-4 bg-white rounded-lg border-2 border-primary/30">
                    <img 
                      src={qrDataUrl} 
                      alt="Wallet QR Matrix" 
                      className="w-40 h-40 sm:w-48 sm:h-48"
                    />
                  </div>
                )}
                
                {/* Matrix Address Display */}
                <div className="w-full space-y-3">
                  <div className="text-center">
                    <p className="text-sm font-mono text-primary/80 uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
                      <div className="w-1 h-1 bg-primary rounded-full"></div>
                      {t('wallet.networkAddress')}
                    </p>
                    <div className="bg-black/60 border border-primary/20 rounded-lg p-3">
                      <code className="text-xs font-mono text-primary/70 break-all block">
                        {walletAddress}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Matrix Controls */}
            <div className="p-4 border-t border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <Button
                variant="outline"
                onClick={handleCopyAddress}
                className="cyber-button w-full bg-primary/20 hover:bg-primary/30 border-primary/50 hover:border-primary text-primary h-10 font-mono transition-all duration-150 neon-glow"
              >
                <Copy className="h-3 w-3 mr-2" />
                COPY MATRIX ADDRESS
              </Button>
              <p className="text-[10px] font-mono text-primary/40 text-center mt-2">
                › QR MATRIX READY FOR BLOCKCHAIN TRANSMISSION
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}