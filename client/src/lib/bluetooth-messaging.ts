import { isNativePlatform, CapacitorBluetoothService, type NativeBleDevice } from './capacitor-bluetooth';

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
  signature?: string;
}

interface DiscoveryMessage {
  id: string;
  type: 'discovery';
  userId: string;
  username: string;
  avatar?: string;
  timestamp: number;
  publicKey?: string;
}

interface BluetoothPeer {
  device: BluetoothDevice | { id: string; name?: string };
  server: BluetoothRemoteGATTServer | null;
  messageCharacteristic: BluetoothRemoteGATTCharacteristic | null;
  discoveryCharacteristic: BluetoothRemoteGATTCharacteristic | null;
  userId?: string;
  username?: string;
  lastSeen: number;
  messageBuffer: Uint8Array;
  expectedLength: number;
  discoveryBuffer: Uint8Array;
  discoveryExpectedLength: number;
  isNative?: boolean;
  nativeDeviceId?: string;
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
  private nativeService: CapacitorBluetoothService | null = null;
  private discoveredNativeDevices: Map<string, NativeBleDevice> = new Map();
  private autoConnectEnabled = true;

  constructor(userId: string, username: string) {
    this.currentUserId = userId;
    this.currentUsername = username;

    if (isNativePlatform()) {
      this.initNativeService();
    }
  }

  private initNativeService(): void {
    this.nativeService = new CapacitorBluetoothService({
      onDeviceFound: (device) => this.handleNativeDeviceFound(device),
      onMessageReceived: (deviceId, data) => this.handleNativeMessage(deviceId, data),
      onDiscoveryReceived: (deviceId, data) => this.handleNativeDiscovery(deviceId, data),
      onDeviceDisconnected: (deviceId) => this.handleNativeDisconnect(deviceId)
    });
  }

  private async handleNativeDeviceFound(device: NativeBleDevice): Promise<void> {
    if (this.discoveredNativeDevices.has(device.deviceId)) return;
    if (this.peers.has(device.deviceId)) return;

    this.discoveredNativeDevices.set(device.deviceId, device);
    console.log(`Native BLE: Found Offchat device: ${device.name || device.deviceId}`);

    if (this.autoConnectEnabled) {
      try {
        await this.connectToNativeDevice(device.deviceId);
      } catch (error) {
        console.error('Auto-connect failed:', error);
      }
    }
  }

  private async connectToNativeDevice(deviceId: string): Promise<void> {
    if (!this.nativeService) return;

    try {
      await this.nativeService.connectToDevice(deviceId);

      const device = this.discoveredNativeDevices.get(deviceId);
      const peer: BluetoothPeer = {
        device: { id: deviceId, name: device?.name },
        server: null,
        messageCharacteristic: null,
        discoveryCharacteristic: null,
        lastSeen: Date.now(),
        messageBuffer: new Uint8Array(0),
        expectedLength: 0,
        discoveryBuffer: new Uint8Array(0),
        discoveryExpectedLength: 0,
        isNative: true,
        nativeDeviceId: deviceId
      };

      this.peers.set(deviceId, peer);
      this.peerHandlers.forEach(handler => handler(peer, 'connected'));

      const discoveryData = JSON.stringify({
        id: crypto.randomUUID(),
        type: 'discovery',
        userId: this.currentUserId,
        username: this.currentUsername,
        timestamp: Date.now()
      });
      await this.nativeService.sendDiscovery(deviceId, discoveryData);

      console.log(`Native BLE: Connected to ${device?.name || deviceId}`);
    } catch (error) {
      console.error(`Native BLE: Failed to connect to ${deviceId}:`, error);
      throw error;
    }
  }

  private handleNativeMessage(deviceId: string, data: string): void {
    try {
      const message: BluetoothMessage = JSON.parse(data);
      const peer = this.peers.get(deviceId);
      if (peer) {
        peer.lastSeen = Date.now();
        this.messageHandlers.forEach(handler => handler(message, peer));

        if (message.type === 'chat') {
          this.sendNativeAcknowledgment(deviceId, message.id);
        }
      }
    } catch (error) {
      console.error('Failed to parse native BLE message:', error);
    }
  }

