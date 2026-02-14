import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw, DollarSign, BarChart3, ArrowUpDown, Send, X, Users, Loader2, Wallet, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { cryptoService, type CryptoCurrency, type CryptoPriceHistory } from "@/lib/crypto-service";
import { useWallet } from "@/hooks/use-wallet";
import MatrixBackground from "@/components/matrix-background";
import { format } from "date-fns";

interface ChartDataPoint {
  timestamp: number;
  price: number;
  date: string;
  formattedDate: string;
}

const CHAIN_LOGOS: Record<string, { name: string; logo: string; color: string }> = {
  ethereum: { name: "Ethereum", logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png", color: "#627EEA" },
  bsc: { name: "BNB Chain", logo: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png", color: "#F0B90B" },
  arbitrum: { name: "Arbitrum", logo: "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg", color: "#28A0F0" },
  polygon: { name: "Polygon", logo: "https://assets.coingecko.com/coins/images/4713/small/polygon.png", color: "#8247E5" },
  base: { name: "Base", logo: "https://assets.coingecko.com/asset_platforms/images/131/small/base.jpeg", color: "#0052FF" },
  optimism: { name: "Optimism", logo: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png", color: "#FF0420" },
};

export default function CryptoDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const [, setLocation] = useLocation();
  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(7);
  const [showSendOptions, setShowSendOptions] = useState(false);
  const [sendMode, setSendMode] = useState<'options' | 'friend' | 'address' | null>(null);
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState('');
  const [friendLoading, setFriendLoading] = useState(false);
  const { currentUser, sendTransaction } = useWallet();

  const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);
  const isValidAmount = (amt: string) => parseFloat(amt) > 0 && !isNaN(parseFloat(amt));
  
  const coinId = params.coinId;

  const { data: friends = [] } = useQuery({
    queryKey: ['/api/chats', currentUser?.id],
    enabled: !!currentUser?.id && sendMode === 'friend',
  });

  // Fetch current crypto data
  const { data: cryptoData, isLoading: isCryptoLoading } = useQuery({
    queryKey: ['/api/crypto/detail', coinId],
    queryFn: async () => {
      const cryptos = await cryptoService.getTopCryptocurrencies();
      return cryptos.find(crypto => crypto.id === coinId);
    },
    enabled: !!coinId,
  });

  // Fetch price history
  const { data: priceHistory, isLoading: isHistoryLoading, refetch } = useQuery({
    queryKey: ['/api/crypto/history', coinId, selectedTimeframe],
    queryFn: () => cryptoService.getCryptocurrencyHistory(coinId!, selectedTimeframe),
    enabled: !!coinId,
    refetchInterval: 60000, // Refresh every minute
  });

  // Process chart data
  const chartData: ChartDataPoint[] = priceHistory?.prices?.map(([timestamp, price]) => ({
    timestamp,
    price,
    date: format(new Date(timestamp), 'MMM dd'),
    formattedDate: format(new Date(timestamp), 'MMM dd, yyyy HH:mm')
  })) || [];

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(price);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    }).format(price);
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`;
    }
    if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    }
    if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    }
    return `$${marketCap.toFixed(0)}`;
  };

  const timeframeOptions = [
    { value: 1, label: '1D' },
    { value: 7, label: '7D' },
    { value: 30, label: '30D' },
    { value: 90, label: '90D' },
    { value: 365, label: '1Y' }
  ];

  if (isCryptoLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <MatrixBackground />
        <div className="relative z-10 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-primary/20 rounded w-1/3"></div>
              <div className="h-64 bg-primary/10 rounded"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 bg-primary/10 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cryptoData) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <MatrixBackground />
        <div className="relative z-10 p-6">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-primary mb-4">Cryptocurrency Not Found</h1>
            <Button onClick={() => setLocation('/')} className="cyber-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MatrixBackground />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Mobile-First Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-primary/20" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="flex items-center justify-between p-3 md:p-4">
            <Button 
              onClick={() => setLocation('/')} 
              variant="outline" 
              size="sm"
              className="cyber-button h-8 px-3"
              data-testid="button-back"
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">{t('common.back')}</span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <h1 className="text-sm md:text-base font-bold text-white font-mono tracking-wider">
                CRYPTO <span className="text-primary">ANALYSIS</span>
              </h1>
            </div>
            
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="cyber-button h-8 px-3"
              data-testid="button-refresh"
            >
              <RefreshCw className={`w-3 h-3 ${isHistoryLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-1">SYNC</span>
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 md:p-4 space-y-4">
            {/* Crypto Info Header - Mobile Optimized */}
            <Card className="glass-card neon-border border-primary/20">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={cryptoData.image || `https://via.placeholder.com/40/00ff00/000000?text=${cryptoData.symbol.toUpperCase()}`}
                      alt={cryptoData.name}
                      className="w-10 h-10 rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://via.placeholder.com/40/00ff00/000000?text=${cryptoData.symbol.toUpperCase()}`;
                      }}
                    />
                    <div>
                      <h1 className="text-lg md:text-xl font-bold text-primary">{cryptoData.name}</h1>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground uppercase font-mono">
                          {cryptoData.symbol}
                        </span>
                        <Badge variant="outline" className="bg-primary/5 border-primary/20 text-xs h-4">
                          #{cryptoData.market_cap_rank}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-left sm:text-right">
                    <div className="text-xl md:text-2xl font-bold text-primary font-mono">
                      {formatPrice(cryptoData.current_price)}
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      {cryptoData.price_change_percentage_24h >= 0 ? (
                        <TrendingUp className="w-3 h-3 text-green-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      )}
                      <span
                        className={`text-sm font-mono ${
                          cryptoData.price_change_percentage_24h >= 0
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}
                      >
                        {cryptoData.price_change_percentage_24h > 0 ? '+' : ''}
                        {cryptoData.price_change_percentage_24h?.toFixed(2) || '0.00'}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons - Send & Swap */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowSendOptions(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-green-600/90 to-emerald-600/90 hover:from-green-500 hover:to-emerald-500 text-white font-semibold text-sm border border-green-500/20 shadow-lg shadow-green-500/10 transition-all"
              >
                <Send className="w-4 h-4" />
                {t('common.send')}
              </button>
              <button
                onClick={() => setLocation('/swap')}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm border border-blue-500/20 shadow-lg shadow-blue-500/10 transition-all"
              >
                <ArrowUpDown className="w-4 h-4" />
                Swap
              </button>
            </div>

            {/* Send Modal */}
            {showSendOptions && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => { setShowSendOptions(false); setSendMode(null); setSendAmount(''); setSendAddress(''); setSendError(''); }}>
                <div className="bg-[#0a0a0a] border border-green-500/15 rounded-t-3xl sm:rounded-2xl w-full max-w-sm overflow-hidden max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between p-4 border-b border-green-500/10">
                    <div className="flex items-center gap-2">
                      {sendMode && (
                        <button onClick={() => { setSendMode(null); setSendAmount(''); setSendAddress(''); setSendError(''); }} className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white">
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                      )}
                      <h3 className="text-sm font-bold text-white">
                        {sendMode === 'friend' ? 'Send to Friend' : sendMode === 'address' ? 'Send to Address' : `Send ${cryptoData?.symbol?.toUpperCase()}`}
                      </h3>
                    </div>
                    <button onClick={() => { setShowSendOptions(false); setSendMode(null); setSendAmount(''); setSendAddress(''); setSendError(''); }} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {!sendMode && (
                    <div className="p-4 space-y-3">
                      <button
                        onClick={() => setSendMode('friend')}
                        className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/8 hover:bg-green-500/5 hover:border-green-500/15 transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-semibold text-white">Send to Friend</div>
                          <div className="text-[11px] text-white/40">Choose a contact from your chats</div>
                        </div>
                      </button>
                      <button
                        onClick={() => setSendMode('address')}
                        className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/8 hover:bg-blue-500/5 hover:border-blue-500/15 transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-semibold text-white">Send to Address</div>
                          <div className="text-[11px] text-white/40">Enter a wallet address manually</div>
                        </div>
                      </button>
                    </div>
                  )}

                  {sendMode === 'friend' && (
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {friendLoading && (
                        <div className="text-center py-4">
                          <Loader2 className="w-5 h-5 text-green-400 animate-spin mx-auto" />
                          <p className="text-xs text-white/40 mt-2">Loading wallet...</p>
                        </div>
                      )}
                      {sendError && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{sendError}</span>
                        </div>
                      )}
                      {!friendLoading && Array.isArray(friends) && friends.length > 0 ? (
                        friends.filter((chat: any) => !chat.isGroup && chat.otherUserId).map((chat: any) => (
                          <button
                            key={chat.id}
                            disabled={friendLoading}
                            onClick={async () => {
                              if (!chat.otherUserId) return;
                              setFriendLoading(true);
                              setSendError('');
                              try {
                                const res = await fetch(`/api/users/${chat.otherUserId}`);
                                if (!res.ok) throw new Error('Failed to load user');
                                const user = await res.json();
                                if (user?.walletAddress && isValidAddress(user.walletAddress)) {
                                  setSendAddress(user.walletAddress);
                                  setSendMode('address');
                                } else {
                                  setSendError('This contact has no wallet address');
                                }
                              } catch {
                                setSendError('Could not load contact wallet');
                              } finally {
                                setFriendLoading(false);
                              }
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/8 hover:bg-green-500/5 hover:border-green-500/15 transition-all disabled:opacity-50"
                          >
                            <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center overflow-hidden">
                              {chat.avatar ? (
                                <img src={chat.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                              ) : (
                                <span className="text-green-400 font-mono text-sm font-bold">
                                  {(chat.name || '?')[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <div className="text-sm font-semibold text-white truncate">{chat.name}</div>
                              <div className="text-[11px] text-white/40 font-mono">Contact</div>
                            </div>
                            <Send className="w-4 h-4 text-green-400/50" />
                          </button>
                        ))
                      ) : !friendLoading ? (
                        <div className="text-center py-8">
                          <Users className="w-8 h-8 text-white/20 mx-auto mb-3" />
                          <p className="text-sm text-white/40">No contacts found</p>
                          <p className="text-[11px] text-white/25 mt-1">Start a chat to add contacts</p>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {sendMode === 'address' && (
                    <div className="p-4 space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-mono text-green-400/70">Recipient Address</label>
                        <input
                          type="text"
                          value={sendAddress}
                          onChange={(e) => { setSendAddress(e.target.value); setSendError(''); }}
                          placeholder="0x..."
                          className={`w-full bg-black/80 border rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-white/20 focus:outline-none ${sendAddress && !isValidAddress(sendAddress) ? 'border-red-500/40 focus:border-red-500/60' : 'border-green-500/20 focus:border-green-500/40'}`}
                        />
                        {sendAddress && !isValidAddress(sendAddress) && (
                          <p className="text-[10px] text-red-400 font-mono">Invalid EVM address (must be 0x + 40 hex chars)</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-mono text-green-400/70">Amount ({cryptoData?.symbol?.toUpperCase()})</label>
                        <input
                          type="number"
                          value={sendAmount}
                          onChange={(e) => { setSendAmount(e.target.value); setSendError(''); }}
                          placeholder="0.00"
                          step="any"
                          min="0"
                          className={`w-full bg-black/80 border rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-white/20 focus:outline-none ${sendAmount && !isValidAmount(sendAmount) ? 'border-red-500/40 focus:border-red-500/60' : 'border-green-500/20 focus:border-green-500/40'}`}
                        />
                        {sendAmount && !isValidAmount(sendAmount) && (
                          <p className="text-[10px] text-red-400 font-mono">Amount must be greater than 0</p>
                        )}
                      </div>
                      {sendError && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{sendError}</span>
                        </div>
                      )}
                      {isValidAddress(sendAddress) && isValidAmount(sendAmount) && (
                        <div className="bg-white/[0.02] border border-white/8 rounded-xl p-3 space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-white/40">To</span>
                            <span className="text-white/70 font-mono">{sendAddress.slice(0, 6)}...{sendAddress.slice(-4)}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-white/40">Amount</span>
                            <span className="text-white/70 font-mono">{sendAmount} {cryptoData?.symbol?.toUpperCase()}</span>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={async () => {
                          if (!isValidAddress(sendAddress) || !isValidAmount(sendAmount) || !cryptoData) return;
                          setSendLoading(true);
                          setSendError('');
                          try {
                            await sendTransaction({
                              to: sendAddress,
                              amount: sendAmount,
                              token: cryptoData.symbol.toUpperCase(),
                              network: 'ethereum',
                            });
                            setShowSendOptions(false);
                            setSendMode(null);
                            setSendAmount('');
                            setSendAddress('');
                          } catch (e: any) {
                            setSendError(e?.message || 'Transaction failed');
                          } finally {
                            setSendLoading(false);
                          }
                        }}
                        disabled={!isValidAddress(sendAddress) || !isValidAmount(sendAmount) || sendLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-green-600/90 to-emerald-600/90 hover:from-green-500 hover:to-emerald-500 text-white font-semibold text-sm border border-green-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {sendLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        {sendLoading ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stats Cards - Mobile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="glass-card neon-border border-primary/20">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-3 h-3 text-primary" />
                    <span className="text-xs text-muted-foreground font-mono">{t('crypto.marketCap').toUpperCase()}</span>
                  </div>
                  <div className="text-sm md:text-base font-bold text-primary font-mono">
                    {formatMarketCap(cryptoData.market_cap)}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card neon-border border-primary/20">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-3 h-3 text-primary" />
                    <span className="text-xs text-muted-foreground font-mono">{t('crypto.change24h').toUpperCase()}</span>
                  </div>
                  <div className={`text-sm md:text-base font-bold font-mono ${
                    cryptoData.price_change_24h >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatPrice(Math.abs(cryptoData.price_change_24h))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card neon-border border-primary/20">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart3 className="w-3 h-3 text-primary" />
                    <span className="text-xs text-muted-foreground font-mono">RANK</span>
                  </div>
                  <div className="text-sm md:text-base font-bold text-primary font-mono">
                    #{cryptoData.market_cap_rank}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Price Chart - Mobile Optimized */}
            <Card className="glass-card neon-border border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <CardTitle className="text-primary font-mono text-base">PRICE MATRIX</CardTitle>
                  <div className="flex flex-wrap gap-1">
                    {timeframeOptions.map((option) => (
                      <Button
                        key={option.value}
                        onClick={() => setSelectedTimeframe(option.value)}
                        variant={selectedTimeframe === option.value ? "default" : "outline"}
                        size="sm"
                        className={`h-7 px-2 text-xs ${selectedTimeframe === option.value ? "bg-primary text-black" : "cyber-button"}`}
                        data-testid={`button-timeframe-${option.value}`}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {isHistoryLoading ? (
                  <div className="h-64 md:h-80 flex items-center justify-center">
                    <div className="flex items-center space-x-2 text-primary">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="text-sm font-mono">{t('common.loading')}</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00ff00" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#00ff00" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 2" stroke="#00ff0015" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#00ff0060"
                          fontSize={10}
                          fontFamily="monospace"
                          tickLine={false}
                          axisLine={{ stroke: '#00ff0020' }}
                        />
                        <YAxis 
                          stroke="#00ff0060"
                          fontSize={10}
                          fontFamily="monospace"
                          tickFormatter={(value) => `$${value.toFixed(0)}`}
                          tickLine={false}
                          axisLine={{ stroke: '#00ff0020' }}
                          width={60}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#000000f0',
                            border: '1px solid #00ff0030',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            boxShadow: '0 0 10px #00ff0020'
                          }}
                          labelStyle={{ color: '#00ff00', fontSize: '10px' }}
                          formatter={(value: number) => [
                            formatPrice(value),
                            'PRICE'
                          ]}
                          labelFormatter={(label, payload) => {
                            if (payload && payload.length > 0 && payload[0].payload) {
                              return payload[0].payload.formattedDate;
                            }
                            return label;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke="#00ff00"
                          strokeWidth={1.5}
                          fill="url(#priceGradient)"
                          dot={false}
                          activeDot={{ 
                            r: 3, 
                            fill: '#00ff00', 
                            stroke: '#000000', 
                            strokeWidth: 1,
                            style: { filter: 'drop-shadow(0 0 4px #00ff00)' }
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Supported Networks */}
            <div className="mt-4 pb-6">
              <div className="text-center mb-5">
                <span className="text-xs font-mono tracking-[0.3em]" style={{ color: '#00ff00', textShadow: '0 0 8px rgba(0,255,0,0.4)' }}>SUPPORTED NETWORKS</span>
                <div className="w-20 h-px mx-auto mt-2" style={{ background: 'linear-gradient(90deg, transparent, #00ff00, transparent)' }}></div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {Object.entries(CHAIN_LOGOS).map(([key, chain]) => (
                  <div key={key} className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all hover:scale-105" style={{ background: 'rgba(0,255,0,0.02)', borderColor: 'rgba(0,255,0,0.08)' }}>
                    <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center" style={{ background: `${chain.color}15`, border: `1px solid ${chain.color}30` }}>
                      <img src={chain.logo} alt={chain.name} className="w-7 h-7 rounded-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                    <span className="text-[10px] font-mono font-bold tracking-wider" style={{ color: '#00ff00', textShadow: '0 0 6px rgba(0,255,0,0.3)' }}>{chain.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}