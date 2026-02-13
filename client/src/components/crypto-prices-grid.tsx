import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cryptoService, type CryptoCurrency } from "@/lib/crypto-service";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface CryptoPricesGridProps {
  onCoinClick?: (coinId: string) => void;
  limit?: number;
}

export default function CryptoPricesGrid({ onCoinClick, limit }: CryptoPricesGridProps) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [visibleCount, setVisibleCount] = useState(limit || 10);
  
  const { data: allCryptocurrencies = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['/api/crypto/prices'],
    queryFn: () => cryptoService.getTopCryptocurrencies(),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
  });

  const cryptocurrencies = allCryptocurrencies.slice(0, visibleCount);
  const hasMore = !limit && visibleCount < allCryptocurrencies.length && visibleCount < 50;

  const handleCoinClick = (coinId: string) => {
    if (onCoinClick) {
      onCoinClick(coinId);
    } else {
      setLocation(`/crypto/${coinId}`);
    }
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 10, 50, allCryptocurrencies.length));
  };

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold gradient-text font-mono">{t('crypto.cryptoPrices')}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 md:gap-2">
          {Array.from({ length: limit || 10 }).map((_, i) => (
            <div key={i} className="border border-primary/15 rounded p-2 animate-pulse">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-4 h-4 bg-primary/20 rounded-full"></div>
                <div className="h-3 bg-primary/20 rounded w-8"></div>
              </div>
              <div className="h-3 bg-primary/20 rounded w-14 mb-1"></div>
              <div className="h-2.5 bg-primary/10 rounded w-10"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-xs md:text-sm font-bold text-primary font-mono">{t('crypto.market')}</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 md:gap-2">
        {cryptocurrencies.map((crypto, index) => (
          <div
            key={crypto.id}
            className="border border-primary/15 rounded p-2 hover:bg-primary/5 cursor-pointer group"
            onClick={() => handleCoinClick(crypto.id)}
            data-testid={`card-crypto-${crypto.id}`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <img 
                src={crypto.image || `https://via.placeholder.com/20/00ff00/000000?text=${crypto.symbol.toUpperCase()}`}
                alt={crypto.name}
                className="w-4 h-4 rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://via.placeholder.com/20/00ff00/000000?text=${crypto.symbol.toUpperCase()}`;
                }}
              />
              <span className="text-[10px] font-bold text-primary font-mono truncate">{crypto.symbol.toUpperCase()}</span>
              <span className="text-[9px] text-primary/40 ml-auto">#{crypto.market_cap_rank || index + 1}</span>
            </div>
            <div className="text-xs font-bold text-primary font-mono">{formatPrice(crypto.current_price)}</div>
            <div className="flex items-center gap-0.5 mt-0.5">
              {crypto.price_change_percentage_24h >= 0 ? (
                <TrendingUp className="w-2.5 h-2.5 text-green-400" />
              ) : (
                <TrendingDown className="w-2.5 h-2.5 text-red-400" />
              )}
              <span className={`text-[10px] font-mono ${crypto.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {crypto.price_change_percentage_24h > 0 ? '+' : ''}{crypto.price_change_percentage_24h?.toFixed(1) || '0.0'}%
              </span>
            </div>
            <div className="text-[9px] text-muted-foreground/50 font-mono mt-0.5">{formatMarketCap(crypto.market_cap)}</div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button onClick={handleLoadMore} variant="outline" size="sm" className="h-6 px-3 text-[10px] border-primary/20 text-primary hover:bg-primary/5 font-mono" data-testid="button-load-more">
            {t('crypto.loadMore', { count: allCryptocurrencies.length - visibleCount })}
          </Button>
        </div>
      )}

      <div className="text-center pt-1.5 border-t border-primary/10">
        <div className="flex items-center justify-center gap-1.5 text-[9px] text-muted-foreground/30 font-mono">
          <div className="w-1 h-1 bg-primary/40 rounded-full"></div>
          <span>{t('crypto.live')}</span>
          <div className="w-1 h-1 bg-primary/40 rounded-full"></div>
          <span>{t('crypto.refreshInterval')}</span>
        </div>
      </div>
    </div>
  );
}