import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserAvatar from "./UserAvatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Users, X, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFriendWebSocket } from "@/hooks/use-friend-websocket";

interface User {
  id: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  isOnline: boolean;
  walletAddress: string | null;
}

interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: string;
  createdAt: string;
  requesterName?: string;
  requesterAvatar?: string | null;
}

interface FriendManagementProps {
  currentUserId: string;
  onStartChat: (userId: string, closeDialog?: () => void) => void;
  shouldHighlight?: boolean;
}

export default function FriendManagement({ currentUserId, onStartChat, shouldHighlight = false }: FriendManagementProps) {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  useFriendWebSocket(currentUserId);

  const { data: friends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ['/api/friends', currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/friends/${currentUserId}`);
      if (!response.ok) throw new Error('Failed to fetch friends');
      return response.json();
    },
    enabled: !!currentUserId,
  });

  const { data: blockedUsers = [], isLoading: blockedLoading } = useQuery({
    queryKey: ['/api/users', currentUserId, 'blocked'],
    queryFn: async () => {
      const response = await fetch(`/api/users/${currentUserId}/blocked`);
      if (!response.ok) throw new Error('Failed to fetch blocked users');
      return response.json();
    },
    enabled: !!currentUserId,
  });

  // Unblock user mutation
  const unblockMutation = useMutation({
    mutationFn: async (blockedId: string) => {
      const response = await fetch(`/api/users/block/${currentUserId}/${blockedId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to unblock user');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('friends.userUnblocked'),
        description: t('friends.userUnblockedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users', currentUserId, 'blocked'] });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('friends.failedToUnblock'),
        variant: "destructive",
      });
    },
  });


  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="cyber-button w-full bg-black/40 border-primary/30 hover:bg-primary/10 hover:border-primary/50 text-primary h-8 px-2 text-xs font-mono transition-all duration-150 neon-glow flex items-center justify-center gap-1.5"
          data-testid="button-open-friends"
        >
          <Users className="h-3.5 w-3.5" />
          <span className="text-[10px] tracking-wider">{t('friends.friends')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] sm:max-w-lg max-h-[85vh] overflow-hidden bg-black/95 border-primary/20 backdrop-blur-md p-0 rounded-xl">
        <div className="glass-card border-primary/10">
          <DialogHeader className="p-4 pb-3 border-b border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <DialogTitle className="text-primary font-mono flex items-center gap-2 text-lg tracking-wider">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <Users className="w-4 h-4" />
              {t('friends.friendMatrix')}
            </DialogTitle>
            <DialogDescription className="text-xs text-primary/60 font-mono mt-1">
              {t('friends.manageConnections')}
            </DialogDescription>
          </DialogHeader>
        
        <div className="p-4">
          <Tabs defaultValue="friends" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-10 bg-black/40 border border-primary/20 rounded-lg">
              <TabsTrigger 
                value="friends" 
                className="font-mono text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-primary/60 transition-all duration-200 data-[state=active]:border-primary/30"
                data-testid="tab-friends"
              >
                {t('friends.friends').toUpperCase()}
                <Badge variant="outline" className="ml-1 text-[10px] bg-primary/10 border-primary/30 text-primary">
                  {friends.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="blocked" 
                className="font-mono text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-primary/60 transition-all duration-200"
                data-testid="tab-blocked"
              >
                {t('friends.blocked').toUpperCase()}
                <Badge variant="outline" className="ml-1 text-[10px] bg-red-500/10 border-red-500/30 text-red-400">
                  {blockedUsers.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Friends List */}
            <TabsContent value="friends" className="space-y-3 mt-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                <span className="text-xs font-mono text-primary/80 uppercase tracking-wider">{t('friends.activeConnections')}</span>
              </div>
              <ScrollArea className="h-72 pr-3">
                {friendsLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-2">
                    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <div className="text-primary/60 text-xs font-mono">{t('friends.scanningNetwork')}</div>
                  </div>
                ) : (friends as User[]).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <Users className="w-8 h-8 text-primary/30" />
                    <div className="text-center">
                      <div className="text-primary/60 text-xs font-mono mb-1">{t('friends.noActiveConnections')}</div>
                      <div className="text-primary/40 text-[10px] font-mono">{t('friends.useScanTab')}</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(friends as User[]).map((friend: User) => (
                    <Card key={friend.id} className="glass-card border-primary/20 hover:border-primary/40 bg-black/40 hover:bg-black/60 transition-all duration-150 group" data-testid={`card-friend-${friend.id}`}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="relative shrink-0">
                              <UserAvatar 
                                username={friend.username}
                                avatar={friend.avatar}
                                size="sm"
                                isBlocked={(blockedUsers as User[]).some(blocked => blocked.id === friend.id)}
                              />
                              {friend.isOnline && !((blockedUsers as User[]).some(blocked => blocked.id === friend.id)) && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full border border-black animate-pulse" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-mono font-medium truncate text-primary group-hover:text-primary/80 transition-colors">{friend.username}</h4>
                                <Badge 
                                  variant={friend.isOnline ? "default" : "secondary"} 
                                  className={`text-[10px] h-4 px-2 font-mono ${
                                    friend.isOnline 
                                      ? 'bg-primary/20 text-primary border-primary/30' 
                                      : 'bg-muted/30 text-muted-foreground border-muted/40'
                                  }`}
                                >
                                  {friend.isOnline ? t('common.online').toUpperCase() : t('common.offline').toUpperCase()}
                                </Badge>
                              </div>
                              {friend.bio && (
                                <p className="text-[11px] text-primary/60 truncate font-mono">{friend.bio}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => onStartChat(friend.id, () => setIsDialogOpen(false))}
                            className="cyber-button bg-primary/10 hover:bg-primary/20 text-primary border-primary/30 hover:border-primary/50 h-8 w-8 p-0 shrink-0 transition-all duration-150"
                            data-testid={`button-chat-${friend.id}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

            {/* Blocked Users List */}
            <TabsContent value="blocked" className="space-y-3 mt-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-1 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-mono text-red-400/80 uppercase tracking-wider">{t('friends.blockedEntities')}</span>
              </div>
              <ScrollArea className="h-72 pr-3">
                {blockedLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-2">
                    <div className="w-6 h-6 border-2 border-red-400/20 border-t-red-400 rounded-full animate-spin"></div>
                    <div className="text-red-400/60 text-xs font-mono">{t('friends.scanningBlocked')}</div>
                  </div>
                ) : (blockedUsers as User[]).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <X className="w-8 h-8 text-primary/30" />
                    <div className="text-center">
                      <div className="text-primary/60 text-xs font-mono mb-1">{t('friends.noBlockedUsers')}</div>
                      <div className="text-primary/40 text-[10px] font-mono">{t('friends.allConnectionsActive')}</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(blockedUsers as User[]).map((blockedUser: User) => (
                    <Card key={blockedUser.id} className="glass-card border-red-500/20 hover:border-red-500/40 bg-black/40 hover:bg-black/60 transition-all duration-150 group" data-testid={`card-blocked-${blockedUser.id}`}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="relative shrink-0">
                              <Avatar className="w-8 h-8 border border-red-500/20 grayscale">
                                <AvatarImage src={blockedUser.avatar || undefined} />
                                <AvatarFallback className="bg-red-500/20 text-red-400 text-sm font-mono">
                                  {blockedUser.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-black flex items-center justify-center">
                                <X className="w-2 h-2 text-white" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-mono font-medium truncate text-red-400 group-hover:text-red-400/80 transition-colors line-through">{blockedUser.username}</h4>
                                <Badge variant="destructive" className="text-[10px] h-4 px-2 font-mono bg-red-500/20 text-red-400 border-red-500/30">
                                  {t('friends.blocked').toUpperCase()}
                                </Badge>
                              </div>
                              {blockedUser.bio && (
                                <p className="text-[11px] text-red-400/60 truncate font-mono opacity-50">{blockedUser.bio}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => unblockMutation.mutate(blockedUser.id)}
                            disabled={unblockMutation.isPending}
                            className="cyber-button bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/30 hover:border-orange-500/50 h-8 px-3 text-xs font-mono transition-all duration-150"
                            data-testid={`button-unblock-${blockedUser.id}`}
                          >
                            {unblockMutation.isPending ? "..." : t('friends.unblock').toUpperCase()}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

        </Tabs>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}