import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, MessageCircle, Settings, X, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ObjectUploader } from "./ObjectUploader";

interface User {
  id: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  isOnline: boolean;
}

interface Chat {
  id: string;
  name: string | null;
  isGroup: boolean;
  createdAt: string;
}

interface GroupManagementProps {
  currentUserId: string;
  onGroupCreated: (groupId: string) => void;
}

export default function GroupManagement({ currentUserId, onGroupCreated }: GroupManagementProps) {
  const { t } = useTranslation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupUsername, setGroupUsername] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupPhoto, setGroupPhoto] = useState<string>("");
  const [usernameError, setUsernameError] = useState<string>("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Photo upload handlers
  const handleGetUploadParameters = async () => {
    try {
      const response = await fetch('/api/objects/upload', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to get upload URL');
      const { uploadURL } = await response.json();
      return { method: 'PUT' as const, url: uploadURL };
    } catch (error) {
      console.error('Error getting upload parameters:', error);
      throw error;
    }
  };

  const handleGroupPhotoUploadComplete = async (result: { successful: { uploadURL?: string }[] }) => {
    try {
      if (result.successful && result.successful.length > 0) {
        const uploadedFile = result.successful[0];
        const photoURL = uploadedFile.uploadURL;
        
        if (photoURL) {
          setGroupPhoto(photoURL);
          toast({
            title: t('common.success'),
            description: t('groups.groupPhotoUploaded'),
          });
        }
      }
    } catch (error) {
      console.error('Error uploading group photo:', error);
      toast({
        title: t('common.error'),
        description: t('groups.groupPhotoError'),
        variant: "destructive",
      });
    }
  };

  const generateGroupAvatar = () => {
    if (groupName.trim()) {
      const firstLetter = groupName.trim().charAt(0).toUpperCase();
      setGroupPhoto(firstLetter);
    }
  };

  // Check group username availability
  const checkGroupUsername = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameError("");
      return;
    }
    
    try {
      const response = await fetch(`/api/chats/username/${username}`);
      if (response.status === 200) {
        setUsernameError(t('groups.usernameTaken'));
      } else if (response.status === 404) {
        setUsernameError("");
      }
    } catch (error) {
      console.error('Username check error:', error);
    }
  };

  const handleUsernameChange = (newUsername: string) => {
    // Only allow lowercase letters, numbers, and underscores
    const cleanUsername = newUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setGroupUsername(cleanUsername);
    if (cleanUsername.length >= 3) {
      setTimeout(() => checkGroupUsername(cleanUsername), 500);
    } else {
      setUsernameError("");
    }
  };

  // Fetch user's friends for group creation
  const { data: friends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ['/api/friends', currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/friends/${currentUserId}`);
      if (!response.ok) throw new Error('Failed to fetch friends');
      return response.json();
    },
    enabled: !!currentUserId,
  });

  // Groups are now displayed in the main chat list only

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: { name: string; username?: string; description?: string; photo?: string; members: string[] }) => {
      // Create the group chat (without avatar initially)
      const chatPayload = {
        name: groupData.name,
        username: groupData.username || null,
        description: groupData.description || null,
        isGroup: true,
        avatar: null, // Will be set via separate endpoint
      };
      
      const chatResponse = await fetch('/api/chats', {
        method: 'POST',
        body: JSON.stringify(chatPayload),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!chatResponse.ok) throw new Error('Failed to create group');
      const chat = await chatResponse.json();

      // Process avatar if provided (similar to user avatar processing)
      if (groupData.photo && groupData.photo.includes('storage.googleapis.com')) {
        try {
          const avatarResponse = await fetch(`/api/chats/${chat.id}/avatar`, {
            method: 'PUT',
            body: JSON.stringify({ avatarURL: groupData.photo }),
            headers: {
              'Content-Type': 'application/json',
            },
          });
          if (avatarResponse.ok) {
            const { objectPath } = await avatarResponse.json();
            console.log('Group avatar processed successfully:', objectPath);
          }
        } catch (avatarError) {
          console.error('Failed to process group avatar:', avatarError);
        }
      }

      // Add creator to the group as owner
      await fetch(`/api/chats/${chat.id}/participants`, {
        method: 'POST',
        body: JSON.stringify({
          userId: currentUserId,
          role: 'owner'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Add selected members to the group
      for (const memberId of groupData.members) {
        await fetch(`/api/chats/${chat.id}/participants`, {
          method: 'POST',
          body: JSON.stringify({
            userId: memberId,
            role: 'member'
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      return chat;
    },
    onSuccess: (group) => {
      toast({
        title: t('groups.groupCreated'),
        description: t('groups.groupCreatedDesc', { name: group.name }),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      setIsCreateDialogOpen(false);
      setGroupName("");
      setGroupUsername("");
      setGroupDescription("");
      setGroupPhoto("");
      setSelectedMembers([]);
      setUsernameError("");
      onGroupCreated(group.id);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('groups.groupCreateError'),
        variant: "destructive",
      });
    },
  });

  const handleMemberToggle = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast({
        title: t('common.error'),
        description: t('groups.groupNameRequired'),
        variant: "destructive",
      });
      return;
    }

    if (groupUsername && groupUsername.length < 3) {
      toast({
        title: t('common.error'),
        description: t('groups.usernameMinLength'),
        variant: "destructive",
      });
      return;
    }

    if (usernameError) {
      toast({
        title: t('common.error'),
        description: usernameError,
        variant: "destructive",
      });
      return;
    }

    if (selectedMembers.length === 0) {
      toast({
        title: t('common.error'),
        description: t('groups.selectAtLeastOneMember'),
        variant: "destructive",
      });
      return;
    }

    createGroupMutation.mutate({
      name: groupName.trim(),
      username: groupUsername.trim() || undefined,
      description: groupDescription.trim() || undefined,
      photo: groupPhoto || undefined,
      members: selectedMembers,
    });
  };

  return (
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="cyber-button w-full bg-black/40 border-primary/30 hover:bg-primary/10 hover:border-primary/50 text-primary h-8 px-2 text-xs font-mono transition-all duration-150 neon-glow flex items-center justify-center gap-1.5"
            data-testid="button-create-group"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span className="text-[10px] tracking-wider">{t('groups.group')}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-hidden bg-black/95 border-primary/20 backdrop-blur-md p-0 rounded-xl">
          <div className="glass-card border-primary/10">
            <DialogHeader className="p-4 pb-3 border-b border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <DialogTitle className="text-primary font-mono flex items-center gap-2 text-lg tracking-wider">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <UserPlus className="w-4 h-4" />
                {t('groups.groupMatrixCreation')}
              </DialogTitle>
              <p className="text-xs text-primary/60 font-mono mt-1">
                {t('groups.initializeGroup')}
              </p>
            </DialogHeader>
          
            <div className="p-4 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              {/* Group Avatar Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-2 border-primary/30 bg-black/60 flex items-center justify-center overflow-hidden">
                    <Avatar className="w-16 h-16">
                      {groupPhoto && groupPhoto.length > 1 ? (
                        <AvatarImage 
                          src={groupPhoto} 
                          alt="Group Photo"
                          onError={() => console.error('Failed to load group photo in management:', groupPhoto)}
                        />
                      ) : (
                        <AvatarFallback className="bg-primary/20 text-primary text-lg font-mono border border-primary/20">
                          {groupPhoto && groupPhoto.length === 1 
                            ? groupPhoto 
                            : <Users className="w-6 h-6" />
                          }
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary/20 rounded-full border border-primary/30 flex items-center justify-center">
                    <Camera className="w-3 h-3 text-primary" />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5 * 1024 * 1024}
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleGroupPhotoUploadComplete}
                    buttonClassName="cyber-button bg-primary/10 border-primary/30 hover:bg-primary/20 text-primary text-xs px-3 py-2 font-mono transition-all duration-150"
                  >
                    <Camera className="w-3 h-3 mr-1.5" />
                    {t('profile.upload')}
                  </ObjectUploader>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cyber-button bg-black/40 border-primary/20 hover:bg-primary/10 text-primary text-xs px-3 py-2 font-mono transition-all duration-150"
                    onClick={generateGroupAvatar}
                    disabled={!groupName.trim()}
                    data-testid="button-generate-avatar"
                  >
                    {t('groups.auto')}
                  </Button>
                </div>
              </div>

              {/* Group Name */}
              <div className="space-y-3">
                <Label htmlFor="group-name" className="text-sm font-mono text-primary/80 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  {t('groups.groupName')} *
                </Label>
                <Input
                  id="group-name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder={t('groups.enterGroupName')}
                  className="cyber-input bg-black/40 border-primary/20 hover:border-primary/30 focus:border-primary/50 text-primary placeholder:text-primary/40 font-mono transition-all duration-150"
                  maxLength={50}
                  data-testid="input-group-name"
                />
              </div>

              {/* Group Username */}
              <div className="space-y-3">
                <Label htmlFor="group-username" className="text-sm font-mono text-primary/80 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  {t('groups.handleIdentifier')}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/60 text-sm font-mono">›</span>
                  <Input
                    id="group-username"
                    value={groupUsername}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="matrix_group_handle"
                    className={`pl-8 cyber-input bg-black/40 border-primary/20 hover:border-primary/30 focus:border-primary/50 text-primary placeholder:text-primary/40 font-mono transition-all duration-150 ${
                      usernameError ? 'border-red-500/50 focus:border-red-500' : ''
                    }`}
                    maxLength={20}
                    data-testid="input-group-username"
                  />
                </div>
                <p className={`text-xs font-mono flex items-center gap-1 ${
                  usernameError ? 'text-red-400' : 'text-primary/50'
                }`}>
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                  {usernameError || t('groups.usernameHelp')}
                </p>
              </div>
              
              {/* Group Description */}
              <div className="space-y-3">
                <Label htmlFor="group-description" className="text-sm font-mono text-primary/80 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  {t('groups.groupDescription')}
                </Label>
                <Textarea
                  id="group-description"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder={t('groups.enterGroupDescription')}
                  className="cyber-input bg-black/40 border-primary/20 hover:border-primary/30 focus:border-primary/50 text-primary placeholder:text-primary/40 font-mono resize-none transition-all duration-150"
                  rows={3}
                  maxLength={100}
                  data-testid="textarea-group-description"
                />
                <p className="text-xs font-mono text-primary/50 flex items-center gap-1">
                  <div className="w-1 h-1 bg-primary/50 rounded-full"></div>
                  {t('groups.charactersRemaining', { count: 100 - groupDescription.length })}
                </p>
              </div>

              {/* Member Selection Matrix */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <Label className="text-sm font-mono text-primary/80 uppercase tracking-wider flex items-center gap-2">
                    <div className="w-1 h-1 bg-primary rounded-full"></div>
                    {t('groups.networkMembers')}
                  </Label>
                  <Badge variant="outline" className="text-xs font-mono bg-primary/10 border-primary/30 text-primary px-2 py-1">
                    {selectedMembers.length} {t('groups.selected')}
                  </Badge>
                </div>
                
                <div className="border border-primary/20 rounded-lg bg-black/40 backdrop-blur-sm">
                  <ScrollArea className="h-52 p-3">
                    {friendsLoading ? (
                      <div className="flex flex-col items-center justify-center py-8 space-y-2">
                        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <div className="text-primary/60 text-xs font-mono">{t('friends.scanningNetwork')}</div>
                      </div>
                    ) : (friends as User[]).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 space-y-3">
                        <Users className="w-8 h-8 text-primary/30" />
                        <div className="text-center">
                          <div className="text-primary/60 text-xs font-mono mb-1">{t('groups.noConnectionsFound')}</div>
                          <div className="text-primary/40 text-[10px] font-mono">{t('groups.addFriendsToGroup')}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(friends as User[]).map((friend: User) => (
                          <div
                            key={friend.id}
                            className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-150 group border ${
                              selectedMembers.includes(friend.id) 
                                ? 'bg-primary/10 border-primary/30 hover:bg-primary/15' 
                                : 'bg-black/20 border-primary/10 hover:bg-black/40 hover:border-primary/20'
                            }`}
                            onClick={() => handleMemberToggle(friend.id)}
                            data-testid={`member-option-${friend.id}`}
                          >
                            <div className={`w-4 h-4 rounded border-2 transition-all duration-150 flex items-center justify-center ${
                              selectedMembers.includes(friend.id)
                                ? 'bg-primary border-primary text-black'
                                : 'border-primary/30 group-hover:border-primary/50'
                            }`}>
                              {selectedMembers.includes(friend.id) && (
                                <div className="w-2 h-2 bg-black rounded-full"></div>
                              )}
                            </div>
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="relative">
                                <Avatar className="w-8 h-8 border border-primary/20">
                                  <AvatarImage src={friend.avatar || undefined} />
                                  <AvatarFallback className="bg-primary/20 text-primary text-sm font-mono">
                                    {friend.username.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                {friend.isOnline && (
                                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full border border-black animate-pulse" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-mono text-sm text-primary group-hover:text-primary/80 transition-colors">{friend.username}</p>
                                {friend.bio && (
                                  <p className="text-xs text-primary/60 truncate font-mono">{friend.bio}</p>
                                )}
                                <Badge 
                                  variant={friend.isOnline ? "default" : "secondary"} 
                                  className={`text-[10px] h-3 px-1 mt-1 font-mono ${
                                    friend.isOnline 
                                      ? 'bg-primary/20 text-primary border-primary/30' 
                                      : 'bg-muted/30 text-muted-foreground border-muted/40'
                                  }`}
                                >
                                  {friend.isOnline ? t('common.online').toUpperCase() : t('common.offline').toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>

          </div>
          
            {/* Action Matrix */}
            <div className="p-4 border-t border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex justify-between gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="cyber-button bg-black/40 border-primary/20 hover:bg-black/60 hover:border-primary/30 text-primary font-mono text-xs px-4 transition-all duration-150"
                  data-testid="button-cancel-group"
                >
                  {t('common.cancel').toUpperCase()}
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateGroup}
                  disabled={createGroupMutation.isPending || !groupName.trim() || selectedMembers.length === 0}
                  className="cyber-button bg-primary/20 hover:bg-primary/30 border-primary/50 hover:border-primary text-primary font-mono text-xs px-4 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed neon-glow"
                  data-testid="button-create-group-submit"
                >
                  {createGroupMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin"></div>
                      {t('groups.initializing')}
                    </div>
                  ) : (
                    t('groups.createGroup').toUpperCase()
                  )}
                </Button>
              </div>
              <div className="mt-2 text-center">
                <p className="text-[10px] font-mono text-primary/40">
                  {t('groups.willBeCreatedWith', { count: selectedMembers.length })}
                </p>
              </div>
            </div>
        </div>
        </DialogContent>
      </Dialog>
  );
}