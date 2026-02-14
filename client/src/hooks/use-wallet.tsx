import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { 
  getWalletConnectBalance, 
  clearStoredWallet, 
  sendWalletConnectTransaction, 
  performWalletMaintenance
} from "@/lib/walletconnect";
import { useToast } from "@/hooks/use-toast";

interface WalletContextValue {
  walletAddress: string | null;
  balance: string;
  isConnected: boolean;
  setWalletData: (address: string, walletBalance: string) => void;
  disconnectWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  sendTransaction: (params: { to: string; amount: string; token: string; network: string; }) => Promise<{ success: boolean; txHash?: string; error?: string; }>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(() => {
    const saved = localStorage.getItem('walletAddress');
    const connected = localStorage.getItem('walletConnected') === 'true';
    return (saved && connected) ? saved : null;
  });
  const [balance, setBalance] = useState<string>("0.00");
  const [isConnected, setIsConnected] = useState(() => {
    const saved = localStorage.getItem('walletAddress');
    const connected = localStorage.getItem('walletConnected') === 'true';
    return !!(saved && connected);
  });
  const { toast } = useToast();

  const setWalletData = useCallback((address: string, walletBalance: string) => {
    setWalletAddress(address);
    setBalance(walletBalance);
    setIsConnected(true);
    
    localStorage.setItem('walletAddress', address);
    localStorage.setItem('walletConnected', 'true');
    
    console.log('Wallet data set:', { address, walletBalance });
  }, []);

  const disconnectWallet = useCallback(async () => {
    clearStoredWallet();
    
    setWalletAddress(null);
    setBalance("0.00");
    setIsConnected(false);
    
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletConnected');
    
    toast({
      title: "Wallet Disconnected",
      description: "Wallet disconnected successfully.",
    });
  }, [toast]);

  const refreshBalance = useCallback(async () => {
    if (walletAddress) {
      try {
        const newBalance = await getWalletConnectBalance(walletAddress);
        setBalance(newBalance);
      } catch (error) {
        console.error('Failed to refresh balance:', error);
      }
    }
  }, [walletAddress]);

  const sendTransaction = useCallback(async (params: {
    to: string;
    amount: string;
    token: string;
    network: string;
  }) => {
    try {
      const txHash = await sendWalletConnectTransaction(
        params.to,
        params.amount,
        params.network
      );
      
      toast({
        title: "Transaction Sent",
        description: `${params.amount} ${params.token} sent successfully`,
      });

      return { success: true, txHash };
    } catch (error: any) {
      console.error('Transaction failed:', error);
      
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to send transaction",
        variant: "destructive",
      });

      return { success: false, error: error.message || "Transaction failed" };
    }
  }, [toast]);

  useEffect(() => {
    const checkExistingConnection = async () => {
      const savedAddress = localStorage.getItem('walletAddress');
      const wasConnected = localStorage.getItem('walletConnected') === 'true';
      
      if (savedAddress && wasConnected) {
        try {
          console.log('Wallet found in localStorage, restoring connection:', savedAddress);
          setWalletAddress(savedAddress);
          setIsConnected(true);
          
          try {
            const walletBalance = await getWalletConnectBalance(savedAddress);
            setBalance(walletBalance);
          } catch (balanceError) {
            console.warn('Could not fetch balance, using default:', balanceError);
          }
        } catch (error) {
          console.error('Failed to restore wallet connection:', error);
        }
      }
    };

    checkExistingConnection();
  }, []);

  useEffect(() => {
    if (isConnected && walletAddress) {
      const interval = setInterval(() => {
        refreshBalance();
        performWalletMaintenance();
      }, 30000);
      
      performWalletMaintenance();
      
      return () => clearInterval(interval);
    }
  }, [isConnected, walletAddress, refreshBalance]);

  const value: WalletContextValue = {
    walletAddress,
    balance,
    isConnected,
    setWalletData,
    disconnectWallet,
    refreshBalance,
    sendTransaction
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
