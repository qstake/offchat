import { OFFCHAT_SERVICE_UUID, OFFCHAT_MESSAGE_CHARACTERISTIC_UUID, OFFCHAT_DISCOVERY_CHARACTERISTIC_UUID } from './bluetooth-messaging';

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
      Plugins?: Record<string, any>;
    };
  }
}

export function isNativePlatform(): boolean {
  return !!(window.Capacitor?.isNativePlatform?.());
}

export interface NativeBleDevice {
  deviceId: string;
  name?: string;
  rssi?: number;
}

export interface NativeBleCallbacks {
  onDeviceFound: (device: NativeBleDevice) => void;
  onMessageReceived: (deviceId: string, data: string) => void;
  onDiscoveryReceived: (deviceId: string, data: string) => void;
  onDeviceDisconnected: (deviceId: string) => void;
}

export class CapacitorBluetoothService {
  private scanning = false;
  private advertising = false;
  private connectedDevices: Map<string, NativeBleDevice> = new Map();
  private callbacks: NativeBleCallbacks;
  private rescanTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(callbacks: NativeBleCallbacks) {
    this.callbacks = callbacks;
  }

  private getBlePlugin(): any {
    return window.Capacitor?.Plugins?.['BluetoothLe'];
  }

  private getAdvertiserPlugin(): any {
    return window.Capacitor?.Plugins?.['BleAdvertiser'];
  }

  async initialize(): Promise<void> {
    const BleClient = this.getBlePlugin();
    if (!BleClient) {
      throw new Error('Capacitor BLE plugin not available');
    }

    try {
      await BleClient.initialize();
      console.log('Capacitor BLE initialized');
    } catch (error) {
      console.error('Failed to initialize BLE:', error);
      throw error;
    }
  }

  async requestPermissions(): Promise<boolean> {
    const BleClient = this.getBlePlugin();
    if (!BleClient) return false;

    try {
      const result = await BleClient.requestPermissions();
      return result?.granted !== false;
    } catch (error) {
      console.error('Failed to request BLE permissions:', error);
      return false;
    }
  }

  async startAdvertising(userId: string, username: string): Promise<void> {
    const Advertiser = this.getAdvertiserPlugin();
    if (!Advertiser) {
      console.warn('BLE Advertiser plugin not available, skipping advertising');
      return;
    }

    try {
      await Advertiser.startAdvertising({
        serviceUuid: OFFCHAT_SERVICE_UUID,
        localName: `Offchat-${username.substring(0, 8)}`,
        userId: userId,
        username: username
      });
      this.advertising = true;
      console.log('BLE advertising started');
    } catch (error) {
      console.error('Failed to start BLE advertising:', error);
    }
  }

  async stopAdvertising(): Promise<void> {
    const Advertiser = this.getAdvertiserPlugin();
    if (!Advertiser || !this.advertising) return;

    try {
      await Advertiser.stopAdvertising();
      this.advertising = false;
      console.log('BLE advertising stopped');
    } catch (error) {
      console.error('Failed to stop advertising:', error);
    }
  }

  async startScanning(): Promise<void> {
    const BleClient = this.getBlePlugin();
    if (!BleClient || this.scanning) return;

    try {
      this.scanning = true;

      await BleClient.requestLEScan(
        {
          services: [OFFCHAT_SERVICE_UUID],
          allowDuplicates: false
        },
        (result: any) => {
          if (result?.device) {
            const device: NativeBleDevice = {
              deviceId: result.device.deviceId,
              name: result.device.name || result.localName,
              rssi: result.rssi
            };
            this.callbacks.onDeviceFound(device);
          }
        }
      );

      console.log('BLE scanning started');

      setTimeout(async () => {
        await this.stopScanning();
        this.scheduleRescan();
      }, 15000);
    } catch (error) {
      this.scanning = false;
      console.error('Failed to start BLE scanning:', error);
      throw error;
    }
  }

  async stopScanning(): Promise<void> {
    const BleClient = this.getBlePlugin();
    if (!BleClient || !this.scanning) return;

    try {
      await BleClient.stopLEScan();
      this.scanning = false;
      console.log('BLE scanning stopped');
    } catch (error) {
      console.error('Failed to stop scanning:', error);
    }
  }

