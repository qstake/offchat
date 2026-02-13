import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, UserX } from "lucide-react";

interface UserAvatarProps {
  user?: {
    username: string;
    avatar?: string | null;
  };
  username?: string;
  avatar?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  isBlocked?: boolean;
}

export default function UserAvatar({ 
  user, 
  username: propUsername, 
  avatar: propAvatar, 
  size = "md",
  className = "",
  isBlocked = false
}: UserAvatarProps) {
  // Use either user object or individual props
  const username = user?.username || propUsername || "";
  const avatar = user?.avatar || propAvatar;
  
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10", 
    lg: "w-12 h-12"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  // If user is blocked, show blocked avatar
  if (isBlocked) {
    return (
      <Avatar className={`${sizeClasses[size]} ${className} opacity-50`}>
        <AvatarFallback className="bg-red-500/20 text-red-400 font-mono">
          <UserX className={iconSizes[size]} />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {avatar && avatar.length > 1 ? (
        <AvatarImage src={avatar} alt={`${username}'s profile`} />
      ) : (
        <AvatarFallback className="bg-primary/20 text-primary font-mono">
          {avatar && avatar.length === 1 
            ? avatar 
            : username 
              ? username.charAt(0).toUpperCase()
              : <User className={iconSizes[size]} />
          }
        </AvatarFallback>
      )}
    </Avatar>
  );
}