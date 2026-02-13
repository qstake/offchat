import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Users, Crown, Shield, UserMinus, UserPlus, Edit, Save, X, Ban, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import UserAvatar from "./UserAvatar";

interface GroupAdminPanelProps {
  groupId: string;
  currentUserId: string;
  currentUserRole: string;
  onClose: () => void;
}

interface GroupMember {
  id: string;
  username: string;
  avatar: string | null;
  isOnline: boolean;
  role: string;
}

export default function GroupAdminPanel({ 
  groupId, 
  currentUserId, 
  currentUserRole, 
  onClose 
}: GroupAdminPanelProps) {
  const { t } = useTranslation();
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch group info
  const { data: group } = useQuery({
    queryKey: ['/api/chats', groupId, 'partner', currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/chats/${groupId}/partner/${currentUserId}`);
      if (!response.ok) throw new Error('Failed to fetch group');
      return response.json();
    },
    enabled: !!groupId,
  });

  // Fetch group members
  const { data: members = [] } = useQuery({
    queryKey: ['/api/chats', groupId, 'participants'],
    queryFn: async () => {
      const response = await fetch(`/api/chats/${groupId}/participants`);
      if (!response.ok) throw new Error('Failed to fetch members');
      return response.json();
    },
    enabled: !!groupId,
  });

  // Update group info mutation
  const updateGroupInfoMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      await apiRequest('PATCH', `/api/chats/${groupId}`, {
        ...data,
        userId: currentUserId
      });
    },
    onSuccess: () => {
      toast({
        title: t('common.success'),
        description: t('groups.groupInfoUpdated'),
      });
      setIsEditingInfo(false);
      queryClient.invalidateQueries({ queryKey: ['/api/chats', groupId] });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('groups.failedToUpdateInfo'),
        variant: "destructive",
      });
    },
  });

  // Promote user mutation
  const promoteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest('PATCH', `/api/chats/${groupId}/participants/${userId}/promote`, {
        requesterId: currentUserId
      });
    },
    onSuccess: () => {
      toast({
        title: t('common.success'),
        description: t('groups.userPromoted'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/chats', groupId, 'participants'] });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('groups.failedToPromote'),
        variant: "destructive",
      });
    },
  });

  // Demote user mutation
  const demoteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest('PATCH', `/api/chats/${groupId}/participants/${userId}/demote`, {
        requesterId: currentUserId
      });
    },
    onSuccess: () => {
      toast({
        title: t('common.success'), 
        description: t('groups.userDemoted'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/chats', groupId, 'participants'] });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('groups.failedToDemote'),
        variant: "destructive",
      });
    },
  });

  // Ban user mutation
  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      await apiRequest('POST', `/api/chats/${groupId}/ban`, {
        userId,
        bannedBy: currentUserId,
        reason
      });
    },
    onSuccess: () => {
      toast({
        title: t('common.success'),
        description: t('groups.userBanned'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/chats', groupId, 'participants'] });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('groups.failedToBan'),
        variant: "destructive",
      });
    },
  });

  // Kick user mutation
  const kickUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest('POST', `/api/chats/${groupId}/kick`, {
        userId,
        removedBy: currentUserId
      });
    },
    onSuccess: () => {
      toast({
        title: t('common.success'),
        description: t('groups.userKicked'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/chats', groupId, 'participants'] });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('groups.failedToKick'),
        variant: "destructive",
      });
    },
  });

  const handleStartEdit = () => {
    setEditName(group?.name || "");
    setEditDescription(group?.description || "");
    setIsEditingInfo(true);
  };

  const handleSaveInfo = () => {
    updateGroupInfoMutation.mutate({
      name: editName,
      description: editDescription,
    });
  };

  const handlePromoteUser = (userId: string) => {
    promoteUserMutation.mutate(userId);
  };

  const handleDemoteUser = (userId: string) => {
    demoteUserMutation.mutate(userId);
  };

  const handleBanUser = (userId: string, reason?: string) => {
    banUserMutation.mutate({ userId, reason });
  };

  const handleKickUser = (userId: string) => {
    kickUserMutation.mutate(userId);
  };

  const canManageUsers = currentUserRole === 'owner' || currentUserRole === 'admin';

  return (
    <div className="space-y-6">
      {/* Group Information Edit */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-mono">{t('groups.groupInformation')}</CardTitle>
            {!isEditingInfo && canManageUsers && (
              <Button variant="ghost" size="sm" onClick={handleStartEdit}>
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditingInfo ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="groupName" className="text-xs font-mono">{t('groups.groupName')}</Label>
                <Input
                  id="groupName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupDesc" className="text-xs font-mono">{t('groups.groupDescription')}</Label>
                <Textarea
                  id="groupDesc"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="font-mono text-sm min-h-20"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleSaveInfo}
                  disabled={updateGroupInfoMutation.isPending}
                  className="font-mono"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {t('common.save')}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditingInfo(false)}
                  className="font-mono"
                >
                  <X className="w-4 h-4 mr-2" />
                  {t('common.cancel')}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <Label className="text-xs font-mono text-muted-foreground">{t('groups.groupName')}</Label>
                <p className="text-sm font-mono mt-1">{group?.name || t('groups.unknown')}</p>
              </div>
              {group?.description && (
                <div>
                  <Label className="text-xs font-mono text-muted-foreground">{t('groups.groupDescription')}</Label>
                  <p className="text-sm font-mono mt-1">{group.description}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Member Management */}
      {canManageUsers && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('groups.memberManagement')} ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {members.map((member: GroupMember) => (
                  <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                    <div className="flex items-center space-x-3">
                      <UserAvatar 
                        username={member.username}
                        avatar={member.avatar}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate font-mono">{member.username}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={member.isOnline ? "default" : "secondary"} 
                            className="text-xs font-mono"
                          >
                            {member.isOnline ? t('common.online') : t('common.offline')}
                          </Badge>
                          {member.role === 'owner' && (
                            <Badge variant="secondary" className="text-xs font-mono">
                              <Crown className="w-3 h-3 mr-1 text-yellow-500" />
                              {t('groups.owner')}
                            </Badge>
                          )}
                          {member.role === 'admin' && (
                            <Badge variant="secondary" className="text-xs font-mono">
                              <Shield className="w-3 h-3 mr-1 text-blue-500" />
                              {t('groups.admin')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Admin Actions */}
                    {member.id !== currentUserId && currentUserRole === 'owner' && (
                      <div className="flex gap-1">
                        {member.role === 'member' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePromoteUser(member.id)}
                            disabled={promoteUserMutation.isPending}
                            className="font-mono text-xs"
                          >
                            <UserPlus className="w-3 h-3 mr-1" />
                            {t('groups.makeAdmin')}
                          </Button>
                        )}
                        {member.role === 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDemoteUser(member.id)}
                            disabled={demoteUserMutation.isPending}
                            className="font-mono text-xs"
                          >
                            <UserMinus className="w-3 h-3 mr-1" />
                            {t('groups.removeAdmin')}
                          </Button>
                        )}
                        {/* Ban/Kick buttons */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleKickUser(member.id)}
                          disabled={kickUserMutation.isPending}
                          className="text-xs font-mono text-orange-600 hover:text-orange-700"
                        >
                          <UserX className="w-3 h-3 mr-1" />
                          {t('groups.kick')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBanUser(member.id)}
                          disabled={banUserMutation.isPending}
                          className="text-xs font-mono text-red-600 hover:text-red-700"
                        >
                          <Ban className="w-3 h-3 mr-1" />
                          {t('groups.ban')}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}