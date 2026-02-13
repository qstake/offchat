import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface GlobalWebSocketContextType {
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  connect: () => void;
  disconnect: () => void;
}

const GlobalWebSocketContext = createContext<GlobalWebSocketContextType | null>(null);

export function useGlobalWebSocket() {
  const context = useContext(GlobalWebSocketContext);
  if (!context) {
    throw new Error('useGlobalWebSocket must be used within a GlobalWebSocketProvider');
  }
  return context;
}

interface GlobalWebSocketProviderProps {
  children: React.ReactNode;
  userId: string | null;
}

export function GlobalWebSocketProvider({ children, userId }: GlobalWebSocketProviderProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const connectRef = useRef<() => void>();

  connectRef.current = () => {
    if (!userId) return;
    
    setConnectionStatus('connecting');
    
    // Simple WebSocket URL for Replit
    const currentUrl = new URL(window.location.href);
    const wsUrl = `${currentUrl.protocol === 'https:' ? 'wss:' : 'ws:'}//${currentUrl.host}/ws`;
    console.log('🌐 Global WebSocket connecting to:', wsUrl, { location: window.location.href });
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      setConnectionStatus('connected');
      
      // Join as global user (not specific chat)
      newSocket.send(JSON.stringify({
        type: 'join_global',
        userId
      }));
    };

    newSocket.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        
        switch (data.type) {
          case 'friend_request_received':
            // Friend request received - show toast and invalidate cache
            toast({
              title: "Friend Request",
              description: `${data.requester?.username || 'Someone'} sent you a friend request.`,
            });
            // Invalidate friend requests cache
            queryClient.invalidateQueries({ queryKey: ['/api/friends', userId, 'requests'] });
            queryClient.invalidateQueries({ queryKey: ['/api/friends', userId] });
            break;
            
          case 'friend_request_accepted':
            // Friend request was accepted - invalidate cache
            queryClient.invalidateQueries({ queryKey: ['/api/friends', userId] });
            queryClient.invalidateQueries({ queryKey: ['/api/friends', userId, 'requests'] });
            queryClient.invalidateQueries({ queryKey: ['/api/friends', userId, 'sent'] });
            queryClient.invalidateQueries({ queryKey: ['/api/chats', userId] });
            break;
            
          case 'friend_request_rejected':
            // Friend request was rejected - invalidate cache
            queryClient.invalidateQueries({ queryKey: ['/api/friends', userId] });
            queryClient.invalidateQueries({ queryKey: ['/api/friends', userId, 'requests'] });
            queryClient.invalidateQueries({ queryKey: ['/api/friends', userId, 'sent'] });
            break;
        }
      } catch (error) {
        console.error('Global WebSocket message parsing error:', error);
        // Gracefully handle parsing errors
      }
    };

    newSocket.onclose = () => {
      setConnectionStatus('disconnected');
      setSocket(null);
      
      // Attempt to reconnect after 3 seconds if user is still logged in
      if (userId) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connectRef.current?.();
        }, 3000);
      }
    };

    newSocket.onerror = (error) => {
      console.error('❌ Global WebSocket error:', error);
      console.error('❌ Global WebSocket URL was:', wsUrl);
      console.error('❌ Global WebSocket readyState:', newSocket.readyState);
      setConnectionStatus('disconnected');
      // Ensure error doesn't propagate as unhandled rejection
    };

    setSocket(newSocket);
  };

  const connect = useCallback(() => {
    connectRef.current?.();
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (socket) {
      socket.close();
    }
  }, [socket]);

  // Connect when user logs in
  useEffect(() => {
    if (userId) {
      // Close existing socket if any
      if (socket) {
        socket.close();
        setSocket(null);
      }
      connectRef.current?.();
    } else {
      disconnect();
    }
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [userId, socket, disconnect]);

  return (
    <GlobalWebSocketContext.Provider value={{ connectionStatus, connect, disconnect }}>
      {children}
    </GlobalWebSocketContext.Provider>
  );
}