import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpDown, Settings, RefreshCw, ChevronDown, Loader2, ExternalLink, AlertTriangle, Check, X, Wallet, Info, Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ethers } from "ethers";

function MatrixRainBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const matrixChars = 'ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンヴ日月火水木金土天地人心道力光闇風雷電雨雲海山川空星花夢影命魂龍鬼神';
    const fontSize = 13;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(0).map(() => Math.random() * -40);
    const speeds: number[] = Array(columns).fill(0).map(() => 0.15 + Math.random() * 0.25);
    const brightness: number[] = Array(columns).fill(0).map(() => Math.random());
    let animId: number;
    let frameCount = 0;
    const draw = () => {
      frameCount++;
      if (frameCount % 2 === 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = `${fontSize}px "MS Gothic", "Hiragino Kaku Gothic Pro", monospace`;
        for (let i = 0; i < drops.length; i++) {
          const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
          const y = drops[i] * fontSize;
          const headGlow = brightness[i] > 0.8;
          if (headGlow) {
            ctx.shadowColor = '#00ff41';
            ctx.shadowBlur = 6;
            ctx.fillStyle = 'rgba(170, 255, 170, 0.5)';
          } else {
            ctx.shadowBlur = 0;
            const alpha = 0.06 + brightness[i] * 0.2;
            ctx.fillStyle = `rgba(0, 255, 65, ${alpha})`;
          }
          ctx.fillText(char, i * fontSize, y);
          ctx.shadowBlur = 0;
          if (y > canvas.height && Math.random() > 0.985) {
            drops[i] = 0;
            speeds[i] = 0.15 + Math.random() * 0.25;
            brightness[i] = Math.random();
          }
          drops[i] += speeds[i];
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} />;
}

const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
];

interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logo: string;
  isNative?: boolean;
}

interface ChainConfig {
  id: string;
  name: string;
  chainIdDecimal: number;
  logo: string;
  color: string;
  rpcUrl: string;
  explorerUrl: string;
  routerAddress: string;
  wrappedNative: string;
  nativeSymbol: string;
  tokens: Token[];
}

