import { ethers } from 'ethers';

// Network configurations
export interface NetworkConfig {
  id: string;
  name: string;
  symbol: string;
  rpcUrl: string;
  chainId: number;
  blockExplorer: string;
  logoUrl?: string;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://eth.llamarpc.com',
    chainId: 1,
    blockExplorer: 'https://etherscan.io',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/32x32/1027.png'
  },
  bsc: {
    id: 'bsc',
    name: 'Binance Smart Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    chainId: 56,
    blockExplorer: 'https://bscscan.com',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/32x32/1839.png'
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum One',
    symbol: 'ETH',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    chainId: 42161,
    blockExplorer: 'https://arbiscan.io',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/32x32/11841.png'
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'ETH',
    rpcUrl: 'https://polygon-rpc.com',
    chainId: 137,
    blockExplorer: 'https://polygonscan.com',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/32x32/3890.png'
  },
  base: {
    id: 'base',
    name: 'Base',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.base.org',
    chainId: 8453,
    blockExplorer: 'https://basescan.org',
    logoUrl: 'https://avatars.githubusercontent.com/u/108554348?s=280&v=4'
  },
  optimism: {
    id: 'optimism',
    name: 'Optimism',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.optimism.io',
    chainId: 10,
    blockExplorer: 'https://optimistic.etherscan.io',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/32x32/11840.png'
  }
};

// Supported tokens on each network
export const SUPPORTED_TOKENS: Record<string, TokenConfig[]> = {
  ethereum: [
    {
      address: 'native',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/32x32/1027.png'
    }
  ],
  bsc: [
    {
      address: '0xaf62c16e46238c14ab8eda78285feb724e7d4444',
      symbol: 'OFFC',
      name: 'Offchat Token',
      decimals: 18,
      logoUrl: '/logo.png'
    },
    {
      address: 'native',
      symbol: 'BNB',
      name: 'Binance Coin',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/32x32/1839.png'
    }
  ],
  arbitrum: [
    {
      address: 'native',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/32x32/1027.png'
    }
  ],
  polygon: [
    {
      address: 'native',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/32x32/1027.png'
    }
  ],
  base: [
    {
      address: 'native',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/32x32/1027.png'
    }
  ],
  optimism: [
    {
      address: 'native',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/32x32/1027.png'
    }
  ]
};

