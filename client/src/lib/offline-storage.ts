// Offline message storage using IndexedDB for offline messaging functionality

interface OfflineMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  messageType: string;
  timestamp: number;
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;
  bluetoothDeviceId?: string;
  transactionData?: any;
}

interface OfflineContact {
  id: string;
  username: string;
  bluetoothDeviceId: string;
  lastSeen: number;
  publicKey?: string; // For future encryption
}

class OfflineStorageManager {
  private dbName = 'OffchatOfflineDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messagesStore = db.createObjectStore('messages', { keyPath: 'id' });
          messagesStore.createIndex('chatId', 'chatId', { unique: false });
          messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
          messagesStore.createIndex('status', 'status', { unique: false });
        }

        // Create contacts store for nearby Bluetooth devices
        if (!db.objectStoreNames.contains('contacts')) {
          const contactsStore = db.createObjectStore('contacts', { keyPath: 'id' });
          contactsStore.createIndex('bluetoothDeviceId', 'bluetoothDeviceId', { unique: true });
          contactsStore.createIndex('lastSeen', 'lastSeen', { unique: false });
        }

        // Create chat metadata store
        if (!db.objectStoreNames.contains('chats')) {
          const chatsStore = db.createObjectStore('chats', { keyPath: 'id' });
          chatsStore.createIndex('lastActivity', 'lastActivity', { unique: false });
        }
      };
    });
  }

  private ensureDb(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  // Store a message for offline sending
  async storeOfflineMessage(message: Omit<OfflineMessage, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<string> {
    const db = this.ensureDb();
    const id = crypto.randomUUID();
    
    const offlineMessage: OfflineMessage = {
      ...message,
      id,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const request = store.add(offlineMessage);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(new Error('Failed to store offline message'));
    });
  }

  // Get all pending messages for a specific chat
  async getPendingMessages(chatId: string): Promise<OfflineMessage[]> {
    const db = this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const index = store.index('chatId');
      const request = index.getAll(chatId);

      request.onsuccess = () => {
        const messages = request.result.filter(msg => msg.status === 'pending');
        resolve(messages.sort((a, b) => a.timestamp - b.timestamp));
      };
      request.onerror = () => reject(new Error('Failed to get pending messages'));
    });
  }

  // Get all pending messages for Bluetooth transmission
  async getAllPendingMessages(): Promise<OfflineMessage[]> {
    const db = this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => {
        resolve(request.result.sort((a, b) => a.timestamp - b.timestamp));
      };
      request.onerror = () => reject(new Error('Failed to get all pending messages'));
    });
  }

  // Mark a message as sent
  async markMessageSent(messageId: string): Promise<void> {
    const db = this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const getRequest = store.get(messageId);

      getRequest.onsuccess = () => {
        const message = getRequest.result;
        if (message) {
          message.status = 'sent';
          const putRequest = store.put(message);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(new Error('Failed to mark message as sent'));
        } else {
          reject(new Error('Message not found'));
        }
      };
      getRequest.onerror = () => reject(new Error('Failed to get message'));
    });
  }

  // Mark a message as failed and increment retry count
  async markMessageFailed(messageId: string): Promise<void> {
    const db = this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const getRequest = store.get(messageId);

      getRequest.onsuccess = () => {
        const message = getRequest.result;
        if (message) {
          message.status = 'failed';
          message.retryCount += 1;
          const putRequest = store.put(message);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(new Error('Failed to mark message as failed'));
        } else {
          reject(new Error('Message not found'));
        }
      };
      getRequest.onerror = () => reject(new Error('Failed to get message'));
    });
  }

  // Store/update nearby contact information
  async storeContact(contact: OfflineContact): Promise<void> {
    const db = this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['contacts'], 'readwrite');
      const store = transaction.objectStore('contacts');
      const request = store.put(contact);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to store contact'));
    });
  }

  // Get all known contacts
  async getContacts(): Promise<OfflineContact[]> {
    const db = this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['contacts'], 'readonly');
      const store = transaction.objectStore('contacts');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result.sort((a, b) => b.lastSeen - a.lastSeen));
      };
      request.onerror = () => reject(new Error('Failed to get contacts'));
    });
  }

  // Get recently seen contacts (within last hour)
  async getRecentContacts(): Promise<OfflineContact[]> {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const contacts = await this.getContacts();
    return contacts.filter(contact => contact.lastSeen > oneHourAgo);
  }

  // Clean up old data (messages older than 7 days, contacts not seen for 24h)
  async cleanup(): Promise<void> {
    const db = this.ensureDb();
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messages', 'contacts'], 'readwrite');
      
      // Clean old messages
      const messagesStore = transaction.objectStore('messages');
      const messagesIndex = messagesStore.index('timestamp');
      const messagesRequest = messagesIndex.openCursor(IDBKeyRange.upperBound(sevenDaysAgo));
      
      messagesRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (cursor.value.status === 'sent') {
            cursor.delete();
          }
          cursor.continue();
        }
      };

      // Clean old contacts
      const contactsStore = transaction.objectStore('contacts');
      const contactsIndex = contactsStore.index('lastSeen');
      const contactsRequest = contactsIndex.openCursor(IDBKeyRange.upperBound(oneDayAgo));
      
      contactsRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to cleanup database'));
    });
  }

  // Get storage usage statistics
  async getStorageStats(): Promise<{ messageCount: number; contactCount: number; totalSize: number }> {
    const db = this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messages', 'contacts'], 'readonly');
      let messageCount = 0;
      let contactCount = 0;

      const messagesStore = transaction.objectStore('messages');
      messagesStore.count().onsuccess = (event) => {
        messageCount = (event.target as IDBRequest).result;
      };

      const contactsStore = transaction.objectStore('contacts');
      contactsStore.count().onsuccess = (event) => {
        contactCount = (event.target as IDBRequest).result;
      };

      transaction.oncomplete = () => {
        // Rough estimation of storage size
        const totalSize = (messageCount * 200) + (contactCount * 100); // bytes
        resolve({ messageCount, contactCount, totalSize });
      };

      transaction.onerror = () => reject(new Error('Failed to get storage stats'));
    });
  }
}

// Create singleton instance
export const offlineStorage = new OfflineStorageManager();

// Export types for use in other files
export type { OfflineMessage, OfflineContact };