import { useParams, useLocation } from "wouter";
import { useTranslation } from 'react-i18next';
import { useQueryClient } from "@tanstack/react-query";
import UserProfileDetail from "@/components/user-profile-detail";

interface UserProfilePageProps {
  currentUser: {
    id: string;
    username: string;
    walletAddress: string;
    avatar?: string | null;
    bio?: string | null;
  };
}

export default function UserProfilePage({ currentUser }: UserProfilePageProps) {
  const { t } = useTranslation();
  const params = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const userId = params.userId;

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('profile.invalidUserId')}</p>
      </div>
    );
  }

  const handleBack = () => {
    setLocation("/chat");
  };

  const handleStartChat = async (targetUserId: string) => {
    try {
      // First fetch fresh chats to avoid cache issues
      const response = await fetch(`/api/chats/${currentUser.id}`);
      const currentChats = await response.json();
      
      // Look for existing private chat with this user
      const existingChat = currentChats.find((chat: any) => 
        !chat.isGroup && chat.otherUserId === targetUserId
      );
      
      if (existingChat) {
        setLocation(`/chat/${existingChat.id}`);
        return;
      }
      
      // Create new chat
      const createResponse = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isGroup: false })
      });
      
      if (!createResponse.ok) throw new Error('Failed to create chat');
      const newChat = await createResponse.json();
      
      // Add participants
      await Promise.all([
        fetch(`/api/chats/${newChat.id}/participants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, role: 'member' })
        }),
        fetch(`/api/chats/${newChat.id}/participants`, {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: targetUserId, role: 'member' })
        })
      ]);
      
      // Invalidate chat cache so sidebar updates immediately
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats', currentUser.id] });
      
      // Navigate to the new chat immediately
      setLocation(`/chat/${newChat.id}`);
    } catch (error) {
      console.error('Failed to start chat:', error);
      // Fallback to general chat page if there's an error
      setLocation('/chat');
    }
  };

  return (
    <div className="h-screen bg-background">
      <UserProfileDetail
        userId={userId}
        currentUserId={currentUser.id}
        onBack={handleBack}
        onStartChat={handleStartChat}
      />
    </div>
  );
}