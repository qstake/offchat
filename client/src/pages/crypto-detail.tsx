import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw, DollarSign, BarChart3, ArrowUpDown, Send, X } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { cryptoService, type CryptoCurrency, type CryptoPriceHistory } from "@/lib/crypto-service";
import MatrixBackground from "@/components/matrix-background";
import { format } from "date-fns";

interface ChartDataPoint {
  timestamp: number;
  price: number;
  date: string;
  formattedDate: string;
}

export default function CryptoDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const [, setLocation] = useLocation();
  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(7);
  const [showSendOptions, setShowSendOptions] = useState(false);
  
  const coinId = params.coinId;

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
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-primary/20">
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
              <h1 className="text-sm md:text-base font-bold gradient-text font-mono">
                CRYPTO ANALYSIS
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

            {/* Send Options Modal */}
            {showSendOptions && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowSendOptions(false)}>
                <div className="bg-[#0a0a0a] border border-green-500/15 rounded-t-3xl sm:rounded-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between p-4 border-b border-green-500/10">
                    <h3 className="text-sm font-bold text-white">Send {cryptoData?.symbol?.toUpperCase()}</h3>
                    <button onClick={() => setShowSendOptions(false)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    <button
                      onClick={() => { setShowSendOptions(false); setLocation('/'); }}
                      className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/8 hover:bg-green-500/5 hover:border-green-500/15 transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <Send className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-white">Send to Friend</div>
                        <div className="text-[11px] text-white/40">Choose a contact from your chats</div>
                      </div>
                    </button>
                    <button
                      onClick={() => { setShowSendOptions(false); setLocation('/swap'); }}
                      className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/8 hover:bg-blue-500/5 hover:border-blue-500/15 transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-white">Send to Address</div>
                        <div className="text-[11px] text-white/40">Enter a wallet address manually</div>
                      </div>
                    </button>
                  </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}