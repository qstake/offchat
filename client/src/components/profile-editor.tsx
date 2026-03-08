import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Edit, Save, Upload, Wallet, LogOut, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ObjectUploader } from "./ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { useTranslation } from 'react-i18next';

interface User {
  id: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  walletAddress: string | null;
  isOnline: boolean;
  createdAt: string;
}

interface ProfileEditorProps {
  currentUser: User;
  onLogout?: () => void;
}

export default function ProfileEditor({ currentUser, onLogout }: ProfileEditorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    username: currentUser.username,
    bio: currentUser.bio || "",
    avatar: currentUser.avatar || "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [usernameError, setUsernameError] = useState<string>("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Profile could not be updated');
      }
      return response.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: t('profile.profileUpdated'),
        description: t('profile.profileUpdatedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/wallet', currentUser.walletAddress] });
      queryClient.setQueryData(['/api/users/wallet', currentUser.walletAddress], updatedUser);
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('profile.updateError'),
        variant: "destructive",
      });
    },
  });

  const checkUsername = async (username: string) => {
    if (!username || username.length < 3 || username === currentUser.username) {
      setUsernameError("");
      return;
    }
    
    try {
      const response = await fetch(`/api/users/username/${username}`);
      if (response.status === 200) {
        setUsernameError(t('profile.usernameTaken'));
      } else if (response.status === 404) {
        setUsernameError("");
      }
    } catch (error) {
      console.error('Username check error:', error);
    }
  };

  const handleUsernameChange = (newUsername: string) => {
    setProfileData(prev => ({ ...prev, username: newUsername }));
    if (newUsername.length >= 3) {
      setTimeout(() => checkUsername(newUsername), 500);
    } else {
      setUsernameError("");
    }
  };

  const handleSave = () => {
    if (!profileData.username.trim()) {
      toast({
        title: t('common.error'),
        description: t('profile.usernameRequired'),
        variant: "destructive",
      });
      return;
    }

    if (profileData.username.length < 3) {
      toast({
        title: t('common.error'), 
        description: t('profile.usernameMinLength'),
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

    const updateData = {
      username: profileData.username.trim(),
      bio: profileData.bio.trim() || null,
      avatar: profileData.avatar || null,
    };

    updateProfileMutation.mutate(updateData);
  };

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

  const handleAvatarUploadComplete = async (result: { successful: { uploadURL?: string }[] }) => {
    try {
      if (result.successful && result.successful.length > 0) {
        const uploadedFile = result.successful[0];
        const avatarURL = uploadedFile.uploadURL;
        
        const response = await fetch(`/api/users/${currentUser.id}/avatar`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ avatarURL }),
        });
        
        if (!response.ok) throw new Error('Failed to update avatar');
        
        const { objectPath } = await response.json();
        
        setProfileData(prev => ({ ...prev, avatar: objectPath }));
        
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        
        toast({
          title: t('common.success'),
          description: t('profile.profilePhotoUploaded'),
        });
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast({
        title: t('common.error'),
        description: t('profile.profilePhotoError'),
        variant: "destructive",
      });
    }
  };

  const generateAvatar = () => {
    const firstLetter = profileData.username.charAt(0).toUpperCase();
    setProfileData(prev => ({ ...prev, avatar: firstLetter }));
    setAvatarPreview("");
  };

  const resetForm = () => {
    setProfileData({
      username: currentUser.username,
      bio: currentUser.bio || "",
      avatar: currentUser.avatar || "",
    });
    setAvatarPreview("");
    setUsernameError("");
    setIsEditing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="cyber-button w-full justify-start p-3 h-auto bg-black/40 border border-primary/20 hover:bg-primary/10 hover:border-primary/30 transition-all duration-150 neon-glow"
          data-testid="button-profile-edit"
        >
          <div className="flex items-center space-x-3 w-full min-w-0">
            <div className="relative shrink-0">
              <Avatar className="w-10 h-10 border border-primary/30">
                {currentUser.avatar && currentUser.avatar.length > 1 ? (
                  <AvatarImage src={currentUser.avatar} alt="Profile" />
                ) : (
                  <AvatarFallback className="bg-primary/20 text-primary font-mono text-sm">
                    {currentUser.avatar && currentUser.avatar.length === 1 
                      ? currentUser.avatar 
                      : currentUser.username.charAt(0).toUpperCase()
                    }
                  </AvatarFallback>
                )}
              </Avatar>
              {currentUser.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border border-black animate-pulse" />
              )}
            </div>
            <div className="flex-1 text-left min-w-0 overflow-hidden">
              <div className="flex items-center space-x-2 mb-1">
                <p className="font-mono text-primary text-sm font-medium truncate tracking-wide">{currentUser.username}</p>
                <Badge 
                  variant={currentUser.isOnline ? "default" : "secondary"} 
                  className={`text-[10px] h-4 px-1.5 font-mono shrink-0 ${
                    currentUser.isOnline 
                      ? 'bg-primary/20 text-primary border-primary/30' 
                      : 'bg-muted/30 text-muted-foreground border-muted/40'
                  }`}
                >
                  {currentUser.isOnline ? t('common.online') : t('common.offline')}
                </Badge>
              </div>
              {currentUser.bio && (
                <p className="text-xs text-primary/60 line-clamp-1 font-mono pr-2 break-all">{currentUser.bio}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Wallet className="w-3 h-3 text-primary/40 shrink-0" />
                <p className="text-[10px] text-primary/40 font-mono truncate">
                  {currentUser.walletAddress?.slice(0, 8)}...{currentUser.walletAddress?.slice(-6)}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-1 shrink-0">
              <Edit className="w-4 h-4 text-primary/60" />
              <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
            </div>
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[calc(100vw-24px)] max-w-md max-h-[85vh] overflow-hidden bg-black/95 border-primary/20 backdrop-blur-md p-0 rounded-xl">
        <div className="glass-card border-primary/10 flex flex-col max-h-[85vh]">
          <DialogHeader className="p-3 sm:p-4 border-b border-primary/20 bg-gradient-to-r from-primary/5 to-transparent shrink-0">
            <DialogTitle className="text-primary font-mono flex items-center gap-2 text-base tracking-wider">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <User className="w-4 h-4" />
              <span className="truncate">{isEditing ? t('profile.editProfile') : t('profile.userProfileData')}</span>
            </DialogTitle>
            <p className="text-[10px] sm:text-xs text-primary/60 font-mono mt-1 truncate">
              › {isEditing ? t('profile.modifyParameters') : t('profile.displayInformation')}
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-4">
            <div className="bg-black/60 border border-primary/20 rounded-lg p-2.5 sm:p-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-primary/80 font-mono tracking-wider uppercase mb-1 flex items-center gap-1">
                    <span className="w-1 h-1 bg-primary rounded-full inline-block"></span>
                    {t('wallet.networkAddress')}
                  </p>
                  <p className="text-[10px] sm:text-xs font-mono text-primary/70 truncate bg-black/40 px-2 py-1 rounded border border-primary/10">
                    {currentUser.walletAddress}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-primary/30 bg-black/60 flex items-center justify-center overflow-hidden">
                  <Avatar className="w-14 h-14 sm:w-16 sm:h-16">
                    {profileData.avatar && profileData.avatar.length > 1 ? (
                      <AvatarImage src={profileData.avatar} alt="Profile" />
                    ) : (
                      <AvatarFallback className="bg-primary/20 text-primary text-lg font-mono border border-primary/20">
                        {profileData.avatar && profileData.avatar.length === 1 
                          ? profileData.avatar 
                          : <User className="w-5 h-5 sm:w-6 sm:h-6" />
                        }
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-primary/20 rounded-full border border-primary/30 flex items-center justify-center">
                  <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                </div>
              </div>
              
              {isEditing && (
                <div className="flex gap-2 w-full max-w-[260px]">
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5 * 1024 * 1024}
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleAvatarUploadComplete}
                    buttonClassName="cyber-button bg-primary/10 border-primary/30 hover:bg-primary/20 text-primary text-[11px] px-3 py-2 font-mono transition-all duration-150 flex-1"
                  >
                    <Camera className="w-3 h-3 mr-1" />
                    {t('profile.upload')}
                  </ObjectUploader>
                  
                  <Button
                    type="button"
                    className="cyber-button bg-black/40 border-primary/20 hover:bg-primary/10 text-primary text-[11px] px-3 py-2 font-mono transition-all duration-150 flex-1"
                    onClick={generateAvatar}
                    disabled={!profileData.username}
                    data-testid="button-generate-profile-avatar"
                  >
                    {t('profile.autoGen')}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-mono text-primary/80 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-1 bg-primary rounded-full inline-block"></span>
                {t('profile.usernameId')}
              </Label>
              {isEditing ? (
                <>
                  <Input
                    id="username"
                    value={profileData.username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    className={`cyber-input bg-black/40 border-primary/20 hover:border-primary/30 focus:border-primary/50 text-primary placeholder:text-primary/40 font-mono text-sm h-10 transition-all duration-150 ${
                      usernameError ? 'border-red-500/50 focus:border-red-500' : ''
                    }`}
                    maxLength={20}
                    placeholder="Enter matrix identifier..."
                    data-testid="input-profile-username"
                  />
                  <p className={`text-[10px] font-mono flex items-center gap-1 ${
                    usernameError ? 'text-red-400' : 'text-primary/50'
                  }`}>
                    <span className="w-1 h-1 bg-current rounded-full inline-block"></span>
                    {usernameError || t('profile.usernameHint')}
                  </p>
                </>
              ) : (
                <div className="bg-black/40 border border-primary/20 rounded-lg p-2.5">
                  <p className="text-sm font-mono text-primary">{currentUser.username}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-xs font-mono text-primary/80 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-1 bg-primary rounded-full inline-block"></span>
                {t('profile.bioInformation')}
              </Label>
              {isEditing ? (
                <>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder={t('profile.enterPersonalInfo')}
                    className="cyber-input bg-black/40 border-primary/20 hover:border-primary/30 focus:border-primary/50 text-primary placeholder:text-primary/40 font-mono resize-none transition-all duration-150 text-sm h-20"
                    rows={3}
                    maxLength={150}
                    data-testid="textarea-profile-bio"
                  />
                  <p className="text-[10px] font-mono text-primary/50 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 bg-primary/50 rounded-full inline-block"></span>
                      {t('profile.description')}
                    </span>
                    <span>{profileData.bio.length}/150</span>
                  </p>
                </>
              ) : (
                <div className="bg-black/40 border border-primary/20 rounded-lg p-2.5 min-h-[48px] flex items-center">
                  <p className="text-sm font-mono text-primary/70">
                    {currentUser.bio || t('profile.noBio')}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-mono text-primary/80 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-1 bg-primary rounded-full inline-block"></span>
                {t('profile.registrationDate')}
              </Label>
              <div className="bg-black/40 border border-primary/20 rounded-lg p-2.5">
                <p className="text-sm font-mono text-primary/70">
                  › {new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        
          <div className="p-3 sm:p-4 border-t border-primary/20 bg-gradient-to-r from-primary/5 to-transparent shrink-0">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              {onLogout && (
                <Button
                  onClick={onLogout}
                  className="cyber-button bg-black/60 border border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 text-red-400 text-[11px] font-mono px-3 py-2 h-9 transition-all duration-150"
                  data-testid="button-logout"
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  {t('wallet.disconnect')}
                </Button>
              )}
              
              <div className="flex gap-2 ml-auto">
                {isEditing ? (
                  <>
                    <Button
                      onClick={resetForm}
                      disabled={updateProfileMutation.isPending}
                      className="cyber-button bg-black/40 border-primary/20 hover:bg-black/60 hover:border-primary/30 text-primary text-[11px] font-mono px-3 py-2 h-9 transition-all duration-150"
                      data-testid="button-cancel-edit"
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={updateProfileMutation.isPending || !!usernameError}
                      className="cyber-button bg-primary/20 hover:bg-primary/30 border-primary/50 hover:border-primary text-primary text-[11px] font-mono px-3 py-2 h-9 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed neon-glow"
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin"></div>
                          {t('profile.updating')}
                        </div>
                      ) : (
                        <>
                          <Save className="w-3 h-3 mr-1" />
                          {t('common.save')}
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="cyber-button bg-primary/20 hover:bg-primary/30 border-primary/50 hover:border-primary text-primary text-[11px] font-mono px-3 py-2 h-9 transition-all duration-150 neon-glow"
                    data-testid="button-edit-profile"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    {t('profile.editProfile')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
