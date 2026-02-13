declare global {
  interface Window {
    ethereum?: any;
  }
}

export const connectWallet = async (): Promise<string | null> => {
  if (typeof window === 'undefined') {
    throw new Error('Browser environment not detected.');
  }
  
  if (!window.ethereum) {
    throw new Error('MetaMask wallet not found. Please install MetaMask and refresh the page.');
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (accounts.length === 0) {
      throw new Error('No account selected.');
    }

    // Switch to Ethereum mainnet if not already
    await switchToMainnet();

    return accounts[0];
  } catch (error: any) {
    
    if (error.code === 4001) {
      throw new Error('User rejected wallet connection.');
    } else if (error.code === -32603) {
      throw new Error('MetaMask internal error. Please restart MetaMask or refresh the page.');
    } else if (error.code === -32002) {
      throw new Error('MetaMask already open. Please check MetaMask popup.');
    }
    throw new Error(`MetaMask error: ${error.message || 'Unknown error'}`);
  }
};

export const switchToMainnet = async (): Promise<void> => {
  if (!window.ethereum) return;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x1' }], // Ethereum mainnet
    });
  } catch (switchError: any) {
    // Chain might not be added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x1',
              chainName: 'Ethereum Mainnet',
              nativeCurrency: {
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://mainnet.infura.io/v3/'],
              blockExplorerUrls: ['https://etherscan.io/'],
            },
          ],
        });
      } catch (addError) {
        throw new Error('Could not switch to Ethereum network.');
      }
    } else {
      throw new Error('Could not switch to Ethereum network.');
    }
  }
};

export const getBalance = async (address: string): Promise<string> => {
  if (!window.ethereum) {
    throw new Error('MetaMask not found.');
  }

  try {
    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    });

    // Convert from wei to ether
    const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
    return balanceInEth.toFixed(4);
  } catch (error) {
    return '0.0000';
  }
};

export const sendTransaction = async (
  to: string,
  amount: string
): Promise<string> => {
  if (!window.ethereum) {
    throw new Error('MetaMask not found.');
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });

    if (accounts.length === 0) {
      throw new Error('Wallet not connected.');
    }

    // Convert amount to wei
    const amountInWei = '0x' + (parseFloat(amount) * Math.pow(10, 18)).toString(16);

    const transactionHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: accounts[0],
          to: to,
          value: amountInWei,
        },
      ],
    });

    return transactionHash;
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected transaction.');
    }
    throw new Error('Transaction failed.');
  }
};

export const getTransactionStatus = async (txHash: string): Promise<string> => {
  if (!window.ethereum) {
    throw new Error('MetaMask not found.');
  }

  try {
    const receipt = await window.ethereum.request({
      method: 'eth_getTransactionReceipt',
      params: [txHash],
    });

    if (!receipt) {
      return 'pending';
    }

    return receipt.status === '0x1' ? 'success' : 'failed';
  } catch (error) {
    console.error('Failed to get transaction status:', error);
    return 'unknown';
  }
};