const SCANNABLE_TOKENS: Record<string, TokenConfig[]> = {
  bsc: [
    { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', name: 'Tether USD', decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
    { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', name: 'USD Coin', decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png' },
    { address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', symbol: 'BUSD', name: 'Binance USD', decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/9576/small/BUSD.png' },
    { address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', symbol: 'ETH', name: 'Ethereum', decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
    { address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', symbol: 'CAKE', name: 'PancakeSwap', decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/12632/small/IMG_0440.PNG' },
    { address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', symbol: 'BTCB', name: 'Bitcoin BEP20', decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/14108/small/Binance-bitcoin.png' },
    { address: '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE', symbol: 'XRP', name: 'XRP', decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
    { address: '0xbA2aE424d960c26247Dd6c32edC70B295c744C43', symbol: 'DOGE', name: 'Dogecoin', decimals: 8, logoUrl: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png' },
    { address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', symbol: 'DAI', name: 'Dai', decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png' },
    { address: '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD', symbol: 'LINK', name: 'Chainlink', decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' },
  ],
  ethereum: [
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6, logoUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6, logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png' },
    { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', name: 'Dai', decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png' },
    { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8, logoUrl: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png' },
    { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', symbol: 'LINK', name: 'Chainlink', decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' },
    { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI', name: 'Uniswap', decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/12504/small/uni.jpg' },
    { address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', symbol: 'SHIB', name: 'Shiba Inu', decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png' },
  ],
  arbitrum: [
    { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', name: 'Tether USD', decimals: 6, logoUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
    { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', name: 'USD Coin', decimals: 6, logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png' },
    { address: '0x912CE59144191C1204E64559FE8253a0e49E6548', symbol: 'ARB', name: 'Arbitrum', decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg' },
  ],
  polygon: [
    { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether USD', decimals: 6, logoUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
    { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', symbol: 'USDC', name: 'USD Coin', decimals: 6, logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png' },
    { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', symbol: 'WETH', name: 'Wrapped ETH', decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  ],
  base: [
    { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6, logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png' },
  ],
  optimism: [
    { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', symbol: 'USDT', name: 'Tether USD', decimals: 6, logoUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
    { address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', symbol: 'USDC', name: 'USD Coin', decimals: 6, logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png' },
    { address: '0x4200000000000000000000000000000000000042', symbol: 'OP', name: 'Optimism', decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png' },
  ],
};

// Token configuration interface
export interface TokenConfig {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
}

// Custom wallet interface
export interface CustomWallet {
  address: string;
  mnemonic: string;
  privateKey: string;
  encryptedData?: string;
}

// Balance interface
export interface WalletBalance {
  networkId: string;
  balance: string;
  balanceUSD: string;
  symbol: string;
}

// Encryption helpers and storage keys
const STORAGE_KEY = 'matrixchat_wallet';
const PASSWORD_KEY = 'matrixchat_wallet_password';
const BACKUP_STORAGE_KEY = 'matrixchat_wallet_backup';
const LAST_BACKUP_KEY = 'matrixchat_wallet_last_backup';
const INTEGRITY_CHECK_KEY = 'matrixchat_wallet_integrity';

class SimpleWalletManager {
  public wallet: ethers.HDNodeWallet | null = null;
  private providers: Record<string, ethers.JsonRpcProvider> = {};
  private currentNetwork: string = 'ethereum';

  constructor() {
    // Initialize providers for all networks
    Object.values(NETWORKS).forEach(network => {
      this.providers[network.id] = new ethers.JsonRpcProvider(network.rpcUrl);
    });
  }

  // Get current provider
  private getProvider(networkId?: string): ethers.JsonRpcProvider {
    const id = networkId || this.currentNetwork;
    return this.providers[id];
  }

  // Get connected address
  getConnectedAddress(): string | null {
    return this.wallet ? this.wallet.address : null;
  }

  // Switch network
  switchNetwork(networkId: string): void {
    if (!NETWORKS[networkId]) {
      throw new Error(`Unsupported network: ${networkId}`);
    }
    this.currentNetwork = networkId;
    console.log(`Switched to ${NETWORKS[networkId].name}`);
  }

  // Get current network
  getCurrentNetwork(): NetworkConfig {
    return NETWORKS[this.currentNetwork];
  }

  // Get all available networks
  getAllNetworks(): NetworkConfig[] {
    return Object.values(NETWORKS);
  }

  // Get price in USDT with fallback values
  async getTokenPrice(symbol: string): Promise<number> {
    // Fallback prices (approximate)
    const fallbackPrices = {
      ETH: 2500,
      BNB: 600,
      OFFC: 0.001 // Default OFFC price
    };
    
    try {
      // Handle OFFC token price from PancakeSwap
      if (symbol === 'OFFC') {
        const pancakeResponse = await fetch(`https://api.pancakeswap.info/api/v2/tokens/0xaf62c16e46238c14ab8eda78285feb724e7d4444`, {
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors'
        });
        
        if (pancakeResponse.ok) {
          const pancakeData = await pancakeResponse.json();
          if (pancakeData?.data?.price) {
            return parseFloat(pancakeData.data.price);
          }
        }
        
        console.warn('Failed to get OFFC price from PancakeSwap, using fallback:', fallbackPrices.OFFC);
        return fallbackPrices.OFFC;
      }
      
      const coinId = symbol === 'ETH' ? 'ethereum' : 'binancecoin';
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`, {
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        console.warn(`Price API responded with status: ${response.status}, using fallback price`);
        return fallbackPrices[symbol as keyof typeof fallbackPrices] || 0;
      }
      
      const data = await response.json();
      const price = data[coinId]?.usd;
      
      if (typeof price === 'number' && price > 0) {
        return price;
      }
      
      console.warn(`Invalid price data for ${symbol}, using fallback:`, data);
      return fallbackPrices[symbol as keyof typeof fallbackPrices] || 0;
    } catch (error) {
      console.warn(`Failed to get ${symbol} price, using fallback:`, error);
      return fallbackPrices[symbol as keyof typeof fallbackPrices] || 0;
    }
  }

  // Get multi-network balance
  async getMultiNetworkBalance(address: string): Promise<WalletBalance[]> {
    const balances: WalletBalance[] = [];
    
    // Get balances and prices in parallel for better performance
    const networkPromises = Object.values(NETWORKS).map(async (network) => {
      try {
        console.log(`Getting balance for ${network.name} (${network.symbol})...`);
        
        const [balance, price] = await Promise.all([
          this.getBalance(address, network.id),
          this.getTokenPrice(network.symbol)
        ]);
        
        const balanceNum = parseFloat(balance);
        const balanceUSD = (balanceNum * price).toFixed(2);
        
        console.log(`${network.symbol} balance: ${balance}, price: $${price}, USD: $${balanceUSD}`);
        
        return {
          networkId: network.id,
          balance: balanceNum.toFixed(4),
          balanceUSD,
          symbol: network.symbol
        };
      } catch (error) {
        console.error(`Failed to get balance for ${network.name}:`, error);
        return {
          networkId: network.id,
          balance: '0.0000',
          balanceUSD: '0.00',
          symbol: network.symbol
        };
      }
    });
    
    const results = await Promise.all(networkPromises);
    return results;
  }

  // Generate new wallet with mnemonic
  generateWallet(): CustomWallet {
    console.log('Generating new wallet...');
    
    // Generate mnemonic (12 words)
    const mnemonic = ethers.Mnemonic.entropyToPhrase(ethers.randomBytes(16));
    
    // Create wallet from mnemonic
    const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic);
    
    this.wallet = wallet;
    
    return {
      address: wallet.address,
      mnemonic: mnemonic,
      privateKey: wallet.privateKey
    };
  }

  // Import wallet from mnemonic
  importWallet(mnemonic: string): CustomWallet {
    console.log('Importing wallet from mnemonic...');
    
    try {
      // Validate and create wallet from mnemonic
      const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic.trim());
      
      this.wallet = wallet;
      
      return {
        address: wallet.address,
        mnemonic: mnemonic.trim(),
        privateKey: wallet.privateKey
      };
    } catch (error) {
      console.error('Invalid mnemonic:', error);
      throw new Error('Invalid 12 words. Please enter the correct words.');
    }
  }

  // Enhanced save wallet with backup and integrity checking
  saveWallet(walletData: CustomWallet, password: string): void {
    try {
      // Simple encryption - in production use better encryption
      const dataToEncrypt = JSON.stringify({
        address: walletData.address,
        mnemonic: walletData.mnemonic,
        privateKey: walletData.privateKey,
        timestamp: Date.now(),
        version: '1.1' // Version for future compatibility
      });
      
      // Base64 encode with password (simple obfuscation)
      const encrypted = btoa(password + '|' + dataToEncrypt);
      
      // Primary storage
      localStorage.setItem(STORAGE_KEY, encrypted);
      localStorage.setItem(PASSWORD_KEY, btoa(password));
      
      // Create backup copy
      localStorage.setItem(BACKUP_STORAGE_KEY, encrypted);
      localStorage.setItem(LAST_BACKUP_KEY, Date.now().toString());
      
      // Create integrity hash for validation
      const integrityHash = btoa(encrypted + walletData.address);
      localStorage.setItem(INTEGRITY_CHECK_KEY, integrityHash);
      
      console.log('Wallet saved successfully with backup');
    } catch (error) {
      console.error('Failed to save wallet:', error);
      throw new Error('Wallet could not be saved.');
    }
  }

  // Load wallet from localStorage
  loadWallet(password: string): CustomWallet | null {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEY);
      const storedPasswordHash = localStorage.getItem(PASSWORD_KEY);
      
      if (!encrypted || !storedPasswordHash) {
        return null;
      }
      
      // Verify password
      if (btoa(password) !== storedPasswordHash) {
        throw new Error('Wrong password.');
      }
      
      // Decrypt
      const decrypted = atob(encrypted);
      const [storedPassword, dataJson] = decrypted.split('|', 2);
      
      if (storedPassword !== password) {
        throw new Error('Wrong password.');
      }
      
      const walletData = JSON.parse(dataJson);
      
      // Recreate wallet instance
      this.wallet = ethers.HDNodeWallet.fromPhrase(walletData.mnemonic);
      
      return walletData;
    } catch (error) {
      console.error('Failed to load wallet:', error);
      if (error instanceof Error && error.message === 'Wrong password.') {
        throw error;
      }
      throw new Error('Wallet could not be loaded.');
    }
  }

  // Check if wallet exists in storage
  hasStoredWallet(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  // Enhanced validate wallet data integrity with backup checking
  validateWalletData(): boolean {
    try {
      // Check primary storage
      const primaryValid = this.validateStorageLocation(STORAGE_KEY);
      
      if (primaryValid) {
        // Verify integrity hash
        const encrypted = localStorage.getItem(STORAGE_KEY);
        const expectedIntegrityHash = localStorage.getItem(INTEGRITY_CHECK_KEY);
        
        if (expectedIntegrityHash && encrypted) {
          const decrypted = atob(encrypted);
          const [, dataJson] = decrypted.split('|', 2);
          const walletData = JSON.parse(dataJson);
          const calculatedHash = btoa(encrypted + walletData.address);
          
          if (calculatedHash !== expectedIntegrityHash) {
            console.warn('Primary wallet data integrity check failed, trying backup...');
            return this.recoverFromBackup();
          }
        }
        
        return true;
      }
      
      // If primary storage fails, try backup
      console.warn('Primary wallet storage invalid, trying backup...');
      return this.recoverFromBackup();
    } catch (error) {
      console.error('Wallet data validation failed:', error);
      return false;
    }
  }

  // Validate a specific storage location
  private validateStorageLocation(storageKey: string): boolean {
    try {
      const encrypted = localStorage.getItem(storageKey);
      const storedPasswordHash = localStorage.getItem(PASSWORD_KEY);
      
      if (!encrypted || !storedPasswordHash) {
        return false;
      }
      
      const decrypted = atob(encrypted);
      const [storedPassword, dataJson] = decrypted.split('|', 2);
      
      if (!storedPassword || !dataJson) {
        return false;
      }
      
      const walletData = JSON.parse(dataJson);
      return walletData && walletData.address && walletData.mnemonic && walletData.privateKey;
    } catch {
      return false;
    }
  }

  // Recover from backup storage
  private recoverFromBackup(): boolean {
    try {
      const backupValid = this.validateStorageLocation(BACKUP_STORAGE_KEY);
      
      if (backupValid) {
        console.log('Backup wallet data is valid, restoring primary storage...');
        
        // Copy backup to primary
        const backupData = localStorage.getItem(BACKUP_STORAGE_KEY);
        if (backupData) {
          localStorage.setItem(STORAGE_KEY, backupData);
          
          // Recreate integrity hash
          const decrypted = atob(backupData);
          const [, dataJson] = decrypted.split('|', 2);
          const walletData = JSON.parse(dataJson);
          const integrityHash = btoa(backupData + walletData.address);
          localStorage.setItem(INTEGRITY_CHECK_KEY, integrityHash);
          
          console.log('Primary wallet storage restored from backup');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Failed to recover from backup:', error);
      return false;
    }
  }

  // Get native token balance (ETH, BNB)
  async getBalance(address: string, networkId?: string): Promise<string> {
    try {
      const provider = this.getProvider(networkId);
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0.0';
    }
  }

  // Get ERC-20 token balance
  async getTokenBalance(walletAddress: string, tokenConfig: TokenConfig, networkId?: string): Promise<string> {
    try {
      // If it's a native token, use regular balance method
      if (tokenConfig.address === 'native') {
        return await this.getBalance(walletAddress, networkId);
      }

      const provider = this.getProvider(networkId);
      
      // ERC-20 contract ABI for balanceOf function
      const erc20Abi = [
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function symbol() view returns (string)"
      ];
      
      const contract = new ethers.Contract(tokenConfig.address, erc20Abi, provider);
      const balance = await contract.balanceOf(walletAddress);
      
      return ethers.formatUnits(balance, tokenConfig.decimals);
    } catch (error) {
      console.error(`Failed to get ${tokenConfig.symbol} balance:`, error);
      return '0.0';
    }
  }

  // Get all token balances for a specific network (includes discovered tokens)
  async getAllTokenBalances(walletAddress: string, networkId?: string): Promise<Array<{token: TokenConfig, balance: string}>> {
    const network = networkId || this.currentNetwork;
    const baseTokens = SUPPORTED_TOKENS[network] || [];
    const customTokens = this.getCustomTokens(network);
    const scanTokens = SCANNABLE_TOKENS[network] || [];
    
    const allAddresses = new Set(baseTokens.map(t => t.address.toLowerCase()));
    const mergedTokens = [...baseTokens];
    
    for (const ct of customTokens) {
      if (!allAddresses.has(ct.address.toLowerCase())) {
        mergedTokens.push(ct);
        allAddresses.add(ct.address.toLowerCase());
      }
    }
    
    for (const st of scanTokens) {
      if (!allAddresses.has(st.address.toLowerCase())) {
        mergedTokens.push(st);
        allAddresses.add(st.address.toLowerCase());
      }
    }
    
    const balances = await Promise.all(
      mergedTokens.map(async (token) => {
        const balance = await this.getTokenBalance(walletAddress, token, networkId);
        return { token, balance };
      })
    );
    
    const nonZero = balances.filter(b => {
      const val = parseFloat(b.balance);
      return val > 0;
    });
    
    for (const item of nonZero) {
      if (item.token.address !== 'native' && !baseTokens.find(t => t.address.toLowerCase() === item.token.address.toLowerCase())) {
        this.addCustomToken(network, item.token);
      }
    }
    
    return nonZero;
  }

  addCustomToken(networkId: string, token: TokenConfig): void {
    const key = 'offchat_custom_tokens';
    try {
      const stored = JSON.parse(localStorage.getItem(key) || '{}');
      if (!stored[networkId]) stored[networkId] = [];
      if (!stored[networkId].find((t: any) => t.address.toLowerCase() === token.address.toLowerCase())) {
        stored[networkId].push(token);
        localStorage.setItem(key, JSON.stringify(stored));
      }
    } catch {}
  }

  getCustomTokens(networkId: string): TokenConfig[] {
    try {
      const stored = JSON.parse(localStorage.getItem('offchat_custom_tokens') || '{}');
      return stored[networkId] || [];
    } catch { return []; }
  }

  // Auto-restore wallet from storage if available
  public async autoRestoreWallet(): Promise<void> {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        // Decode the base64 encoded data first
        const decrypted = atob(storedData);
        const [, dataJson] = decrypted.split('|', 2);
        const data = JSON.parse(dataJson);
        
        if (data && data.mnemonic) {
          console.log('Auto-restoring wallet from storage...');
          this.wallet = ethers.Wallet.fromPhrase(data.mnemonic);
          console.log('Wallet auto-restored successfully');
        }
      }
    } catch (error) {
      console.error('Failed to auto-restore wallet:', error);
    }
  }

  // Send native token transaction (ETH, BNB)
  async sendTransaction(to: string, amount: string, networkId?: string): Promise<string> {
    // Force wallet restore - multiple attempts
    for (let i = 0; i < 3; i++) {
      if (!this.wallet) {
        console.log(`Attempting to restore wallet for native transfer (attempt ${i + 1}/3)...`);
        try {
          await this.autoRestoreWallet();
          if (this.wallet) {
            console.log('Wallet successfully restored for native transfer!');
            break;
          }
        } catch (error) {
          console.error(`Wallet restore attempt ${i + 1} failed:`, error);
        }
        
        // Wait a bit before next attempt
        if (i < 2) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } else {
        break;
      }
    }
    
    if (!this.wallet) {
      throw new Error('Unable to access wallet for transfer. Please refresh the page and try again.');
    }

    try {
      // Connect wallet to provider
      const provider = this.getProvider(networkId);
      const connectedWallet = this.wallet.connect(provider);
      
      // Create transaction
      const tx = {
        to: to,
        value: ethers.parseEther(amount),
        gasLimit: 21000,
      };
      
      // Send transaction
      const txResponse = await connectedWallet.sendTransaction(tx);
      
      console.log('Native token transaction sent:', txResponse.hash);
      return txResponse.hash;
    } catch (error: any) {
      console.error('Transaction failed:', error);
      
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient balance.');
      }
      
      throw new Error('Transaction failed: ' + (error.message || 'Unknown error'));
    }
  }

  // Send ERC-20 token transaction
  async sendTokenTransaction(to: string, amount: string, tokenConfig: TokenConfig, networkId?: string): Promise<string> {
    // Force wallet restore - multiple attempts
    for (let i = 0; i < 3; i++) {
      if (!this.wallet) {
        console.log(`Attempting to restore wallet (attempt ${i + 1}/3)...`);
        try {
          await this.autoRestoreWallet();
          if (this.wallet) {
            console.log('Wallet successfully restored!');
            break;
          }
        } catch (error) {
          console.error(`Wallet restore attempt ${i + 1} failed:`, error);
        }
        
        // Wait a bit before next attempt
        if (i < 2) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } else {
        break;
      }
    }
    
    if (!this.wallet) {
      // If still no wallet, check if we have stored data
      const hasWalletData = localStorage.getItem('walletData') || localStorage.getItem('backup_walletData');
      if (hasWalletData) {
        console.log('Wallet data exists but restore failed. Trying one more time...');
        try {
          await this.autoRestoreWallet();
        } catch (error) {
          console.error('Final restore attempt failed:', error);
        }
      }
      
      if (!this.wallet) {
        throw new Error('Unable to access wallet. Please refresh the page and try again.');
      }
    }

    try {
      // If it's a native token, use regular transaction method
      if (tokenConfig.address === 'native') {
        return await this.sendTransaction(to, amount, networkId);
      }

      const provider = this.getProvider(networkId);
      const connectedWallet = this.wallet.connect(provider);
      
      // ERC-20 contract ABI for transfer function
      const erc20Abi = [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)"
      ];
      
      const contract = new ethers.Contract(tokenConfig.address, erc20Abi, connectedWallet);
      
      // Convert amount to proper units
      const amountInWei = ethers.parseUnits(amount, tokenConfig.decimals);
      
      // Check balance first
      const balance = await contract.balanceOf(this.wallet.address);
      if (balance < amountInWei) {
        throw new Error(`Insufficient ${tokenConfig.symbol} balance.`);
      }
      
      // BSC optimized gas settings
      const isMainnet = networkId === 'ethereum';
      const gasPrice = isMainnet ? undefined : ethers.parseUnits('1', 'gwei'); // 5 gwei for BSC
      
      // Estimate gas limit first
      const estimatedGas = await contract.transfer.estimateGas(to, amountInWei);
      const gasLimit = estimatedGas + (estimatedGas * BigInt(20)) / BigInt(100); // Add 20% buffer
      
      // Send token transfer transaction with optimized gas
      const txOptions: any = {
        gasLimit: gasLimit
      };
      
      // Only set gas price for non-mainnet (BSC)
      if (!isMainnet && gasPrice) {
        txOptions.gasPrice = gasPrice;
      }
      
      const txResponse = await contract.transfer(to, amountInWei, txOptions);
      
      console.log(`${tokenConfig.symbol} token transaction sent:`, txResponse.hash);
      return txResponse.hash;
    } catch (error: any) {
      console.error(`${tokenConfig.symbol} token transaction failed:`, error);
      
      if (error.message?.includes('insufficient')) {
        throw new Error(`Insufficient ${tokenConfig.symbol} balance.`);
      }
      
      throw new Error(`${tokenConfig.symbol} transaction failed: ` + (error.message || 'Unknown error'));
    }
  }

  // Clear wallet data (all storage locations)
  clearWallet(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PASSWORD_KEY);
    localStorage.removeItem(BACKUP_STORAGE_KEY);
    localStorage.removeItem(LAST_BACKUP_KEY);
    localStorage.removeItem(INTEGRITY_CHECK_KEY);
    this.wallet = null;
    console.log('Wallet data cleared from all storage locations');
  }

  // Periodic maintenance for wallet storage
  performMaintenanceCheck(): void {
    try {
      const lastBackup = localStorage.getItem(LAST_BACKUP_KEY);
      const now = Date.now();
      
      // If no backup timestamp or backup is older than 24 hours
      if (!lastBackup || (now - parseInt(lastBackup)) > 24 * 60 * 60 * 1000) {
        console.log('Performing wallet storage maintenance...');
        
        // Refresh backup if primary storage is valid
        if (this.validateStorageLocation(STORAGE_KEY)) {
          const primaryData = localStorage.getItem(STORAGE_KEY);
          if (primaryData) {
            localStorage.setItem(BACKUP_STORAGE_KEY, primaryData);
            localStorage.setItem(LAST_BACKUP_KEY, now.toString());
            console.log('Wallet backup refreshed');
          }
        }
      }
    } catch (error) {
      console.error('Maintenance check failed:', error);
    }
  }
}

// Global wallet manager instance
const walletManager = new SimpleWalletManager();

// Make wallet manager globally accessible and auto-restore wallet
if (typeof window !== 'undefined') {
  (window as any).walletManager = walletManager;
  
  // Auto-restore wallet on page load if data exists
  setTimeout(async () => {
    if (!walletManager.wallet && walletManager.hasStoredWallet()) {
      console.log('Auto-restoring wallet on page load...');
      await walletManager.autoRestoreWallet();
    }
  }, 1000); // Small delay to ensure page is loaded
}

// Export functions to maintain compatibility with existing code
export const initWalletConnect = async (): Promise<boolean> => {
  console.log('Custom wallet system initialized');
  return true;
};

export const connectWalletConnect = async (): Promise<string | null> => {
  // This will be handled by the UI components
  throw new Error('Please create a wallet or import your existing wallet.');
};

export const disconnectWalletConnect = async (): Promise<void> => {
  walletManager.clearWallet();
};

export const getWalletConnectBalance = async (address: string): Promise<string> => {
  const balance = await walletManager.getBalance(address);
  return parseFloat(balance).toFixed(4);
};

export const sendWalletConnectTransaction = async (
  to: string,
  amount: string,
  networkId?: string
): Promise<string> => {
  return await walletManager.sendTransaction(to, amount, networkId);
};

export const isWalletConnectConnected = (): boolean => {
  return walletManager.hasStoredWallet();
};

export const getConnectedWalletAddress = (): string | null => {
  return walletManager.getConnectedAddress();
};

export const getWalletConnectProvider = (): any => {
  return walletManager;
};

// New wallet-specific functions
export const generateNewWallet = (): CustomWallet => {
  return walletManager.generateWallet();
};

export const importWalletFromMnemonic = (mnemonic: string): CustomWallet => {
  return walletManager.importWallet(mnemonic);
};

export const saveWalletToStorage = (wallet: CustomWallet, password: string): void => {
  walletManager.saveWallet(wallet, password);
};

export const loadWalletFromStorage = (password: string): CustomWallet | null => {
  return walletManager.loadWallet(password);
};

export const hasStoredWallet = (): boolean => {
  return walletManager.hasStoredWallet();
};

export const validateWalletIntegrity = (): boolean => {
  return walletManager.validateWalletData();
};

// Recovery function that attempts to restore wallet from database
export const recoverWalletFromDatabase = async (walletAddress: string): Promise<CustomWallet | null> => {
  try {
    console.log('Attempting to recover wallet from database for address:', walletAddress);
    
    // Fetch user data from backend to get stored mnemonic/private key
    const response = await fetch(`/api/users/wallet/${walletAddress}`);
    
    if (!response.ok) {
      console.error('Failed to fetch user wallet data from database');
      return null;
    }
    
    const userData = await response.json();
    
    // Check if we have the necessary recovery data
    if (!userData.mnemonic || !userData.privateKey) {
      console.error('No wallet recovery data found in database');
      return null;
    }
    
    console.log('Wallet recovery data found, attempting to restore...');
    
    // Create wallet object with the recovered data
    const recoveredWallet: CustomWallet = {
      address: userData.walletAddress,
      mnemonic: userData.mnemonic,
      privateKey: userData.privateKey
    };
    
    // Validate the recovered wallet data by trying to recreate the wallet
    try {
      const testWallet = ethers.HDNodeWallet.fromPhrase(userData.mnemonic);
      if (testWallet.address.toLowerCase() !== userData.walletAddress.toLowerCase()) {
        console.error('Recovered wallet address mismatch');
        return null;
      }
    } catch (error) {
      console.error('Failed to validate recovered wallet:', error);
      return null;
    }
    
    console.log('Wallet successfully recovered from database');
    return recoveredWallet;
    
  } catch (error) {
    console.error('Failed to recover wallet from database:', error);
    return null;
  }
};

export const clearStoredWallet = (): void => {
  walletManager.clearWallet();
};

// New multi-network functions
export const getMultiNetworkWalletBalance = async (address: string): Promise<WalletBalance[]> => {
  return walletManager.getMultiNetworkBalance(address);
};

export const switchWalletNetwork = (networkId: string): void => {
  walletManager.switchNetwork(networkId);
};

export const getCurrentWalletNetwork = (): NetworkConfig => {
  return walletManager.getCurrentNetwork();
};

export const getAllWalletNetworks = (): NetworkConfig[] => {
  return walletManager.getAllNetworks();
};

// Perform wallet maintenance check
export const performWalletMaintenance = (): void => {
  walletManager.performMaintenanceCheck();
};

// Token-related functions
export const getSupportedTokens = (networkId?: string): TokenConfig[] => {
  const network = networkId || 'ethereum';
  return SUPPORTED_TOKENS[network] || [];
};

export const getTokenBalance = async (walletAddress: string, tokenConfig: TokenConfig, networkId?: string): Promise<string> => {
  return await walletManager.getTokenBalance(walletAddress, tokenConfig, networkId);
};

export const getAllTokenBalances = async (walletAddress: string, networkId?: string): Promise<Array<{token: TokenConfig, balance: string}>> => {
  return await walletManager.getAllTokenBalances(walletAddress, networkId);
};

export const sendTokenTransaction = async (to: string, amount: string, tokenConfig: TokenConfig, networkId?: string): Promise<string> => {
  return await walletManager.sendTokenTransaction(to, amount, tokenConfig, networkId);
};