  private scheduleRescan(): void {
    if (!this.advertising) return;
    if (this.rescanTimer) clearTimeout(this.rescanTimer);

    this.rescanTimer = setTimeout(async () => {
      if (this.advertising && !this.scanning) {
        console.log('Periodic BLE rescan starting...');
        try {
          await this.startScanning();
        } catch (error) {
          console.error('Periodic rescan failed:', error);
          this.scheduleRescan();
        }
      }
    }, 30000);
  }

  async connectToDevice(deviceId: string): Promise<void> {
    const BleClient = this.getBlePlugin();
    if (!BleClient) throw new Error('BLE plugin not available');

    try {
      await BleClient.connect(deviceId, (disconnectedDeviceId: string) => {
        this.connectedDevices.delete(disconnectedDeviceId);
        this.callbacks.onDeviceDisconnected(disconnectedDeviceId);
      });

      await BleClient.startNotifications(
        deviceId,
        OFFCHAT_SERVICE_UUID,
        OFFCHAT_MESSAGE_CHARACTERISTIC_UUID,
        (value: any) => {
          const data = this.dataViewToString(value);
          if (data) {
            this.callbacks.onMessageReceived(deviceId, data);
          }
        }
      );

      await BleClient.startNotifications(
        deviceId,
        OFFCHAT_SERVICE_UUID,
        OFFCHAT_DISCOVERY_CHARACTERISTIC_UUID,
        (value: any) => {
          const data = this.dataViewToString(value);
          if (data) {
            this.callbacks.onDiscoveryReceived(deviceId, data);
          }
        }
      );

      const device: NativeBleDevice = { deviceId, name: undefined };
      this.connectedDevices.set(deviceId, device);

      console.log(`Connected to BLE device: ${deviceId}`);
    } catch (error) {
      console.error(`Failed to connect to device ${deviceId}:`, error);
      throw error;
    }
  }

  async sendData(deviceId: string, characteristicUuid: string, data: string): Promise<void> {
    const BleClient = this.getBlePlugin();
    if (!BleClient) throw new Error('BLE plugin not available');

    try {
      const encoded = this.stringToDataView(data);
      await BleClient.write(
        deviceId,
        OFFCHAT_SERVICE_UUID,
        characteristicUuid,
        encoded
      );
    } catch (error) {
      console.error('Failed to send BLE data:', error);
      throw error;
    }
  }

  async sendMessage(deviceId: string, data: string): Promise<void> {
    await this.sendData(deviceId, OFFCHAT_MESSAGE_CHARACTERISTIC_UUID, data);
  }

  async sendDiscovery(deviceId: string, data: string): Promise<void> {
    await this.sendData(deviceId, OFFCHAT_DISCOVERY_CHARACTERISTIC_UUID, data);
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    const BleClient = this.getBlePlugin();
    if (!BleClient) return;

    try {
      await BleClient.stopNotifications(deviceId, OFFCHAT_SERVICE_UUID, OFFCHAT_MESSAGE_CHARACTERISTIC_UUID);
      await BleClient.stopNotifications(deviceId, OFFCHAT_SERVICE_UUID, OFFCHAT_DISCOVERY_CHARACTERISTIC_UUID);
      await BleClient.disconnect(deviceId);
      this.connectedDevices.delete(deviceId);
    } catch (error) {
      console.error('Failed to disconnect device:', error);
    }
  }

  async disconnectAll(): Promise<void> {
    if (this.rescanTimer) {
      clearTimeout(this.rescanTimer);
      this.rescanTimer = null;
    }
    for (const deviceId of this.connectedDevices.keys()) {
      await this.disconnectDevice(deviceId);
    }
    await this.stopScanning();
    await this.stopAdvertising();
  }

  getConnectedDevices(): NativeBleDevice[] {
    return Array.from(this.connectedDevices.values());
  }

  isScanning(): boolean {
    return this.scanning;
  }

  isAdvertisingActive(): boolean {
    return this.advertising;
  }

  private dataViewToString(value: any): string | null {
    try {
      if (value instanceof DataView) {
        const decoder = new TextDecoder();
        return decoder.decode(value.buffer);
      }
      if (typeof value === 'string') return value;
      if (value?.buffer) {
        const decoder = new TextDecoder();
        return decoder.decode(value.buffer);
      }
      return null;
    } catch {
      return null;
    }
  }

  private stringToDataView(str: string): DataView {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str);
    return new DataView(encoded.buffer);
  }
}