const CHAINS: ChainConfig[] = [
  {
    id: "bsc",
    name: "BNB Chain",
    chainIdDecimal: 56,
    logo: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
    color: "#F0B90B",
    rpcUrl: "https://bsc-dataseed.binance.org/",
    explorerUrl: "https://bscscan.com",
    routerAddress: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
    wrappedNative: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    nativeSymbol: "BNB",
    tokens: [
      { symbol: "BNB", name: "BNB", address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", decimals: 18, logo: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png", isNative: true },
      { symbol: "USDT", name: "Tether USD", address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18, logo: "https://assets.coingecko.com/coins/images/325/small/Tether.png" },
      { symbol: "BUSD", name: "Binance USD", address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", decimals: 18, logo: "https://assets.coingecko.com/coins/images/9576/small/BUSD.png" },
      { symbol: "USDC", name: "USD Coin", address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18, logo: "https://assets.coingecko.com/coins/images/6319/small/usdc.png" },
      { symbol: "CAKE", name: "CAKE", address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", decimals: 18, logo: "https://assets.coingecko.com/coins/images/12632/small/IMG_0440.PNG" },
      { symbol: "ETH", name: "Ethereum", address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", decimals: 18, logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
      { symbol: "BTCB", name: "Bitcoin BEP20", address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", decimals: 18, logo: "https://assets.coingecko.com/coins/images/14108/small/Binance-bitcoin.png" },
      { symbol: "XRP", name: "XRP", address: "0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE", decimals: 18, logo: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png" },
      { symbol: "ADA", name: "Cardano", address: "0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47", decimals: 18, logo: "https://assets.coingecko.com/coins/images/975/small/cardano.png" },
      { symbol: "DOGE", name: "Dogecoin", address: "0xbA2aE424d960c26247Dd6c32edC70B295c744C43", decimals: 8, logo: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png" },
      { symbol: "DOT", name: "Polkadot", address: "0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402", decimals: 18, logo: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png" },
      { symbol: "LINK", name: "Chainlink", address: "0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD", decimals: 18, logo: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png" },
      { symbol: "DAI", name: "Dai Stablecoin", address: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3", decimals: 18, logo: "https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png" },
      { symbol: "OFFC", name: "Offchat Token", address: "0xaf62c16e46238c14ab8eda78285feb724e7d4444", decimals: 18, logo: "https://dd.dexscreener.com/ds-data/tokens/bsc/0xaf62c16e46238c14ab8eda78285feb724e7d4444.png" },
    ],
  },
  {
    id: "ethereum",
    name: "Ethereum",
    chainIdDecimal: 1,
    logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    color: "#627EEA",
    rpcUrl: "https://eth.llamarpc.com",
    explorerUrl: "https://etherscan.io",
    routerAddress: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    wrappedNative: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    nativeSymbol: "ETH",
    tokens: [
      { symbol: "ETH", name: "Ethereum", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18, logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png", isNative: true },
      { symbol: "USDT", name: "Tether USD", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6, logo: "https://assets.coingecko.com/coins/images/325/small/Tether.png" },
      { symbol: "USDC", name: "USD Coin", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6, logo: "https://assets.coingecko.com/coins/images/6319/small/usdc.png" },
      { symbol: "DAI", name: "Dai Stablecoin", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18, logo: "https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png" },
      { symbol: "WBTC", name: "Wrapped BTC", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8, logo: "https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png" },
      { symbol: "UNI", name: "Uniswap", address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", decimals: 18, logo: "https://assets.coingecko.com/coins/images/12504/small/uni.jpg" },
      { symbol: "LINK", name: "Chainlink", address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", decimals: 18, logo: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png" },
      { symbol: "AAVE", name: "Aave", address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", decimals: 18, logo: "https://assets.coingecko.com/coins/images/12645/small/aave-token-round.png" },
      { symbol: "SHIB", name: "Shiba Inu", address: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE", decimals: 18, logo: "https://assets.coingecko.com/coins/images/11939/small/shiba.png" },
      { symbol: "PEPE", name: "Pepe", address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933", decimals: 18, logo: "https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg" },
    ],
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    chainIdDecimal: 42161,
    logo: "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg",
    color: "#28A0F0",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    explorerUrl: "https://arbiscan.io",
    routerAddress: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
    wrappedNative: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    nativeSymbol: "ETH",
    tokens: [
      { symbol: "ETH", name: "Ethereum", address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", decimals: 18, logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png", isNative: true },
      { symbol: "USDT", name: "Tether USD", address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6, logo: "https://assets.coingecko.com/coins/images/325/small/Tether.png" },
      { symbol: "USDC", name: "USD Coin", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6, logo: "https://assets.coingecko.com/coins/images/6319/small/usdc.png" },
      { symbol: "WBTC", name: "Wrapped BTC", address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", decimals: 8, logo: "https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png" },
      { symbol: "ARB", name: "Arbitrum", address: "0x912CE59144191C1204E64559FE8253a0e49E6548", decimals: 18, logo: "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg" },
      { symbol: "DAI", name: "Dai Stablecoin", address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", decimals: 18, logo: "https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png" },
      { symbol: "LINK", name: "Chainlink", address: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4", decimals: 18, logo: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png" },
      { symbol: "GMX", name: "GMX", address: "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a", decimals: 18, logo: "https://assets.coingecko.com/coins/images/18323/small/arbit.png" },
    ],
  },
  {
    id: "polygon",
    name: "Polygon",
    chainIdDecimal: 137,
    logo: "https://assets.coingecko.com/coins/images/4713/small/polygon.png",
    color: "#8247E5",
    rpcUrl: "https://polygon-rpc.com",
    explorerUrl: "https://polygonscan.com",
    routerAddress: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
    wrappedNative: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    nativeSymbol: "POL",
    tokens: [
      { symbol: "POL", name: "POL", address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", decimals: 18, logo: "https://assets.coingecko.com/coins/images/4713/small/polygon.png", isNative: true },
      { symbol: "USDT", name: "Tether USD", address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6, logo: "https://assets.coingecko.com/coins/images/325/small/Tether.png" },
      { symbol: "USDC", name: "USD Coin", address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", decimals: 6, logo: "https://assets.coingecko.com/coins/images/6319/small/usdc.png" },
      { symbol: "WETH", name: "Wrapped ETH", address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", decimals: 18, logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
      { symbol: "WBTC", name: "Wrapped BTC", address: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", decimals: 8, logo: "https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png" },
      { symbol: "DAI", name: "Dai Stablecoin", address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", decimals: 18, logo: "https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png" },
      { symbol: "LINK", name: "Chainlink", address: "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39", decimals: 18, logo: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png" },
      { symbol: "AAVE", name: "Aave", address: "0xD6DF932A45C0f255f85145f286eA0b292B21C90B", decimals: 18, logo: "https://assets.coingecko.com/coins/images/12645/small/aave-token-round.png" },
    ],
  },
  {
    id: "base",
    name: "Base",
    chainIdDecimal: 8453,
    logo: "https://assets.coingecko.com/asset_platforms/images/131/small/base.jpeg",
    color: "#0052FF",
    rpcUrl: "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
    routerAddress: "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24",
    wrappedNative: "0x4200000000000000000000000000000000000006",
    nativeSymbol: "ETH",
    tokens: [
      { symbol: "ETH", name: "Ethereum", address: "0x4200000000000000000000000000000000000006", decimals: 18, logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png", isNative: true },
      { symbol: "USDC", name: "USD Coin", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6, logo: "https://assets.coingecko.com/coins/images/6319/small/usdc.png" },
      { symbol: "DAI", name: "Dai Stablecoin", address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", decimals: 18, logo: "https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png" },
      { symbol: "cbETH", name: "Coinbase ETH", address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22", decimals: 18, logo: "https://assets.coingecko.com/coins/images/27008/small/cbeth.png" },
    ],
  },
  {
    id: "optimism",
    name: "Optimism",
    chainIdDecimal: 10,
    logo: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png",
    color: "#FF0420",
    rpcUrl: "https://mainnet.optimism.io",
    explorerUrl: "https://optimistic.etherscan.io",
    routerAddress: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
    wrappedNative: "0x4200000000000000000000000000000000000006",
    nativeSymbol: "ETH",
    tokens: [
      { symbol: "ETH", name: "Ethereum", address: "0x4200000000000000000000000000000000000006", decimals: 18, logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png", isNative: true },
      { symbol: "USDT", name: "Tether USD", address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", decimals: 6, logo: "https://assets.coingecko.com/coins/images/325/small/Tether.png" },
      { symbol: "USDC", name: "USD Coin", address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", decimals: 6, logo: "https://assets.coingecko.com/coins/images/6319/small/usdc.png" },
      { symbol: "DAI", name: "Dai Stablecoin", address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", decimals: 18, logo: "https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png" },
      { symbol: "WBTC", name: "Wrapped BTC", address: "0x68f180fcCe6836688e9084f035309E29Bf0A2095", decimals: 8, logo: "https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png" },
      { symbol: "OP", name: "Optimism", address: "0x4200000000000000000000000000000000000042", decimals: 18, logo: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png" },
      { symbol: "LINK", name: "Chainlink", address: "0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6", decimals: 18, logo: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png" },
    ],
  },
];

const SLIPPAGE_OPTIONS = [0.5, 1, 3];
const PERCENT_OPTIONS = [25, 50, 75, 100];

function getWalletManager(): any {
  if (typeof window !== "undefined" && (window as any).walletManager) {
    return (window as any).walletManager;
  }
  return null;
}

async function resolveWallet(): Promise<{ address: string; wallet: any } | null> {
  const wm = getWalletManager();
  if (!wm) return null;

  if (!wm.wallet) {
    await wm.autoRestoreWallet();
  }

  if (wm.wallet) {
    return { address: wm.wallet.address, wallet: wm.wallet };
  }

  const savedAddr = localStorage.getItem('walletAddress');
  const connected = localStorage.getItem('walletConnected') === 'true';
  if (savedAddr && connected && wm.hasStoredWallet()) {
    await wm.autoRestoreWallet();
    if (wm.wallet) {
      return { address: wm.wallet.address, wallet: wm.wallet };
    }
  }

  return null;
}

export default function SwapPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  useEffect(() => {
    document.title = "Token Swap - Offchat | DEX Trading";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Swap tokens instantly on Offchat\'s integrated DEX. Trade across Ethereum, BSC, Arbitrum, Polygon, Base and Optimism with best rates from decentralized liquidity pools.');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', 'Token Swap - Offchat | DEX Trading');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', 'Swap tokens instantly on Offchat\'s integrated DEX. Trade across Ethereum, BSC, Arbitrum, Polygon, Base and Optimism with best rates from decentralized liquidity pools.');
  }, []);

  const [selectedChain, setSelectedChain] = useState<ChainConfig>(CHAINS[0]);
  const [fromToken, setFromToken] = useState<Token>(CHAINS[0].tokens[0]);
  const [toToken, setToToken] = useState<Token>(CHAINS[0].tokens[1]);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showFromSelector, setShowFromSelector] = useState(false);
  const [showToSelector, setShowToSelector] = useState(false);
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "approving" | "success" | "error">("idle");
  const [txError, setTxError] = useState("");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [fromBalance, setFromBalance] = useState("");
  const [toBalance, setToBalance] = useState("");
  const [rate, setRate] = useState("");
  const [tokenSearch, setTokenSearch] = useState("");
  const [walletReady, setWalletReady] = useState(false);

  const getRpcProvider = useCallback(() => {
    return new ethers.JsonRpcProvider(selectedChain.rpcUrl);
  }, [selectedChain]);

  useEffect(() => {
    let cancelled = false;
    const initWallet = async () => {
      const maxAttempts = 10;
      for (let i = 0; i < maxAttempts; i++) {
        const result = await resolveWallet();
        if (cancelled) return;
        if (result) {
          setWalletAddress(result.address);
          setWalletReady(true);
          return;
        }
        await new Promise(r => setTimeout(r, 500));
      }
      const savedAddr = localStorage.getItem('walletAddress');
      if (savedAddr && !cancelled) {
        setWalletAddress(savedAddr);
      }
    };
    initWallet();
    return () => { cancelled = true; };
  }, []);

  const fetchBalances = useCallback(async () => {
    if (!walletAddress) return;
    const provider = getRpcProvider();

    try {
      if (fromToken.isNative) {
        const bal = await provider.getBalance(walletAddress);
        setFromBalance(ethers.formatEther(bal));
      } else {
        const contract = new ethers.Contract(fromToken.address, ERC20_ABI, provider);
        const bal = await contract.balanceOf(walletAddress);
        setFromBalance(ethers.formatUnits(bal, fromToken.decimals));
      }
    } catch {
      setFromBalance("");
    }
    try {
      if (toToken.isNative) {
        const bal = await provider.getBalance(walletAddress);
        setToBalance(ethers.formatEther(bal));
      } else {
        const contract = new ethers.Contract(toToken.address, ERC20_ABI, provider);
        const bal = await contract.balanceOf(walletAddress);
        setToBalance(ethers.formatUnits(bal, toToken.decimals));
      }
    } catch {
      setToBalance("");
    }
  }, [walletAddress, fromToken, toToken, getRpcProvider]);

  useEffect(() => {
    if (walletAddress) fetchBalances();
  }, [walletAddress, fromToken, toToken, fetchBalances]);

  const handleChainChange = (chain: ChainConfig) => {
    setSelectedChain(chain);
    setFromToken(chain.tokens[0]);
    setToToken(chain.tokens[1]);
    setFromAmount("");
    setToAmount("");
    setRate("");
    setFromBalance("");
    setToBalance("");
    setTxStatus("idle");
    setShowChainSelector(false);
  };

  const getQuote = useCallback(async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setToAmount("");
      setRate("");
      return;
    }
    setIsQuoting(true);
    try {
      const rpcProvider = getRpcProvider();
      const router = new ethers.Contract(selectedChain.routerAddress, ROUTER_ABI, rpcProvider);
      const amountIn = ethers.parseUnits(fromAmount, fromToken.decimals);
      const path = fromToken.address === toToken.address
        ? [fromToken.address]
        : fromToken.isNative || toToken.isNative
          ? [fromToken.address, toToken.address]
          : [fromToken.address, selectedChain.wrappedNative, toToken.address];
      if (path.length < 2) { setToAmount(""); setIsQuoting(false); return; }
      const amounts = await router.getAmountsOut(amountIn, path);
      const out = ethers.formatUnits(amounts[amounts.length - 1], toToken.decimals);
      setToAmount(parseFloat(out).toFixed(6));
      const r = parseFloat(out) / parseFloat(fromAmount);
      setRate(`1 ${fromToken.symbol} ≈ ${r.toFixed(4)} ${toToken.symbol}`);
    } catch {
      setToAmount("");
      setRate("");
    }
    setIsQuoting(false);
  }, [fromAmount, fromToken, toToken, getRpcProvider, selectedChain]);

  useEffect(() => {
    const timeout = setTimeout(() => { getQuote(); }, 500);
    return () => clearTimeout(timeout);
  }, [getQuote]);

  const handleSwapDirection = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
    const tempBal = fromBalance;
    setFromBalance(toBalance);
    setToBalance(tempBal);
  };

  const handlePercentClick = (pct: number) => {
    if (!fromBalance || parseFloat(fromBalance) <= 0) return;
    const bal = parseFloat(fromBalance);
    let amt: number;
    if (pct === 100 && fromToken.isNative) {
      amt = Math.max(0, bal - 0.005);
    } else {
      amt = bal * (pct / 100);
    }
    const maxDecimals = fromToken.decimals > 8 ? 8 : fromToken.decimals;
    setFromAmount(amt.toFixed(maxDecimals).replace(/\.?0+$/, ''));
  };

  const executeSwap = async () => {
    if (!walletAddress || !fromAmount || !toAmount) return;

    const resolved = await resolveWallet();
    if (!resolved) {
      setTxStatus("error");
      setTxError("Wallet not available. Please refresh the page.");
      return;
    }
    const wallet = resolved.wallet;

    setIsSwapping(true);
    setTxStatus("pending");
    setTxError("");
    setTxHash("");

    try {
      const provider = getRpcProvider();
      const connectedWallet = wallet.connect(provider);
      const router = new ethers.Contract(selectedChain.routerAddress, ROUTER_ABI, connectedWallet);
      const amountIn = ethers.parseUnits(fromAmount, fromToken.decimals);
      const effectiveSlip = customSlippage ? parseFloat(customSlippage) : slippage;
      const minOutValue = parseFloat(toAmount) * (1 - effectiveSlip / 100);
      const minOutStr = minOutValue.toFixed(toToken.decimals > 8 ? 8 : toToken.decimals);
      const minOut = ethers.parseUnits(minOutStr, toToken.decimals);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      const path = fromToken.isNative || toToken.isNative
        ? [fromToken.address, toToken.address]
        : [fromToken.address, selectedChain.wrappedNative, toToken.address];

      let tx;
      if (fromToken.isNative) {
        tx = await router.swapExactETHForTokens(minOut, path, walletAddress, deadline, { value: amountIn });
      } else {
        const tokenContract = new ethers.Contract(fromToken.address, ERC20_ABI, connectedWallet);
        const allowance = await tokenContract.allowance(walletAddress, selectedChain.routerAddress);
        if (allowance < amountIn) {
          setTxStatus("approving");
          setIsApproving(true);
          const approveTx = await tokenContract.approve(selectedChain.routerAddress, ethers.MaxUint256);
          await approveTx.wait();
          setIsApproving(false);
          setTxStatus("pending");
        }
        if (toToken.isNative) {
          tx = await router.swapExactTokensForETH(amountIn, minOut, path, walletAddress, deadline);
        } else {
          tx = await router.swapExactTokensForTokens(amountIn, minOut, path, walletAddress, deadline);
        }
      }

      setTxHash(tx.hash);
      await tx.wait();
      setTxStatus("success");
      fetchBalances();
      setFromAmount("");
      setToAmount("");
    } catch (err: any) {
      setTxStatus("error");
      const msg = err?.reason || err?.shortMessage || err?.message || "Swap failed";
      if (msg.includes("INSUFFICIENT_FUNDS") || msg.includes("insufficient")) {
        setTxError(t('swap.insufficientBalance'));
      } else {
        setTxError(msg);
      }
    }
    setIsSwapping(false);
    setIsApproving(false);
  };

  const effectiveSlippage = customSlippage ? parseFloat(customSlippage) : slippage;
  const hasWallet = !!walletAddress;
  const canSwap = hasWallet && walletReady && fromAmount && toAmount && parseFloat(fromAmount) > 0 && !isSwapping && !isQuoting;

  const filteredTokens = (tokens: Token[], exclude: Token) =>
    tokens.filter(t =>
      t.address.toLowerCase() !== exclude.address.toLowerCase() &&
      (tokenSearch === "" ||
        t.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) ||
        t.name.toLowerCase().includes(tokenSearch.toLowerCase()))
    );

  const TokenSelectorModal = ({ exclude, onSelect, onClose }: { exclude: Token; onSelect: (t: Token) => void; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0a0a0a] border border-green-500/15 rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-green-500/10">
          <h3 className="text-sm font-bold text-white">{t('swap.selectToken')}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input
              type="text"
              placeholder={t('swap.searchTokens')}
              value={tokenSearch}
              onChange={(e) => setTokenSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/30"
              autoFocus
            />
          </div>
        </div>
        <div className="px-2 pb-3 max-h-[50vh] overflow-y-auto">
          {filteredTokens(selectedChain.tokens, exclude).map((token) => (
            <button
              key={token.address}
              onClick={() => { onSelect(token); onClose(); setTokenSearch(""); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors"
            >
              <img src={token.logo} alt={token.symbol} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect fill="%23222" width="40" height="40" rx="20"/><text x="20" y="25" text-anchor="middle" fill="%2300ff88" font-size="14" font-family="monospace">' + token.symbol.charAt(0) + '</text></svg>'; }} />
              <div className="text-left flex-1">
                <div className="text-sm font-semibold text-white">{token.symbol}</div>
                <div className="text-xs text-white/40">{token.name}</div>
              </div>
            </button>
          ))}
          {filteredTokens(selectedChain.tokens, exclude).length === 0 && (
            <div className="text-center py-8 text-white/30 text-sm">No tokens found</div>
          )}
        </div>
      </div>
    </div>
  );

  const ChainSelectorModal = () => (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowChainSelector(false)}>
      <div className="bg-[#0a0a0a] border border-green-500/15 rounded-t-3xl sm:rounded-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-green-500/10">
          <h3 className="text-sm font-bold text-white">{t('swap.settings')}</h3>
          <button onClick={() => setShowChainSelector(false)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-2">
          {CHAINS.map((chain) => (
            <button
              key={chain.id}
              onClick={() => handleChainChange(chain)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors ${
                selectedChain.id === chain.id ? 'bg-green-500/10 border border-green-500/20' : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <img src={chain.logo} alt={chain.name} className="w-8 h-8 rounded-full bg-white/5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className="text-left flex-1">
                <div className="text-sm font-semibold text-white">{chain.name}</div>
                <div className="text-[11px] text-white/40">{chain.tokens.length} tokens</div>
              </div>
              {selectedChain.id === chain.id && <Check className="w-4 h-4 text-green-400" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const formatBal = (bal: string) => {
    const n = parseFloat(bal);
    if (isNaN(n)) return "0";
    if (n === 0) return "0";
    if (n < 0.0001) return "<0.0001";
    if (n < 1) return n.toFixed(6);
    if (n < 1000) return n.toFixed(4);
    return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <MatrixRainBg />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-green-500/3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-1/4 w-56 h-56 bg-emerald-500/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative min-h-screen" style={{ zIndex: 1 }}>
        <div className={`${isMobile ? "pt-safe" : ""} sticky top-0 z-30 bg-black/95 backdrop-blur-xl border-b border-green-500/8`}>
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => window.history.back()} className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h1 className="text-sm font-bold text-white tracking-tight">{t('swap.title')}</h1>
                  <span className="text-[10px] text-white/30">Trade tokens instantly</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowChainSelector(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 transition-all"
                >
                  <img src={selectedChain.logo} alt={selectedChain.name} className="w-4 h-4 rounded-full" />
                  <span className="text-[11px] font-medium text-white/70">{selectedChain.name}</span>
                  <ChevronDown className="w-3 h-3 text-white/30" />
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${showSettings ? 'bg-green-500/15 border-green-500/25 text-green-400' : 'bg-white/5 border-white/8 text-white/50 hover:text-white'}`}
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={`max-w-lg mx-auto px-4 py-5 ${isMobile ? 'pb-24' : ''}`}>
          {walletAddress && (
            <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/90 border border-green-500/10 backdrop-blur-xl">
              <Wallet className="w-3.5 h-3.5 text-green-400/60" />
              <span className="text-[11px] text-green-400/70 font-mono truncate">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
              <div className="ml-auto flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${walletReady ? 'bg-green-400' : 'bg-amber-400'}`}></div>
                <span className="text-[10px] text-white/30">{walletReady ? 'Ready' : 'Loading...'}</span>
              </div>
            </div>
          )}

          {showSettings && (
            <div className="mb-4 p-4 rounded-2xl bg-black/95 border border-white/8 backdrop-blur-xl">
              <div className="text-xs font-semibold text-white/60 mb-3">{t('swap.slippageTolerance')}</div>
              <div className="flex items-center gap-2">
                {SLIPPAGE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSlippage(s); setCustomSlippage(""); }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      slippage === s && !customSlippage
                        ? "bg-green-500/15 text-green-400 border border-green-500/25"
                        : "bg-white/5 text-white/40 border border-white/5 hover:border-white/15"
                    }`}
                  >
                    {s}%
                  </button>
                ))}
                <div className="flex-1 relative">
                  <input
                    type="number"
                    placeholder="Custom"
                    value={customSlippage}
                    onChange={(e) => setCustomSlippage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white/5 border border-white/8 text-white placeholder-white/20 focus:outline-none focus:border-green-500/25"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/20">%</span>
                </div>
              </div>
              {effectiveSlippage > 5 && (
                <div className="mt-2.5 flex items-center gap-1.5 text-amber-400/80 text-[11px]">
                  <AlertTriangle className="w-3 h-3" />
                  <span>High slippage may result in unfavorable trades</span>
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl bg-black/95 border border-white/8 overflow-hidden backdrop-blur-xl">
            <div className="p-4 pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-white/40">{t('swap.from')}</span>
                {fromBalance && (
                  <div className="flex items-center gap-1 text-[11px] text-white/40">
                    <Wallet className="w-3 h-3" />
                    <span>{formatBal(fromBalance)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="flex-1 bg-transparent text-2xl font-bold text-white placeholder-white/15 focus:outline-none min-w-0"
                />
                <button
                  onClick={() => { setShowFromSelector(true); setTokenSearch(""); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/15 transition-all shrink-0"
                >
                  <img src={fromToken.logo} alt={fromToken.symbol} className="w-6 h-6 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <span className="text-sm font-semibold text-white">{fromToken.symbol}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                </button>
              </div>
              {fromBalance && parseFloat(fromBalance) > 0 && (
                <div className="flex items-center gap-1.5 mt-2.5">
                  {PERCENT_OPTIONS.map((pct) => (
                    <button
                      key={pct}
                      onClick={() => handlePercentClick(pct)}
                      className="flex-1 py-1.5 rounded-lg bg-white/[0.03] border border-white/6 text-[10px] font-semibold text-white/40 hover:text-green-400 hover:border-green-500/20 hover:bg-green-500/5 transition-all"
                    >
                      {pct === 100 ? 'Max' : `${pct}%`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative flex items-center justify-center -my-1.5 z-10 px-4">
              <div className="flex-1 h-px bg-white/5"></div>
              <button
                onClick={handleSwapDirection}
                className="mx-3 w-9 h-9 rounded-xl bg-[#111] border border-white/10 flex items-center justify-center text-white/50 hover:text-green-400 hover:border-green-500/25 hover:bg-green-500/5 transition-all hover:rotate-180 duration-300"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
              <div className="flex-1 h-px bg-white/5"></div>
            </div>

            <div className="p-4 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-white/40">{t('swap.to')}</span>
                <div className="flex items-center gap-1.5">
                  {toBalance && (
                    <div className="flex items-center gap-1 text-[11px] text-white/40">
                      <Wallet className="w-3 h-3" />
                      <span>{formatBal(toBalance)}</span>
                    </div>
                  )}
                  {isQuoting && <Loader2 className="w-3 h-3 text-green-400 animate-spin" />}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="0.0"
                  value={toAmount}
                  readOnly
                  className="flex-1 bg-transparent text-2xl font-bold text-white placeholder-white/15 focus:outline-none min-w-0"
                />
                <button
                  onClick={() => { setShowToSelector(true); setTokenSearch(""); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/15 transition-all shrink-0"
                >
                  <img src={toToken.logo} alt={toToken.symbol} className="w-6 h-6 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <span className="text-sm font-semibold text-white">{toToken.symbol}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                </button>
              </div>
            </div>

            {rate && (
              <div className="px-4 py-3 border-t border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-white/30">Rate</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-white/60">{rate}</span>
                    <button onClick={getQuote} className="text-white/30 hover:text-green-400 transition-colors">
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-white/30">{t('swap.slippageTolerance')}</span>
                  <span className="text-[11px] text-white/60">{effectiveSlippage}%</span>
                </div>
                {toAmount && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/30">{t('swap.minimumReceived')}</span>
                    <span className="text-[11px] text-white/60">
                      {(parseFloat(toAmount) * (1 - effectiveSlippage / 100)).toFixed(6)} {toToken.symbol}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-white/30">Network</span>
                  <div className="flex items-center gap-1">
                    <img src={selectedChain.logo} alt="" className="w-3 h-3 rounded-full" />
                    <span className="text-[11px] text-white/60">{selectedChain.name}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4">
            {!hasWallet ? (
              <Button
                onClick={() => window.location.href = '/'}
                className="w-full h-13 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-sm border-0"
              >
                {t('swap.connectWallet')}
              </Button>
            ) : (
              <Button
                onClick={executeSwap}
                disabled={!canSwap}
                className="w-full h-13 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-sm border-0 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isSwapping ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isApproving ? t('swap.approving') : t('swap.swapping')}
                  </div>
                ) : !walletReady ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading wallet...
                  </div>
                ) : !fromAmount || parseFloat(fromAmount) <= 0 ? (
                  t('swap.enterAmount')
                ) : isQuoting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Getting quote...
                  </div>
                ) : !toAmount ? (
                  "Insufficient liquidity"
                ) : (
                  `${t('swap.swapTokens')} ${fromToken.symbol} → ${toToken.symbol}`
                )}
              </Button>
            )}
          </div>

          {txStatus !== "idle" && (
            <div className={`mt-4 p-4 rounded-2xl border ${
              txStatus === "success" ? "bg-emerald-500/8 border-emerald-500/15" :
              txStatus === "error" ? "bg-red-500/8 border-red-500/15" :
              "bg-white/[0.02] border-white/8"
            }`}>
              <div className="flex items-center gap-2">
                {txStatus === "pending" && <Loader2 className="w-4 h-4 text-green-400 animate-spin" />}
                {txStatus === "approving" && <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />}
                {txStatus === "success" && <Check className="w-4 h-4 text-emerald-400" />}
                {txStatus === "error" && <AlertTriangle className="w-4 h-4 text-red-400" />}
                <span className={`text-xs font-semibold ${
                  txStatus === "success" ? "text-emerald-300" :
                  txStatus === "error" ? "text-red-300" :
                  txStatus === "approving" ? "text-amber-300" :
                  "text-white/70"
                }`}>
                  {txStatus === "pending" && "Transaction pending..."}
                  {txStatus === "approving" && "Approving token..."}
                  {txStatus === "success" && "Swap successful!"}
                  {txStatus === "error" && t('common.error')}
                </span>
              </div>
              {txError && <p className="text-[11px] text-red-300/60 mt-2 break-all">{txError}</p>}
              {txHash && (
                <a
                  href={`${selectedChain.explorerUrl}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 mt-2 text-[11px] text-green-400/70 hover:text-green-400 transition-colors"
                >
                  View on Explorer <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-2">
            <Info className="w-3 h-3 text-white/15" />
            <span className="text-[10px] text-white/15">Trades are executed on-chain via decentralized liquidity pools</span>
          </div>
        </div>
      </div>

      {showFromSelector && (
        <TokenSelectorModal
          exclude={toToken}
          onSelect={(t) => setFromToken(t)}
          onClose={() => { setShowFromSelector(false); setTokenSearch(""); }}
        />
      )}
      {showToSelector && (
        <TokenSelectorModal
          exclude={fromToken}
          onSelect={(t) => setToToken(t)}
          onClose={() => { setShowToSelector(false); setTokenSearch(""); }}
        />
      )}
      {showChainSelector && <ChainSelectorModal />}
    </div>
  );
}
