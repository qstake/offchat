import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

// Web Bluetooth API type definitions
declare global {
  interface Navigator {
    bluetooth: Bluetooth;
  }
  
  interface Bluetooth {
    requestDevice(options: BluetoothRequestDeviceOptions): Promise<BluetoothDevice>;
  }
  
  interface BluetoothRequestDeviceOptions {
    filters?: BluetoothLEScanFilterInit[];
    acceptAllDevices?: boolean;
    optionalServices?: BluetoothServiceUUID[];
  }
  
  interface BluetoothLEScanFilterInit {
    namePrefix?: string;
    services?: BluetoothServiceUUID[];
  }
  
  type BluetoothServiceUUID = number | string;
  
  interface BluetoothDevice extends EventTarget {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
    addEventListener(type: 'gattserverdisconnected', listener: (this: BluetoothDevice, ev: Event) => any): void;
  }
  
  interface BluetoothRemoteGATTServer {
    device: BluetoothDevice;
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: BluetoothServiceUUID): Promise<any>;
    getPrimaryServices(service?: BluetoothServiceUUID): Promise<any[]>;
  }
}

// Import offline storage after global type declarations
import { offlineStorage, type OfflineMessage, type OfflineContact } from "@/lib/offline-storage";
import { BluetoothMessagingService, type BluetoothMessage, type BluetoothPeer } from "@/lib/bluetooth-messaging";
import { useWallet } from "@/hooks/use-wallet";

interface OfflineModeContextType {
  isOfflineMode: boolean;
  isBluetoothSupported: boolean;
  isBluetoothConnected: boolean;
  toggleOfflineMode: () => void;
  connectBluetooth: () => Promise<void>;
  disconnectBluetooth: () => void;
  bluetoothDevice: BluetoothDevice | null;
  storeOfflineMessage: (message: Omit<OfflineMessage, 'id' | 'timestamp' | 'status' | 'retryCount'>) => Promise<string>;
  getPendingMessages: (chatId: string) => Promise<OfflineMessage[]>;
  getNearbyContacts: () => Promise<OfflineContact[]>;
  sendPendingMessages: () => Promise<void>;
  sendBluetoothMessage: (content: string, chatId: string, messageType?: string, transactionData?: any) => Promise<void>;
  getConnectedPeers: () => BluetoothPeer[];
  storageReady: boolean;
  messagingService: BluetoothMessagingService | null;
}

const OfflineModeContext = createContext<OfflineModeContextType | undefined>(undefined);

interface OfflineModeProviderProps {
  children: ReactNode;
}

