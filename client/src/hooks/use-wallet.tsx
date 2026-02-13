import { useState, useEffect, useCallback } from "react";
import { 
  getWalletConnectBalance, 
  clearStoredWallet, 
  sendWalletConnectTransaction, 
  performWalletMaintenance
} from "@/lib/walletconnect";
import { useToast } from "@/hooks/use-toast";

export function useWallet() {
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
    
    // Store in localStorage for persistence
    localStorage.setItem('walletAddress', address);
    localStorage.setItem('walletConnected', 'true');
    
    console.log('Wallet data set:', { address, walletBalance });
  }, []);

  const disconnectWallet = useCallback(async () => {
    // Clear stored wallet data
    clearStoredWallet();
    
    setWalletAddress(null);
    setBalance("0.00");
    setIsConnected(false);
    
    // Clear localStorage
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletConnected');
    
    toast({
      title: "Wallet Disconnected",
      description: "Wallet disconnected successfully.",
    });
    
    // Refresh page and redirect to create wallet
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
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

  // Check for existing wallet connection on mount
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

  // Custom wallet system handles account management

  // Refresh balance periodically and perform wallet maintenance
  useEffect(() => {
    if (isConnected && walletAddress) {
      const interval = setInterval(() => {
        refreshBalance();
        // Perform wallet maintenance check every time we refresh balance
        performWalletMaintenance();
      }, 30000); // Every 30 seconds
      
      // Also perform immediate maintenance check
      performWalletMaintenance();
      
      return () => clearInterval(interval);
    }
  }, [isConnected, walletAddress, refreshBalance]);

  return {
    walletAddress,
    balance,
    isConnected,
    setWalletData,
    disconnectWallet,
    refreshBalance,
    sendTransaction
  };
}
