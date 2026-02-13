import { type User, type InsertUser, type UpsertUser, type Chat, type InsertChat, type Message, type InsertMessage, type ChatParticipant, type Friendship, type InsertFriendship, type BannedMember, type InsertBannedMember, type BlockedUser, type InsertBlockedUser, type Nft, type InsertNft } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(userId: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  updateUserBalance(userId: string, ethBalance: string, bnbBalance: string): Promise<User | undefined>;
  updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void>;
  updateUserAvatar(userId: string, avatarPath: string): Promise<void>;
  searchUsers(query: string, excludeUserId?: string): Promise<User[]>;

  // Friend methods
  sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship>;
  acceptFriendRequest(friendshipId: string): Promise<void>;
  rejectFriendRequest(friendshipId: string): Promise<void>;
  getFriends(userId: string): Promise<User[]>;
  getFriendRequests(userId: string): Promise<Friendship[]>;
  getSentFriendRequests(userId: string): Promise<Friendship[]>;
  checkFriendship(userId1: string, userId2: string): Promise<Friendship | undefined>;
  getFriendship(friendshipId: string): Promise<Friendship | undefined>;

  // Chat methods
  getChat(id: string): Promise<Chat | undefined>;
  getChatByUsername(username: string): Promise<Chat | undefined>;
  getUserChats(userId: string): Promise<Chat[]>;
  searchGroups(query: string): Promise<Chat[]>;
  createChat(chat: InsertChat): Promise<Chat>;
  addUserToChat(chatId: string, userId: string, role?: string): Promise<void>;
  removeUserFromChat(chatId: string, userId: string): Promise<void>;
  getChatParticipants(chatId: string): Promise<(User & { role: string })[]>;
  updateUserRole(chatId: string, userId: string, role: string): Promise<boolean>;
  updateChatAvatar(chatId: string, avatarPath: string): Promise<void>;
  updateChatInfo(chatId: string, info: { name?: string; description?: string }): Promise<boolean>;
  deleteChat(chatId: string): Promise<boolean>;
  updateChatPin(chatId: string, isPinned: boolean): Promise<boolean>;

  // Message methods
  getChatMessages(chatId: string, limit?: number): Promise<(Message & { senderUsername?: string, senderAvatar?: string | null, senderRole?: string })[]>;
  getMessage(messageId: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessage(messageId: string): Promise<boolean>;
  deleteAllUserMessages(chatId: string, userId: string): Promise<number>;
  markMessageAsDelivered(messageId: string): Promise<void>;
  markMessageAsRead(messageId: string): Promise<void>;
  updateMessagePin(messageId: string, isPinned: boolean): Promise<boolean>;
  getPinnedMessages(chatId: string): Promise<Message[]>;
  
  // Block methods
  blockUser(blockerId: string, blockedId: string): Promise<BlockedUser>;
  unblockUser(blockerId: string, blockedId: string): Promise<void>;
  getBlockedUsers(userId: string): Promise<User[]>;
  isUserBlocked(blockerId: string, blockedId: string): Promise<boolean>;

  // Ban methods
  banUser(chatId: string, userId: string, bannedBy: string, reason?: string): Promise<BannedMember>;
  unbanUser(chatId: string, userId: string): Promise<void>;
  getBannedMembers(chatId: string): Promise<(User & { bannedAt: Date; bannedBy: string; reason?: string })[]>;
  isUserBanned(chatId: string, userId: string): Promise<boolean>;

  // OFFC Transfer methods
  getOFFCTransferLeaderboard(): Promise<Array<{
    userId: string;
    username: string;
    walletAddress: string | null;
    totalTransferred: string;
    transferCount: number;
    latestTransfer: Date | null;
    avatar?: string | null;
  }>>;

  // NFT methods
  getNftById(nftId: string): Promise<Nft | undefined>;
  getNftsByUser(userId: string): Promise<Nft[]>;
  getNftsWithPrivateUrls(): Promise<Nft[]>;
  createNft(nft: InsertNft): Promise<Nft>;
  updateNft(nftId: string, updates: Partial<InsertNft>): Promise<Nft | undefined>;
  deleteNft(nftId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chats: Map<string, Chat>;
  private messages: Map<string, Message>;
  private chatParticipants: Map<string, ChatParticipant>;
  private blockedUsers: Map<string, BlockedUser>;
  private bannedMembers: Map<string, BannedMember>;
  private nfts: Map<string, Nft>;

  constructor() {
    this.users = new Map();
    this.chats = new Map();
    this.messages = new Map();
    this.chatParticipants = new Map();
    this.blockedUsers = new Map();
    this.bannedMembers = new Map();
    this.nfts = new Map();
    
    // Initialize with some demo data
    this.initializeDemo();
  }

  private initializeDemo() {
    // Create demo users
    const demoUsers = [
      { id: "user1", username: "OffchatAdmin", walletAddress: "0xf4b32a4cdfB630076D5Cb2EeF02D1F0Fe08d79b0", ethBalance: "1.5", bnbBalance: "0.8", avatar: "A", bio: "Matrix Admin", isOnline: true, lastSeen: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { id: "user2", username: "Morpheus", walletAddress: "0x2345678901234567890123456789012345678901", ethBalance: "2.3", bnbBalance: "1.2", avatar: "M", bio: "Matrix guide", isOnline: true, lastSeen: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { id: "user3", username: "Trinity", walletAddress: "0x3456789012345678901234567890123456789012", ethBalance: "0.7", bnbBalance: "0.4", avatar: "T", bio: "Hacker", isOnline: false, lastSeen: new Date(Date.now() - 300000), createdAt: new Date(), updatedAt: new Date() },
      { id: "user4", username: "Alice", walletAddress: "0x4567890123456789012345678901234567890123", ethBalance: "1.1", bnbBalance: "0.6", avatar: "A", bio: "Wonderland traveler", isOnline: false, lastSeen: new Date(Date.now() - 120000), createdAt: new Date(), updatedAt: new Date() }
    ];

    demoUsers.forEach(user => this.users.set(user.id, user));

    // Create demo chats
    const demoChats = [
      { id: "chat1", name: null, username: null, avatar: null, description: null, isGroup: false, isPinned: false, createdAt: new Date() },
      { id: "chat2", name: null, username: null, avatar: null, description: null, isGroup: false, isPinned: false, createdAt: new Date() },
      { id: "chat3", name: null, username: null, avatar: null, description: null, isGroup: false, isPinned: false, createdAt: new Date() }
    ];

    demoChats.forEach(chat => this.chats.set(chat.id, chat));

    // Add participants to chats
    const participants = [
      { id: "p1", chatId: "chat1", userId: "user1", role: "member", joinedAt: new Date() },
      { id: "p2", chatId: "chat1", userId: "user2", role: "member", joinedAt: new Date() },
      { id: "p3", chatId: "chat2", userId: "user1", role: "member", joinedAt: new Date() },
      { id: "p4", chatId: "chat2", userId: "user3", role: "member", joinedAt: new Date() },
      { id: "p5", chatId: "chat3", userId: "user1", role: "member", joinedAt: new Date() },
      { id: "p6", chatId: "chat3", userId: "user4", role: "member", joinedAt: new Date() }
    ];

    participants.forEach(p => this.chatParticipants.set(p.id, p));

    // Create demo messages
    const demoMessages = [
      {
        id: "msg1",
        chatId: "chat1",
        senderId: "user2",
        content: "Matrix'e hoş geldin, Neo. Bu mesaj şifrelendi.",
        messageType: "text",
        transactionHash: null,
        amount: null,
        tokenSymbol: null,
        nftId: null,
        timestamp: new Date(Date.now() - 60000),
        isDelivered: true,
        isRead: true,
        isPinned: false
      },
      {
        id: "msg2",
        chatId: "chat1",
        senderId: "user1",
        content: "Kırmızı hapı seçiyorum!",
        messageType: "text",
        transactionHash: null,
        amount: null,
        tokenSymbol: null,
        nftId: null,
        timestamp: new Date(Date.now() - 30000),
        isDelivered: true,
        isRead: true,
        isPinned: false
      },
      {
        id: "msg3",
        chatId: "chat2",
        senderId: "user3",
        content: "0.5 ETH gönderildi",
        messageType: "crypto_transaction",
        transactionHash: "0xabc123def456",
        amount: "0.5",
        tokenSymbol: "ETH",
        nftId: null,
        timestamp: new Date(Date.now() - 180000),
        isDelivered: true,
        isRead: true,
        isPinned: false
      }
    ];

    demoMessages.forEach(msg => this.messages.set(msg.id, msg));

    // Create demo NFTs
    const demoNfts = [
      {
        id: "nft1",
        ownerId: "user1",
        contractAddress: "0x7Bd29408f11D2bFC23c34f18275bBf23bB716Bc7",
        tokenId: "1",
        name: "Matrix Genesis #001",
        description: "The first NFT in the Matrix collection",
        imageUrl: "https://example.com/nft1.png",
        collectionName: "Matrix Genesis",
        chain: "ethereum",
        metadata: { rarity: "legendary", attributes: [{ trait_type: "Power", value: "100" }] },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "nft2",
        ownerId: "user2",
        contractAddress: "0x7Bd29408f11D2bFC23c34f18275bBf23bB716Bc7",
        tokenId: "2",
        name: "Matrix Genesis #002",
        description: "Second NFT in the Matrix collection",
        imageUrl: "https://example.com/nft2.png",
        collectionName: "Matrix Genesis",
        chain: "ethereum",
        metadata: { rarity: "rare", attributes: [{ trait_type: "Power", value: "75" }] },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "nft3",
        ownerId: "user1",
        contractAddress: "0x495f947276749Ce646f68AC8c248420045cb7b5e",
        tokenId: "123",
        name: "Crypto Punk Avatar",
        description: "A unique crypto punk avatar",
        imageUrl: "https://example.com/nft3.png",
        collectionName: "Crypto Punks",
        chain: "polygon",
        metadata: { rarity: "common", attributes: [{ trait_type: "Style", value: "Cool" }] },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    demoNfts.forEach(nft => this.nfts.set(nft.id, nft));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.walletAddress === walletAddress);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      username: insertUser.username,
      walletAddress: insertUser.walletAddress || null,
      ethBalance: insertUser.ethBalance || "0",
      bnbBalance: insertUser.bnbBalance || "0",
      avatar: insertUser.avatar || null,
      bio: insertUser.bio || null,
      isOnline: false,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(userId: string, ethBalance: string, bnbBalance: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (user) {
      const updatedUser = { ...user, ethBalance, bnbBalance, updatedAt: new Date() };
      this.users.set(userId, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
      this.users.set(userId, user);
    }
  }

  async updateUserAvatar(userId: string, avatarPath: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.avatar = avatarPath;
      user.updatedAt = new Date();
      this.users.set(userId, user);
    }
  }

  async updateChatAvatar(chatId: string, avatarPath: string): Promise<void> {
    const chat = this.chats.get(chatId);
    if (chat) {
      chat.avatar = avatarPath;
      this.chats.set(chatId, chat);
    }
  }

  async updateChatInfo(chatId: string, info: { name?: string; description?: string }): Promise<boolean> {
    const chat = this.chats.get(chatId);
    if (chat) {
      if (info.name !== undefined) chat.name = info.name;
      if (info.description !== undefined) chat.description = info.description;
      this.chats.set(chatId, chat);
      return true;
    }
    return false;
  }

  async getChat(id: string): Promise<Chat | undefined> {
    return this.chats.get(id);
  }

  async getChatByUsername(username: string): Promise<Chat | undefined> {
    return Array.from(this.chats.values()).find(chat => chat.username === username);
  }

  async searchGroups(query: string): Promise<Chat[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.chats.values()).filter(chat => 
      chat.isGroup && (
        chat.name?.toLowerCase().includes(lowerQuery) ||
        chat.username?.toLowerCase().includes(lowerQuery) ||
        chat.description?.toLowerCase().includes(lowerQuery)
      )
    );
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    const userChatIds = Array.from(this.chatParticipants.values())
      .filter(p => p.userId === userId)
      .map(p => p.chatId);
    
    return userChatIds.map(chatId => this.chats.get(chatId)).filter(Boolean) as Chat[];
  }

  async createChat(insertChat: InsertChat): Promise<Chat> {
    const id = randomUUID();
    const chat: Chat = {
      id,
      name: insertChat.name || null,
      username: insertChat.username || null,
      avatar: insertChat.avatar || null,
      description: insertChat.description || null,
      isGroup: insertChat.isGroup || false,
      isPinned: false,
      createdAt: new Date()
    };
    this.chats.set(id, chat);
    return chat;
  }

  async addUserToChat(chatId: string, userId: string, role: string = "member"): Promise<void> {
    const id = randomUUID();
    const participant: ChatParticipant = {
      id,
      chatId,
      userId,
      role,
      joinedAt: new Date()
    };
    this.chatParticipants.set(id, participant);
  }

  async updateUserRole(chatId: string, userId: string, role: string): Promise<boolean> {
    // Find the participant
    for (const [id, participant] of this.chatParticipants) {
      if (participant.chatId === chatId && participant.userId === userId) {
        const updatedParticipant = { ...participant, role };
        this.chatParticipants.set(id, updatedParticipant);
        return true;
      }
    }
    return false;
  }

  async getChatMessages(chatId: string, limit = 50): Promise<(Message & { senderUsername?: string, senderAvatar?: string | null, senderRole?: string })[]> {
    const chatMessages = Array.from(this.messages.values())
      .filter(msg => msg.chatId === chatId)
      .sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0))
      .slice(-limit);
    
    // Add sender information to messages
    return chatMessages.map(message => {
      const sender = Array.from(this.users.values()).find(u => u.id === message.senderId);
      const participant = Array.from(this.chatParticipants.values())
        .find(p => p.chatId === chatId && p.userId === message.senderId);
      
      return {
        ...message,
        senderUsername: sender?.username,
        senderAvatar: sender?.avatar,
        senderRole: participant?.role || 'member'
      };
    });
  }

  async getMessage(messageId: string): Promise<Message | undefined> {
    return this.messages.get(messageId);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      id,
      chatId: insertMessage.chatId,
      senderId: insertMessage.senderId,
      content: insertMessage.content,
      messageType: insertMessage.messageType || "text",
      transactionHash: insertMessage.transactionHash || null,
      amount: insertMessage.amount || null,
      tokenSymbol: insertMessage.tokenSymbol || null,
      nftId: insertMessage.nftId || null,
      timestamp: new Date(),
      isDelivered: false,
      isRead: false,
      isPinned: false
    };
    this.messages.set(id, message);
    return message;
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    return this.messages.delete(messageId);
  }

  async markMessageAsDelivered(messageId: string): Promise<void> {
    const message = this.messages.get(messageId);
    if (message) {
      message.isDelivered = true;
      this.messages.set(messageId, message);
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    const message = this.messages.get(messageId);
    if (message) {
      message.isRead = true;
      this.messages.set(messageId, message);
    }
  }

  async updateMessagePin(messageId: string, isPinned: boolean): Promise<boolean> {
    const message = this.messages.get(messageId);
    if (message) {
      (message as any).isPinned = isPinned;
      this.messages.set(messageId, message);
      return true;
    }
    return false;
  }

  async getPinnedMessages(chatId: string): Promise<Message[]> {
    const chatMessages = Array.from(this.messages.values())
      .filter(msg => msg.chatId === chatId && (msg as any).isPinned === true)
      .sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
    
    return chatMessages;
  }

  // Additional methods for interface compliance
  async upsertUser(user: UpsertUser): Promise<User> {
    if (user.id && this.users.has(user.id)) {
      const existingUser = this.users.get(user.id)!;
      const updatedUser = {
        ...existingUser,
        ...user,
        updatedAt: new Date()
      };
      this.users.set(user.id, updatedUser);
      return updatedUser;
    }
    return this.createUser(user);
  }

  async updateUserProfile(userId: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (user) {
      const updatedUser = { ...user, ...updates, updatedAt: new Date() };
      this.users.set(userId, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  async searchUsers(query: string, excludeUserId?: string): Promise<User[]> {
    console.log('MemStorage.searchUsers called with:', query, excludeUserId);
    return Array.from(this.users.values())
      .filter(user => 
        user.username.toLowerCase().includes(query.toLowerCase()) &&
        user.id !== excludeUserId
      )
      .slice(0, 20);
  }

  async sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship> {
    const id = randomUUID();
    const friendship: Friendship = {
      id,
      requesterId,
      addresseeId,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    // Mock implementation for MemStorage
    return friendship;
  }

  async acceptFriendRequest(friendshipId: string): Promise<void> {
    // Mock implementation for MemStorage
  }

  async rejectFriendRequest(friendshipId: string): Promise<void> {
    // Mock implementation for MemStorage
  }

  async getFriends(userId: string): Promise<User[]> {
    // Mock implementation for MemStorage
    return [];
  }

  async getFriendRequests(userId: string): Promise<Friendship[]> {
    // Mock implementation for MemStorage
    return [];
  }

  async getSentFriendRequests(userId: string): Promise<Friendship[]> {
    // Mock implementation for MemStorage
    return [];
  }

  async checkFriendship(userId1: string, userId2: string): Promise<Friendship | undefined> {
    // Mock implementation for MemStorage
    return undefined;
  }

  async getFriendship(friendshipId: string): Promise<Friendship | undefined> {
    // Mock implementation for MemStorage
    return undefined;
  }

  async removeUserFromChat(chatId: string, userId: string): Promise<void> {
    // Mock implementation for MemStorage
  }

  async getChatParticipants(chatId: string): Promise<(User & { role: string })[]> {
    const participants = Array.from(this.chatParticipants.values())
      .filter(p => p.chatId === chatId)
      .map(p => {
        const user = this.users.get(p.userId);
        return user ? { ...user, role: p.role } : null;
      })
      .filter(Boolean) as (User & { role: string })[];
    return participants;
  }


  async deleteChat(chatId: string): Promise<boolean> {
    // Delete all messages in the chat
    const messagesToDelete = Array.from(this.messages.values())
      .filter(message => message.chatId === chatId);
    messagesToDelete.forEach(msg => this.messages.delete(msg.id));

    // Delete all chat participants
    const participantsToDelete = Array.from(this.chatParticipants.values())
      .filter(participant => participant.chatId === chatId);
    participantsToDelete.forEach(p => this.chatParticipants.delete(p.id));

    // Delete the chat itself
    return this.chats.delete(chatId);
  }

  async updateChatPin(chatId: string, isPinned: boolean): Promise<boolean> {
    const chat = this.chats.get(chatId);
    if (chat) {
      (chat as any).isPinned = isPinned;
      this.chats.set(chatId, chat);
      return true;
    }
    return false;
  }

  async blockUser(blockerId: string, blockedId: string): Promise<BlockedUser> {
    const blockedUser: BlockedUser = {
      id: randomUUID(),
      blockerId,
      blockedId,
      createdAt: new Date(),
    };
    this.blockedUsers.set(blockedUser.id, blockedUser);
    return blockedUser;
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    for (const [id, block] of this.blockedUsers.entries()) {
      if (block.blockerId === blockerId && block.blockedId === blockedId) {
        this.blockedUsers.delete(id);
        break;
      }
    }
  }

  async getBlockedUsers(userId: string): Promise<User[]> {
    const blocked: User[] = [];
    for (const block of this.blockedUsers.values()) {
      if (block.blockerId === userId) {
        const blockedUser = this.users.get(block.blockedId);
        if (blockedUser) {
          blocked.push(blockedUser);
        }
      }
    }
    return blocked;
  }

  async isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    for (const block of this.blockedUsers.values()) {
      if (block.blockerId === blockerId && block.blockedId === blockedId) {
        return true;
      }
    }
    return false;
  }

  async banUser(chatId: string, userId: string, bannedBy: string, reason?: string): Promise<BannedMember> {
    const bannedMember: BannedMember = {
      id: randomUUID(),
      chatId,
      userId,
      bannedBy,
      reason: reason || null,
      bannedAt: new Date(),
    };
    
    this.bannedMembers.set(bannedMember.id, bannedMember);
    
    // Remove user from chat
    await this.removeUserFromChat(chatId, userId);
    
    return bannedMember;
  }

  async unbanUser(chatId: string, userId: string): Promise<void> {
    const bannedMember = Array.from(this.bannedMembers.values()).find(
      bm => bm.chatId === chatId && bm.userId === userId
    );
    
    if (bannedMember) {
      this.bannedMembers.delete(bannedMember.id);
    }
  }

  async getBannedMembers(chatId: string): Promise<(User & { bannedAt: Date; bannedBy: string; reason?: string })[]> {
    const bannedMembersInChat = Array.from(this.bannedMembers.values()).filter(
      bm => bm.chatId === chatId
    );
    
    const bannedUsers = [];
    for (const bannedMember of bannedMembersInChat) {
      const user = this.users.get(bannedMember.userId);
      if (user) {
        bannedUsers.push({
          ...user,
          bannedAt: bannedMember.bannedAt!,
          bannedBy: bannedMember.bannedBy,
          reason: bannedMember.reason || undefined,
        });
      }
    }
    
    return bannedUsers;
  }

  async isUserBanned(chatId: string, userId: string): Promise<boolean> {
    const bannedMember = Array.from(this.bannedMembers.values()).find(
      bm => bm.chatId === chatId && bm.userId === userId
    );
    return !!bannedMember;
  }

  async deleteAllUserMessages(chatId: string, userId: string): Promise<number> {
    const messagesToDelete = Array.from(this.messages.values())
      .filter(message => message.chatId === chatId && message.senderId === userId);
    
    messagesToDelete.forEach(message => this.messages.delete(message.id));
    return messagesToDelete.length;
  }


  async getOFFCTransferLeaderboard(): Promise<Array<{
    userId: string;
    username: string;
    walletAddress: string | null;
    totalTransferred: string;
    transferCount: number;
    latestTransfer: Date | null;
    avatar?: string | null;
  }>> {
    // Get all OFFC transfers from messages
    const offcTransfers = Array.from(this.messages.values())
      .filter(m => m.messageType === 'crypto' && m.tokenSymbol === 'OFFC');
    
    // Group by sender
    const leaderboardMap = new Map<string, {
      userId: string;
      username: string;
      walletAddress: string | null;
      totalTransferred: number;
      transferCount: number;
      latestTransfer: Date | null;
      avatar?: string | null;
    }>();
    
    offcTransfers.forEach(transfer => {
      const user = this.users.get(transfer.senderId);
      if (!user) return;
      
      const existing = leaderboardMap.get(transfer.senderId);
      const amount = parseFloat(transfer.amount || '0');
      
      if (existing) {
        existing.totalTransferred += amount;
        existing.transferCount += 1;
        if (transfer.timestamp && existing.latestTransfer && transfer.timestamp > existing.latestTransfer) {
          existing.latestTransfer = transfer.timestamp;
        }
      } else {
        leaderboardMap.set(transfer.senderId, {
          userId: user.id,
          username: user.username,
          walletAddress: user.walletAddress,
          totalTransferred: amount,
          transferCount: 1,
          latestTransfer: transfer.timestamp,
          avatar: user.avatar
        });
      }
    });
    
    // Convert to array, sort by total transferred (descending)
    return Array.from(leaderboardMap.values())
      .map(entry => ({
        ...entry,
        totalTransferred: entry.totalTransferred.toString()
      }))
      .sort((a, b) => parseFloat(b.totalTransferred) - parseFloat(a.totalTransferred));
  }

  // NFT methods
  async getNftById(nftId: string): Promise<Nft | undefined> {
    return this.nfts.get(nftId);
  }

  async getNftsByUser(userId: string): Promise<Nft[]> {
    return Array.from(this.nfts.values()).filter(nft => nft.ownerId === userId);
  }

  async getNftsWithPrivateUrls(): Promise<Nft[]> {
    return Array.from(this.nfts.values()).filter(nft => 
      nft.imageUrl && nft.imageUrl.includes('/.private/uploads/')
    );
  }

  async createNft(insertNft: InsertNft): Promise<Nft> {
    const id = randomUUID();
    const nft: Nft = {
      id,
      ownerId: insertNft.ownerId,
      contractAddress: insertNft.contractAddress,
      tokenId: insertNft.tokenId,
      name: insertNft.name,
      description: insertNft.description || null,
      imageUrl: insertNft.imageUrl || null,
      collectionName: insertNft.collectionName || null,
      chain: insertNft.chain,
      metadata: insertNft.metadata || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.nfts.set(id, nft);
    return nft;
  }

  async updateNft(nftId: string, updates: Partial<InsertNft>): Promise<Nft | undefined> {
    const nft = this.nfts.get(nftId);
    if (nft) {
      const updatedNft = { ...nft, ...updates, updatedAt: new Date() };
      this.nfts.set(nftId, updatedNft);
      return updatedNft;
    }
    return undefined;
  }

  async deleteNft(nftId: string): Promise<boolean> {
    return this.nfts.delete(nftId);
  }
}
