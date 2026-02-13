import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import MessageBubble from "./message-bubble";
import UserAvatar from "./UserAvatar";
import { Menu, Send, DollarSign, MoreHorizontal, Plus, ImageIcon, Image, Wifi, WifiOff, Bluetooth, Users, Pin, X } from "lucide-react";
import type { Message } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { handleError, showSuccessMessage } from "@/lib/error-handler";
import { useLocation } from "wouter";
import { getMultiNetworkWalletBalance, getAllTokenBalances, getTokenBalance } from "@/lib/walletconnect";
import { useOfflineMode } from "@/hooks/use-offline-mode";
import { useTranslation } from 'react-i18next';

// Get current user data
function useCurrentUser(userId: string) {
  return useQuery({
    queryKey: ['/api/users', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    enabled: !!userId,
  });
}

interface ChatAreaProps {
  chatId: string;
  messages: Message[];
  typingUsers: string[];
  onSendMessage: (content: string, messageType?: string, transactionData?: any) => void;
  onToggleMobileMenu: () => void;
  isMobile: boolean;
  walletAddress: string | null;
  isWalletConnected: boolean;
  currentUserId: string;
  onMessageDeleted?: (messageId: string) => void;
  onChatDeleted?: () => void;
  onRefetchMessages?: () => void;
}

export default function ChatArea({
  chatId,
  messages,
  typingUsers,
  onSendMessage,
  onToggleMobileMenu,
  isMobile,
  walletAddress,
  isWalletConnected,
  currentUserId,
  onMessageDeleted,
  onRefetchMessages,
  onChatDeleted
}: ChatAreaProps) {
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const { t } = useTranslation();
  
  // Offline mode context
  const { 
    isOfflineMode, 
    isBluetoothConnected, 
    sendBluetoothMessage, 
    getConnectedPeers 
  } = useOfflineMode();

  // Unified send message handler for both online and offline modes
  const sendMessage = async (content: string, messageType?: string, transactionData?: any) => {
    if (isOfflineMode) {
      // Check if we have connected peers before sending
      if (!isBluetoothConnected || getConnectedPeers().length === 0) {
        toast({
          title: "No Bluetooth Peers",
          description: "Connect to a Bluetooth peer to send offline messages.",
          variant: "destructive",
        });
        return;
      }
      
      try {
        // Optimistically add message to chat UI
        onSendMessage(content, messageType, transactionData);
        
        // Send via Bluetooth
        await sendBluetoothMessage(content, chatId, messageType, transactionData);
        
        toast({
          title: "Message Sent",
          description: "Message sent via Bluetooth.",
        });
      } catch (error) {
        console.error('Bluetooth message sending failed:', error);
        toast({
          title: "Send Failed",
          description: "Failed to send message via Bluetooth. Check your connection.",
          variant: "destructive",
        });
      }
    } else {
      // Send as regular online message
      onSendMessage(content, messageType, transactionData);
    }
  };
  const [sendAmount, setSendAmount] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState("OFFC-BSC");
  const [isLoading, setIsLoading] = useState(false);
  const [cryptoBalances, setCryptoBalances] = useState<{[key: string]: {balance: string, valueUSD: string}}>({});
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isMediaUploadOpen, setIsMediaUploadOpen] = useState(false);
  const [isNftPickerOpen, setIsNftPickerOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isVirtualKeyboardOpen, setIsVirtualKeyboardOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { sendTransaction } = useWallet();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Load crypto balances for quick send
  useEffect(() => {
    const loadCryptoBalances = async () => {
      if (!walletAddress || !isWalletConnected) return;
      
      setIsLoadingBalances(true);
      try {
        const balances: {[key: string]: {balance: string, valueUSD: string}} = {};
        
        // Get network balances
        const networkBalances = await getMultiNetworkWalletBalance(walletAddress);
        
        for (const balance of networkBalances) {
          if (balance.symbol === 'ETH') {
            balances['ETH'] = {
              balance: balance.balance,
              valueUSD: balance.balanceUSD
            };
          } else if (balance.symbol === 'BNB') {
            balances['BNB'] = {
              balance: balance.balance,
              valueUSD: balance.balanceUSD
            };
          }
        }
        
        // Get OFFC token balance
        try {
          const offcBalance = await getTokenBalance(walletAddress, {
            address: '0xaf62c16e46238c14ab8eda78285feb724e7d4444',
            symbol: 'OFFC',
            name: 'Offchat Token',
            decimals: 18,
            logoUrl: '/logo.png'
          }, 'bsc');
          
          const offcPrice = 0.00005903; // Current price from DEXScreener
          const offcValueUSD = (parseFloat(offcBalance) * offcPrice).toFixed(2);
          
          balances['OFFC'] = {
            balance: parseFloat(offcBalance).toLocaleString(),
            valueUSD: offcValueUSD
          };
        } catch (error) {
          console.error('Failed to load OFFC balance:', error);
          balances['OFFC'] = {
            balance: '0',
            valueUSD: '0.00'
          };
        }
        
        setCryptoBalances(balances);
      } catch (error) {
        console.error('Failed to load crypto balances:', error);
      } finally {
        setIsLoadingBalances(false);
      }
    };

    loadCryptoBalances();
    
    // Refresh balances every 30 seconds
    const interval = setInterval(loadCryptoBalances, 30000);
    return () => clearInterval(interval);
  }, [walletAddress, isWalletConnected]);

  // Auto-resize textarea with mobile optimization
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, isMobile ? 120 : 200);
      textarea.style.height = newHeight + 'px';
      
      // Ensure input stays in view on mobile when virtual keyboard is open
      if (isMobile && isVirtualKeyboardOpen && document.activeElement === textarea) {
        setTimeout(() => {
          textarea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    }
  }, [messageInput, isMobile, isVirtualKeyboardOpen]);

  useEffect(() => {
    if (!isMobile) return;

    const vv = window.visualViewport;
    let rafId: number | null = null;
    let lastHeight = window.innerHeight;

    const updateHeight = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const h = vv ? vv.height : window.innerHeight;
        if (Math.abs(h - lastHeight) < 10) return;
        lastHeight = h;
        setViewportHeight(h);
        const keyboardOpen = vv ? (window.innerHeight - h > 100) : false;
        setIsVirtualKeyboardOpen(keyboardOpen);
        if (chatContainerRef.current) {
          chatContainerRef.current.style.height = `${h}px`;
        }
        if (keyboardOpen && scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      });
    };

    setViewportHeight(window.innerHeight);
    if (chatContainerRef.current) {
      chatContainerRef.current.style.height = `${window.innerHeight}px`;
    }

    if (vv) {
      vv.addEventListener('resize', updateHeight);
    }
    window.addEventListener('resize', updateHeight);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (vv) {
        vv.removeEventListener('resize', updateHeight);
      }
      window.removeEventListener('resize', updateHeight);
    };
  }, [isMobile]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const el = scrollAreaRef.current;
        el.scrollTop = el.scrollHeight;
      }
    };
    scrollToBottom();
    setTimeout(scrollToBottom, 50);
    setTimeout(scrollToBottom, 200);
    setTimeout(scrollToBottom, 500);
  }, [messages, messages.length]);

  // Find user by username in current chat
  const findUserByUsername = async (username: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/participants`);
      if (!response.ok) return null;
      const participants = await response.json();
      return participants.find((p: any) => p.username?.toLowerCase() === username.toLowerCase());
    } catch (error) {
      console.error('Error finding user:', error);
      return null;
    }
  };

  // Handle slash commands
  const handleSlashCommand = async (message: string): Promise<boolean> => {
    const trimmed = message.trim();
    
    // Check if it's a slash command
    if (!trimmed.startsWith('/')) return false;
    
    // Check if user has admin/owner permissions
    if (currentUserRole !== 'admin' && currentUserRole !== 'owner') {
      toast({
        title: "Permission Denied",
        description: "Only administrators and owners can use moderation commands.",
        variant: "destructive"
      });
      return true; // Command was recognized but not executed
    }
    
    // Check if it's a group chat (commands don't work in direct messages)
    if (!displayPartner.isGroup) {
      toast({
        title: "Invalid Command",
        description: "Moderation commands only work in group chats.",
        variant: "destructive"
      });
      return true;
    }
    
    // Parse kick command: /kick @username
    const kickMatch = trimmed.match(/^\/kick\s+@([a-zA-Z0-9_]+)\s*$/);
    if (kickMatch) {
      const username = kickMatch[1];
      const user = await findUserByUsername(username);
      
      if (!user) {
        toast({
          title: "User Not Found",
          description: `User @${username} was not found in this group.`,
          variant: "destructive"
        });
        return true;
      }
      
      if (user.id === currentUserId) {
        toast({
          title: "Invalid Action",
          description: "You cannot kick yourself.",
          variant: "destructive"
        });
        return true;
      }
      
      // Execute kick
      try {
        const response = await fetch(`/api/chats/${chatId}/kick`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user.id, 
            removedBy: currentUserId 
          })
        });
        
        if (!response.ok) throw new Error('Failed to kick user');
        
        toast({
          title: "User Kicked",
          description: `@${username} has been removed from the group.`,
        });
        
        // Refresh participants
        queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'participants'] });
        
      } catch (error) {
        toast({
          title: t('common.error'),
          description: "Failed to kick user. Please try again.",
          variant: "destructive"
        });
      }
      
      return true;
    }
    
    // Parse ban command: /ban @username
    const banMatch = trimmed.match(/^\/ban\s+@([a-zA-Z0-9_]+)\s*$/);
    if (banMatch) {
      const username = banMatch[1];
      const user = await findUserByUsername(username);
      
      if (!user) {
        toast({
          title: "User Not Found",
          description: `User @${username} was not found in this group.`,
          variant: "destructive"
        });
        return true;
      }
      
      if (user.id === currentUserId) {
        toast({
          title: "Invalid Action",
          description: "You cannot ban yourself.",
          variant: "destructive"
        });
        return true;
      }
      
      // Execute ban
      try {
        const response = await fetch(`/api/chats/${chatId}/ban`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user.id, 
            bannedBy: currentUserId,
            reason: `Banned via command by ${currentUser?.username}`
          })
        });
        
        if (!response.ok) throw new Error('Failed to ban user');
        
        toast({
          title: "User Banned",
          description: `@${username} has been banned from the group.`,
        });
        
        // Refresh participants
        queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'participants'] });
        
      } catch (error) {
        toast({
          title: t('common.error'),
          description: "Failed to ban user. Please try again.",
          variant: "destructive"
        });
      }
      
      return true;
    }
    
    // Command not recognized
    toast({
      title: "Unknown Command",
      description: "Available commands: /kick @username, /ban @username",
      variant: "destructive"
    });
    return true;
  };

  const handleSendMessage = async () => {
    if (messageInput.trim()) {
      const trimmedMessage = messageInput.trim();
      
      // Check if it's a slash command
      const isCommand = await handleSlashCommand(trimmedMessage);
      
      if (!isCommand) {
        // Send as regular message using unified handler
        await sendMessage(trimmedMessage);
      }
      
      // Clear input in both cases
      setMessageInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickSend = async () => {
    if (!sendAmount || parseFloat(sendAmount) <= 0 || !chatPartner?.walletAddress) return;
    
    setIsLoading(true);
    try {
      const amount = parseFloat(sendAmount);
      
      // Get wallet manager from window
      const walletManager = (window as any).walletManager;
      if (!walletManager) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      let txHash: string;
      
      // Parse selected crypto format: TOKEN-NETWORK (e.g., "OFFC-ETH", "ETH-ETH", "BNB-BSC")
      const [tokenSymbol, networkSymbol] = selectedCrypto.split('-');
      
      // Map network symbols to network IDs
      const networkMap: { [key: string]: string } = {
        'ETH': 'ethereum',
        'BSC': 'bsc', 
        'ARB': 'arbitrum',
        'POLY': 'polygon',
        'BASE': 'base',
        'OP': 'optimism'
      };
      
      const networkId = networkMap[networkSymbol] || 'ethereum';
      
      // Handle different token types
      if (tokenSymbol === 'OFFC') {
        // Send OFFC token (available on all networks)
        const offcTokenConfig = {
          address: '0xaf62c16e46238c14ab8eda78285feb724e7d4444',
          symbol: 'OFFC',
          name: 'Offchat Token',
          decimals: 18,
          logoUrl: '/logo.png'
        };
        txHash = await walletManager.sendTokenTransaction(
          chatPartner.walletAddress,
          amount.toString(),
          offcTokenConfig,
          networkId
        );
      } else if (tokenSymbol === 'ETH') {
        // Send ETH (native on ethereum, arbitrum, polygon, base, optimism)
        txHash = await walletManager.sendTransaction(
          chatPartner.walletAddress,
          amount.toString(),
          networkId
        );
      } else if (tokenSymbol === 'BNB') {
        // Send BNB (native on BSC)
        txHash = await walletManager.sendTransaction(
          chatPartner.walletAddress,
          amount.toString(),
          'bsc'
        );
      } else {
        throw new Error('Unsupported cryptocurrency type');
      }

      if (txHash) {
        // Send transaction message to chat
        const [tokenSymbol] = selectedCrypto.split('-');
        await sendMessage(
          `${amount} ${tokenSymbol} sent`,
          "crypto",
          {
            transactionHash: txHash,
            amount: amount,
            tokenSymbol: tokenSymbol,
            recipientAddress: chatPartner.walletAddress
          }
        );
        
        // Close dialog and reset form
        setIsQuickSendOpen(false);
        setSendAmount("");
        setSelectedCrypto("OFFC-BSC");
        
        // Show success message
        alert(`Transaction sent successfully! Hash: ${txHash.substring(0, 10)}...`);
      }
    } catch (error: any) {
      console.error('Quick send error:', error);
      const errorMessage = error.message || 'An error occurred during sending.';
      alert(`Send failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch current user data
  const { data: currentUser } = useCurrentUser(currentUserId);

  const deleteMessageMutation = useMutation({
    mutationFn: async ({ messageId, deleteForEveryone }: { messageId: string; deleteForEveryone: boolean }) => {
      await apiRequest('DELETE', `/api/messages/${messageId}`, { userId: currentUserId, deleteForEveryone });
    },
    onSuccess: (_, { messageId }) => {
      onMessageDeleted?.(messageId);
      queryClient.invalidateQueries({ queryKey: ['/api/messages', chatId] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
    },
    onError: (error) => {
      handleError(error, "Could not delete message. Please try again.");
    },
  });

  const deleteMessage = (messageId: string, deleteForEveryone: boolean = false) => {
    const confirmMsg = deleteForEveryone 
      ? 'Are you sure you want to delete this message for everyone? This cannot be undone.'
      : 'Are you sure you want to delete this message?';
    if (confirm(confirmMsg)) {
      deleteMessageMutation.mutate({ messageId, deleteForEveryone });
    }
  };

  // Fetch pinned messages for this chat
  const { data: pinnedMessages = [] } = useQuery({
    queryKey: ['/api/messages', chatId, 'pinned'],
    queryFn: async () => {
      const response = await fetch(`/api/messages/${chatId}/pinned`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!chatId,
  });

  const [showPinnedBanner, setShowPinnedBanner] = useState(true);
  const [pinnedBannerIndex, setPinnedBannerIndex] = useState(0);
  const [showPinnedList, setShowPinnedList] = useState(false);

  useEffect(() => {
    setShowPinnedBanner(true);
    setPinnedBannerIndex(0);
  }, [chatId]);

  useEffect(() => {
    if (pinnedMessages.length > 0) {
      setShowPinnedBanner(true);
      setPinnedBannerIndex((prev) => Math.min(prev, pinnedMessages.length - 1));
    }
  }, [pinnedMessages]);

  // Pin message mutation
  const pinMessageMutation = useMutation({
    mutationFn: async ({ messageId, isPinned }: { messageId: string; isPinned: boolean }) => {
      await apiRequest('PATCH', `/api/messages/${messageId}/pin`, { isPinned });
      return isPinned;
    },
    onSuccess: (isPinned) => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', chatId] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', chatId, 'pinned'] });
      if (isPinned) {
        setShowPinnedBanner(true);
        setPinnedBannerIndex(0);
      }
      onRefetchMessages?.();
      toast({
        title: isPinned ? "Message Pinned" : "Message Unpinned",
        description: isPinned ? "Message has been pinned to the top of the chat." : "Message has been unpinned.",
      });
    },
    onError: (error) => {
      handleError(error, "Could not update message pin status. Please try again.");
    },
  });

  const pinMessage = (messageId: string, isPinned: boolean) => {
    pinMessageMutation.mutate({ messageId, isPinned });
  };

  // Ban user mutation
  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      const response = await fetch(`/api/chats/${chatId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          bannedBy: currentUserId,
          reason: reason || 'Banned from group'
        })
      });
      if (!response.ok) throw new Error('Failed to ban user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'participants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages', chatId] });
      toast({
        title: "User Banned",
        description: "User has been banned from the group successfully.",
      });
    },
    onError: (error) => {
      handleError(error, "Could not ban user. Please try again.");
    },
  });

  // Delete all user messages mutation
  const deleteAllUserMessagesMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/chats/${chatId}/messages/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId: currentUserId })
      });
      if (!response.ok) throw new Error('Failed to delete user messages');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', chatId] });
      toast({
        title: "Messages Deleted",
        description: `Deleted ${data.deletedCount} messages successfully.`,
      });
    },
    onError: (error) => {
      handleError(error, "Could not delete user messages. Please try again.");
    },
  });

  const handleBanUser = (userId: string, username: string) => {
    if (confirm(`Are you sure you want to ban @${username} from this group? This will remove them and prevent them from rejoining.`)) {
      banUserMutation.mutate({ userId, reason: `Banned by ${currentUser?.username}` });
    }
  };

  const handleDeleteAllUserMessages = (userId: string, username: string) => {
    if (confirm(`Are you sure you want to delete ALL messages from @${username}? This action cannot be undone.`)) {
      deleteAllUserMessagesMutation.mutate(userId);
    }
  };

  // Delete chat mutation
  const deleteChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to delete chat: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }
      return response.json();
    },
    onSuccess: (data, chatId) => {
      toast({
        title: "Chat Deleted",
        description: "Chat deleted successfully.",
      });
      
      // Comprehensive cache invalidation
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.removeQueries({ queryKey: ['/api/chats', chatId] });
      queryClient.removeQueries({ queryKey: ['/api/messages', chatId] });
      queryClient.removeQueries({ queryKey: ['/api/chats', chatId, 'partner'] });
      
      // Force immediate refetch
      queryClient.refetchQueries({ queryKey: ['/api/chats', currentUserId] });
      
      // Navigate away from deleted chat
      onChatDeleted?.();
      setLocation('/');
    },
    onError: (error) => {
      console.error('Error deleting chat:', error);
      toast({
        title: t('common.error'),
        description: "An error occurred while deleting the chat: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteChat = () => {
    if (confirm('Are you sure you want to delete this chat completely? This action cannot be undone and all messages will be deleted.')) {
      deleteChatMutation.mutate(chatId);
    }
  };

  const handleViewProfile = () => {
    if (displayPartner.isGroup) {
      // Navigate to group profile
      setLocation(`/profile/group/${chatId}`);
    } else {
      // Navigate to user profile - need to get the other user's ID
      // For direct chats, we need to fetch the other participant
      if (chatPartner?.id) {
        setLocation(`/profile/user/${chatPartner.id}`);
      }
    }
  };

  const handleBlockUser = async () => {
    if (!chatPartner?.id || displayPartner.isGroup) return;
    
    if (confirm('Are you sure you want to block this user? They will not be able to send you messages.')) {
      try {
        const response = await fetch('/api/users/block', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            blockerId: currentUserId, 
            blockedId: chatPartner.id 
          })
        });
        
        if (!response.ok) throw new Error('Failed to block user');
        
        toast({
          title: "User Blocked",
          description: "User has been blocked successfully.",
        });
        
        // Refresh chats and navigate away
        queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
        setLocation('/chat');
      } catch (error) {
        console.error('Failed to block user:', error);
        toast({
          title: t('common.error'),
          description: "Failed to block user. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Fetch chat partner information
  const { data: chatPartner, isLoading: partnerLoading, error: partnerError } = useQuery({
    queryKey: ['/api/chats', chatId, 'partner', currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/chats/${chatId}/partner/${currentUserId}`);
      if (!response.ok) throw new Error('Failed to fetch chat partner');
      return response.json();
    },
    enabled: !!chatId && !!currentUserId,
  });

  // Get current user's role in this chat
  const { data: currentUserRole } = useQuery({
    queryKey: ['/api/chats', chatId, 'participants'],
    queryFn: async () => {
      const response = await fetch(`/api/chats/${chatId}/participants`);
      if (!response.ok) throw new Error('Failed to fetch chat participants');
      const participants = await response.json();
      const currentParticipant = participants.find((p: any) => p.id === currentUserId);
      return currentParticipant?.role || 'member';
    },
    enabled: !!chatId && !!currentUserId,
  });

  // Fetch blocked users to check if current chat partner is blocked
  const { data: blockedUsers = [] } = useQuery({
    queryKey: ['/api/users', currentUserId, 'blocked'],
    queryFn: async () => {
      const response = await fetch(`/api/users/${currentUserId}/blocked`);
      if (!response.ok) throw new Error('Failed to fetch blocked users');
      return response.json();
    },
    enabled: !!currentUserId,
  });

  // Safe default values
  const displayPartner = {
    isGroup: false,
    username: "Loading...",
    name: "Loading...",
    avatar: null,
    isOnline: false,
    participantCount: 0,
    ...chatPartner
  };

  // Check if current chat partner is blocked
  const isPartnerBlocked = chatPartner && !chatPartner.isGroup && blockedUsers.some((blocked: any) => blocked.id === chatPartner.userId);

  return (
    <div 
      ref={chatContainerRef}
      className={`flex flex-col overflow-hidden ${isMobile ? 'chat-container' : 'h-full'}`}
      style={isMobile ? { height: `${viewportHeight || window.innerHeight}px`, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10 } : undefined}
    >
      {/* Professional Mobile Header - Always Visible on Mobile */}
      {isMobile && (<>
        <div className="mobile-chat-header pt-safe">
          <div className="mobile-header-content">
            <button
              onClick={onToggleMobileMenu}
              className="mobile-menu-button text-green-400"
              data-testid="button-mobile-menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            
            <button 
              className="mobile-chat-partner cursor-pointer"
              role="button"
              aria-label={`View ${displayPartner.isGroup ? 'group' : 'user'} profile for ${displayPartner.isGroup ? (displayPartner.name || 'Group') : (displayPartner.username || 'Loading...')}`}
              onClick={() => {
                if (displayPartner.isGroup) {
                  setLocation(`/profile/group/${chatId}`);
                } else {
                  setLocation(`/profile/user/${displayPartner.id}`);
                }
              }}
            >
              <div className="mobile-avatar-container">
                {displayPartner.isGroup ? (
                  <div className={`mobile-avatar-wrapper ${displayPartner.isOnline ? 'online' : ''}`}>
                    <div className="mobile-avatar-inner">
                      {displayPartner.avatar && displayPartner.avatar.length > 1 ? (
                        <img 
                          src={displayPartner.avatar} 
                          alt="Group" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {displayPartner.avatar && displayPartner.avatar.length === 1 ? (
                            <span className="text-primary font-mono text-sm font-bold">{displayPartner.avatar}</span>
                          ) : (
                            <span className="text-primary text-sm">🔥</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={`mobile-avatar-wrapper ${displayPartner.isOnline ? 'online' : ''}`}>
                    <div className="mobile-avatar-inner">
                      <UserAvatar 
                        username={displayPartner.username} 
                        avatar={displayPartner.avatar}
                        size="sm"
                        className="w-full h-full"
                        isBlocked={isPartnerBlocked}
                      />
                    </div>
                    {!displayPartner.isGroup && displayPartner.isOnline && (
                      <div className="mobile-online-indicator" />
                    )}
                  </div>
                )}
              </div>
              
              <div className="mobile-text-container">
                <h3 className="mobile-partner-name" data-testid="text-mobile-chat-partner-name">
                  {displayPartner.isGroup ? (displayPartner.name || 'Group') : (displayPartner.username || 'Loading...')}
                </h3>
                <div className="mobile-partner-status">
                  {isOfflineMode ? (
                    <div className="mobile-offline-status" data-testid="text-mobile-offline-status">
                      <Bluetooth className="w-3 h-3" />
                      <span>
                        {isBluetoothConnected ? `${getConnectedPeers().length} peers` : 'No peers'}
                      </span>
                    </div>
                  ) : (
                    <span data-testid="text-mobile-chat-partner-status">
                      {displayPartner.isGroup 
                        ? `${displayPartner.participantCount || 0} members` 
                        : (displayPartner.isOnline ? "online" : "offline")
                      }
                    </span>
                  )}
                </div>
              </div>
            </button>
            
            <div className="flex items-center gap-2">
              <button
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-green-500/8 border border-green-500/15 text-green-400 hover:bg-green-500/15 hover:border-green-400/25 active:scale-95 transition-all duration-200 disabled:opacity-30"
                disabled={!isWalletConnected}
                onClick={() => setIsQuickSendOpen(true)}
                data-testid="button-mobile-crypto-send"
              >
                <DollarSign className="w-4 h-4" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-green-400/60 hover:text-green-400 hover:bg-white/5 active:scale-95 transition-all duration-200"
                    data-testid="button-mobile-more-options"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  sideOffset={8}
                  className="w-44 bg-black/95 backdrop-blur-xl border-green-500/20 shadow-2xl shadow-black/50 rounded-xl"
                >
                  <DropdownMenuItem
                    className="text-xs text-green-300 hover:bg-green-500/15 focus:bg-green-500/15 cursor-pointer rounded-lg mx-1 my-0.5"
                    onClick={() => handleViewProfile()}
                  >
                    View Profile
                  </DropdownMenuItem>
                  {!displayPartner.isGroup && (
                    <DropdownMenuItem
                      className="text-xs text-orange-300 hover:bg-orange-500/15 focus:bg-orange-500/15 cursor-pointer rounded-lg mx-1 my-0.5"
                      onClick={() => handleBlockUser()}
                    >
                      Block User
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-xs text-red-300 hover:bg-red-500/15 focus:bg-red-500/15 cursor-pointer rounded-lg mx-1 my-0.5"
                    onClick={() => handleDeleteChat()}
                    disabled={deleteChatMutation.isPending}
                  >
                    {deleteChatMutation.isPending ? "Deleting..." : "Delete Chat"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        
        {/* Mobile Pinned Message Banner - Fixed below mobile header */}
        {pinnedMessages.length > 0 && showPinnedBanner && (
          <div className="mobile-pinned-banner px-3 py-1.5 bg-black/80 border-b border-green-500/20 backdrop-blur-sm flex items-center gap-2 cursor-pointer"
            onClick={() => {
              const currentPinned = pinnedMessages[pinnedBannerIndex];
              if (currentPinned) {
                const el = document.querySelector(`[data-message-id="${currentPinned.id}"]`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el.classList.add('highlight-message');
                  setTimeout(() => el.classList.remove('highlight-message'), 2000);
                }
              }
              if (pinnedMessages.length > 1) {
                setPinnedBannerIndex((prev) => (prev + 1) % pinnedMessages.length);
              }
            }}
          >
            <Pin className="w-3.5 h-3.5 text-green-400 fill-green-400 flex-shrink-0" />
            <div className="w-0.5 h-6 bg-green-500/50 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-mono text-green-400/70 leading-tight">
                Pinned {pinnedMessages.length > 1 ? `${pinnedBannerIndex + 1}/${pinnedMessages.length}` : 'Message'}
              </p>
              <p className="text-[11px] text-foreground/80 truncate leading-tight">
                {(() => {
                  const msg = pinnedMessages[pinnedBannerIndex];
                  if (!msg) return '';
                  if (msg.content?.includes('/objects/') || msg.content?.startsWith('http')) return 'Media';
                  return msg.content?.length > 40 ? msg.content.substring(0, 40) + '...' : msg.content;
                })()}
              </p>
            </div>
            {pinnedMessages.length > 1 && (
              <button
                className="flex-shrink-0 px-2 py-1 rounded text-[9px] font-mono text-green-400 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPinnedList(true);
                }}
              >
                {pinnedMessages.length} Pins
              </button>
            )}
            <button 
              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                setShowPinnedBanner(false);
              }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </>)}

      {/* Blocked User Banner */}
      {isPartnerBlocked && (
        <div className={`p-3 bg-red-500/20 border-b border-red-500/30 text-center ${isMobile ? 'mt-20' : ''}`}>
          <p className="text-red-400 text-sm font-mono">
            🚫 This user is blocked. You cannot send messages to blocked users.
          </p>
        </div>
      )}
      
      {/* Desktop Chat Header */}
      <div className={`px-5 py-3 border-b border-green-500/10 bg-gradient-to-r from-black/60 via-green-950/20 to-black/60 backdrop-blur-md ${isMobile ? 'hidden' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div 
              className="relative cursor-pointer group"
              onClick={() => {
                if (displayPartner.isGroup) {
                  setLocation(`/profile/group/${chatId}`);
                } else {
                  setLocation(`/profile/user/${displayPartner.id}`);
                }
              }}
            >
              {displayPartner.isGroup ? (
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-green-500/30 to-emerald-700/40 border border-green-500/25 group-hover:border-green-400/50 transition-all duration-200 shadow-lg shadow-green-900/20">
                  {displayPartner.avatar && displayPartner.avatar.length > 1 ? (
                    <img src={displayPartner.avatar} alt="Group" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-green-300 text-sm font-medium">{displayPartner.avatar && displayPartner.avatar.length === 1 ? displayPartner.avatar : '👥'}</span>
                    </div>
                  )}
                </div>
              ) : (
                <UserAvatar 
                  username={displayPartner.username} 
                  avatar={displayPartner.avatar}
                  size="sm"
                  className="w-10 h-10 rounded-xl group-hover:ring-2 group-hover:ring-green-400/30 transition-all duration-200 shadow-lg shadow-green-900/20"
                  isBlocked={isPartnerBlocked}
                />
              )}
              {!displayPartner.isGroup && displayPartner.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-black shadow-lg shadow-emerald-500/50" />
              )}
            </div>
            <div 
              className="cursor-pointer group"
              onClick={() => {
                if (displayPartner.isGroup) {
                  setLocation(`/profile/group/${chatId}`);
                } else {
                  setLocation(`/profile/user/${displayPartner.id}`);
                }
              }}
            >
              <h2 className="font-semibold text-[14px] text-green-50 leading-tight tracking-tight group-hover:text-green-300 transition-colors" data-testid="text-chat-partner-name">
                {displayPartner.isGroup ? (displayPartner.name || 'Group') : (displayPartner.username || 'Loading...')}
              </h2>
              <p className="text-[11px] text-green-400/70 leading-tight mt-0.5 font-mono tracking-wide" data-testid="text-chat-partner-status">
                {isOfflineMode ? (
                  <span className="text-blue-400 flex items-center gap-1">
                    <Bluetooth className="w-3 h-3" />
                    {isBluetoothConnected ? `${getConnectedPeers().length} peers` : 'No peers'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    {!displayPartner.isGroup && displayPartner.isOnline && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                    {displayPartner.isGroup 
                      ? `${displayPartner.participantCount || 0} members` 
                      : (displayPartner.isOnline ? "online" : "offline")
                    }
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center text-green-400 bg-green-500/8 border border-green-500/15 hover:bg-green-500/15 hover:border-green-400/30 active:scale-95 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
              disabled={!isWalletConnected}
              onClick={() => setIsQuickSendOpen(true)}
              data-testid="button-crypto-send"
            >
              <DollarSign className="w-4 h-4" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-green-400/60 hover:text-green-400 hover:bg-white/5 active:scale-95 transition-all duration-200"
                  data-testid="button-more-options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                sideOffset={8}
                className="w-44 bg-black/95 backdrop-blur-xl border-green-500/20 shadow-2xl shadow-black/50 rounded-xl"
              >
                <DropdownMenuItem
                  className="text-xs text-green-300 hover:bg-green-500/15 focus:bg-green-500/15 cursor-pointer rounded-lg mx-1 my-0.5"
                  onClick={() => handleViewProfile()}
                >
                  View Profile
                </DropdownMenuItem>
                {!displayPartner.isGroup && (
                  <DropdownMenuItem
                    className="text-xs text-orange-300 hover:bg-orange-500/15 focus:bg-orange-500/15 cursor-pointer rounded-lg mx-1 my-0.5"
                    onClick={() => handleBlockUser()}
                    data-testid="button-block-user"
                  >
                    Block User
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-xs text-red-300 hover:bg-red-500/15 focus:bg-red-500/15 cursor-pointer rounded-lg mx-1 my-0.5"
                  onClick={() => handleDeleteChat()}
                  disabled={deleteChatMutation.isPending}
                >
                  {deleteChatMutation.isPending ? "Deleting..." : "Delete Chat"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Desktop Pinned Message Banner - Telegram Style */}
      {!isMobile && pinnedMessages.length > 0 && showPinnedBanner && (
        <div className="px-3 py-2 bg-black/60 border-b border-primary/20 backdrop-blur-sm flex items-center gap-3 cursor-pointer hover:bg-black/70 transition-colors"
          onClick={() => {
            const currentPinned = pinnedMessages[pinnedBannerIndex];
            if (currentPinned) {
              const el = document.querySelector(`[data-message-id="${currentPinned.id}"]`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('highlight-message');
                setTimeout(() => el.classList.remove('highlight-message'), 2000);
              }
            }
            if (pinnedMessages.length > 1) {
              setPinnedBannerIndex((prev) => (prev + 1) % pinnedMessages.length);
            }
          }}
        >
          <div className="flex items-center gap-2 flex-shrink-0">
            <Pin className="w-4 h-4 text-primary fill-primary" />
            <div className="w-0.5 h-8 bg-primary/60 rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono text-primary/70 leading-tight">
              Pinned Message {pinnedMessages.length > 1 ? `${pinnedBannerIndex + 1}/${pinnedMessages.length}` : ''}
            </p>
            <p className="text-xs text-foreground/90 truncate leading-tight mt-0.5">
              {(() => {
                const msg = pinnedMessages[pinnedBannerIndex];
                if (!msg) return '';
                if (msg.content?.includes('/objects/') || msg.content?.startsWith('http')) return 'Media';
                return msg.content?.length > 60 ? msg.content.substring(0, 60) + '...' : msg.content;
              })()}
            </p>
          </div>
          {pinnedMessages.length > 1 && (
            <button
              className="flex-shrink-0 px-2 py-1 rounded text-[10px] font-mono text-green-400 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20"
              onClick={(e) => {
                e.stopPropagation();
                setShowPinnedList(true);
              }}
            >
              {pinnedMessages.length} Pins
            </button>
          )}
          <button 
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowPinnedBanner(false);
            }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div 
        ref={scrollAreaRef}
        className={`${isMobile ? `chat-messages p-3 pt-2 pb-2${pinnedMessages.length > 0 && showPinnedBanner ? ' has-pinned-banner' : ''}` : 'flex-1 p-4'} overflow-y-auto scrollbar-thin`}
      >
        <div className="space-y-3">
          {!isMobile && pinnedMessages.length > 0 && showPinnedBanner && (
            <div className="h-1" />
          )}
          {messages.map((message: any) => {
            const isOwn = message.senderId === currentUserId;
            return (
              <div key={message.id} data-message-id={message.id}>
                <MessageBubble
                  message={message}
                  isOwn={isOwn}
                  partnerAvatar={isOwn ? currentUser?.avatar : (displayPartner.avatar || message.senderAvatar)}
                  currentUserAvatar={currentUser?.avatar}
                  senderUsername={isOwn ? currentUser?.username : (displayPartner.username || message.senderUsername)}
                  currentUsername={currentUser?.username}
                  senderRole={message.senderRole}
                  currentUserRole={currentUserRole}
                  onDeleteMessage={deleteMessage}
                  onPinMessage={pinMessage}
                  onBanUser={handleBanUser}
                  onDeleteAllUserMessages={handleDeleteAllUserMessages}
                  chatId={chatId}
                />
              </div>
            );
          })}
          
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 px-1">
              <UserAvatar 
                username={displayPartner.username} 
                avatar={displayPartner.avatar}
                size="sm"
                className="flex-shrink-0 w-6 h-6"
              />
              <div className="bg-white/5 rounded-full px-3 py-1.5 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" style={{animationDelay: '0ms'}} />
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" style={{animationDelay: '150ms'}} />
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" style={{animationDelay: '300ms'}} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className={`
        ${isMobile ? 'pb-safe' : ''} 
        p-2 border-t border-green-900/40 bg-black/60 backdrop-blur-sm flex-shrink-0
      `}>
        <div className={`
          flex items-end gap-1.5 rounded-2xl bg-white/[0.04] border border-green-900/30 
          transition-all duration-200 px-2
          ${isInputFocused ? 'border-green-500/40 bg-white/[0.06]' : ''}
          ${isPartnerBlocked ? 'opacity-40 pointer-events-none' : ''}
        `}>
          <div className="flex items-center gap-0.5 py-1.5">
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center text-green-400/60 hover:text-green-400 hover:bg-green-500/10 active:scale-90 transition-all touch-manipulation"
              onClick={() => !isPartnerBlocked && setIsMediaUploadOpen(true)}
              disabled={isPartnerBlocked}
              data-testid="button-media-upload"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center text-green-400/60 hover:text-green-400 hover:bg-green-500/10 active:scale-90 transition-all touch-manipulation disabled:opacity-30"
              onClick={() => !isPartnerBlocked && isWalletConnected && setIsNftPickerOpen(true)}
              disabled={!isWalletConnected || isPartnerBlocked}
              data-testid="button-nft-share"
            >
              <Image className="w-4 h-4" />
            </button>
          </div>

          <Textarea
            ref={textareaRef}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => {
              setIsInputFocused(true);
              if (isMobile) {
                setTimeout(() => {
                  textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 300);
              }
            }}
            onBlur={() => setIsInputFocused(false)}
            placeholder={isPartnerBlocked ? "Blocked" : t('chat.typeMessage')}
            className="flex-1 bg-transparent border-0 resize-none focus:outline-none focus:ring-0 text-sm text-foreground placeholder-muted-foreground/50 min-h-[36px] max-h-[100px] py-2 px-1"
            rows={1}
            disabled={isPartnerBlocked}
            data-testid="textarea-message-input"
          />

          <div className="py-1.5">
            <button
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 touch-manipulation ${
                messageInput.trim() && !isPartnerBlocked
                  ? 'bg-green-500 text-black hover:bg-green-400 shadow-lg shadow-green-500/25'
                  : 'text-green-400/30'
              }`}
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || isPartnerBlocked}
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Send Crypto Dialog */}
      <Dialog open={isQuickSendOpen} onOpenChange={setIsQuickSendOpen}>
        <DialogContent className="w-[90vw] max-w-md p-3 md:p-4 bg-black/95 backdrop-blur-xl border-green-500/30 shadow-2xl z-[100]">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm font-semibold text-center text-green-400">
              {t('chat.quickSend')}
            </DialogTitle>
            <DialogDescription className="text-center text-green-300/70 text-sm">
              Send cryptocurrency directly from the chat.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <div className="text-center bg-green-500/10 rounded-lg p-3 border border-green-500/20">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <UserAvatar 
                  username={displayPartner.username} 
                  avatar={displayPartner.avatar}
                  size="sm"
                />
                <div className="text-left">
                  <div className="text-xs font-medium text-green-400">
                    {displayPartner.username}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Recipient
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="crypto-amount" className="text-xs font-medium text-foreground">Amount</Label>
              <Input
                id="crypto-amount"
                type="number"
                step="0.001"
                placeholder="0.0"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                className="terminal-border bg-black/50 text-sm h-8 border-green-500/30 focus:border-green-500 text-green-400"
              />
              {selectedCrypto && cryptoBalances[selectedCrypto] && (
                <div className="text-xs text-green-300/70 flex justify-between">
                  <span>Available: {cryptoBalances[selectedCrypto].balance} {selectedCrypto}</span>
                  <span>${cryptoBalances[selectedCrypto].valueUSD}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="crypto-type" className="text-xs font-medium text-foreground">Cryptocurrency</Label>
              <Select value={selectedCrypto} onValueChange={(value) => {
                console.log('Crypto selected:', value);
                setSelectedCrypto(value);
              }}>
                <SelectTrigger className="terminal-border bg-black/70 text-sm h-8 border-green-500/40 focus:border-green-500 cursor-pointer hover:border-green-500/60 transition-colors">
                  <SelectValue placeholder="Select cryptocurrency">
                    <div className="flex items-center gap-2">
                      {selectedCrypto.startsWith('OFFC') && <img src="/logo.png" alt="OFFC" className="w-4 h-4 rounded-full" />}
                      {selectedCrypto.startsWith('ETH') && <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/1027.png" alt="ETH" className="w-4 h-4 rounded-full" />}
                      {selectedCrypto.startsWith('BNB') && <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/1839.png" alt="BNB" className="w-4 h-4 rounded-full" />}
                      <span>{selectedCrypto.split('-')[0]} ({selectedCrypto.split('-')[1]})</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent 
                  className="bg-black/95 border-green-500/40 backdrop-blur-xl shadow-2xl"
                  position="popper"
                  sideOffset={8}
                  style={{ zIndex: 99999 }}
                >
                  {/* 1. OFFC Token (priority) */}
                  <SelectItem value="OFFC-BSC" className="text-green-400 hover:bg-green-500/30 focus:bg-green-500/30 cursor-pointer py-3 px-4 text-sm font-medium">
                    <div className="flex items-center gap-3 w-full">
                      <div className="relative">
                        <img src="/logo.png" alt="OFFC" className="w-5 h-5 rounded-full" />
                        <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/1839.png" alt="BSC" className="w-3 h-3 rounded-full absolute -bottom-0.5 -right-0.5 border border-black" />
                      </div>
                      <span>OFFC - BSC</span>
                    </div>
                  </SelectItem>
                  
                  {/* 2. BNB */}
                  <SelectItem value="BNB-BSC" className="text-green-400 hover:bg-green-500/30 focus:bg-green-500/30 cursor-pointer py-3 px-4 text-sm font-medium">
                    <div className="flex items-center gap-3 w-full">
                      <div className="relative">
                        <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/1839.png" alt="BNB" className="w-5 h-5 rounded-full" />
                      </div>
                      <span>BNB - BSC</span>
                    </div>
                  </SelectItem>
                  
                  {/* 3. ETH - Ethereum */}
                  <SelectItem value="ETH-ETH" className="text-green-400 hover:bg-green-500/30 focus:bg-green-500/30 cursor-pointer py-3 px-4 text-sm font-medium">
                    <div className="flex items-center gap-3 w-full">
                      <div className="relative">
                        <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/1027.png" alt="ETH" className="w-5 h-5 rounded-full" />
                        <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/1027.png" alt="Ethereum" className="w-3 h-3 rounded-full absolute -bottom-0.5 -right-0.5 border border-black" />
                      </div>
                      <span>ETH - Ethereum</span>
                    </div>
                  </SelectItem>
                  
                  {/* 4. ETH - Arbitrum */}
                  <SelectItem value="ETH-ARB" className="text-green-400 hover:bg-green-500/30 focus:bg-green-500/30 cursor-pointer py-3 px-4 text-sm font-medium">
                    <div className="flex items-center gap-3 w-full">
                      <div className="relative">
                        <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/1027.png" alt="ETH" className="w-5 h-5 rounded-full" />
                        <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/11841.png" alt="Arbitrum" className="w-3 h-3 rounded-full absolute -bottom-0.5 -right-0.5 border border-black" />
                      </div>
                      <span>ETH - Arbitrum</span>
                    </div>
                  </SelectItem>
                  
                  {/* 5. ETH - Polygon */}
                  <SelectItem value="ETH-POLY" className="text-green-400 hover:bg-green-500/30 focus:bg-green-500/30 cursor-pointer py-3 px-4 text-sm font-medium">
                    <div className="flex items-center gap-3 w-full">
                      <div className="relative">
                        <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/1027.png" alt="ETH" className="w-5 h-5 rounded-full" />
                        <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/3890.png" alt="Polygon" className="w-3 h-3 rounded-full absolute -bottom-0.5 -right-0.5 border border-black" />
                      </div>
                      <span>ETH - Polygon</span>
                    </div>
                  </SelectItem>
                  
                  {/* 6. ETH - Base */}
                  <SelectItem value="ETH-BASE" className="text-green-400 hover:bg-green-500/30 focus:bg-green-500/30 cursor-pointer py-3 px-4 text-sm font-medium">
                    <div className="flex items-center gap-3 w-full">
                      <div className="relative">
                        <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/1027.png" alt="ETH" className="w-5 h-5 rounded-full" />
                        <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/27716.png" alt="Base" className="w-3 h-3 rounded-full absolute -bottom-0.5 -right-0.5 border border-black" />
                      </div>
                      <span>ETH - Base</span>
                    </div>
                  </SelectItem>
                  
                  {/* 7. ETH - Optimism */}
                  <SelectItem value="ETH-OP" className="text-green-400 hover:bg-green-500/30 focus:bg-green-500/30 cursor-pointer py-3 px-4 text-sm font-medium">
                    <div className="flex items-center gap-3 w-full">
                      <div className="relative">
                        <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/1027.png" alt="ETH" className="w-5 h-5 rounded-full" />
                        <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/11840.png" alt="Optimism" className="w-3 h-3 rounded-full absolute -bottom-0.5 -right-0.5 border border-black" />
                      </div>
                      <span>ETH - Optimism</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-center p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="text-xs text-blue-400">
                {(() => {
                  const [token, network] = selectedCrypto.split('-');
                  const networkNames = {
                    'ETH': 'Ethereum',
                    'BSC': 'Binance Smart Chain',
                    'ARB': 'Arbitrum',
                    'POLY': 'Polygon',
                    'BASE': 'Base',
                    'OP': 'Optimism'
                  };
                  return `On ${networkNames[network as keyof typeof networkNames] || network} network sent with lowest fees`;
                })()}
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsQuickSendOpen(false)}
                className="flex-1 text-xs h-8 border-gray-500/50 hover:border-gray-400 text-gray-300 hover:text-gray-200"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleQuickSend}
                disabled={!sendAmount || parseFloat(sendAmount) <= 0 || isLoading}
                className="flex-1 bg-green-500 hover:bg-green-600 text-black font-medium text-xs h-8 shadow-lg"
              >
                {isLoading ? t('chat.sending') : t('common.send')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Media Upload Dialog */}
      <Dialog open={isMediaUploadOpen} onOpenChange={setIsMediaUploadOpen}>
        <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-xl border-green-500/30 text-green-400">
          <DialogHeader>
            <DialogTitle className="text-green-400 font-mono">Share Media</DialogTitle>
            <DialogDescription className="text-green-300/70 text-sm">
              Upload and share images or files in the chat.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={10485760}
              skipAclSetting={true}
              onGetUploadParameters={async () => {
                const response = await fetch('/api/objects/upload', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();
                return {
                  method: 'PUT' as const,
                  url: data.uploadURL,
                };
              }}
              onComplete={async (result) => {
                if (result.successful.length > 0) {
                  const uploadedFile = result.successful[0];
                  const rawURL = uploadedFile.uploadURL;
                  
                  if (rawURL) {
                    try {
                      // Set media ACL and get the normalized /objects/ path
                      const response = await fetch('/api/media/acl', {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          mediaURL: rawURL.split('?')[0],
                          ownerId: currentUserId,
                        }),
                      });

                      if (response.ok) {
                        const { objectPath } = await response.json();
                        // Send media message with normalized path
                        await sendMessage(objectPath || rawURL, 'media');
                      } else {
                        // Fallback to raw URL if ACL setting fails
                        await sendMessage(rawURL, 'media');
                      }
                    } catch (error) {
                      // Fallback to raw URL if error
                      await sendMessage(rawURL, 'media');
                    }
                  }
                  
                  setIsMediaUploadOpen(false);
                  
                  showSuccessMessage("Media Shared", "Your media has been shared successfully.");
                }
              }}
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>Upload Media</span>
              </div>
            </ObjectUploader>
          </div>
        </DialogContent>
      </Dialog>

      {/* NFT Picker Dialog */}
      <Dialog open={isNftPickerOpen} onOpenChange={setIsNftPickerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-black/95 backdrop-blur-xl border-2 border-green-400/30 text-green-400">
          <DialogHeader className="border-b border-green-400/20 pb-4">
            <DialogTitle className="text-green-400 font-mono text-lg tracking-wide">
              SHARE NFT ASSET
            </DialogTitle>
            <DialogDescription className="text-green-300/70 text-sm font-mono">
              › SELECT AN NFT FROM YOUR COLLECTION TO SHARE
            </DialogDescription>
          </DialogHeader>
          
          <NFTPickerContent 
            userId={currentUserId} 
            walletAddress={walletAddress}
            onSelectNft={async (nft) => {
              // Send NFT message
              await sendMessage(`Shared NFT: ${nft.name}`, 'nft', { nftId: nft.id });
              setIsNftPickerOpen(false);
              showSuccessMessage("NFT Shared", `${nft.name} has been shared successfully.`);
            }}
            onClose={() => setIsNftPickerOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Pinned Messages List Dialog */}
      <Dialog open={showPinnedList} onOpenChange={setShowPinnedList}>
        <DialogContent className="w-[90vw] max-w-md p-0 bg-black/95 backdrop-blur-xl border-green-500/30 shadow-2xl z-[100]">
          <DialogHeader className="px-4 pt-4 pb-2 border-b border-green-500/20">
            <DialogTitle className="text-sm font-semibold text-green-400 flex items-center gap-2">
              <Pin className="w-4 h-4 fill-green-400" />
              Pinned Messages ({pinnedMessages.length})
            </DialogTitle>
            <DialogDescription className="text-green-300/70 text-xs">
              Tap a message to scroll to it in the chat
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {pinnedMessages.map((msg: any, idx: number) => (
              <div
                key={msg.id}
                className="px-4 py-3 border-b border-green-500/10 hover:bg-green-500/5 cursor-pointer transition-colors flex items-start gap-3"
                onClick={() => {
                  const el = document.querySelector(`[data-message-id="${msg.id}"]`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('highlight-message');
                    setTimeout(() => el.classList.remove('highlight-message'), 2000);
                  }
                  setShowPinnedList(false);
                }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <Pin className="w-3.5 h-3.5 text-green-400 fill-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground/90 break-words">
                    {msg.content?.includes('/objects/') || msg.content?.startsWith('http') 
                      ? 'Media' 
                      : msg.content}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''}
                  </p>
                </div>
                <button
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    pinMessage(msg.id, false);
                  }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// NFT Picker Content Component
function NFTPickerContent({ 
  userId, 
  walletAddress, 
  onSelectNft, 
  onClose 
}: { 
  userId: string; 
  walletAddress: string | null;
  onSelectNft: (nft: any) => void;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChain, setSelectedChain] = useState<string>("all");

  // Fetch user's NFTs
  const { data: nfts = [], isLoading } = useQuery({
    queryKey: ['/api/nfts/user', userId],
    queryFn: async () => {
      const response = await fetch(`/api/nfts/user/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch NFTs');
      return response.json();
    },
    enabled: !!userId,
  });

  // Filter NFTs based on search and chain
  const filteredNfts = nfts.filter((nft: any) => {
    const matchesSearch = !searchQuery || 
      nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (nft.collectionName && nft.collectionName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesChain = selectedChain === "all" || nft.chain.toLowerCase() === selectedChain.toLowerCase();
    return matchesSearch && matchesChain;
  });

  const chains = Array.from(new Set(nfts.map((nft: any) => nft.chain as string))) as string[];

  return (
    <div className="space-y-4 p-4">
      {/* Matrix-style border effects */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent"></div>
      
      {/* Search and Filter Controls */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Search NFTs by name or collection..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="terminal-border bg-black/50 text-sm h-10 border-green-500/30 focus:border-green-500 text-green-400 font-mono"
            data-testid="input-nft-search"
          />
        </div>
        <Select value={selectedChain} onValueChange={setSelectedChain}>
          <SelectTrigger className="terminal-border bg-black/70 text-sm h-10 w-40 border-green-500/40 focus:border-green-500 text-green-400 font-mono">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-black/95 border-green-500/40 backdrop-blur-xl">
            <SelectItem value="all" className="text-green-400 hover:bg-green-500/30 font-mono">
              All Chains
            </SelectItem>
            {chains.map((chain: string) => (
              <SelectItem 
                key={chain} 
                value={chain.toLowerCase()}
                className="text-green-400 hover:bg-green-500/30 font-mono capitalize"
              >
                {chain}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* NFT Grid */}
      <div className="max-h-[60vh] overflow-y-auto">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card bg-green-900/10 border-green-400/20 rounded-lg p-4 animate-pulse">
                <div className="aspect-square bg-green-400/20 rounded-lg mb-3"></div>
                <div className="h-4 bg-green-400/20 rounded mb-2"></div>
                <div className="h-3 bg-green-400/10 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredNfts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredNfts.map((nft: any) => (
              <NFTCard
                key={nft.id}
                nft={nft}
                onClick={() => onSelectNft(nft)}
                isSelectable={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <Image className="w-16 h-16 mx-auto text-green-400/30" />
            <div className="space-y-2">
              <p className="text-green-400/70 font-mono text-lg">
                {searchQuery || selectedChain !== "all" ? "No matching NFTs found" : "No NFTs found"}
              </p>
              <p className="text-green-400/50 text-sm font-mono">
                {!walletAddress 
                  ? "Connect your wallet to view your NFT collection"
                  : searchQuery || selectedChain !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Add NFTs to your collection to share them in chat"
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-green-400/20">
        <Button
          variant="outline"
          onClick={onClose}
          className="bg-black/80 border-green-400/50 text-green-400 hover:bg-green-400/10"
          data-testid="button-cancel-nft-picker"
        >
          Cancel
        </Button>
      </div>
      
      {/* Matrix-style progress bar effect */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent"></div>
    </div>
  );
}

// NFT Card Component for the picker
function NFTCard({ 
  nft, 
  onClick, 
  isSelectable = false 
}: { 
  nft: any; 
  onClick: () => void; 
  isSelectable?: boolean; 
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <div 
      className={`
        glass-card bg-black/60 border-2 border-green-400/30 rounded-lg overflow-hidden
        cursor-pointer transition-all duration-150 group
        hover:border-green-400/60 hover:scale-[1.02] hover:shadow-xl
        ${isSelectable ? 'hover:bg-green-400/5' : ''}
      `}
      onClick={onClick}
      data-testid={`card-nft-selectable-${nft.id}`}
    >
      {/* Matrix-style border effect */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      {/* NFT Image */}
      <div className="relative aspect-square bg-gradient-to-br from-green-900/20 to-black/50">
        {nft.imageUrl && !imageError ? (
          <img
            src={nft.imageUrl}
            alt={nft.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
            data-testid={`img-nft-picker-${nft.id}`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-900/20 to-black/50 flex items-center justify-center">
            <Image className="w-8 h-8 text-green-400/50" />
          </div>
        )}
        
        {/* Chain badge */}
        <div className="absolute top-2 right-2">
          <div className={`px-2 py-1 rounded text-xs font-mono uppercase tracking-wide ${
            nft.chain.toLowerCase() === 'ethereum' ? 'bg-blue-500 text-white' :
            nft.chain.toLowerCase() === 'polygon' ? 'bg-purple-500 text-white' :
            nft.chain.toLowerCase() === 'bsc' ? 'bg-yellow-500 text-black' :
            'bg-gray-500 text-white'
          }`}>
            {nft.chain}
          </div>
        </div>
        
        {/* Selection overlay */}
        {isSelectable && (
          <div className="absolute inset-0 bg-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
            <div className="bg-green-400/90 rounded-full px-3 py-1">
              <span className="text-black text-xs font-mono font-bold">SHARE</span>
            </div>
          </div>
        )}
      </div>

      {/* NFT Info */}
      <div className="p-3 space-y-2">
        <div>
          <h3 className="text-green-400 font-mono text-sm font-bold line-clamp-1" data-testid={`text-nft-picker-name-${nft.id}`}>
            {nft.name}
          </h3>
          {nft.collectionName && (
            <p className="text-green-300/70 text-xs font-mono line-clamp-1" data-testid={`text-nft-picker-collection-${nft.id}`}>
              {nft.collectionName}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-green-400/70">
          <span>#{nft.tokenId}</span>
          <span>{nft.contractAddress.slice(0, 6)}...</span>
        </div>

        {/* Matrix-style progress bar effect */}
        <div className="h-px bg-gradient-to-r from-transparent via-green-400/30 to-transparent"></div>
      </div>
    </div>
  );
}
