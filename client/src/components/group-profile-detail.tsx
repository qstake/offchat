import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Users, Crown, MessageCircle, Settings, UserPlus, Copy, Ban, UserMinus } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import GroupAdminPanel from "@/components/group-admin-panel";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface GroupProfileDetailProps {
  chatId: string;
  currentUserId: string;
  onBack: () => void;
  onStartChat?: () => void;
}

interface GroupMember {
  id: string;
  username: string;
  avatar: string | null;
  isOnline: boolean;
  role: string;
}

export default function GroupProfileDetail({ 
  chatId, 
  currentUserId,
  onBack, 
  onStartChat 
}: GroupProfileDetailProps) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  // Fetch group details
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['/api/chats', chatId, 'partner', currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/chats/${chatId}/partner/${currentUserId}`);
      if (!response.ok) throw new Error('Failed to fetch group');
      return response.json();
    },
    enabled: !!chatId,
  });

  // Fetch group members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['/api/chats', chatId, 'participants'],
    queryFn: async () => {
      const response = await fetch(`/api/chats/${chatId}/participants`);
      if (!response.ok) throw new Error('Failed to fetch members');
      return response.json();
    },
    enabled: !!chatId
  });

  // Get current user's role - make sure members is an array
  const membersList = Array.isArray(members) ? members : [];
  const currentUserRole = membersList.find((m: GroupMember) => m.id === currentUserId)?.role || 'member';
  const isCurrentUserAdmin = currentUserRole === 'admin' || currentUserRole === 'owner';

  // Fetch banned members
  const { data: bannedMembers = [], isLoading: bannedLoading } = useQuery({
    queryKey: ['/api/chats', chatId, 'banned'],
    queryFn: async () => {
      const response = await fetch(`/api/chats/${chatId}/banned`);
      if (!response.ok) throw new Error('Failed to fetch banned members');
      return response.json();
    },
    enabled: !!chatId && isCurrentUserAdmin
  });


  const isLoading = groupLoading || membersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">{t('groups.loadingGroup')}</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">{t('groups.groupNotFound')}</p>
          <Button onClick={onBack} variant="outline" className="mt-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('groups.goBack')}
          </Button>
        </div>
      </div>
    );
  }

  const copyGroupUsername = () => {
    if (group.username) {
      navigator.clipboard.writeText(`@${group.username}`);
      toast({
        title: t('groups.copied'),
        description: t('groups.usernameCopied'),
      });
    }
  };

  const currentUserMember = membersList.find((m: GroupMember) => m.id === currentUserId);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              size="sm"
              variant="outline"
              onClick={onBack}
              className="cyber-button w-8 h-8 rounded-full"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">{t('groups.groupInfo')}</h1>
          </div>
          {isCurrentUserAdmin && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="cyber-button">
                  <Settings className="w-4 h-4 mr-2" />
                  {t('groups.manageGroup')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-mono">{t('groups.groupManagement')}</DialogTitle>
                </DialogHeader>
                <GroupAdminPanel 
                  groupId={chatId}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  onClose={() => {}}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main Group Card */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Group Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/25 to-primary/15 border-2 border-primary/20 shadow-lg">
                  {group.avatar && group.avatar.length > 1 ? (
                    <img 
                      src={group.avatar} 
                      alt="Group" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {group.avatar && group.avatar.length === 1 ? (
                        <span className="text-primary font-mono text-3xl font-bold">{group.avatar}</span>
                      ) : (
                        <span className="text-primary text-3xl">🔥</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Group Info */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {group.name}
                </h2>
                {group.username && (
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-sm text-muted-foreground font-mono">
                      @{group.username}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyGroupUsername}
                      className="h-5 w-5 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                {group.description && (
                  <p className="text-muted-foreground max-w-sm">
                    {group.description}
                  </p>
                )}
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{t('groups.membersCount', { count: membersList.length })}</span>
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 mt-4">
                <Button
                  onClick={onStartChat}
                  className="cyber-button"
                  data-testid="button-open-chat"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {t('groups.openChat')}
                </Button>
                {isCurrentUserAdmin && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="cyber-button"
                        data-testid="button-manage-group"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        {t('groups.manageGroup')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="font-mono">{t('groups.groupManagement')}</DialogTitle>
                      </DialogHeader>
                      <GroupAdminPanel 
                        groupId={chatId}
                        currentUserId={currentUserId}
                        currentUserRole={currentUserRole}
                        onClose={() => {}}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <span>{t('groups.members')} ({membersList.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {membersList.map((member: GroupMember, index: number) => (
                <div key={member.id}>
                  <div className="flex items-center space-x-3">
                    <div 
                      className="relative cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => member.id !== currentUserId && setLocation(`/profile/user/${member.id}`)}
                      data-testid={`button-view-profile-${member.id}`}
                    >
                      <UserAvatar 
                        username={member.username} 
                        avatar={member.avatar}
                        size="sm"
                        className="w-10 h-10"
                      />
                      {member.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full ring-2 ring-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p 
                          className="text-sm font-medium text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                          onClick={() => member.id !== currentUserId && setLocation(`/profile/user/${member.id}`)}
                          data-testid={`text-username-${member.id}`}
                        >
                          {member.username}
                        </p>
                        {member.role === 'admin' && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {member.isOnline ? t('common.online') : t('common.offline')} • {member.role}
                      </p>
                    </div>
                    {member.id !== currentUserId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-6 px-2 cyber-button"
                        onClick={() => setLocation(`/profile/user/${member.id}`)}
                        data-testid={`button-view-member-${member.id}`}
                      >
                        {t('groups.viewProfile')}
                      </Button>
                    )}
                  </div>
                  {index < membersList.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Group Details */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>{t('groups.groupDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t('groups.created')}</span>
              <span className="text-sm font-medium">
                {new Date(group.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t('groups.type')}</span>
              <Badge variant="secondary">{t('groups.publicGroup')}</Badge>
            </div>
            {group.username && (
              <>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('groups.searchable')}</span>
                  <Badge variant="default">{t('groups.yes')}</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Banned Members Section - Only for admins */}
        {isCurrentUserAdmin && bannedMembers.length > 0 && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-500" />
                {t('groups.bannedMembers')} ({bannedMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bannedMembers.map((bannedMember: any, index: number) => (
                  <div key={bannedMember.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <UserAvatar 
                          username={bannedMember.username}
                          avatar={bannedMember.avatar}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{bannedMember.username}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="destructive" className="text-xs">
                              <Ban className="w-3 h-3 mr-1" />
                              {t('groups.banned')}
                            </Badge>
                            {bannedMember.reason && (
                              <span className="text-xs text-muted-foreground truncate">
                                {t('groups.reason')}: {bannedMember.reason}
                              </span>
                            )}
                          </div>
                          {bannedMember.bannedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {t('groups.bannedDate')}: {new Date(bannedMember.bannedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {index < bannedMembers.length - 1 && <Separator className="mt-3" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}