import { useParams, useLocation } from "wouter";
import { useTranslation } from 'react-i18next';
import GroupProfileDetail from "@/components/group-profile-detail";

interface GroupProfilePageProps {
  currentUser: {
    id: string;
    username: string;
    walletAddress: string;
    avatar?: string | null;
    bio?: string | null;
  };
}

export default function GroupProfilePage({ currentUser }: GroupProfilePageProps) {
  const { t } = useTranslation();
  const params = useParams();
  const [, setLocation] = useLocation();
  
  const chatId = params.chatId;

  if (!chatId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('chat.invalidGroupId')}</p>
      </div>
    );
  }

  const handleBack = () => {
    setLocation("/chat");
  };

  const handleStartChat = () => {
    setLocation(`/chat/${chatId}`);
  };

  return (
    <div className="h-screen bg-background">
      <GroupProfileDetail
        chatId={chatId}
        currentUserId={currentUser.id}
        onBack={handleBack}
        onStartChat={handleStartChat}
      />
    </div>
  );
}