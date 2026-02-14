export interface CryptoCurrency {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  market_cap_rank: number;
  image: string;
  price_change_24h: number;
}

export interface CryptoPriceHistory {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

function isCapacitorApp(): boolean {
  if (typeof window === 'undefined') return false;
  if ((window as any).Capacitor) return true;
  if (window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:') return true;
  if (window.location.hostname === 'localhost' && window.location.protocol === 'https:' && !window.location.port) return true;
  return false;
}

class CryptoService {
  private isNative = isCapacitorApp();

  async getTopCryptocurrencies(): Promise<CryptoCurrency[]> {
    try {
      let response: Response;

      if (this.isNative) {
        response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h',
          { headers: { 'Accept': 'application/json' } }
        );
      } else {
        response = await fetch('/api/crypto/prices', {
          headers: { 'Accept': 'application/json' },
        });
      }

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch cryptocurrency data:', error);
      return [];
    }
  }

  async getCryptocurrencyHistory(coinId: string, days: number = 7): Promise<CryptoPriceHistory> {
    try {
      let response: Response;

      if (this.isNative) {
        response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=usd&days=${days}`,
          { headers: { 'Accept': 'application/json' } }
        );
      } else {
        response = await fetch(
          `/api/crypto/history/${encodeURIComponent(coinId)}?days=${days}`,
          { headers: { 'Accept': 'application/json' } }
        );
      }

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch price history for ${coinId}:`, error);
      return { prices: [], market_caps: [], total_volumes: [] };
    }
  }
}

export const cryptoService = new CryptoService();
