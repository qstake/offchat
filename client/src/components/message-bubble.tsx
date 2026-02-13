import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { Check, CheckCheck, Lock, MoreHorizontal, Pin, Trash2, UserX, MessageSquareX, Eye, ExternalLink } from "lucide-react";
import type { Message, Nft } from "@shared/schema";
import UserAvatar from "./UserAvatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { resolveImageUrl } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  partnerAvatar?: string | null;
  currentUserAvatar?: string | null;
  senderUsername?: string;
  currentUsername?: string;
  senderRole?: string; // admin, owner, member
  currentUserRole?: string; // current user's role in this chat
  onDeleteMessage?: (messageId: string, deleteForEveryone?: boolean) => void;
  onPinMessage?: (messageId: string, isPinned: boolean) => void;
  onBanUser?: (userId: string, username: string) => void;
  onDeleteAllUserMessages?: (userId: string, username: string) => void;
  chatId?: string;
}

// Function to get message bubble style based on user role
const getMessageBubbleStyle = (isOwn: boolean, senderRole?: string) => {
  if (isOwn) {
    return 'message-bubble-own';
  }
  
  // Different styles for admin/owner messages with new mobile designs
  if (senderRole === 'owner') {
    return 'message-bubble owner-message';
  }
  
  if (senderRole === 'admin') {
    return 'message-bubble admin-message';
  }
  
  return 'message-bubble';
};

