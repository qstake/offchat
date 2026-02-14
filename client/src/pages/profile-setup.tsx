import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, User, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import AnimatedBackground from "@/components/animated-background";
const offchatLogo = "/logo.png";
import type { CustomWallet } from "@/lib/walletconnect";

interface ProfileSetupProps {
  walletData: CustomWallet;
  onComplete: (user: any) => void;
}

interface ProfileData {
  username: string;
  bio: string;
  avatar: string;
  avatarPreview?: string;
}

export default function ProfileSetup({ walletData, onComplete }: ProfileSetupProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profileData, setProfileData] = useState<ProfileData>({
    username: "",
    bio: "",
    avatar: "",
    avatarPreview: "",
  });
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [usernameError, setUsernameError] = useState<string>("");
  const { t } = useTranslation();

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const saveOfflineUser = (userData: any) => {
        const offlineUser = {
          id: Date.now(),
          username: userData.username,
          walletAddress: userData.walletAddress,
          bio: userData.bio || null,
          avatar: null,
          isOnline: false,
          createdOffline: true,
        };
        localStorage.setItem('offchat_offline_user', JSON.stringify(offlineUser));
        const safeData = {
          username: userData.username,
          walletAddress: userData.walletAddress,
          bio: userData.bio || null,
          avatar: null,
        };
        localStorage.setItem('offchat_offline_user_full', JSON.stringify(safeData));
        return offlineUser;
      };

      if (!navigator.onLine) {
        return saveOfflineUser(userData);
      }

      try {
        if (userData.avatar && (userData.avatar.includes('storage.googleapis.com') || userData.avatar.includes('/objects/'))) {
          const userWithoutAvatar = { ...userData, avatar: null };
          const response = await fetch('/api/users', {
            method: 'POST',
            body: JSON.stringify(userWithoutAvatar),
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error('Failed to create user');
          }
          
          const user = await response.json();
          
          try {
            const avatarResponse = await fetch(`/api/users/${user.id}/avatar`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ avatarURL: userData.avatar }),
            });
            
            if (avatarResponse.ok) {
              const { objectPath } = await avatarResponse.json();
              user.avatar = objectPath;
            }
          } catch (error) {
            console.error('Error setting avatar after user creation:', error);
          }
          
          return user;
        } else {
          const response = await fetch('/api/users', {
            method: 'POST',
            body: JSON.stringify(userData),
            headers: {
              'Content-Type': 'application/json',
            },
          });
          if (!response.ok) {
            throw new Error('Failed to create user');
          }
          return response.json();
        }
      } catch (error) {
        if (!navigator.onLine || (error instanceof TypeError && error.message.includes('fetch'))) {
          return saveOfflineUser(userData);
        }
        throw error;
      }
    },
    onSuccess: (user) => {
      toast({
        title: t('profile.profileCreated'), 
        description: t('profile.welcomeStartChatting'),
        duration: 1000,
      });
      
      // Call onComplete for parent state update
      onComplete(user);
      
      // Show success message and redirect to chat
      setTimeout(() => {
        toast({
          title: "🎉 " + t('profile.profileCreatedSuccess'),
          description: t('profile.welcomeToOffchat'),
          duration: 1000,
        });
      }, 500);
      
      // Redirect to chat with force reload
      setTimeout(() => {
        window.location.href = '/chat';
        window.location.reload();
      }, 1200);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('profile.profileError'),
        variant: "destructive",
      });
    },
  });

  // Avatar upload handlers
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

  const handleAvatarUploadStart = (file: File) => {
    // Create local preview URL immediately when file is selected
    const previewURL = URL.createObjectURL(file);
    setProfileData(prev => ({ 
      ...prev, 
      avatarPreview: previewURL
    }));
    setIsUploadingAvatar(true);
  };

  const handleAvatarUploadComplete = async (result: { successful: { uploadURL?: string }[] }) => {
    try {
      if (result.successful && result.successful.length > 0) {
        const uploadedFile = result.successful[0];
        const avatarURL = uploadedFile.uploadURL;
        
        if (avatarURL) {
          // Store the upload URL - keep the preview URL for display
          setProfileData(prev => ({ 
            ...prev, 
            avatar: avatarURL
            // Keep existing avatarPreview for immediate display
          }));
          
          toast({
            title: t('common.success'),
            description: t('profile.profilePhotoUploaded'),
          });
        }
      }
    } catch (error) {
      console.error('Error handling avatar upload:', error);
      // Clear preview on error
      setProfileData(prev => ({ 
        ...prev, 
        avatarPreview: ""
      }));
      toast({
        title: t('common.error'),
        description: t('profile.profilePhotoError'),
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Check username availability
  const checkUsername = async (username: string) => {
    if (!username || username.length < 3) {
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
      setUsernameError("");
      console.log('Offline mode: skipping username check');
    }
  };

  const handleUsernameChange = (newUsername: string) => {
    setProfileData(prev => ({ ...prev, username: newUsername }));
    // Debounce username check
    if (newUsername.length >= 3) {
      setTimeout(() => checkUsername(newUsername), 500);
    } else {
      setUsernameError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

    let finalAvatarPath = null;
    
    // If avatar is uploaded, include the raw URL - server will process it
    if (profileData.avatar && (profileData.avatar.includes('storage.googleapis.com') || profileData.avatar.includes('/objects/'))) {
      finalAvatarPath = profileData.avatar;
    }

    const userData = {
      username: profileData.username.trim(),
      walletAddress: walletData.address,
      bio: profileData.bio.trim() || null,
      avatar: finalAvatarPath,
      privateKey: walletData.privateKey,
      mnemonic: walletData.mnemonic,
    };

    createUserMutation.mutate(userData);
  };

  const generateAvatar = () => {
    const firstLetter = profileData.username.charAt(0).toUpperCase();
    setProfileData(prev => ({ 
      ...prev, 
      avatar: firstLetter,
      avatarPreview: '' // Clear preview when using generated avatar
    }));
  };

  return (
    <div className="min-h-screen bg-black text-green-400 relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-950/20 via-black to-green-950/10"></div>
      
      {/* Main Container */}
      <div className="min-h-screen relative z-10 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          {/* Matrix Profile Card */}
          <div className="bg-black/95 border-2 border-green-400/30 backdrop-blur-sm relative">
            {/* Matrix-style borders */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-px bg-green-400/20"></div>
            
            {/* Matrix Header */}
            <div className="text-center py-3 md:py-6 border-b border-green-400/20">
              <div className="relative mb-2 md:mb-4">
                <div className="w-8 h-8 md:w-12 md:h-12 mx-auto relative">
                  <img 
                    src={offchatLogo} 
                    alt="Offchat Logo" 
                    className="w-full h-full object-contain"
                    style={{
                      filter: 'brightness(0) saturate(100%) invert(64%) sepia(98%) saturate(454%) hue-rotate(92deg) brightness(98%) contrast(92%)'
                    }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-base md:text-xl font-mono text-green-400 tracking-widest">
                  {t('profile.identitySetup')}
                </h1>
                <div className="w-16 md:w-20 h-px bg-green-400 mx-auto"></div>
                <p className="text-green-300/70 font-mono text-xs tracking-wide">
                  {t('profile.createDigitalProfile')}
                </p>
              </div>
            </div>
            
            {/* Wallet Status */}
            <div className="p-3 md:p-6 border-b border-green-400/20">
              <div className="bg-black/80 border border-green-400/30 p-2.5 md:p-4">
                <div className="flex items-center space-x-3">
                  <Wallet className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                  <div className="flex-1">
                    <p className="text-green-400 font-mono text-sm tracking-wide mb-1">{t('profile.walletSecured')}</p>
                    <p className="text-green-300/60 text-xs font-mono break-all">
                      {walletData.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>
              
              <form onSubmit={handleSubmit} className="space-y-0">
                {/* Avatar Section */}
                <div className="p-3 md:p-6 text-center">
                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-sm font-mono text-green-400 tracking-wide">{t('profile.avatarSelection')}</h3>
                    
                    <div className="relative w-16 h-16 md:w-24 md:h-24 mx-auto">
                      <Avatar className="w-16 h-16 md:w-24 md:h-24 border-2 border-green-400/50">
                        {(profileData.avatarPreview || profileData.avatar) ? (
                          <AvatarImage 
                            src={profileData.avatarPreview || profileData.avatar} 
                            alt="Profile Avatar" 
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <AvatarFallback className="bg-black text-green-400 text-xl">
                            <User className="w-6 h-6 md:w-10 md:h-10" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    
                    <div className="flex justify-center gap-3">
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={5242880}
                        onGetUploadParameters={handleGetUploadParameters}
                        onComplete={handleAvatarUploadComplete}
                        onFileSelect={handleAvatarUploadStart}
                        buttonClassName="bg-black border-2 border-green-400/30 text-green-400 hover:bg-green-400/5 font-mono text-xs px-4 py-2 tracking-wide"
                      >
                        <Upload className="w-3 h-3 mr-2" />
                        {isUploadingAvatar ? t('profile.uploading') : t('profile.upload')}
                      </ObjectUploader>
                      
                      <Button
                        type="button"
                        className="bg-black border-2 border-green-400/30 text-green-400 hover:bg-green-400/5 font-mono text-xs px-4 py-2 tracking-wide"
                        onClick={generateAvatar}
                        disabled={!profileData.username}
                      >
                        {t('profile.autoGen')}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Username Section */}
                <div className="p-3 md:p-6 border-b border-green-400/20">
                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-sm font-mono text-green-400 tracking-wide text-center">{t('profile.usernameAssignment')}</h3>
                    
                    <div className="space-y-3">
                      <Label htmlFor="username" className="text-xs font-mono text-green-400 tracking-wide">{t('profile.identifier')}</Label>
                      <Input
                        id="username"
                        value={profileData.username}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        placeholder={t('profile.enterUsername')}
                        className="bg-black/90 border-2 border-green-400/30 text-green-300 placeholder:text-green-500/50 font-mono p-2 md:p-3 h-9 md:h-12 tracking-wide focus:border-green-400 focus:ring-1 focus:ring-green-400/20"
                        maxLength={20}
                        required
                      />
                      {usernameError && (
                        <p className="text-red-400 text-xs font-mono tracking-wide">
                          ERROR: {usernameError}
                        </p>
                      )}
                      <div className="flex justify-between">
                        <span className="text-green-300/50 text-xs font-mono">
                          {profileData.username.length > 0 ? t('profile.valid') : t('profile.pending')}
                        </span>
                        <span className="text-green-300/50 text-xs font-mono">
                          {profileData.username.length}/20
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio Section */}
                <div className="p-3 md:p-6">
                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-sm font-mono text-green-400 tracking-wide text-center">{t('profile.bioData')}</h3>
                    
                    <div className="space-y-3">
                      <Label htmlFor="bio" className="text-xs font-mono text-green-400 tracking-wide">{t('profile.description')}</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder={t('profile.enterPersonalInfo')}
                        className="bg-black/90 border-2 border-green-400/30 text-green-300 placeholder:text-green-500/50 font-mono p-2 md:p-3 h-16 md:h-20 text-sm resize-none focus:border-green-400 focus:ring-1 focus:ring-green-400/20"
                        rows={3}
                        maxLength={150}
                      />
                      <div className="flex justify-between">
                        <span className="text-green-300/50 text-xs font-mono">
                          {profileData.bio.length > 0 ? t('profile.dataEntered') : t('profile.optional')}
                        </span>
                        <span className="text-green-300/50 text-xs font-mono">
                          {profileData.bio.length}/150
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Section */}
                <div className="p-3 md:p-6 border-t border-green-400/20">
                  <Button
                    type="submit"
                    className="w-full h-10 md:h-14 bg-black border-2 border-green-400 text-green-400 hover:bg-green-400/10 font-mono text-sm md:text-base tracking-wide disabled:border-green-600/30 disabled:text-green-600/50"
                    disabled={createUserMutation.isPending || !profileData.username.trim() || !!usernameError}
                  >
                    {createUserMutation.isPending ? t('profile.creatingProfile') : t('profile.initializeMatrix')}
                  </Button>
                </div>
              </form>
              
            {/* Matrix Footer */}
            <div className="text-center py-3 md:py-6 border-t border-green-400/20">
              <div className="flex items-center justify-center space-x-4">
                <div className="w-8 h-px bg-green-400/50"></div>
                <span className="text-xs font-mono text-green-400/70 tracking-widest">{t('profile.identityProtocol')}</span>
                <div className="w-8 h-px bg-green-400/50"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}