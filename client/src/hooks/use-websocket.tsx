import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getWebSocketUrl } from "@/lib/queryClient";
import type { Message } from "@shared/schema";

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket(chatId: string | null, userId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (!chatId) return;
    
    // Close existing socket if any
    if (socket) {
      socket.close();
      setSocket(null);
    }

    setConnectionStatus('connecting');
    
    try {
      const wsUrl = getWebSocketUrl();
      
      // Log the WebSocket URL for debugging
      console.log('🔗 Final WebSocket URL:', wsUrl);
      
      console.log('🚀 Attempting WebSocket connection to:', wsUrl);
      const newSocket = new WebSocket(wsUrl);

      newSocket.onopen = () => {
      setConnectionStatus('connected');
      
      // Join the chat
      newSocket.send(JSON.stringify({
        type: 'join',
        userId,
        chatId
      }));
    };

    newSocket.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        
        switch (data.type) {
          case 'new_message':
            setMessages(prev => [...prev, data.message]);
            
            // Update chat list in sidebar for real-time last message updates
            queryClient.invalidateQueries({ queryKey: ['/api/chats', userId] });
            break;
            
          case 'typing':
            if (data.isTyping) {
              setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
            } else {
              setTypingUsers(prev => prev.filter(id => id !== data.userId));
            }
            break;
            
          case 'user_status':
            // Handle user online/offline status updates
            break;
            
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
            // Friend request was accepted - show notification and invalidate cache
            console.log('✓ Friend request accepted notification received');
            toast({
              title: "Friend Request Accepted",
              description: "Your friend request was accepted!",
            });
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
            
          case 'message_deleted':
            setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
            queryClient.invalidateQueries({ queryKey: ['/api/chats', userId] });
            break;
            
          case 'chat_deleted':
            if (data.chatId === chatId) {
              toast({
                title: "Chat Deleted",
                description: "This chat has been deleted by the other user.",
                variant: "destructive"
              });
              queryClient.invalidateQueries({ queryKey: ['/api/chats', userId] });
              setTimeout(() => {
                window.location.href = '/';
              }, 1500);
            } else {
              queryClient.invalidateQueries({ queryKey: ['/api/chats', userId] });
            }
            break;
            
          case 'user_kicked':
            if (data.userId === userId && data.chatId === chatId) {
              toast({
                title: "Removed from Group",
                description: data.reason || "You have been removed from this group",
                variant: "destructive"
              });
              setTimeout(() => {
                window.location.href = '/';
              }, 2000);
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
        // Continue gracefully on parsing errors
      }
    };

    newSocket.onclose = () => {
      setConnectionStatus('disconnected');
      setSocket(null);
      
      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    newSocket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      console.error('❌ WebSocket URL was:', wsUrl);
      console.error('❌ WebSocket readyState:', newSocket.readyState);
      setConnectionStatus('disconnected');
    };

      setSocket(newSocket);
    } catch (error) {
      console.error('🚫 WebSocket connection failed:', error);
      setConnectionStatus('disconnected');
    }
  }, [chatId, userId]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (socket) {
      socket.close();
    }
  }, [socket]);

  const sendMessage = useCallback((messageData: any) => {
    console.log('🚀 Attempting to send message:', messageData);
    console.log('📡 Socket state:', socket?.readyState, 'Open should be:', WebSocket.OPEN);
    console.log('🔌 Connection status:', connectionStatus);
    
    if (socket?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'send_message',
        ...messageData
      };
      console.log('📤 Sending WebSocket message:', message);
      socket.send(JSON.stringify(message));
    } else {
      console.warn('❌ Cannot send message - WebSocket not open. State:', socket?.readyState);
    }
  }, [socket, connectionStatus]);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'typing',
        userId,
        chatId,
        isTyping
      }));
    }
  }, [socket, userId, chatId]);

  // Load initial messages
  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/messages/${chatId}`);
        if (response.ok) {
          const initialMessages = await response.json();
          setMessages(initialMessages);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
        // Gracefully handle loading errors without breaking the app
      }
    };

    loadMessages();
  }, [chatId]);

  // Connect when chatId changes
  useEffect(() => {
    if (chatId) {
      connect();
    }
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [chatId, connect]);

  // Clear typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const removeMessage = useCallback((messageId: string) => {
    setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
  }, []);

  const refetchMessages = useCallback(async () => {
    if (!chatId) return;
    
    try {
      const response = await fetch(`/api/messages/${chatId}`);
      if (response.ok) {
        const freshMessages = await response.json();
        setMessages(freshMessages);
      }
    } catch (error) {
      console.error('Failed to refetch messages:', error);
      // Continue gracefully on refetch errors
    }
  }, [chatId]);

  return {
    socket,
    messages,
    typingUsers,
    connectionStatus,
    sendMessage,
    sendTypingIndicator,
    connect,
    disconnect,
    removeMessage,
    refetchMessages
  };
}