export default function MessageBubble({ message, isOwn, partnerAvatar, currentUserAvatar, senderUsername, currentUsername, senderRole, currentUserRole, onDeleteMessage, onPinMessage, onBanUser, onDeleteAllUserMessages, chatId }: MessageBubbleProps) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  
  const formatTime = (timestamp: Date | null) => {
    if (!timestamp) return "";
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: undefined
    });
  };

  const handleProfileClick = (userId: string) => {
    if (userId) {
      setLocation(`/profile/user/${userId}`);
    }
  };

  const handleUsernameClick = async (username: string) => {
    try {
      const response = await fetch(`/api/users/username/${username}`);
      if (response.ok) {
        const user = await response.json();
        setLocation(`/profile/user/${user.id}`);
      } else {
        // Show a toast message for better user feedback
        console.log(`User @${username} not found - could show toast here`);
      }
    } catch (error) {
      console.error(`Error looking up user @${username}:`, error);
      // Gracefully handle user lookup errors
    }
  };

  const renderMessageContent = (content: string) => {
    // Replace @username patterns with clickable links
    const usernameRegex = /@([a-zA-Z0-9_]+)/g;
    const parts = content.split(usernameRegex);
    
    return (
      <span>
        {parts.map((part, index) => {
          if (index % 2 === 1) {
            // This is a username (odd indices after split)
            return (
              <span
                key={index}
                className="text-primary hover:text-primary/80 cursor-pointer font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUsernameClick(part);
                }}
                data-testid={`link-username-${part}`}
              >
                @{part}
              </span>
            );
          }
          return part;
        })}
      </span>
    );
  };

  if (message.messageType === "crypto_transaction") {
    return (
      <div className="flex justify-center" data-testid={`message-crypto-${message.id}`}>
        <div className="border border-primary/20 rounded-lg p-3 max-w-[240px] mx-2 bg-black/80">
          <div className="flex items-center justify-center mb-1.5">
            <div className="crypto-icon w-5 h-5" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-mono text-primary font-semibold" data-testid="text-crypto-amount">
              {isOwn ? '-' : '+'} {message.amount} {message.tokenSymbol}
            </p>
            <p className="text-[10px] text-green-400" data-testid="text-crypto-sender">
              {isOwn ? t('chat.sent') : t('chat.received')}
            </p>
            {message.transactionHash && (
              <p className="text-[9px] text-muted-foreground truncate font-mono bg-black/30 px-1.5 py-0.5 rounded" data-testid="text-transaction-hash">
                TX: {message.transactionHash.slice(0, 8)}...{message.transactionHash.slice(-6)}
              </p>
            )}
            <p className="text-[9px] text-muted-foreground" data-testid="text-crypto-time">
              {formatTime(message.timestamp)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle media messages
  if (message.messageType === "media") {
    const displayName = isOwn ? currentUsername : senderUsername;
    // Extract media URL from content (format: "URL filename")
    const parts = message.content.split(' ');
    // Look for /objects/ path first (new format), then fall back to storage.googleapis.com (old format)
    const mediaURL = parts.find(part => part.startsWith('/objects/')) || 
                     parts.find(part => part.includes('storage.googleapis.com')) || 
                     (parts.length === 1 ? parts[0] : null); // Handle single URL case
    const fileName = parts.length > 1 ? parts.slice(1).join(' ') : 'Media file';
    // Try to render as image first, fallback to file if it fails
    const isImage = true; // Always try as image first

    return (
      <div 
        className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
        data-testid={`message-media-${message.id}`}
      >
        {/* Username above message */}
        {displayName && (
          <span 
            className="text-xs text-muted-foreground mb-1 px-1 cursor-pointer hover:text-primary transition-colors"
            onClick={() => !isOwn && message.senderId && handleProfileClick(message.senderId)}
            data-testid={`text-sender-name-${message.senderId}`}
          >
            {displayName}
          </span>
        )}
        
        <div className={`flex items-start space-x-3 ${isOwn ? 'justify-end' : ''}`}>
          {!isOwn && (
            <div 
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => message.senderId && handleProfileClick(message.senderId)}
              data-testid={`avatar-sender-${message.senderId}`}
            >
              <UserAvatar 
                username={senderUsername || 'Unknown'} 
                avatar={partnerAvatar}
                size="sm"
                className="flex-shrink-0"
              />
            </div>
          )}
          
          <div className="max-w-xs lg:max-w-md">
            <div className={`rounded-lg p-2 ${isOwn ? 'message-bubble-own' : 'message-bubble'} group relative`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-2">
                  {isImage && mediaURL ? (
                    <div className="space-y-2">
                      <img 
                        src={resolveImageUrl(mediaURL) || mediaURL}
                        alt={fileName}
                        loading="lazy"
                        className="max-w-full h-auto rounded-lg border border-border/30"
                        style={{ maxHeight: '300px' }}
                        onError={(e) => {
                          // Hide image and show as file instead
                          const imgContainer = e.currentTarget.parentElement;
                          if (imgContainer) {
                            const resolvedUrl = resolveImageUrl(mediaURL) || mediaURL;
                            imgContainer.innerHTML = `
                              <div class="flex items-center space-x-2 p-2 bg-muted/30 rounded-lg">
                                <div class="w-8 h-8 bg-primary/20 rounded flex items-center justify-center">
                                  <span class="text-primary text-xs">📄</span>
                                </div>
                                <div class="flex-1 min-w-0">
                                  <p class="text-sm font-medium truncate">${fileName}</p>
                                  <p class="text-xs text-muted-foreground">File</p>
                                </div>
                              </div>
                              <a href="${resolvedUrl}" target="_blank" rel="noopener noreferrer" class="text-xs text-primary hover:underline">Download</a>
                            `;
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground">{fileName}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 p-2 bg-muted/30 rounded-lg">
                        <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center">
                          <span className="text-primary text-xs">📄</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{fileName}</p>
                          <p className="text-xs text-muted-foreground">File</p>
                        </div>
                      </div>
                      {mediaURL && (
                        <a 
                          href={resolveImageUrl(mediaURL) || mediaURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Download
                        </a>
                      )}
                    </div>
                  )}
                </div>
                
                {onDeleteMessage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`flex-shrink-0 transition-opacity ml-2 w-5 h-5 rounded-full flex items-center justify-center ${
                          typeof window !== 'undefined' && window.innerWidth <= 768 
                            ? 'opacity-60 touch-manipulation' 
                            : 'opacity-0 group-hover:opacity-60 hover:!opacity-100'
                        }`}
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-32 bg-black/95 border-green-500/30">
                      <DropdownMenuItem
                        onClick={() => onDeleteMessage(message.id, false)}
                        className="cursor-pointer text-destructive hover:bg-destructive/10 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        {t('common.delete')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDeleteMessage(message.id, true)}
                        className="cursor-pointer text-red-500 hover:bg-red-500/10 text-xs"
                      >
                        <MessageSquareX className="w-3.5 h-3.5 mr-2" />
                        {t('chat.deleteForEveryone')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            <div className={`flex items-center mt-1 space-x-2 ${isOwn ? 'justify-end' : ''}`}>
              {isOwn && (
                <div className="flex items-center space-x-1">
                  {message.isRead ? (
                    <CheckCheck className="w-3 h-3 text-primary" data-testid="icon-message-read" />
                  ) : message.isDelivered ? (
                    <Check className="w-3 h-3 text-primary" data-testid="icon-message-delivered" />
                  ) : (
                    <Check className="w-3 h-3 text-muted-foreground" data-testid="icon-message-sent" />
                  )}
                </div>
              )}
              <span className="text-xs text-muted-foreground font-mono" data-testid="text-message-time">
                {formatTime(message.timestamp)}
              </span>
              <Lock className="w-3 h-3 text-primary" data-testid="icon-message-encrypted" />
            </div>
          </div>

          {isOwn && (
            <div 
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {/* Current user profile - could navigate to own profile */}}
              data-testid="avatar-current-user"
            >
              <UserAvatar 
                username={currentUsername || t('chat.you')} 
                avatar={currentUserAvatar}
                size="sm"
                className="flex-shrink-0"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Handle NFT messages
  if (message.messageType === "nft" && message.nftId) {
    const displayName = isOwn ? currentUsername : senderUsername;
    
    // Fetch NFT data
    const { data: nft, isLoading: isLoadingNft } = useQuery({
      queryKey: ['/api/nfts', message.nftId],
      queryFn: async () => {
        const response = await fetch(`/api/nfts/${message.nftId}`);
        if (!response.ok) throw new Error('Failed to fetch NFT');
        return response.json();
      },
      enabled: !!message.nftId,
    });

    const openInExplorer = (contractAddress: string, tokenId: string, chain: string) => {
      let explorerUrl = '';
      switch (chain.toLowerCase()) {
        case 'ethereum':
          explorerUrl = `https://etherscan.io/nft/${contractAddress}/${tokenId}`;
          break;
        case 'polygon':
          explorerUrl = `https://polygonscan.com/nft/${contractAddress}/${tokenId}`;
          break;
        case 'bsc':
          explorerUrl = `https://bscscan.com/nft/${contractAddress}/${tokenId}`;
          break;
        default:
          explorerUrl = `https://etherscan.io/nft/${contractAddress}/${tokenId}`;
      }
      window.open(explorerUrl, '_blank', 'noopener,noreferrer');
    };

    return (
      <div 
        className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
        data-testid={`message-nft-${message.id}`}
      >
        {/* Username above message */}
        {displayName && (
          <span 
            className="text-xs text-muted-foreground mb-1 px-1 cursor-pointer hover:text-primary transition-colors"
            onClick={() => !isOwn && message.senderId && handleProfileClick(message.senderId)}
            data-testid={`text-sender-name-${message.senderId}`}
          >
            {displayName}
          </span>
        )}
        
        <div className={`flex items-start space-x-3 ${isOwn ? 'justify-end' : ''}`}>
          {!isOwn && (
            <div 
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => message.senderId && handleProfileClick(message.senderId)}
              data-testid={`avatar-sender-${message.senderId}`}
            >
              <UserAvatar 
                username={senderUsername || 'Unknown'} 
                avatar={partnerAvatar}
                size="sm"
                className="flex-shrink-0"
              />
            </div>
          )}
          
          <div className="max-w-xs lg:max-w-md">
            <div className={`rounded-lg overflow-hidden bg-black/95 border-2 border-green-400/30 backdrop-blur-sm hover:border-green-400/60 glass-card group relative transition-all duration-150 hover:scale-[1.02]`}>
              {/* Matrix-style border effects */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              {isLoadingNft ? (
                <div className="p-4 space-y-3">
                  <div className="w-full h-32 bg-green-900/20 rounded animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-green-400/30 rounded animate-pulse"></div>
                    <div className="h-3 bg-green-400/20 rounded animate-pulse w-2/3"></div>
                  </div>
                </div>
              ) : nft ? (
                <>
                  {/* NFT Image */}
                  <div className="relative aspect-square bg-gradient-to-br from-green-900/20 to-black/50">
                    {nft.imageUrl ? (
                      <img
                        src={resolveImageUrl(nft.imageUrl) || nft.imageUrl}
                        alt={nft.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const placeholder = target.nextElementSibling as HTMLElement;
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                        data-testid={`img-nft-${nft.id}`}
                      />
                    ) : null}
                    <div 
                      className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-black/50 flex items-center justify-center"
                      style={{ display: nft.imageUrl ? 'none' : 'flex' }}
                    >
                      <Eye className="w-12 h-12 text-green-400/50" />
                    </div>
                    
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
                  </div>

                  {/* NFT Info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-green-400 font-mono text-sm font-bold line-clamp-1 mb-1" data-testid={`text-nft-name-${nft.id}`}>
                        {nft.name}
                      </h3>
                      {nft.collectionName && (
                        <p className="text-green-300/70 text-xs font-mono line-clamp-1" data-testid={`text-nft-collection-${nft.id}`}>
                          {nft.collectionName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between text-green-400/70">
                        <span>{t('chat.tokenId')}:</span>
                        <span className="font-medium" data-testid={`text-nft-tokenid-${nft.id}`}>
                          #{nft.tokenId}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-green-400/70">
                        <span>{t('chat.contract')}:</span>
                        <span className="font-medium" data-testid={`text-nft-contract-${nft.id}`}>
                          {nft.contractAddress.slice(0, 6)}...{nft.contractAddress.slice(-4)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-black/80 border-green-400/50 text-green-400 hover:bg-green-400/10 text-xs"
                        onClick={() => setLocation(`/profile/user/${nft.ownerId}`)}
                        data-testid={`button-view-nft-${nft.id}`}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        {t('chat.viewDetails')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-black/80 border-green-400/50 text-green-400 hover:bg-green-400/10"
                        onClick={() => openInExplorer(nft.contractAddress, nft.tokenId, nft.chain)}
                        data-testid={`button-explorer-${nft.id}`}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Matrix-style progress bar effect */}
                    <div className="h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent"></div>
                  </div>
                </>
              ) : (
                <div className="p-4 text-center">
                  <Eye className="w-8 h-8 text-green-400/50 mx-auto mb-2" />
                  <p className="text-green-400/70 text-xs font-mono">{t('chat.nftNotFound')}</p>
                </div>
              )}
            </div>
            
            {/* Message timestamp and status */}
            <div className={`flex items-center mt-1 space-x-2 ${isOwn ? 'justify-end' : ''}`}>
              {isOwn && (
                <div className="flex items-center space-x-1">
                  {message.isRead ? (
                    <CheckCheck className="w-3 h-3 text-primary" data-testid="icon-message-read" />
                  ) : message.isDelivered ? (
                    <Check className="w-3 h-3 text-primary" data-testid="icon-message-delivered" />
                  ) : (
                    <Check className="w-3 h-3 text-muted-foreground" data-testid="icon-message-sent" />
                  )}
                </div>
              )}
              <span className="text-xs text-muted-foreground font-mono" data-testid="text-message-time">
                {formatTime(message.timestamp)}
              </span>
              <Lock className="w-3 h-3 text-primary" data-testid="icon-message-encrypted" />
            </div>
          </div>

          {isOwn && (
            <div 
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {/* Current user profile - could navigate to own profile */}}
              data-testid="avatar-current-user"
            >
              <UserAvatar 
                username={currentUsername || t('chat.you')} 
                avatar={currentUserAvatar}
                size="sm"
                className="flex-shrink-0"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  const displayName = isOwn ? currentUsername : senderUsername;

  return (
    <div 
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
      data-testid={`message-text-${message.id}`}
    >
      <div className={`flex items-end gap-1.5 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
        {!isOwn && (
          <div 
            className="cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
            onClick={() => message.senderId && handleProfileClick(message.senderId)}
            data-testid={`avatar-sender-${message.senderId}`}
          >
            <UserAvatar 
              username={senderUsername || 'Unknown'} 
              avatar={partnerAvatar}
              size="sm"
              className="w-7 h-7"
            />
          </div>
        )}
        
        <div className="min-w-0">
          {!isOwn && displayName && (
            <div className="flex items-center gap-1.5 mb-0.5 px-1">
              <span 
                className="text-[11px] font-medium text-muted-foreground cursor-pointer hover:text-primary transition-colors truncate"
                onClick={() => message.senderId && handleProfileClick(message.senderId)}
                data-testid={`text-sender-name-${message.senderId}`}
              >
                {displayName}
              </span>
              {(senderRole === 'owner' || senderRole === 'admin') && (
                <span 
                  className={`text-[9px] px-1 py-px rounded font-medium ${
                    senderRole === 'owner' 
                      ? 'bg-yellow-500/15 text-yellow-400' 
                      : 'bg-blue-500/15 text-blue-400'
                  }`}
                  data-testid={`badge-${senderRole}`}
                >
                  {senderRole === 'owner' ? t('groups.owner') : t('chat.mod')}
                </span>
              )}
            </div>
          )}
          
          <div className={`group relative ${isOwn ? 'rounded-2xl rounded-br-md bg-green-500/15 border border-green-500/20' : 'rounded-2xl rounded-bl-md bg-white/[0.06] border border-white/[0.08]'} px-3 py-2`}>
            <div className="flex items-start gap-1.5">
              <div className="text-[13px] text-foreground flex-1 leading-relaxed break-words" data-testid="text-message-content">
                {renderMessageContent(message.content)}
              </div>
              
              {(onDeleteMessage || onPinMessage) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center opacity-30 sm:opacity-0 sm:group-hover:opacity-60 hover:!opacity-100 transition-opacity touch-manipulation"
                      data-testid="button-message-options"
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-32 bg-black/95 border-green-500/30">
                    {onPinMessage && (
                      <DropdownMenuItem
                        onClick={() => onPinMessage(message.id, !(message as any).isPinned)}
                        className="cursor-pointer text-xs"
                        data-testid="button-pin-message"
                      >
                        <Pin className="w-3.5 h-3.5 mr-2" />
                        {(message as any).isPinned ? t('chat.unpinChat') : t('chat.pinChat')}
                      </DropdownMenuItem>
                    )}
                    {onDeleteMessage && (
                      <>
                        <DropdownMenuItem
                          onClick={() => onDeleteMessage(message.id, false)}
                          className="cursor-pointer text-destructive hover:bg-destructive/10 text-xs"
                          data-testid="button-delete-message"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteMessage(message.id, true)}
                          className="cursor-pointer text-red-500 hover:bg-red-500/10 text-xs"
                          data-testid="button-delete-for-everyone"
                        >
                          <MessageSquareX className="w-3.5 h-3.5 mr-2" />
                          {t('chat.deleteForEveryone')}
                        </DropdownMenuItem>
                      </>
                    )}
                    {!isOwn && (currentUserRole === 'admin' || currentUserRole === 'owner') && message.senderId && senderUsername && (
                      <>
                        <DropdownMenuItem
                          onClick={() => onBanUser && onBanUser(message.senderId!, senderUsername!)}
                          className="cursor-pointer text-orange-500 hover:bg-orange-500/10 text-xs"
                          data-testid="button-ban-user"
                        >
                          <UserX className="w-3.5 h-3.5 mr-2" />
                          {t('chat.banUser')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteAllUserMessages && onDeleteAllUserMessages(message.senderId!, senderUsername!)}
                          className="cursor-pointer text-red-500 hover:bg-red-500/10 text-xs"
                          data-testid="button-delete-all-messages"
                        >
                          <MessageSquareX className="w-3.5 h-3.5 mr-2" />
                          {t('chat.deleteAll')}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          <div className={`flex items-center gap-1 mt-0.5 px-1 ${isOwn ? 'justify-end' : ''}`}>
            {isOwn && (
              <>
                {message.isRead ? (
                  <CheckCheck className="w-3 h-3 text-green-400" data-testid="icon-message-read" />
                ) : message.isDelivered ? (
                  <Check className="w-3 h-3 text-green-400/60" data-testid="icon-message-delivered" />
                ) : (
                  <Check className="w-3 h-3 text-muted-foreground/40" data-testid="icon-message-sent" />
                )}
              </>
            )}
            <span className="text-[10px] text-muted-foreground/60" data-testid="text-message-time">
              {formatTime(message.timestamp)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
