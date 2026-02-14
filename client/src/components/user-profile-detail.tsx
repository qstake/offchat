import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MessageCircle, Wallet, Copy, ExternalLink, UserPlus } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTranslation } from 'react-i18next';

interface UserProfileDetailProps {
  userId: string;
  currentUserId: string;
  onBack: () => void;
  onStartChat?: (userId: string) => void;
}

export default function UserProfileDetail({ 
  userId, 
  currentUserId,
  onBack, 
  onStartChat 
}: UserProfileDetailProps) {
  const { t } = useTranslation();
  // Check if users are already friends
  const { data: friendships = [] } = useQuery({
    queryKey: ['/api/friends', currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/friends/${currentUserId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!currentUserId,
  });

  // Check for pending friend requests
  const { data: friendRequests = [] } = useQuery({
    queryKey: ['/api/friends', currentUserId, 'requests'],
    queryFn: async () => {
      const response = await fetch(`/api/friends/${currentUserId}/requests`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!currentUserId,
  });

  // Friend request mutation
  const sendFriendRequestMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      return apiRequest('POST', '/api/friends/request', {
        requesterId: currentUserId,
        addresseeId: targetUserId
      });
    },
    onSuccess: () => {
      toast({
        title: t('profile.friendRequestSent'),
        description: t('profile.friendRequestSentDesc'),
      });
      // Refresh friend requests
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error?.message || t('profile.friendRequestError'),
        variant: "destructive",
      });
    },
  });

  const handleSendFriendRequest = () => {
    sendFriendRequestMutation.mutate(userId);
  };
  // Fetch user details
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    enabled: !!userId,
  });

  // Check friendship status
  const isFriend = friendships.some((friendship: any) => 
    (friendship.requesterId === userId || friendship.addresseeId === userId) && 
    friendship.status === 'accepted'
  );

  const hasPendingRequest = friendRequests.some((request: any) => 
    (request.requesterId === currentUserId && request.addresseeId === userId) ||
    (request.requesterId === userId && request.addresseeId === currentUserId)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">{t('profile.loadingProfile')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">{t('profile.userNotFound')}</p>
          <Button onClick={onBack} variant="outline" className="mt-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('profile.goBack')}
          </Button>
        </div>
      </div>
    );
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('common.copied'),
      description: `${label} ${t('profile.copiedToClipboard')}`,
    });
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const openWalletExplorer = (address: string) => {
    window.open(`https://etherscan.io/address/${address}`, '_blank');
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border/50" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
        <div className="flex items-center space-x-3">
          <Button
            size="sm"
            variant="outline"
            onClick={onBack}
            className="cyber-button w-8 h-8 rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">{t('profile.userProfile')}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main Profile Card */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Avatar */}
              <div className="relative">
                <UserAvatar 
                  username={user.username} 
                  avatar={user.avatar}
                  size="lg"
                  className="w-24 h-24 shadow-lg ring-2 ring-primary/20"
                />
                {user.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full ring-2 ring-background flex items-center justify-center">
                    <div className="w-3 h-3 bg-background rounded-full animate-pulse" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {user.username}
                </h2>
                {user.bio && (
                  <p className="text-muted-foreground max-w-sm">
                    {user.bio}
                  </p>
                )}
                <div className="flex items-center justify-center space-x-2">
                  <Badge variant={user.isOnline ? "default" : "secondary"}>
                    {user.isOnline ? t('common.online') : t('common.offline')}
                  </Badge>
                  {!user.isOnline && user.lastSeen && (
                    <span className="text-xs text-muted-foreground">
                      {t('profile.lastSeen')} {new Date(user.lastSeen).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {userId !== currentUserId && (
                <div className="flex space-x-3 mt-4">
                  <Button
                    onClick={() => onStartChat?.(userId)}
                    className="cyber-button"
                    data-testid="button-start-chat"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {t('profile.sendMessage')}
                  </Button>
                  {!isFriend && !hasPendingRequest && (
                    <Button
                      onClick={handleSendFriendRequest}
                      variant="outline"
                      className="cyber-button"
                      disabled={sendFriendRequestMutation.isPending}
                      data-testid="button-add-friend"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      {sendFriendRequestMutation.isPending ? t('chat.sending') : t('friends.addFriend')}
                    </Button>
                  )}
                  {hasPendingRequest && (
                    <Button
                      variant="outline"
                      className="cyber-button opacity-50"
                      disabled
                      data-testid="button-pending-request"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      {t('profile.requestSent')}
                    </Button>
                  )}
                  {isFriend && (
                    <Badge variant="default" className="px-3 py-1">
                      {t('friends.friends')}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Wallet Information */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-primary" />
              <span>{t('profile.walletInformation')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t('wallet.address')}
              </label>
              <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                <span className="font-mono text-sm flex-1">
                  {formatWalletAddress(user.walletAddress)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(user.walletAddress, "Wallet address")}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openWalletExplorer(user.walletAddress)}
                  className="h-6 w-6 p-0"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>{t('profile.accountDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t('profile.memberSince')}</span>
              <span className="text-sm font-medium">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t('profile.lastUpdated')}</span>
              <span className="text-sm font-medium">
                {new Date(user.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}