  private handleNativeDiscovery(deviceId: string, data: string): void {
    try {
      const discoveryMessage: DiscoveryMessage = JSON.parse(data);
      const peer = this.peers.get(deviceId);
      if (peer) {
        peer.userId = discoveryMessage.userId;
        peer.username = discoveryMessage.username;
        peer.lastSeen = Date.now();
        console.log(`Native BLE: Discovered peer: ${discoveryMessage.username}`);
      }
    } catch (error) {
      console.error('Failed to parse native discovery:', error);
    }
  }

  private handleNativeDisconnect(deviceId: string): void {
    const peer = this.peers.get(deviceId);
    if (peer) {
      this.peers.delete(deviceId);
      this.peerHandlers.forEach(handler => handler(peer, 'disconnected'));
      console.log(`Native BLE: Device disconnected: ${deviceId}`);
    }
    this.discoveredNativeDevices.delete(deviceId);
  }

  private async sendNativeAcknowledgment(deviceId: string, messageId: string): Promise<void> {
    if (!this.nativeService) return;
    try {
      const ack = JSON.stringify({
        id: crypto.randomUUID(),
        type: 'ack',
        senderId: this.currentUserId,
        content: messageId,
        timestamp: Date.now()
      });
      await this.nativeService.sendMessage(deviceId, ack);
    } catch (error) {
      console.error('Failed to send native ACK:', error);
    }
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.push(handler);
  }

  onPeerChange(handler: PeerHandler) {
    this.peerHandlers.push(handler);
  }

  async startAdvertising(): Promise<void> {
    if (this.isAdvertising) return;

    try {
      this.isAdvertising = true;

      if (this.nativeService) {
        await this.nativeService.initialize();
        await this.nativeService.requestPermissions();
        await this.nativeService.startAdvertising(this.currentUserId, this.currentUsername);
        await this.nativeService.startScanning();
        console.log('Native BLE: Advertising + Scanning started');
      } else {
        console.log('Web Bluetooth: Discovery mode started (scanning only)');
        this.startDiscoveryBroadcast();
      }
    } catch (error) {
      console.error('Failed to start advertising:', error);
      throw error;
    }
  }

  stopAdvertising(): void {
    this.isAdvertising = false;
    if (this.nativeService) {
      this.nativeService.stopAdvertising();
      this.nativeService.stopScanning();
    }
    console.log('Stopped Bluetooth advertising');
  }

  async connectToPeer(): Promise<BluetoothPeer> {
    if (this.nativeService) {
      return this.connectToPeerNative();
    }
    return this.connectToPeerWeb();
  }

