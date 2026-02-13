import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, Search, RefreshCw, ArrowUpDown, Star, Globe, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { cryptoService, type CryptoCurrency } from "@/lib/crypto-service";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

export default function CryptoMarketPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'rank' | 'price' | 'change'>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    document.title = "Crypto Market - Offchat | Live Prices & Charts";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Track real-time cryptocurrency prices, market caps and 24h changes. Monitor Bitcoin, Ethereum, BNB and thousands of tokens on Offchat.');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', 'Crypto Market - Offchat | Live Prices & Charts');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', 'Track real-time cryptocurrency prices, market caps and 24h changes. Monitor Bitcoin, Ethereum, BNB and thousands of tokens on Offchat.');
  }, []);

  const { data: allCryptocurrencies = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['/api/crypto/prices'],
    queryFn: () => cryptoService.getTopCryptocurrencies(),
    refetchInterval: 30000,
    staleTime: 25000,
  });

  const filtered = allCryptocurrencies
    .filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'rank') cmp = (a.market_cap_rank || 999) - (b.market_cap_rank || 999);
      else if (sortBy === 'price') cmp = b.current_price - a.current_price;
      else if (sortBy === 'change') cmp = b.price_change_percentage_24h - a.price_change_percentage_24h;
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const totalMarketCap = allCryptocurrencies.reduce((sum, c) => sum + (c.market_cap || 0), 0);
  const avgChange = allCryptocurrencies.length > 0
    ? allCryptocurrencies.reduce((sum, c) => sum + (c.price_change_percentage_24h || 0), 0) / allCryptocurrencies.length
    : 0;
  const gainers = allCryptocurrencies.filter(c => c.price_change_percentage_24h > 0).length;
  const losers = allCryptocurrencies.filter(c => c.price_change_percentage_24h < 0).length;

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4, maximumFractionDigits: 8 }).format(price);
  };

  const formatMarketCap = (mc: number) => {
    if (mc >= 1e12) return `$${(mc / 1e12).toFixed(2)}T`;
    if (mc >= 1e9) return `$${(mc / 1e9).toFixed(2)}B`;
    if (mc >= 1e6) return `$${(mc / 1e6).toFixed(2)}M`;
    return `$${mc.toFixed(0)}`;
  };

  const toggleSort = (field: 'rank' | 'price' | 'change') => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-emerald-500/3 rounded-full blur-3xl"></div>
      </div>

      <div className={`relative z-10 ${isMobile ? 'pt-safe' : ''} sticky top-0 z-30 bg-black/95 backdrop-blur-xl border-b border-green-500/8`}>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => window.history.back()} className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-green-400/60 hover:text-green-400 hover:bg-green-500/10 transition-all">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight">{t('crypto.marketTitle')}</h1>
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                    <div className="absolute inset-0 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping opacity-40"></div>
                  </div>
                  <span className="text-[10px] text-emerald-400/70 font-medium">Live prices</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                disabled={isRefetching}
                className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-green-400/60 hover:text-green-400 hover:bg-green-500/10 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setLocation('/swap')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/15 transition-all text-xs font-medium"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                Swap
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`relative z-10 max-w-6xl mx-auto px-4 py-5 ${isMobile ? 'pb-20' : ''}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="rounded-xl bg-gradient-to-br from-green-500/8 to-transparent border border-green-500/10 p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Total Cap</span>
            </div>
            <div className="text-lg font-bold text-white">{formatMarketCap(totalMarketCap)}</div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-green-500/8 to-transparent border border-green-500/10 p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Avg Change</span>
            </div>
            <div className={`text-lg font-bold ${avgChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {avgChange > 0 ? '+' : ''}{avgChange.toFixed(2)}%
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-green-500/8 to-transparent border border-green-500/10 p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Gainers</span>
            </div>
            <div className="text-lg font-bold text-emerald-400">{gainers}</div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-green-500/8 to-transparent border border-green-500/10 p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              </div>
              <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Losers</span>
            </div>
            <div className="text-lg font-bold text-red-400">{losers}</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder={t('crypto.searchCoins')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/30 focus:bg-white/8 transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => toggleSort('rank')}
              className={`px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${sortBy === 'rank' ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-white/5 text-white/40 border border-white/8 hover:text-white/60'}`}
            >
              {t('crypto.rank')} {sortBy === 'rank' && (sortDir === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('price')}
              className={`px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${sortBy === 'price' ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-white/5 text-white/40 border border-white/8 hover:text-white/60'}`}
            >
              {t('crypto.price')} {sortBy === 'price' && (sortDir === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('change')}
              className={`px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${sortBy === 'change' ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-white/5 text-white/40 border border-white/8 hover:text-white/60'}`}
            >
              {t('crypto.change24h')} {sortBy === 'change' && (sortDir === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-white/3 border border-white/5 p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/10 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-white/10 rounded w-20 mb-1.5"></div>
                    <div className="h-3 bg-white/5 rounded w-12"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-white/10 rounded w-16 mb-1.5"></div>
                    <div className="h-3 bg-white/5 rounded w-10 ml-auto"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {!isMobile && (
              <div className="hidden md:grid md:grid-cols-[40px_2fr_1fr_1fr_1fr] gap-4 px-4 py-2 text-[10px] text-white/30 font-medium uppercase tracking-wider mb-1">
                <span>#</span>
                <span>Token</span>
                <span className="text-right">{t('crypto.price')}</span>
                <span className="text-right">{t('crypto.change24h')}</span>
                <span className="text-right">{t('crypto.marketCap')}</span>
              </div>
            )}
            
            <div className="space-y-1.5">
              {filtered.map((crypto, index) => (
                <div
                  key={crypto.id}
                  onClick={() => setLocation(`/crypto/${crypto.id}`)}
                  className="group rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-green-500/15 p-3.5 md:p-4 cursor-pointer transition-all"
                >
                  {isMobile ? (
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={crypto.image}
                          alt={crypto.name}
                          className="w-9 h-9 rounded-full bg-white/5"
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://via.placeholder.com/36/111/4ade80?text=${crypto.symbol.charAt(0).toUpperCase()}`; }}
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 text-[8px] bg-black/80 text-white/40 px-1 rounded-full border border-white/10">{crypto.market_cap_rank || index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-white truncate">{crypto.name}</span>
                        </div>
                        <span className="text-[11px] text-white/40 font-medium uppercase">{crypto.symbol}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-white">{formatPrice(crypto.current_price)}</div>
                        <div className={`flex items-center justify-end gap-0.5 text-[11px] font-medium ${crypto.price_change_percentage_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {crypto.price_change_percentage_24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {crypto.price_change_percentage_24h > 0 ? '+' : ''}{crypto.price_change_percentage_24h?.toFixed(2) || '0.00'}%
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-[40px_2fr_1fr_1fr_1fr] gap-4 items-center">
                      <span className="text-xs text-white/30 font-medium">{crypto.market_cap_rank || index + 1}</span>
                      <div className="flex items-center gap-3">
                        <img
                          src={crypto.image}
                          alt={crypto.name}
                          className="w-8 h-8 rounded-full bg-white/5"
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://via.placeholder.com/32/111/4ade80?text=${crypto.symbol.charAt(0).toUpperCase()}`; }}
                        />
                        <div>
                          <span className="text-sm font-semibold text-white">{crypto.name}</span>
                          <span className="text-[11px] text-white/40 font-medium ml-2 uppercase">{crypto.symbol}</span>
                        </div>
                      </div>
                      <div className="text-right text-sm font-semibold text-white">{formatPrice(crypto.current_price)}</div>
                      <div className={`flex items-center justify-end gap-1 text-sm font-medium ${crypto.price_change_percentage_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {crypto.price_change_percentage_24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {crypto.price_change_percentage_24h > 0 ? '+' : ''}{crypto.price_change_percentage_24h?.toFixed(2) || '0.00'}%
                      </div>
                      <div className="text-right text-sm text-white/50 font-medium">{formatMarketCap(crypto.market_cap)}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">No tokens found matching "{searchTerm}"</p>
              </div>
            )}
          </>
        )}

        <div className="mt-8 pt-5 border-t border-white/5">
          <div className="flex items-center justify-center gap-2 text-[10px] text-white/20">
            <div className="relative">
              <div className="w-1.5 h-1.5 bg-emerald-400/50 rounded-full"></div>
              <div className="absolute inset-0 w-1.5 h-1.5 bg-emerald-400/50 rounded-full animate-ping opacity-30"></div>
            </div>
            <span>Live data &middot; Updates every 30s &middot; Powered by Ankr & CoinGecko</span>
          </div>
        </div>
      </div>
    </div>
  );
}
