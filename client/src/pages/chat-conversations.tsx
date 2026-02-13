import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle, Users as UsersIcon, Search, Plus, MoreHorizontal } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import MatrixBackground from "@/components/matrix-background";
import UserAvatar from "@/components/UserAvatar";
const offchatLogo = "/logo.png";

interface ChatConversationsProps {
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

interface Chat {
  id: string;
  name: string;
  type: string;
  participants: Array<{
    id: string;
    username: string;
    avatar: string | null;
    isOnline: boolean;
  }>;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
    senderName: string;
  };
  unreadCount: number;
  updatedAt: string;
}

export default function ChatConversationsPage({ currentUser }: ChatConversationsProps) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  // Fetch user's chats
  const { data: chats = [], isLoading, error } = useQuery({
    queryKey: ['/api/chats', currentUser.id],
    queryFn: async () => {
      const response = await fetch(`/api/chats/${currentUser.id}`);
      if (!response.ok) throw new Error('Failed to fetch chats');
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Filter chats based on search
  const filteredChats = chats.filter((chat: Chat) => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.participants.some(p => p.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleGoBack = () => {
    window.history.back();
  };

  const handleChatSelect = (chatId: string) => {
    setLocation(`/chat/${chatId}`);
  };

  const formatLastMessageTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getOtherParticipants = (chat: Chat) => {
    return chat.participants.filter(p => p.id !== currentUser.id);
  };

  const getChatDisplayName = (chat: Chat) => {
    if (chat.type === 'group') {
      return chat.name;
    }
    const otherParticipants = getOtherParticipants(chat);
    return otherParticipants.length > 0 ? otherParticipants[0].username : 'Unknown';
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === 'group') {
      return null; // Could show group avatar in future
    }
    const otherParticipants = getOtherParticipants(chat);
    return otherParticipants.length > 0 ? otherParticipants[0].avatar : null;
  };

  const getOnlineStatus = (chat: Chat) => {
    if (chat.type === 'group') {
      return getOtherParticipants(chat).some(p => p.isOnline);
    }
    const otherParticipants = getOtherParticipants(chat);
    return otherParticipants.length > 0 ? otherParticipants[0].isOnline : false;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MatrixBackground />
      
      <div className="relative z-10 min-h-screen">
        {/* Professional Header */}
        <div className={`${isMobile ? 'pt-safe' : ''} sticky top-0 z-30 bg-black/95 backdrop-blur-sm border-b border-green-400/20`}>
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isMobile && (
                  <Button
                    onClick={handleGoBack}
                    variant="outline"
                    size="sm"
                    className="border-green-400/30 text-green-400 hover:bg-green-400/10"
                    data-testid="button-back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
                <div className="flex items-center gap-3">
                  <img 
                    src={offchatLogo} 
                    alt="Offchat Logo" 
                    className="w-8 h-8 rounded-lg" 
                  />
                  <div>
                    <h1 className="text-xl font-bold text-green-300 font-mono tracking-wider">
                      {t('chat.conversations')}
                    </h1>
                    <p className="text-green-300/60 text-xs font-mono">
                      {t('chat.activeChats')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-400/30 text-green-400 hover:bg-green-400/10"
                  data-testid="button-new-chat"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('chat.new')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-400/50" />
            <input
              type="text"
              placeholder={t('chat.searchConversations')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black/40 border border-green-400/30 rounded-lg text-green-400 placeholder-green-400/50 font-mono text-sm focus:outline-none focus:border-green-400/60 focus:bg-green-400/5 transition-all duration-300"
              data-testid="input-search-conversations"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="max-w-4xl mx-auto px-4 pb-24">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({length: 5}).map((_, i) => (
                <Card key={i} className="bg-black/40 border-green-400/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-400/10 rounded-full animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-green-400/10 rounded animate-pulse"></div>
                        <div className="h-3 bg-green-400/5 rounded animate-pulse w-2/3"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-400/10 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-green-400/50" />
              </div>
              <h3 className="text-lg font-bold text-green-300 font-mono mb-2">
                {t('chat.noConversationsYet')}
              </h3>
              <p className="text-green-300/60 text-sm font-mono mb-4">
                {t('chat.startChattingDesc')}
              </p>
              <Button
                variant="outline"
                className="border-green-400/30 text-green-400 hover:bg-green-400/10"
                data-testid="button-start-chat"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('chat.startConversationBtn')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredChats.map((chat: Chat) => (
                <Card 
                  key={chat.id}
                  className="bg-black/40 border-green-400/30 hover:bg-green-400/5 hover:border-green-400/50 transition-all duration-300 cursor-pointer group"
                  onClick={() => handleChatSelect(chat.id)}
                  data-testid={`chat-${chat.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative">
                        <UserAvatar
                          user={{
                            username: getChatDisplayName(chat),
                            avatar: getChatAvatar(chat)
                          }}
                          size="lg"
                        />
                        {/* Online status indicator */}
                        {getOnlineStatus(chat) && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-black rounded-full"></div>
                        )}
                        {chat.type === 'group' && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                            <UsersIcon className="w-3 h-3 text-black" />
                          </div>
                        )}
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-green-400 font-mono truncate">
                            {getChatDisplayName(chat)}
                          </h3>
                          <div className="flex items-center gap-2">
                            {chat.lastMessage && (
                              <span className="text-xs text-green-300/50 font-mono">
                                {formatLastMessageTime(chat.lastMessage.createdAt)}
                              </span>
                            )}
                            {chat.unreadCount > 0 && (
                              <Badge 
                                variant="default" 
                                className="bg-green-400 text-black text-xs px-2 py-0.5"
                                data-testid={`unread-count-${chat.id}`}
                              >
                                {chat.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {chat.lastMessage ? (
                          <p className="text-sm text-green-300/70 font-mono truncate">
                            {chat.lastMessage.senderId === currentUser.id ? `${t('chat.you')}: ` : ''}
                            {chat.lastMessage.content}
                          </p>
                        ) : (
                          <p className="text-sm text-green-300/50 font-mono italic">
                            {t('chat.noMessagesYet')}
                          </p>
                        )}

                        {/* Participants preview for group chats */}
                        {chat.type === 'group' && (
                          <div className="flex items-center gap-1 mt-1">
                            <UsersIcon className="w-3 h-3 text-green-400/50" />
                            <span className="text-xs text-green-300/50 font-mono">
                              {chat.participants.length} {t('chat.participants')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* More Options */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-green-400/50 hover:text-green-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle more options
                        }}
                        data-testid={`more-options-${chat.id}`}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}