  private async connectToPeerNative(): Promise<BluetoothPeer> {
    if (!this.nativeService) throw new Error('Native BLE not initialized');

    await this.nativeService.startScanning();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('No Offchat devices found nearby. Make sure another Offchat user has offline mode enabled.'));
      }, 15000);

      const checkInterval = setInterval(() => {
        const unconnected = Array.from(this.discoveredNativeDevices.entries())
          .filter(([id]) => !this.peers.has(id));

        if (unconnected.length > 0) {
          clearTimeout(timeout);
          clearInterval(checkInterval);

          const [deviceId] = unconnected[0];
          this.connectToNativeDevice(deviceId)
            .then(() => {
              const peer = this.peers.get(deviceId);
              if (peer) resolve(peer);
              else reject(new Error('Connection established but peer not found'));
            })
            .catch(reject);
        }
      }, 1000);
    });
  }

  private async connectToPeerWeb(): Promise<BluetoothPeer> {
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
        discoveryExpectedLength: 0,
        isNative: false
      };

      await this.setupWebMessageListener(peer);
      this.peers.set(device.id, peer);

      device.addEventListener('gattserverdisconnected', () => {
        this.handleWebPeerDisconnected(peer);
      });

      await this.sendWebDiscoveryMessage(peer);
      this.peerHandlers.forEach(handler => handler(peer, 'connected'));

      console.log(`Web BLE: Connected to peer: ${device.name || device.id}`);
      return peer;

    } catch (error) {
      console.error('Web BLE: Failed to connect to peer:', error);
      throw error;
    }
  }

  getIsAdvertising(): boolean {
    return this.isAdvertising;
  }

  private async setupWebMessageListener(peer: BluetoothPeer): Promise<void> {
    if (!peer.messageCharacteristic || !peer.discoveryCharacteristic) return;

    try {
      await peer.messageCharacteristic.startNotifications();
      peer.messageCharacteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
        this.handleWebIncomingMessage(event, peer);
      });

      await peer.discoveryCharacteristic.startNotifications();
      peer.discoveryCharacteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
        this.handleWebDiscoveryMessage(event, peer);
      });
    } catch (error) {
      console.error('Failed to setup message listener:', error);
      throw error;
    }
  }

  async sendMessage(message: Omit<BluetoothMessage, 'id' | 'timestamp'>, targetPeerId?: string): Promise<void> {
    const bluetoothMessage: BluetoothMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    const messageStr = JSON.stringify(bluetoothMessage);

    if (targetPeerId) {
      const peer = this.peers.get(targetPeerId);
      if (!peer) throw new Error(`Peer ${targetPeerId} not found`);

      if (peer.isNative && this.nativeService) {
        await this.nativeService.sendMessage(targetPeerId, messageStr);
      } else {
        const messageData = new TextEncoder().encode(messageStr);
        await this.sendToWebPeer(peer, messageData, 'message');
      }
    } else {
      const sendPromises = Array.from(this.peers.entries()).map(([id, peer]) => {
        if (peer.isNative && this.nativeService) {
          return this.nativeService.sendMessage(id, messageStr).catch(err =>
            console.error(`Failed to send to native peer ${id}:`, err)
          );
        } else {
          const messageData = new TextEncoder().encode(messageStr);
          return this.sendToWebPeer(peer, messageData, 'message').catch(err =>
            console.error(`Failed to send to web peer ${id}:`, err)
          );
        }
      });
      await Promise.allSettled(sendPromises);
    }
  }

  private async sendWebDiscoveryMessage(peer: BluetoothPeer): Promise<void> {
    const discoveryMessage: DiscoveryMessage = {
      id: crypto.randomUUID(),
      type: 'discovery',
      userId: this.currentUserId,
      username: this.currentUsername,
      timestamp: Date.now()
    };

    const messageData = new TextEncoder().encode(JSON.stringify(discoveryMessage));
    await this.sendToWebPeer(peer, messageData, 'discovery');
  }

  private async sendToWebPeer(peer: BluetoothPeer, data: Uint8Array, type: 'message' | 'discovery'): Promise<void> {
    try {
      const characteristic = type === 'message'
        ? peer.messageCharacteristic
        : peer.discoveryCharacteristic;

      if (!characteristic) throw new Error('Characteristic not available');

      const frame = new Uint8Array(4 + data.length);
      const view = new DataView(frame.buffer);
      view.setUint32(0, data.length, true);
      frame.set(data, 4);

      const chunkSize = 20;
      for (let i = 0; i < frame.length; i += chunkSize) {
        const chunk = frame.slice(i, i + chunkSize);
        await characteristic.writeValue(chunk);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    } catch (error) {
      console.error(`Failed to send ${type} to web peer:`, error);
      throw error;
    }
  }

  private handleWebIncomingMessage(event: Event, peer: BluetoothPeer): void {
    try {
      const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
      if (!value) return;

      const chunk = new Uint8Array(value.buffer);

      if (peer.messageBuffer.length === 0 && chunk.length >= 4) {
        const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
        peer.expectedLength = view.getUint32(0, true);
        peer.messageBuffer = new Uint8Array(peer.expectedLength);
        const payloadStart = chunk.slice(4);
        peer.messageBuffer.set(payloadStart, 0);
      } else if (peer.messageBuffer.length > 0) {
        const currentLength = peer.messageBuffer.length;
        const newBuffer = new Uint8Array(currentLength + chunk.length);
        newBuffer.set(peer.messageBuffer);
        newBuffer.set(chunk, currentLength);
        peer.messageBuffer = newBuffer.slice(0, peer.expectedLength);
      }

      if (peer.messageBuffer.length >= peer.expectedLength && peer.expectedLength > 0) {
        const messageStr = new TextDecoder().decode(peer.messageBuffer);
        const message: BluetoothMessage = JSON.parse(messageStr);

        peer.messageBuffer = new Uint8Array(0);
        peer.expectedLength = 0;
        peer.lastSeen = Date.now();

        this.messageHandlers.forEach(handler => handler(message, peer));

        if (message.type === 'chat' && peer.messageCharacteristic) {
          this.sendWebAcknowledgment(peer, message.id);
        }
      }
    } catch (error) {
      console.error('Failed to process incoming message:', error);
      peer.messageBuffer = new Uint8Array(0);
      peer.expectedLength = 0;
    }
  }

  private handleWebDiscoveryMessage(event: Event, peer: BluetoothPeer): void {
    try {
      const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
      if (!value) return;

      const chunk = new Uint8Array(value.buffer);

      if (peer.discoveryBuffer.length === 0 && chunk.length >= 4) {
        const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
        peer.discoveryExpectedLength = view.getUint32(0, true);
        const payloadStart = chunk.slice(4);
        peer.discoveryBuffer = new Uint8Array(payloadStart);
      } else if (peer.discoveryExpectedLength > 0) {
        const newBuffer = new Uint8Array(peer.discoveryBuffer.length + chunk.length);
        newBuffer.set(peer.discoveryBuffer);
        newBuffer.set(chunk, peer.discoveryBuffer.length);
        peer.discoveryBuffer = newBuffer;
      }

      if (peer.discoveryBuffer.length >= peer.discoveryExpectedLength && peer.discoveryExpectedLength > 0) {
        const completeMessage = peer.discoveryBuffer.slice(0, peer.discoveryExpectedLength);
        const messageStr = new TextDecoder().decode(completeMessage);
        const discoveryMessage: DiscoveryMessage = JSON.parse(messageStr);

        peer.discoveryBuffer = new Uint8Array(0);
        peer.discoveryExpectedLength = 0;

        peer.userId = discoveryMessage.userId;
        peer.username = discoveryMessage.username;
        peer.lastSeen = Date.now();

        console.log(`Discovered peer: ${discoveryMessage.username} (${discoveryMessage.userId})`);
      }
    } catch (error) {
      console.error('Failed to process discovery message:', error);
      peer.discoveryBuffer = new Uint8Array(0);
      peer.discoveryExpectedLength = 0;
    }
  }

  private async sendWebAcknowledgment(peer: BluetoothPeer, messageId: string): Promise<void> {
    try {
      const ackMessage: BluetoothMessage = {
        id: crypto.randomUUID(),
        type: 'ack',
        senderId: this.currentUserId,
        content: messageId,
        timestamp: Date.now()
      };

      const messageData = new TextEncoder().encode(JSON.stringify(ackMessage));
      await this.sendToWebPeer(peer, messageData, 'message');
    } catch (error) {
      console.error('Failed to send acknowledgment:', error);
    }
  }

  private handleWebPeerDisconnected(peer: BluetoothPeer): void {
    this.peers.delete(peer.device.id);
    this.peerHandlers.forEach(handler => handler(peer, 'disconnected'));
    console.log(`Peer disconnected: ${(peer.device as any).name || peer.device.id}`);
  }

  private startDiscoveryBroadcast(): void {
    if (!this.isAdvertising) return;

    setInterval(async () => {
      if (!this.isAdvertising) return;

      for (const peer of this.peers.values()) {
        if (!peer.isNative) {
          try {
            await this.sendWebDiscoveryMessage(peer);
          } catch (error) {
            console.error('Failed to send discovery message:', error);
          }
        }
      }
    }, 30000);
  }

  getConnectedPeers(): BluetoothPeer[] {
    return Array.from(this.peers.values());
  }

  getDiscoveredDevices(): NativeBleDevice[] {
    return Array.from(this.discoveredNativeDevices.values());
  }

  getPeerByUserId(userId: string): BluetoothPeer | undefined {
    return Array.from(this.peers.values()).find(peer => peer.userId === userId);
  }

  disconnectAll(): void {
    if (this.nativeService) {
      this.nativeService.disconnectAll();
    }

    for (const peer of this.peers.values()) {
      if (!peer.isNative && peer.server) {
        try {
          peer.server.disconnect();
        } catch (error) {
          console.error('Error disconnecting web peer:', error);
        }
      }
    }
    this.peers.clear();
    this.discoveredNativeDevices.clear();
    this.stopAdvertising();
  }

  getStats(): { connectedPeers: number; totalMessages: number; uptime: number } {
    return {
      connectedPeers: this.peers.size,
      totalMessages: 0,
      uptime: this.isAdvertising ? Date.now() : 0
    };
  }

  isNative(): boolean {
    return this.nativeService !== null;
  }
}

export type { BluetoothMessage, BluetoothPeer, MessageHandler, PeerHandler };
