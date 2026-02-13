import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  User, 
  Calendar, 
  Hash,
  MessageCircle,
  UserPlus,
  Settings,
  Crown,
  Shield,
  Info
} from "lucide-react";
import { useTranslation } from 'react-i18next';

interface UserProfileProps {
  type: 'user';
  user: {
    id: string;
    username: string;
    avatar: string | null;
    bio: string | null;
    isOnline: boolean;
    createdAt: string;
    walletAddress?: string;
  };
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface GroupProfileProps {
  type: 'group';
  group: {
    id: string;
    name: string;
    username?: string | null;
    avatar: string | null;
    description: string | null;
    createdAt: string;
    memberCount?: number;
    members?: Array<{
      id: string;
      username: string;
      avatar: string | null;
      role: string;
    }>;
  };
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
}

type ProfileDetailProps = UserProfileProps | GroupProfileProps;

export default function ProfileDetail(props: ProfileDetailProps) {
  const { t } = useTranslation();
  const { isOpen, onClose, currentUserId } = props;

  if (props.type === 'user') {
    const { user } = props;
    
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-sm w-[95vw] max-h-[85vh] overflow-y-auto bg-card border-border p-0 gap-0">
          <DialogHeader className="p-4 pb-3 border-b border-border/20 bg-muted/30">
            <DialogTitle className="text-foreground font-mono flex items-center space-x-2 text-base font-semibold">
              <User className="w-4 h-4" />
              <span>{t('profile.userProfile')}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 space-y-4">
            {/* Profile Photo & Basic Info */}
            <div className="text-center space-y-3">
              <div className="relative w-20 h-20 mx-auto">
                <Avatar className="w-20 h-20 border border-border/50 shadow-lg">
                  {user.avatar && user.avatar.length > 1 ? (
                    <AvatarImage src={user.avatar} alt="Profile" />
                  ) : (
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl font-mono">
                      {user.avatar && user.avatar.length === 1 
                        ? user.avatar 
                        : user.username.charAt(0).toUpperCase()
                      }
                    </AvatarFallback>
                  )}
                </Avatar>
                {user.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background shadow-sm" />
                )}
              </div>
              
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground font-mono">{user.username}</h2>
                <Badge variant={user.isOnline ? "default" : "secondary"} className="text-xs">
                  {user.isOnline ? t('common.online') : t('common.offline')}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Bio */}
            {user.bio && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t('profile.about')}</span>
                </div>
                <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
                  {user.bio}
                </p>
              </div>
            )}

            {/* Member Since */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t('profile.memberSince')}</span>
              </div>
              <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {/* Wallet Address (if available) */}
            {user.walletAddress && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t('wallet.title')}</span>
                </div>
                <p className="text-xs font-mono text-muted-foreground bg-muted/20 p-3 rounded-lg break-all">
                  {user.walletAddress}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-border/20 bg-muted/30">
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                {t('profile.sendMessage')}
              </Button>
              {currentUserId !== user.id && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  {t('friends.addFriend')}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  } else {
    const { group } = props;
    
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-sm w-[95vw] max-h-[85vh] overflow-y-auto bg-card border-border p-0 gap-0">
          <DialogHeader className="p-4 pb-3 border-b border-border/20 bg-muted/30">
            <DialogTitle className="text-foreground font-mono flex items-center space-x-2 text-base font-semibold">
              <Users className="w-4 h-4" />
              <span>{t('profile.groupDetails')}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 space-y-4">
            {/* Group Photo & Basic Info */}
            <div className="text-center space-y-3">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 rounded-3xl overflow-hidden bg-gradient-to-br from-primary/30 to-primary/20 border-2 border-primary/30 shadow-lg">
                  {group.avatar && group.avatar.length > 1 ? (
                    <img src={group.avatar} alt="Group Photo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {group.avatar && group.avatar.length === 1 ? (
                        <span className="text-primary font-mono text-2xl font-bold">{group.avatar}</span>
                      ) : (
                        <Users className="w-8 h-8 text-primary" />
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground font-mono flex items-center justify-center gap-2">
                  🔥 {group.name}
                </h2>
                {group.username && (
                  <div className="text-xs text-muted-foreground font-mono bg-primary/10 px-2 py-1 rounded inline-block">
                    @{group.username}
                  </div>
                )}
                <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>{group.memberCount || 0} {t('groups.members')}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            {group.description && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t('profile.description')}</span>
                </div>
                <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
                  {group.description}
                </p>
              </div>
            )}

            {/* Members List */}
            {group.members && group.members.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t('groups.members')}</span>
                </div>
                <ScrollArea className="h-32 border border-border/50 rounded-lg p-2">
                  <div className="space-y-2">
                    {group.members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3 p-1 rounded hover:bg-muted/30">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={member.avatar || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {member.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{member.username}</p>
                        </div>
                        {member.role === 'admin' && (
                          <Crown className="w-3 h-3 text-yellow-500" />
                        )}
                        {member.role === 'owner' && (
                          <Shield className="w-3 h-3 text-purple-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Created Date */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t('profile.created')}</span>
              </div>
              <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
                {new Date(group.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-border/20 bg-muted/30">
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                {t('profile.openChat')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Settings className="w-3 h-3 mr-1" />
                {t('profile.settings')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
}