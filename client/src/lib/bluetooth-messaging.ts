// Bluetooth messaging interface for peer-to-peer communication

// Extended Web Bluetooth API type definitions
declare global {
  interface BluetoothRemoteGATTServer {
    device: BluetoothDevice;
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
    getPrimaryServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
  }

  interface BluetoothRemoteGATTService {
    device: BluetoothDevice;
    uuid: string;
    isPrimary: boolean;
    getCharacteristic(characteristic: BluetoothServiceUUID): Promise<BluetoothRemoteGATTCharacteristic>;
    getCharacteristics(characteristic?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTCharacteristic[]>;
  }

  interface BluetoothRemoteGATTCharacteristic extends EventTarget {
    service: BluetoothRemoteGATTService;
    uuid: string;
    properties: BluetoothCharacteristicProperties;
    value?: DataView;
    readValue(): Promise<DataView>;
    writeValue(value: BufferSource): Promise<void>;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    addEventListener(type: 'characteristicvaluechanged', listener: (event: Event) => void): void;
  }

  interface BluetoothCharacteristicProperties {
    broadcast: boolean;
    read: boolean;
    writeWithoutResponse: boolean;
    write: boolean;
    notify: boolean;
    indicate: boolean;
    authenticatedSignedWrites: boolean;
    reliableWrite: boolean;
    writableAuxiliaries: boolean;
  }
}

// Offchat Bluetooth Service UUID
export const OFFCHAT_SERVICE_UUID = '19b10000-e8f2-537e-4f6c-d104768a1214';
export const OFFCHAT_MESSAGE_CHARACTERISTIC_UUID = '19b10001-e8f2-537e-4f6c-d104768a1214';
export const OFFCHAT_DISCOVERY_CHARACTERISTIC_UUID = '19b10002-e8f2-537e-4f6c-d104768a1214';

interface BluetoothMessage {
  id: string;
  type: 'chat' | 'discovery' | 'ack' | 'sync';
  senderId: string;
  recipientId?: string;
  chatId?: string;
  content: string;
  timestamp: number;
  messageType?: string;
  transactionData?: any;
  signature?: string; // For future security implementation
}

interface DiscoveryMessage {
  id: string;
  type: 'discovery';
  userId: string;
  username: string;
  avatar?: string;
  timestamp: number;
  publicKey?: string; // For future encryption
}

interface BluetoothPeer {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  messageCharacteristic: BluetoothRemoteGATTCharacteristic;
  discoveryCharacteristic: BluetoothRemoteGATTCharacteristic;
  userId?: string;
  username?: string;
  lastSeen: number;
  // Message reassembly buffers
  messageBuffer: Uint8Array;
  expectedLength: number;
  discoveryBuffer: Uint8Array;
  discoveryExpectedLength: number;
}

type MessageHandler = (message: BluetoothMessage, fromPeer: BluetoothPeer) => void;
type PeerHandler = (peer: BluetoothPeer, event: 'connected' | 'disconnected') => void;

export class BluetoothMessagingService {
  private peers: Map<string, BluetoothPeer> = new Map();
  private messageHandlers: MessageHandler[] = [];
  private peerHandlers: PeerHandler[] = [];
  private isAdvertising = false;
  private currentUserId: string = '';
  private currentUsername: string = '';

  constructor(userId: string, username: string) {
    this.currentUserId = userId;
    this.currentUsername = username;
  }

  // Add event handlers
  onMessage(handler: MessageHandler) {
    this.messageHandlers.push(handler);
  }

  onPeerChange(handler: PeerHandler) {
    this.peerHandlers.push(handler);
  }

  // Start advertising as a Offchat device
  async startAdvertising(): Promise<void> {
    if (this.isAdvertising) return;

    try {
      // Note: Web Bluetooth currently doesn't support advertising from browsers
      // This would typically be implemented on a companion mobile app
      // For now, we'll just broadcast discovery messages when connected
      this.isAdvertising = true;
      console.log('Started Bluetooth advertising (discovery mode)');
      
      // Periodically send discovery messages to connected peers
      this.startDiscoveryBroadcast();
    } catch (error) {
      console.error('Failed to start advertising:', error);
      throw error;
    }
  }

  // Stop advertising
  stopAdvertising(): void {
    this.isAdvertising = false;
    console.log('Stopped Bluetooth advertising');
  }

  // Connect to a nearby Offchat device via Web Bluetooth
  async connectToPeer(): Promise<BluetoothPeer> {
    try {
      let device: BluetoothDevice;
      
      try {
        device = await navigator.bluetooth.requestDevice({
          filters: [
            { namePrefix: 'Offchat' },
            { services: [OFFCHAT_SERVICE_UUID] }
          ],
          optionalServices: [OFFCHAT_SERVICE_UUID]
        });
      } catch (filterError: any) {
        if (filterError.name === 'NotFoundError') {
          device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [OFFCHAT_SERVICE_UUID]
          });
        } else {
          throw filterError;
        }
      }

      const server = await device.gatt!.connect();
      
      let messageCharacteristic: BluetoothRemoteGATTCharacteristic;
      let discoveryCharacteristic: BluetoothRemoteGATTCharacteristic;
      
      try {
        const service = await server.getPrimaryService(OFFCHAT_SERVICE_UUID);
        messageCharacteristic = await service.getCharacteristic(OFFCHAT_MESSAGE_CHARACTERISTIC_UUID);
        discoveryCharacteristic = await service.getCharacteristic(OFFCHAT_DISCOVERY_CHARACTERISTIC_UUID);
      } catch {
        const services = await server.getPrimaryServices();
        if (services.length === 0) {
          throw new Error('No compatible services found on this device');
        }
        const service = services[0];
        const chars = await service.getCharacteristics();
        if (chars.length < 2) {
          throw new Error('Device does not have required characteristics');
        }
        messageCharacteristic = chars[0];
        discoveryCharacteristic = chars.length > 1 ? chars[1] : chars[0];
      }

      const peer: BluetoothPeer = {
        device,
        server,
        messageCharacteristic,
        discoveryCharacteristic,
        lastSeen: Date.now(),
        messageBuffer: new Uint8Array(0),
        expectedLength: 0,
        discoveryBuffer: new Uint8Array(0),
        discoveryExpectedLength: 0
      };

      await this.setupMessageListener(peer);
      this.peers.set(device.id, peer);

      device.addEventListener('gattserverdisconnected', () => {
        this.handlePeerDisconnected(peer);
      });

      await this.sendDiscoveryMessage(peer);
      this.peerHandlers.forEach(handler => handler(peer, 'connected'));

      console.log(`Connected to Offchat peer: ${device.name || device.id}`);
      return peer;

    } catch (error) {
      console.error('Failed to connect to peer:', error);
      throw error;
    }
  }

  // Get advertising status
  getIsAdvertising(): boolean {
    return this.isAdvertising;
  }

  // Set up message listener for a peer
  private async setupMessageListener(peer: BluetoothPeer): Promise<void> {
    try {
      // Listen for messages
      await peer.messageCharacteristic.startNotifications();
      peer.messageCharacteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
        this.handleIncomingMessage(event, peer);
      });

      // Listen for discovery messages
      await peer.discoveryCharacteristic.startNotifications();
      peer.discoveryCharacteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
        this.handleDiscoveryMessage(event, peer);
      });

    } catch (error) {
      console.error('Failed to setup message listener:', error);
      throw error;
    }
  }

  // Send a chat message to a specific peer
  async sendMessage(message: Omit<BluetoothMessage, 'id' | 'timestamp'>, targetPeerId?: string): Promise<void> {
    const bluetoothMessage: BluetoothMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    const messageData = new TextEncoder().encode(JSON.stringify(bluetoothMessage));

    if (targetPeerId) {
      // Send to specific peer
      const peer = this.peers.get(targetPeerId);
      if (peer) {
        await this.sendToPeer(peer, messageData, 'message');
      } else {
        throw new Error(`Peer ${targetPeerId} not found`);
      }
    } else {
      // Broadcast to all connected peers
      const sendPromises = Array.from(this.peers.values()).map(peer => 
        this.sendToPeer(peer, messageData, 'message').catch(err => 
          console.error(`Failed to send to peer ${peer.device.id}:`, err)
        )
      );
      await Promise.allSettled(sendPromises);
    }
  }

  // Send discovery message to introduce ourselves
  private async sendDiscoveryMessage(peer: BluetoothPeer): Promise<void> {
    const discoveryMessage: DiscoveryMessage = {
      id: crypto.randomUUID(),
      type: 'discovery',
      userId: this.currentUserId,
      username: this.currentUsername,
      timestamp: Date.now()
    };

    const messageData = new TextEncoder().encode(JSON.stringify(discoveryMessage));
    await this.sendToPeer(peer, messageData, 'discovery');
  }

  // Send data to a specific peer with proper framing
  private async sendToPeer(peer: BluetoothPeer, data: Uint8Array, type: 'message' | 'discovery'): Promise<void> {
    try {
      const characteristic = type === 'message' 
        ? peer.messageCharacteristic 
        : peer.discoveryCharacteristic;

      // Create frame with length header (4 bytes for length)
      const frame = new Uint8Array(4 + data.length);
      const view = new DataView(frame.buffer);
      view.setUint32(0, data.length, true); // little-endian length
      frame.set(data, 4);

      // Split framed data into chunks if necessary (BLE has MTU limits)
      const chunkSize = 20; // Conservative chunk size for BLE
      for (let i = 0; i < frame.length; i += chunkSize) {
        const chunk = frame.slice(i, i + chunkSize);
        await characteristic.writeValue(chunk);
        
        // Small delay between chunks to ensure proper transmission
        await new Promise(resolve => setTimeout(resolve, 10));
      }

    } catch (error) {
      console.error(`Failed to send ${type} to peer:`, error);
      throw error;
    }
  }

  // Handle incoming message from peer with reassembly
  private handleIncomingMessage(event: Event, peer: BluetoothPeer): void {
    try {
      const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
      if (!value) return;

      const chunk = new Uint8Array(value.buffer);
      
      // Check if we need to start a new message (first chunk has length header)
      if (peer.messageBuffer.length === 0 && chunk.length >= 4) {
        const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
        peer.expectedLength = view.getUint32(0, true); // little-endian
        
        // Initialize buffer and add remaining data after header
        peer.messageBuffer = new Uint8Array(peer.expectedLength);
        const payloadStart = chunk.slice(4);
        peer.messageBuffer.set(payloadStart, 0);
      } else if (peer.messageBuffer.length > 0) {
        // Append chunk to existing buffer
        const currentLength = peer.messageBuffer.length;
        const newBuffer = new Uint8Array(currentLength + chunk.length);
        newBuffer.set(peer.messageBuffer);
        newBuffer.set(chunk, currentLength);
        peer.messageBuffer = newBuffer.slice(0, peer.expectedLength); // Truncate to expected length
      }

      // Check if we have the complete message
      if (peer.messageBuffer.length >= peer.expectedLength && peer.expectedLength > 0) {
        const messageStr = new TextDecoder().decode(peer.messageBuffer);
        const message: BluetoothMessage = JSON.parse(messageStr);

        // Reset buffer for next message
        peer.messageBuffer = new Uint8Array(0);
        peer.expectedLength = 0;

        // Update peer's last seen time
        peer.lastSeen = Date.now();

        // Notify message handlers
        this.messageHandlers.forEach(handler => handler(message, peer));

        // Send acknowledgment for chat messages
        if (message.type === 'chat') {
          this.sendAcknowledgment(peer, message.id);
        }
      }

    } catch (error) {
      console.error('Failed to process incoming message:', error);
      // Reset buffer on error
      peer.messageBuffer = new Uint8Array(0);
      peer.expectedLength = 0;
    }
  }

  // Handle discovery message from peer with reassembly
  private handleDiscoveryMessage(event: Event, peer: BluetoothPeer): void {
    try {
      const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
      if (!value) return;

      const chunk = new Uint8Array(value.buffer);
      
      // Check if we need to start a new discovery message
      if (peer.discoveryBuffer.length === 0 && chunk.length >= 4) {
        const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
        peer.discoveryExpectedLength = view.getUint32(0, true); // little-endian
        
        // Initialize accumulation buffer and add payload after header
        const payloadStart = chunk.slice(4);
        peer.discoveryBuffer = new Uint8Array(payloadStart);
      } else if (peer.discoveryExpectedLength > 0) {
        // Append chunk to accumulating buffer
        const newBuffer = new Uint8Array(peer.discoveryBuffer.length + chunk.length);
        newBuffer.set(peer.discoveryBuffer);
        newBuffer.set(chunk, peer.discoveryBuffer.length);
        peer.discoveryBuffer = newBuffer;
      }

      // Check if we have the complete discovery message
      if (peer.discoveryBuffer.length >= peer.discoveryExpectedLength && peer.discoveryExpectedLength > 0) {
        // Extract only the expected length (in case we received extra data)
        const completeMessage = peer.discoveryBuffer.slice(0, peer.discoveryExpectedLength);
        const messageStr = new TextDecoder().decode(completeMessage);
        const discoveryMessage: DiscoveryMessage = JSON.parse(messageStr);

        // Reset buffer for next message
        peer.discoveryBuffer = new Uint8Array(0);
        peer.discoveryExpectedLength = 0;

        // Update peer information
        peer.userId = discoveryMessage.userId;
        peer.username = discoveryMessage.username;
        peer.lastSeen = Date.now();

        console.log(`Discovered peer: ${discoveryMessage.username} (${discoveryMessage.userId})`);
      }

    } catch (error) {
      console.error('Failed to process discovery message:', error);
      // Reset buffer on error
      peer.discoveryBuffer = new Uint8Array(0);
      peer.discoveryExpectedLength = 0;
    }
  }

  // Send acknowledgment for received message
  private async sendAcknowledgment(peer: BluetoothPeer, messageId: string): Promise<void> {
    try {
      const ackMessage: BluetoothMessage = {
        id: crypto.randomUUID(),
        type: 'ack',
        senderId: this.currentUserId,
        content: messageId,
        timestamp: Date.now()
      };

      const messageData = new TextEncoder().encode(JSON.stringify(ackMessage));
      await this.sendToPeer(peer, messageData, 'message');

    } catch (error) {
      console.error('Failed to send acknowledgment:', error);
    }
  }

  // Handle peer disconnection
  private handlePeerDisconnected(peer: BluetoothPeer): void {
    this.peers.delete(peer.device.id);
    this.peerHandlers.forEach(handler => handler(peer, 'disconnected'));
    console.log(`Peer disconnected: ${peer.device.name || peer.device.id}`);
  }

  // Start periodic discovery broadcast
  private startDiscoveryBroadcast(): void {
    if (!this.isAdvertising) return;

    setInterval(async () => {
      if (!this.isAdvertising) return;

      // Send discovery messages to all connected peers
      for (const peer of this.peers.values()) {
        try {
          await this.sendDiscoveryMessage(peer);
        } catch (error) {
          console.error('Failed to send discovery message:', error);
        }
      }
    }, 30000); // Every 30 seconds
  }

  // Get all connected peers
  getConnectedPeers(): BluetoothPeer[] {
    return Array.from(this.peers.values());
  }

  // Get peer by user ID
  getPeerByUserId(userId: string): BluetoothPeer | undefined {
    return Array.from(this.peers.values()).find(peer => peer.userId === userId);
  }

  // Disconnect from all peers
  disconnectAll(): void {
    for (const peer of this.peers.values()) {
      try {
        peer.server.disconnect();
      } catch (error) {
        console.error('Error disconnecting peer:', error);
      }
    }
    this.peers.clear();
    this.stopAdvertising();
  }

  // Get connection statistics
  getStats(): { connectedPeers: number; totalMessages: number; uptime: number } {
    return {
      connectedPeers: this.peers.size,
      totalMessages: 0, // Would track this in a real implementation
      uptime: this.isAdvertising ? Date.now() : 0
    };
  }
}

// Export types for external use
export type { BluetoothMessage, BluetoothPeer, MessageHandler, PeerHandler };