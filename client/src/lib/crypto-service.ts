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

class CryptoService {
  async getTopCryptocurrencies(): Promise<CryptoCurrency[]> {
    try {
      const response = await fetch('/api/crypto/prices', {
        headers: { 'Accept': 'application/json' },
      });

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
      const response = await fetch(
        `/api/crypto/history/${encodeURIComponent(coinId)}?days=${days}`,
        {
          headers: { 'Accept': 'application/json' },
        }
      );

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