export function OfflineModeProvider({ children }: OfflineModeProviderProps) {
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isBluetoothSupported, setIsBluetoothSupported] = useState(false);
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(false);
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [messagingService, setMessagingService] = useState<BluetoothMessagingService | null>(null);
  const { toast } = useToast();
  const { currentUser } = useWallet();

  // Initialize storage and check Bluetooth support on mount
  useEffect(() => {
    // Initialize offline storage
    const initStorage = async () => {
      try {
        await offlineStorage.init();
        setStorageReady(true);
        console.log('Offline storage initialized successfully');
        
        // Cleanup old data periodically
        await offlineStorage.cleanup();
      } catch (error) {
        console.error('Failed to initialize offline storage:', error);
        toast({
          title: "Storage Initialization Failed",
          description: "Offline messaging may not work properly.",
          variant: "destructive",
        });
      }
    };

    // Check Bluetooth support
    if ('bluetooth' in navigator) {
      setIsBluetoothSupported(true);
    } else {
      setIsBluetoothSupported(false);
      console.warn('Web Bluetooth API is not supported in this browser');
    }

    initStorage();
  }, [toast]);

  const toggleOfflineMode = async () => {
    if (!isOfflineMode && !isBluetoothSupported) {
      toast({
        title: "Bluetooth Not Supported",
        description: "This browser doesn't support Bluetooth API. Try Chrome or Edge on Android.",
        variant: "destructive",
      });
      return;
    }

    if (!isOfflineMode) {
      const userId = currentUser?.id || `anon-${Date.now()}`;
      const username = currentUser?.username || currentUser?.displayName || 'Offchat User';
      
      setIsOfflineMode(true);
      
      const newMessagingService = new BluetoothMessagingService(userId, username);
      
      newMessagingService.onMessage(handleBluetoothMessage);
      newMessagingService.onPeerChange(handlePeerChange);
      
      try {
        await newMessagingService.startAdvertising();
        setMessagingService(newMessagingService);
      } catch (error) {
        console.error('Failed to start messaging service:', error);
      }

      toast({
        title: "Offline Mode Active",
        description: "Tap 'Connect Device' to find nearby Offchat users via Bluetooth.",
        variant: "default",
      });
    } else {
      setIsOfflineMode(false);
      
      if (messagingService) {
        messagingService.disconnectAll();
        setMessagingService(null);
      }
      
      if (isBluetoothConnected) {
        disconnectBluetooth();
      }
      
      setIsBluetoothConnected(false);
      setBluetoothDevice(null);
      
      toast({
        title: "Online Mode",
        description: "Switched back to internet messaging.",
        variant: "default",
      });
    }
  };

  // Handle incoming Bluetooth messages
  const handleBluetoothMessage = async (message: BluetoothMessage, fromPeer: BluetoothPeer) => {
    console.log('Received Bluetooth message:', message, 'from peer:', fromPeer.username || fromPeer.device.id);
    
    try {
      if (message.type === 'chat') {
        // Store the received message in offline storage
        await offlineStorage.storeOfflineMessage({
          chatId: message.chatId || 'bluetooth-chat',
          senderId: message.senderId,
          content: message.content,
          messageType: message.messageType || 'text',
          transactionData: message.transactionData
        });

        toast({
          title: "Message Received",
          description: `Message from ${fromPeer.username || 'Unknown'}: ${message.content.substring(0, 50)}...`,
          variant: "default",
        });
      } else if (message.type === 'discovery') {
        // Handle peer discovery - update contact information
        if (fromPeer.userId && fromPeer.username) {
          await offlineStorage.storeContact({
            id: fromPeer.userId,
            username: fromPeer.username,
            bluetoothDeviceId: fromPeer.device.id,
            lastSeen: Date.now()
          });
        }
      }
    } catch (error) {
      console.error('Failed to handle Bluetooth message:', error);
    }
  };

  // Handle peer connection changes
  const handlePeerChange = (peer: BluetoothPeer, event: 'connected' | 'disconnected') => {
    console.log(`Peer ${event}:`, peer.username || peer.device.id);
    
    if (event === 'connected') {
      toast({
        title: "Peer Connected",
        description: `Connected to ${peer.username || peer.device.name || 'unknown device'}`,
        variant: "default",
      });
    } else {
      toast({
        title: "Peer Disconnected",
        description: `Disconnected from ${peer.username || peer.device.name || 'unknown device'}`,
        variant: "destructive",
      });
    }
  };

  const connectBluetooth = async (): Promise<void> => {
    if (!isBluetoothSupported) {
      throw new Error('Bluetooth not supported');
    }

    if (!messagingService) {
      toast({
        title: "Enable Offline Mode First",
        description: "Turn on offline mode before connecting to devices.",
        variant: "destructive",
      });
      throw new Error('Messaging service not initialized - enable offline mode first');
    }

    try {
      // Use messaging service to connect to peer
      const peer = await messagingService.connectToPeer();
      
      setBluetoothDevice(peer.device);
      setIsBluetoothConnected(true);

      toast({
        title: "Bluetooth Connected",
        description: `Connected to ${peer.device.name || 'Unknown Device'}.`,
        variant: "default",
      });

    } catch (error: any) {
      console.error('Bluetooth connection error:', error);
      
      let errorMessage = 'Bluetooth connection failed.';
      if (error.name === 'NotFoundError') {
        errorMessage = 'No Offchat device found. Make sure there is another Offchat user nearby.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Bluetooth access denied. Check Bluetooth permissions in browser settings.';
      }

      toast({
        title: "Bluetooth Connection Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  };

  const disconnectBluetooth = () => {
    if (bluetoothDevice?.gatt?.connected) {
      bluetoothDevice.gatt.disconnect();
    }
    setBluetoothDevice(null);
    setIsBluetoothConnected(false);
  };

  // Offline storage functions
  const storeOfflineMessage = async (message: Omit<OfflineMessage, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<string> => {
    if (!storageReady) {
      throw new Error('Storage not ready');
    }
    return await offlineStorage.storeOfflineMessage(message);
  };

  const getPendingMessages = async (chatId: string): Promise<OfflineMessage[]> => {
    if (!storageReady) {
      return [];
    }
    return await offlineStorage.getPendingMessages(chatId);
  };

  const getNearbyContacts = async (): Promise<OfflineContact[]> => {
    if (!storageReady) {
      return [];
    }
    return await offlineStorage.getRecentContacts();
  };

  const sendPendingMessages = async (): Promise<void> => {
    if (!storageReady || !messagingService || !isOfflineMode) {
      return;
    }
    
    try {
      const pendingMessages = await offlineStorage.getAllPendingMessages();
      console.log(`Found ${pendingMessages.length} pending messages to send`);
      
      let sentCount = 0;
      let failedCount = 0;
      
      for (const message of pendingMessages) {
        try {
          const bluetoothMessage: Omit<BluetoothMessage, 'id' | 'timestamp'> = {
            type: 'chat',
            senderId: message.senderId,
            chatId: message.chatId,
            content: message.content,
            messageType: message.messageType,
            transactionData: message.transactionData
          };

          await messagingService.sendMessage(bluetoothMessage);
          await offlineStorage.markMessageSent(message.id);
          sentCount++;
        } catch (error) {
          console.error(`Failed to send message ${message.id}:`, error);
          await offlineStorage.markMessageFailed(message.id);
          failedCount++;
        }
      }
      
      if (sentCount > 0) {
        toast({
          title: "Messages Sent",
          description: `${sentCount} pending messages sent via Bluetooth.`,
          variant: "default",
        });
      }
      
      if (failedCount > 0) {
        toast({
          title: "Some Messages Failed",
          description: `${failedCount} messages could not be sent.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to send pending messages:', error);
      toast({
        title: "Send Failed",
        description: "Failed to send some pending messages.",
        variant: "destructive",
      });
    }
  };

  // Send message via Bluetooth
  const sendBluetoothMessage = async (content: string, chatId: string, messageType = 'text', transactionData?: any): Promise<void> => {
    if (!messagingService || !isOfflineMode) {
      throw new Error('Bluetooth messaging not available');
    }

    const userId = currentUser?.id || 'unknown';
    
    const messageId = await offlineStorage.storeOfflineMessage({
      chatId,
      senderId: userId,
      content,
      messageType,
      transactionData
    });

    try {
      const bluetoothMessage: Omit<BluetoothMessage, 'id' | 'timestamp'> = {
        type: 'chat',
        senderId: userId,
        chatId,
        content,
        messageType,
        transactionData
      };

      await messagingService.sendMessage(bluetoothMessage);

      // DO NOT mark as sent immediately - wait for ACK to confirm delivery
      // The handleBluetoothMessage function will mark it as sent when ACK is received
      
      console.log('Bluetooth message sent, waiting for ACK confirmation');
    } catch (error) {
      console.error('Failed to send Bluetooth message:', error);
      
      // Mark as failed if Bluetooth send failed
      await offlineStorage.markMessageFailed(messageId);
      throw error;
    }
  };

  // Get connected Bluetooth peers
  const getConnectedPeers = (): BluetoothPeer[] => {
    if (!messagingService) {
      return [];
    }
    return messagingService.getConnectedPeers();
  };

  return (
    <OfflineModeContext.Provider
      value={{
        isOfflineMode,
        isBluetoothSupported,
        isBluetoothConnected,
        toggleOfflineMode,
        connectBluetooth,
        disconnectBluetooth,
        bluetoothDevice,
        storeOfflineMessage,
        getPendingMessages,
        getNearbyContacts,
        sendPendingMessages,
        sendBluetoothMessage,
        getConnectedPeers,
        storageReady,
        messagingService,
      }}
    >
      {children}
    </OfflineModeContext.Provider>
  );
}

export function useOfflineMode() {
  const context = useContext(OfflineModeContext);
  if (context === undefined) {
    throw new Error('useOfflineMode must be used within an OfflineModeProvider');
  }
  return context;
}