import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getWebSocketUrl } from "@/lib/queryClient";

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useFriendWebSocket(userId: string | null) {
  const socketRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    const wsUrl = getWebSocketUrl();
    console.log('👥 Friend WebSocket connecting to:', wsUrl);
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('Friend WebSocket connected');
      // Join as global user for friend notifications
      socket.send(JSON.stringify({
        type: 'join_global',
        userId
      }));
    };

    socket.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        console.log('Friend WebSocket message:', data);
        
        switch (data.type) {
          case 'friend_request_received':
            // Friend request received - show toast and invalidate cache
            console.log('📨 Friend request received notification:', data);
            const requesterName = data.requester?.username || data.friendship?.requesterName || 'Someone';
            toast({
              title: "Friend Request",
              description: `${requesterName} sent you a friend request.`,
            });
            // Invalidate friend requests cache
            queryClient.invalidateQueries({ queryKey: ['/api/friends', userId, 'requests'] });
            queryClient.invalidateQueries({ queryKey: ['/api/friends', userId] });
            break;
            
          case 'friend_request_accepted':
            // Friend request was accepted - show notification and invalidate cache
            console.log('🎉 Friend request accepted notification received via friend WebSocket');
            toast({
              title: "Friend Request Accepted",
              description: "Your friend request has been accepted! You can now chat.",
            });
            queryClient.invalidateQueries({ queryKey: ['/api/friends', userId] });
            queryClient.invalidateQueries({ queryKey: ['/api/friends', userId, 'requests'] });
            queryClient.invalidateQueries({ queryKey: ['/api/friends', userId, 'sent'] });
            queryClient.invalidateQueries({ queryKey: ['/api/chats', userId] });
            break;
            
          case 'friend_request_rejected':
            // Friend request was rejected - invalidate cache  
            toast({
              title: "Friend Request Rejected",
              description: "Your friend request was declined.",
            });
            queryClient.invalidateQueries({ queryKey: ['/api/friends', userId] });
            queryClient.invalidateQueries({ queryKey: ['/api/friends', userId, 'requests'] });
            queryClient.invalidateQueries({ queryKey: ['/api/friends', userId, 'sent'] });
            break;
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    socket.onclose = () => {
      console.log('Friend WebSocket disconnected');
    };

    socket.onerror = (error) => {
      console.error('❌ Friend WebSocket error:', error);
      console.error('❌ Friend WebSocket URL was:', wsUrl);
      console.error('❌ Friend WebSocket readyState:', socket.readyState);
    };

    socketRef.current = socket;

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [userId, queryClient, toast]);

  return null;
}