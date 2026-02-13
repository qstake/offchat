import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import EnhancedWalletSection from "./enhanced-wallet-section";
import FriendManagement from "./friend-management";
import GroupManagement from "./group-management";
import ProfileEditor from "./profile-editor";
import UserAvatar from "./UserAvatar";
import { X, Search, Users, Trash2, MoreHorizontal, Pin, Wallet, Package, Wifi, Bluetooth, MessageSquareX } from "lucide-react";
const offchatLogo = "/logo.png";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useFriendWebSocket } from "@/hooks/use-friend-websocket";
import { useOfflineMode } from "@/hooks/use-offline-mode";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from "./language-switcher";

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
}

interface ChatSidebarProps {
  selectedChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onCloseMobile: () => void;
  isMobile: boolean;
  walletAddress: string | null;
  balance: string;
  isWalletConnected: boolean;
  onConnectWallet?: (() => Promise<void>) | null;
  onDisconnectWallet: () => void;
  shouldHighlightFriends?: boolean;
  showWalletSection?: boolean;
  currentUser: {
    id: string;
    username: string;
    walletAddress: string;
    avatar?: string | null;
    bio?: string | null;
    isOnline: boolean;
    createdAt: string;
  };
}


export default function ChatSidebar({
  selectedChatId,
  onChatSelect,
  onCloseMobile,
  isMobile,
  walletAddress,
  balance,
  isWalletConnected,
  onConnectWallet,
  onDisconnectWallet,
  shouldHighlightFriends = false,
  showWalletSection = false,
  currentUser
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { isOfflineMode, isBluetoothSupported, isBluetoothConnected, toggleOfflineMode, connectBluetooth } = useOfflineMode();
  const { t } = useTranslation();
  
  // Search users when query is entered
  const { data: searchResults = [] } = useQuery({
    queryKey: ['/api/search-users', searchQuery, currentUser.id],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];
      const response = await fetch(`/api/search-users?q=${encodeURIComponent(searchQuery.trim())}&exclude=${currentUser.id}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!searchQuery.trim() && searchQuery.trim().length >= 2,
  });
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Initialize friend WebSocket for real-time notifications
  useFriendWebSocket(currentUser?.id || null);

  const startChatWithUser = async (userId: string) => {
    try {
      const currentChats = queryClient.getQueryData<any[]>(['/api/chats', currentUser.id]) || [];
      const existingChat = currentChats.find((chat: any) => !chat.isGroup && chat.otherUserId === userId);
      if (existingChat) {
        onChatSelect(existingChat.id);
        setSearchQuery('');
        if (isMobile) onCloseMobile();
        return;
      }
      const createResponse = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isGroup: false })
      });
      if (!createResponse.ok) throw new Error('Failed to create chat');
      const newChat = await createResponse.json();
      await Promise.all([
        fetch(`/api/chats/${newChat.id}/participants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, role: 'member' })
        }),
        fetch(`/api/chats/${newChat.id}/participants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId, role: 'member' })
        })
      ]);
      onChatSelect(newChat.id);
      setSearchQuery('');
      if (isMobile) onCloseMobile();
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  // Fetch user's chats with automatic refresh for real-time updates
  const { data: userChats = [], isLoading: chatsLoading } = useQuery({
    queryKey: ['/api/chats', currentUser.id],
    queryFn: async () => {
      const response = await fetch(`/api/chats/${currentUser.id}`);
      if (!response.ok) throw new Error('Failed to fetch chats');
      return response.json();
    },
    enabled: !!currentUser.id,
    refetchInterval: 5000, // Refresh every 5 seconds as backup
  });
  
  // Filter and sort chats: pinned chats first, then by recent activity
  const filteredChats = userChats
    .filter((chat: any) => {
      return chat.name && chat.name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a: any, b: any) => {
      // First sort by pinned status (pinned chats at top)
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Then sort by last message time (most recent first)
      const aTime = new Date(a.lastMessageTime || a.createdAt).getTime();
      const bTime = new Date(b.lastMessageTime || b.createdAt).getTime();
      return bTime - aTime;
    });

  const deleteChatMutation = useMutation({
    mutationFn: async ({ chatId, deleteForEveryone }: { chatId: string; deleteForEveryone: boolean }) => {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deleteForEveryone }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to delete chat: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }
      return response.json();
    },
    onSuccess: (data, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.removeQueries({ queryKey: ['/api/chats', chatId] });
      queryClient.removeQueries({ queryKey: ['/api/messages', chatId] });
      queryClient.removeQueries({ queryKey: ['/api/chats', chatId, 'partner'] });
      queryClient.refetchQueries({ queryKey: ['/api/chats', currentUser.id] });
      
      if (selectedChatId === chatId) {
        setLocation('/');
      }
    },
    onError: (error) => {
      alert('Error deleting chat: ' + error.message);
    },
  });

  const handleDeleteChat = (chatId: string, deleteForEveryone: boolean = false) => {
    const confirmMsg = deleteForEveryone
      ? 'Are you sure you want to delete this chat for everyone? The other person will also lose all messages.'
      : 'Are you sure you want to delete this chat? This action cannot be undone.';
    if (confirm(confirmMsg)) {
      deleteChatMutation.mutate({ chatId, deleteForEveryone });
    }
  };

  const handlePinChat = async (chatId: string) => {
    try {
      // Find current chat to check if it's pinned
      const currentChat = userChats.find((chat: any) => chat.id === chatId);
      const isCurrentlyPinned = currentChat?.isPinned || false;
      
      // If trying to pin and already have 3 pinned chats, prevent pinning
      if (!isCurrentlyPinned) {
        const pinnedCount = userChats.filter((chat: any) => chat.isPinned).length;
        if (pinnedCount >= 3) {
          alert('You can pin up to 3 chats. Please unpin another chat first.');
          return;
        }
      }
      
      // Toggle pin status
      const newPinnedStatus = !isCurrentlyPinned;
      
      const response = await fetch(`/api/chats/${chatId}/pin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPinned: newPinnedStatus }),
      });

      if (response.ok) {
        // Refresh chats to show the updated pin status
        queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
        queryClient.refetchQueries({ queryKey: ['/api/chats', currentUser?.id] });
      } else {
        throw new Error('Failed to update pin status');
      }
    } catch (error) {
      console.error('Error updating pin status:', error);
      alert('An error occurred while updating pin status.');
    }
  };


  return (
    <div className={`w-full h-screen sidebar-enhanced flex flex-col bg-black/95 border-r border-primary/20 ${isMobile ? 'bg-black/98' : ''}`}>
      <div className="relative z-10 h-full flex flex-col">
        
        {/* Header - Logo + Close (mobile) */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-primary/15">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              setLocation("/");
              if (isMobile) onCloseMobile();
            }}
          >
            <img src={offchatLogo} alt="Offchat" className="w-5 h-5" />
            <h1 className="text-sm font-mono font-bold text-primary tracking-wider">OFFCHAT</h1>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher variant="compact" />
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCloseMobile}
              className="hover:bg-primary/10 hover:text-primary h-7 w-7 p-0"
              data-testid="button-close-sidebar"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          </div>
        </div>

        {/* Profile Section */}
        {isWalletConnected && currentUser && (
          <div className="px-3 py-2 border-b border-primary/15">
            <ProfileEditor 
            currentUser={{
              ...currentUser,
              avatar: currentUser.avatar ?? null,
              bio: currentUser.bio ?? null,
            }}
            onLogout={() => {
              onDisconnectWallet();
              setLocation("/");
            }}
          />
          </div>
        )}

        {/* Wallet Section */}
        <div className="px-3 py-2 border-b border-primary/15">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="cyber-button w-full justify-start gap-3 bg-black/40 border-primary/30 hover:bg-primary/10 hover:border-primary/50 text-primary h-9 px-3 transition-all duration-150 neon-glow"
                data-testid="button-open-wallet"
              >
                <Wallet className="h-4 w-4" />
                <span className="text-xs font-mono font-medium tracking-wider">
                  {isWalletConnected ? 'WALLET' : 'CONNECT WALLET'}
                </span>
                {isWalletConnected && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 shadow-sm shadow-green-500/50"></div>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] w-full sm:max-w-md mx-auto max-h-[80vh] overflow-y-auto p-4">
              <DialogHeader>
                <DialogTitle>Wallet Management</DialogTitle>
              </DialogHeader>
              <div className="py-2">
                <EnhancedWalletSection
                  walletAddress={walletAddress}
                  isConnected={isWalletConnected}
                  onConnect={onConnectWallet || undefined}
                  onDisconnect={onDisconnectWallet}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Action Buttons Row */}
        {isWalletConnected && (
          <div className="px-3 py-2 border-b border-primary/15">
            <div className="grid grid-cols-3 gap-1.5">
              {/* NFT Button */}
              <Button 
                variant="outline" 
                size="sm"
                className="cyber-button bg-black/40 border-primary/30 hover:bg-primary/10 hover:border-primary/50 text-primary h-8 px-2 text-xs font-mono transition-all duration-150 neon-glow flex items-center justify-center gap-1.5"
                onClick={() => {
                  setLocation("/nft-collection");
                  if (isMobile) onCloseMobile();
                }}
                data-testid="button-nft-collection"
              >
                <Package className="h-3.5 w-3.5" />
                <span className="text-[10px] tracking-wider">NFTs</span>
              </Button>

              {/* Friends Button */}
              <div className={`${shouldHighlightFriends ? 'glow-animation' : ''}`}>
                <FriendManagement 
                  currentUserId={currentUser?.id || 'user1'}
                  shouldHighlight={shouldHighlightFriends}
                  onStartChat={async (friendId, closeDialog) => {
                    try {
                      const response = await fetch(`/api/chats/${currentUser.id}`);
                      const currentChats = await response.json();
                      const existingChat = currentChats.find((chat: any) => 
                        !chat.isGroup && chat.otherUserId === friendId
                      );
                      if (existingChat) {
                        onChatSelect(existingChat.id);
                        closeDialog?.();
                        return;
                      }
                      const createResponse = await fetch('/api/chats', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isGroup: false })
                      });
                      if (!createResponse.ok) throw new Error('Failed to create chat');
                      const newChat = await createResponse.json();
                      await Promise.all([
                        fetch(`/api/chats/${newChat.id}/participants`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: currentUser.id, role: 'member' })
                        }),
                        fetch(`/api/chats/${newChat.id}/participants`, {
                          method: 'POST', 
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: friendId, role: 'member' })
                        })
                      ]);
                      onChatSelect(newChat.id);
                      closeDialog?.();
                      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
                    } catch (error) {
                      console.error('Failed to start chat:', error);
                    }
                  }}
                />
              </div>

              {/* New Group Button */}
              <GroupManagement
                currentUserId={currentUser?.id || 'user1'}
                onGroupCreated={(groupId) => {
                  onChatSelect(groupId);
                  queryClient.invalidateQueries({ queryKey: ['/api/chats/user'] });
                }}
              />
            </div>

            {/* Offline Mode Toggle */}
            <div className="mt-2">
              <Button 
                variant="outline" 
                className={`cyber-button w-full justify-start gap-3 border-primary/30 h-8 px-3 transition-all duration-150 neon-glow ${
                  isOfflineMode 
                    ? 'bg-orange-500/20 border-orange-500/50 hover:bg-orange-500/30 hover:border-orange-500/70 text-orange-400' 
                    : 'bg-black/40 hover:bg-primary/10 hover:border-primary/50 text-primary'
                }`}
                onClick={async () => {
                  if (!isOfflineMode && isBluetoothSupported && !isBluetoothConnected) {
                    try {
                      await connectBluetooth();
                    } catch (error) {
                      return;
                    }
                  }
                  toggleOfflineMode();
                }}
                data-testid="button-offline-mode"
              >
                <div className="relative flex items-center">
                  <Wifi className={`h-4 w-4 transition-all duration-200 ${
                    isOfflineMode ? 'text-orange-400 opacity-50' : 'text-primary'
                  }`} />
                  <Bluetooth className={`h-3 w-3 absolute -top-1 -right-1 transition-all duration-200 ${
                    isOfflineMode ? 'text-orange-400 animate-pulse' : 'text-primary/60'
                  }`} />
                </div>
                <span className="text-xs font-mono font-medium tracking-wider">
                  {isOfflineMode ? "GO ONLINE" : "ENABLE OFFLINE"}
                </span>
                <div className={`ml-auto w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                  isOfflineMode 
                    ? 'bg-orange-400 animate-pulse shadow-sm shadow-orange-500/50' 
                    : 'bg-primary/60'
                }`}></div>
              </Button>
              
              {isOfflineMode && (
                <div className="mt-2 px-3 py-2 bg-black/60 rounded-lg border border-orange-500/20">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <div className={`w-2 h-2 rounded-full ${
                      isBluetoothConnected ? 'bg-green-400 animate-pulse' : 'bg-orange-400 animate-pulse'
                    }`}></div>
                    <span className={isBluetoothConnected ? 'text-green-400' : 'text-orange-400'}>
                      {isBluetoothConnected 
                        ? 'Bluetooth Connected' 
                        : isBluetoothSupported 
                          ? 'Bluetooth Not Connected' 
                          : 'Bluetooth Not Supported'
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="px-3 py-2 border-b border-primary/15">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-primary/40" />
            <Input
              placeholder={t('chat.searchUsers')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 h-8 bg-black/40 border-primary/15 hover:border-primary/25 focus:border-primary/50 text-primary placeholder:text-primary/30 text-xs font-mono rounded-lg"
              data-testid="input-search-chats"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full w-full scroll-area-enhanced">
            <div className={`space-y-0.5 px-1.5 py-1 pb-safe ${isMobile ? 'pb-14' : 'pb-6'}`}>
          {chatsLoading ? (
            <div className="text-center py-8 text-muted-foreground font-mono">
              Loading chats...
            </div>
          ) : filteredChats.length === 0 && (!searchQuery.trim() || searchResults.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground font-mono">
              {searchQuery ? t('chat.noResults') : t('chat.noChats')}
            </div>
          ) : (
            <>
              {/* Show user search results when searching */}
              {searchQuery.trim() && searchResults.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2 flex items-center">
                    <Users className="w-3 h-3 mr-2 text-primary" />
                    People ({searchResults.length})
                  </h4>
                  {searchResults.map((user: any) => (
                    <div
                      key={`user-${user.id}`}
                      className="p-2 mx-2 mb-1 rounded-xl cursor-pointer transition-all duration-200 hover:bg-muted/40 hover:shadow-sm border border-transparent hover:border-border/30"
                      data-testid={`user-search-result-${user.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <UserAvatar 
                          username={user.username || 'Unknown'} 
                          avatar={user.avatar}
                          size="sm"
                          className="w-8 h-8 rounded-xl ring-2 ring-background shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate text-foreground text-sm leading-tight">
                                {user.username || 'Unknown User'}
                              </h3>
                              {user.bio && (
                                <p className="text-xs text-muted-foreground/80 truncate leading-tight mt-0.5">
                                  {user.bio}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-2 border-primary/30 text-primary hover:bg-primary/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                startChatWithUser(user.id);
                              }}
                              data-testid={`button-message-${user.id}`}
                            >
                              Message
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Show existing chats */}
              {filteredChats.length > 0 && (
                <div>
                  {searchQuery.trim() && (
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2 flex items-center">
                      <Search className="w-3 h-3 mr-2 text-primary" />
                      Conversations ({filteredChats.length})
                    </h4>
                  )}
                  {filteredChats.map((chat: any) => {
                    return (
                    <div
                      key={chat.id}
                      className={`${isMobile ? `mobile-chat-item ${selectedChatId === chat.id ? 'selected' : ''}` : `p-2 mx-2 rounded-xl cursor-pointer transition-all duration-200 hover:bg-muted/40 hover:shadow-sm relative group border border-transparent ${selectedChatId === chat.id ? 'bg-primary/8 border-primary/25 shadow-md ring-1 ring-primary/10' : 'hover:border-border/30'}`} ${isMobile ? 'touch-manipulation min-h-[48px] active:bg-primary/10 p-2' : ''}`}
                onClick={() => {
                  onChatSelect(chat.id);
                  if (isMobile) onCloseMobile();
                }}
                data-testid={`chat-item-${chat.id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative flex-shrink-0">
                    {chat.isGroup ? (
                      <div className="w-8 h-8 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/25 to-primary/15 border border-primary/20 shadow-sm">
                        {chat.avatar && chat.avatar.length > 1 ? (
                          <img 
                            src={chat.avatar} 
                            alt="Group" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Failed to load group avatar:', chat.avatar);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {chat.avatar && chat.avatar.length === 1 ? (
                              <span className="text-primary font-mono text-lg font-bold">{chat.avatar}</span>
                            ) : (
                              <Users className="w-5 h-5 text-primary" />
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <UserAvatar 
                        username={chat.name || 'Unknown'} 
                        avatar={chat.avatar}
                        size="sm"
                        className={`${isMobile ? 'w-8 h-8' : 'w-9 h-9'} rounded-xl ring-2 ring-background shadow-sm`}
                      />
                    )}
                    {/* Online indicator for direct chats */}
                    {!chat.isGroup && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full shadow-sm"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <h3 className="font-semibold truncate text-foreground text-sm leading-tight" data-testid={`text-chat-name-${chat.id}`}>
                          {chat.name || 'Unnamed Chat'}
                        </h3>
                        {chat.isPinned && (
                          <Pin className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                        {chat.isGroup && chat.username && (
                          <span className="text-xs text-muted-foreground font-mono bg-primary/10 px-1.5 py-0.5 rounded">
                            @{chat.username}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground font-medium" data-testid={`text-chat-time-${chat.id}`}>
                          {chat.lastMessageTime 
                            ? new Date(chat.lastMessageTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                            : new Date(chat.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' })
                          }
                        </span>
                        {/* Professional Chat Options */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-8 h-8 p-0 rounded-full hover:bg-muted/80 transition-colors duration-200 opacity-60 hover:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`button-chat-options-${chat.id}`}
                              title="Chat Options"
                            >
                              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-44 bg-card/95 backdrop-blur-sm border border-border/50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePinChat(chat.id);
                              }}
                              className="cursor-pointer hover:bg-muted/50 text-foreground"
                            >
                              <Pin className={`w-4 h-4 mr-2 ${chat.isPinned ? 'text-yellow-500 fill-current' : 'text-primary'}`} />
                              {chat.isPinned ? t('chat.unpinChat') : t('chat.pinChat')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChat(chat.id, false);
                              }}
                              className="cursor-pointer hover:bg-destructive/10 text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t('chat.deleteChat')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChat(chat.id, true);
                              }}
                              className="cursor-pointer hover:bg-red-500/10 text-red-500"
                            >
                              <MessageSquareX className="w-4 h-4 mr-2" />
                              Delete for Everyone
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground/80 truncate leading-tight" data-testid={`text-chat-message-${chat.id}`}>
                      {(() => {
                        if (!chat.lastMessage) {
                          return chat.isGroup ? 'Group chat started' : 'Direct message';
                        }
                        
                        const message = chat.lastMessage;
                        
                        // Check if it's a media message (URL or file path)
                        if (message.includes('/objects/') || message.startsWith('http') || message.includes('storage.googleapis.com')) {
                          return 'Media';
                        }
                        
                        // Limit text messages to 15 characters
                        if (message.length > 15) {
                          return message.substring(0, 15) + '...';
                        }
                        
                        return message;
                      })()}
                    </p>
                  </div>
                </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
