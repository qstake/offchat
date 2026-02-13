import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Send, QrCode, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  sendTokenTransaction,
  getAllWalletNetworks,
  getSupportedTokens,
  getCurrentWalletNetwork,
  type NetworkConfig,
  type TokenConfig
} from "@/lib/walletconnect";

interface WalletSectionProps {
  walletAddress: string | null;
  balance: string;
  isConnected: boolean;
  onConnect?: () => Promise<void>;
  onDisconnect: () => void;
}

export default function WalletSection({
  walletAddress,
  balance,
  isConnected,
  onConnect,
  onDisconnect
}: WalletSectionProps) {
  const [sendAmount, setSendAmount] = useState("");
  const [sendAddress, setSendAddress] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [availableNetworks, setAvailableNetworks] = useState<NetworkConfig[]>([]);
  const [availableTokens, setAvailableTokens] = useState<TokenConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();

  // Load networks and current network on mount
  useEffect(() => {
    if (isConnected) {
      const networks = getAllWalletNetworks();
      setAvailableNetworks(networks);
      const current = getCurrentWalletNetwork();
      setSelectedNetwork(current.id);
    }
  }, [isConnected]);

  // Load tokens when network changes
  useEffect(() => {
    if (selectedNetwork) {
      const tokens = getSupportedTokens(selectedNetwork);
      // Sort tokens to prioritize OFFC at the top
      const sortedTokens = tokens.sort((a, b) => {
        if (a.symbol === 'OFFC') return -1;
        if (b.symbol === 'OFFC') return 1;
        return 0;
      });
      setAvailableTokens(sortedTokens);
      // Auto-select first token (which will be OFFC if available)
      if (sortedTokens.length > 0) {
        setSelectedToken(sortedTokens[0].symbol);
      }
    }
  }, [selectedNetwork]);

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast({
        title: t('wallet.addressCopied'),
        description: t('wallet.addressCopiedDesc'),
      });
    }
  };

  const handleSendCrypto = async () => {
    if (!sendAmount || !sendAddress || !selectedNetwork || !selectedToken) {
      toast({
        title: t('common.error'),
        description: t('wallet.pleaseEnterDetails'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Basic validation
      if (isNaN(parseFloat(sendAmount)) || parseFloat(sendAmount) <= 0) {
        toast({
          title: t('common.error'),
          description: t('wallet.enterValidAmount'),
          variant: "destructive",
        });
        return;
      }

      if (!sendAddress.startsWith('0x') || sendAddress.length !== 42) {
        toast({
          title: t('common.error'),
          description: t('wallet.enterValidAddress'),
          variant: "destructive",
        });
        return;
      }

      // Find the selected token configuration
      const tokenConfig = availableTokens.find(token => token.symbol === selectedToken);
      if (!tokenConfig) {
        toast({
          title: t('common.error'),
          description: t('wallet.invalidToken'),
          variant: "destructive",
        });
        return;
      }

      // Send crypto transaction with network and token selection
      const txHash = await sendTokenTransaction(
        sendAddress, 
        sendAmount, 
        tokenConfig, 
        selectedNetwork
      );
      
      toast({
        title: t('wallet.transactionSent'),
        description: t('wallet.transactionSentDesc', { amount: sendAmount, token: selectedToken, tx: txHash.slice(0, 10) }),
      });
      
      setSendAmount("");
      setSendAddress("");
    } catch (error: any) {
      toast({
        title: t('wallet.transactionFailed'),
        description: error.message || t('wallet.cryptoSendFailed'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-4 border-b border-green-500/20">
        <div className="bg-black/60 border border-green-500/30 rounded-lg p-4 text-center backdrop-blur-sm">
          <Wallet className="w-8 h-8 mx-auto mb-3 text-green-400" />
          <p className="text-sm text-green-300/80 mb-3 font-mono">
            {t('wallet.walletDisconnected')}
          </p>
          {onConnect && (
            <Button
              onClick={onConnect}
              className="w-full bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30 font-mono shadow-md shadow-green-500/20"
              data-testid="button-connect-wallet"
            >
              {t('wallet.connectWallet')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-b border-green-500/20">
      <div className="bg-black/60 border border-green-500/30 rounded-lg p-3 backdrop-blur-sm shadow-lg shadow-green-500/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-green-400 font-mono font-semibold">{t('wallet.walletTerminal')}</span>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-400/50" />
            <Button
              size="sm"
              variant="ghost"
              onClick={onDisconnect}
              className="text-xs text-green-300/70 hover:text-green-400 font-mono"
              data-testid="button-disconnect-wallet"
            >
              {t('wallet.disconnect')}
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mb-2">
          <div className="text-xs text-green-300/70 font-mono flex-1 truncate" data-testid="text-wallet-address">
            {t('wallet.address')}: <code className="text-green-400 bg-green-500/10 px-1 rounded border border-green-500/20">{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</code>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyAddress}
            className="p-1 h-auto bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
            data-testid="button-copy-address"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-xs text-green-300/70 font-mono">{t('wallet.balance')}:</span>
          <span className="text-lg font-bold text-green-400 font-mono shadow-sm shadow-green-400/30" data-testid="text-wallet-balance">
            {balance} ETH
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30 font-mono shadow-md shadow-green-500/20"
                data-testid="button-send-crypto"
              >
                <Send className="w-3 h-3 mr-1" />
                {t('wallet.send')}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border border-border">
              <DialogHeader>
                <DialogTitle className="text-primary font-mono">{t('wallet.sendCrypto')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="network" className="text-sm font-mono">{t('wallet.network')}</Label>
                  <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                    <SelectTrigger className="terminal-border bg-input font-mono" data-testid="select-network">
                      <SelectValue placeholder={t('wallet.selectNetwork')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableNetworks.map((network) => (
                        <SelectItem key={network.id} value={network.id}>
                          <div className="flex items-center gap-2">
                            {network.logoUrl && (
                              <img src={network.logoUrl} alt={network.symbol} className="w-4 h-4 rounded-full" />
                            )}
                            {network.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="token" className="text-sm font-mono">{t('wallet.tokens')}</Label>
                  <Select value={selectedToken} onValueChange={setSelectedToken}>
                    <SelectTrigger className="terminal-border bg-input font-mono" data-testid="select-token">
                      <SelectValue placeholder={t('wallet.selectToken')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTokens.map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          <div className="flex items-center gap-2">
                            {token.logoUrl && (
                              <img src={token.logoUrl} alt={token.symbol} className="w-4 h-4 rounded-full" />
                            )}
                            <span>{token.symbol}</span>
                            {token.symbol === 'OFFC' && <span className="text-xs text-primary">(Priority)</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount" className="text-sm font-mono">{t('wallet.amount')} ({selectedToken || t('wallet.tokens')})</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.001"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="0.000"
                    className="terminal-border bg-input font-mono"
                    data-testid="input-send-amount"
                  />
                </div>
                <div>
                  <Label htmlFor="address" className="text-sm font-mono">{t('wallet.recipientAddress')}</Label>
                  <Input
                    id="address"
                    value={sendAddress}
                    onChange={(e) => setSendAddress(e.target.value)}
                    placeholder="0x..."
                    className="terminal-border bg-input font-mono"
                    data-testid="input-recipient-address"
                  />
                </div>
                <Button
                  onClick={handleSendCrypto}
                  disabled={isLoading || !sendAmount || !sendAddress || !selectedNetwork || !selectedToken}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-mono"
                  data-testid="button-confirm-send"
                >
                  {isLoading ? t('wallet.sending') : `${t('wallet.send')} ${selectedToken || t('wallet.tokens')}`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-secondary/20 text-secondary-foreground border border-secondary/50 hover:bg-secondary/30 font-mono"
                data-testid="button-receive-crypto"
              >
                <QrCode className="w-3 h-3 mr-1" />
                {t('wallet.receive')}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border border-border">
              <DialogHeader>
                <DialogTitle className="text-primary font-mono">{t('wallet.receiveCrypto')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-center">
                <div className="w-48 h-48 mx-auto bg-muted/20 border border-border rounded-lg flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-muted-foreground" />
                </div>
                <div>
                  <Label className="text-sm font-mono">{t('wallet.walletAddress')}</Label>
                  <div className="mt-2 p-2 bg-input rounded border border-border font-mono text-xs break-all">
                    {walletAddress}
                  </div>
                </div>
                <Button
                  onClick={handleCopyAddress}
                  className="w-full bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 font-mono"
                  data-testid="button-copy-receive-address"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {t('wallet.copyAddress')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
