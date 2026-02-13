import { 
  users, 
  chats, 
  messages, 
  chatParticipants, 
  friendships,
  blockedUsers,
  bannedMembers,
  nfts,
  type User, 
  type InsertUser, 
  type UpsertUser,
  type Chat, 
  type InsertChat, 
  type Message, 
  type InsertMessage, 
  type ChatParticipant,
  type Friendship,
  type InsertFriendship,
  type BannedMember,
  type InsertBannedMember,
  type BlockedUser,
  type InsertBlockedUser,
  type Nft,
  type InsertNft
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, ilike, desc, asc, sql, ne } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(ilike(users.walletAddress, walletAddress));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    console.log('DatabaseStorage.createUser received:', insertUser);
    
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    
    console.log('DatabaseStorage.createUser created user successfully');
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          username: userData.username,
          walletAddress: userData.walletAddress,
          avatar: userData.avatar,
          bio: userData.bio,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(userId: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async updateUserBalance(userId: string, ethBalance: string, bnbBalance: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        ethBalance,
        bnbBalance,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await db
      .update(users)
      .set({ 
        isOnline, 
        lastSeen: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateUserAvatar(userId: string, avatarPath: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        avatar: avatarPath,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateChatAvatar(chatId: string, avatarPath: string): Promise<void> {
    await db
      .update(chats)
      .set({ 
        avatar: avatarPath
      })
      .where(eq(chats.id, chatId));
  }

  async updateChatInfo(chatId: string, info: { name?: string; description?: string }): Promise<boolean> {
    const result = await db
      .update(chats)
      .set(info)
      .where(eq(chats.id, chatId));
    
    return (result.rowCount ?? 0) > 0;
  }

  async searchUsers(query: string, excludeUserId?: string): Promise<User[]> {
    console.log('=== DB SEARCH:', query, 'exclude:', excludeUserId);
    let whereCondition = ilike(users.username, `%${query}%`);
    
    if (excludeUserId) {
      whereCondition = and(whereCondition, ne(users.id, excludeUserId))!;
    }

    return await db
      .select()
      .from(users)
      .where(whereCondition)
      .limit(20);
  }

  // Friend methods
  async sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship> {
    const [friendship] = await db
      .insert(friendships)
      .values({
        requesterId,
        addresseeId,
        status: "pending"
      })
      .returning();
    return friendship;
  }

  async acceptFriendRequest(friendshipId: string): Promise<void> {
    // Get the friendship details
    const friendship = await db
      .select()
      .from(friendships)
      .where(eq(friendships.id, friendshipId))
      .limit(1);
    
    if (friendship.length === 0) {
      throw new Error('Friendship not found');
    }

    const { requesterId, addresseeId } = friendship[0];

    // Update friendship status
    await db
      .update(friendships)
      .set({ 
        status: "accepted",
        updatedAt: new Date()
      })
      .where(eq(friendships.id, friendshipId));

    // Check if a chat already exists between these users
    const existingChat = await db
      .select({ 
        chatId: chatParticipants.chatId,
        count: sql<number>`count(*)`.as('count') 
      })
      .from(chatParticipants)
      .innerJoin(chats, eq(chats.id, chatParticipants.chatId))
      .where(
        and(
          eq(chats.isGroup, false),
          or(
            eq(chatParticipants.userId, requesterId),
            eq(chatParticipants.userId, addresseeId)
          )
        )
      )
      .groupBy(chatParticipants.chatId)
      .having(sql`count(*) = 2`);

    if (existingChat.length === 0) {
      // Create a new private chat
      const newChat = await db
        .insert(chats)
        .values({
          isGroup: false
        })
        .returning();

      const chatId = newChat[0].id;

      // Add both users as participants
      await db
        .insert(chatParticipants)
        .values([
          { chatId, userId: requesterId, role: "member" },
          { chatId, userId: addresseeId, role: "member" }
        ]);

      console.log(`Created chat ${chatId} for friendship between ${requesterId} and ${addresseeId}`);
    }
  }

  async rejectFriendRequest(friendshipId: string): Promise<void> {
    await db
      .update(friendships)
      .set({ 
        status: "rejected",
        updatedAt: new Date()
      })
      .where(eq(friendships.id, friendshipId));
  }

  async getFriends(userId: string): Promise<User[]> {
    const friends = await db
      .select({
        id: users.id,
        username: users.username,
        walletAddress: users.walletAddress,
        ethBalance: users.ethBalance,
        bnbBalance: users.bnbBalance,
        avatar: users.avatar,
        bio: users.bio,
        isOnline: users.isOnline,
        lastSeen: users.lastSeen,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(friendships)
      .innerJoin(users, 
        or(
          and(eq(friendships.requesterId, userId), eq(users.id, friendships.addresseeId)),
          and(eq(friendships.addresseeId, userId), eq(users.id, friendships.requesterId))
        )
      )
      .where(eq(friendships.status, "accepted"));

    return friends;
  }

  async getFriendRequests(userId: string): Promise<Friendship[]> {
    const results = await db
      .select({
        id: friendships.id,
        requesterId: friendships.requesterId,
        addresseeId: friendships.addresseeId,
        status: friendships.status,
        createdAt: friendships.createdAt,
        updatedAt: friendships.updatedAt,
        requesterName: users.username,
        requesterAvatar: users.avatar
      })
      .from(friendships)
      .leftJoin(users, eq(friendships.requesterId, users.id))
      .where(
        and(
          eq(friendships.addresseeId, userId),
          eq(friendships.status, "pending")
        )
      )
      .orderBy(desc(friendships.createdAt));

    return results.map(row => ({
      id: row.id,
      requesterId: row.requesterId,
      addresseeId: row.addresseeId,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      requesterName: row.requesterName || undefined,
      requesterAvatar: row.requesterAvatar || undefined
    }));
  }

  async getSentFriendRequests(userId: string): Promise<Friendship[]> {
    return await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.requesterId, userId),
          eq(friendships.status, "pending")
        )
      )
      .orderBy(desc(friendships.createdAt));
  }

  async checkFriendship(userId1: string, userId2: string): Promise<Friendship | undefined> {
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(eq(friendships.requesterId, userId1), eq(friendships.addresseeId, userId2)),
          and(eq(friendships.requesterId, userId2), eq(friendships.addresseeId, userId1))
        )
      );
    return friendship || undefined;
  }

  async getFriendship(friendshipId: string): Promise<Friendship | undefined> {
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(eq(friendships.id, friendshipId));
    return friendship || undefined;
  }

  // Chat methods
  async getChat(id: string): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat || undefined;
  }

  async getChatByUsername(username: string): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.username, username));
    return chat || undefined;
  }

  async searchGroups(query: string): Promise<Chat[]> {
    return await db
      .select()
      .from(chats)
      .where(
        and(
          eq(chats.isGroup, true),
          or(
            ilike(chats.name, `%${query}%`),
            ilike(chats.username, `%${query}%`),
            ilike(chats.description, `%${query}%`)
          )
        )
      )
      .limit(10);
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    const userChats = await db
      .select({
        id: chats.id,
        name: chats.name,
        username: chats.username,
        avatar: chats.avatar,
        description: chats.description,
        isGroup: chats.isGroup,
        isPinned: chats.isPinned,
        createdAt: chats.createdAt,
      })
      .from(chatParticipants)
      .innerJoin(chats, eq(chatParticipants.chatId, chats.id))
      .where(eq(chatParticipants.userId, userId))
      .orderBy(desc(chats.createdAt));

    return userChats;
  }

  async createChat(insertChat: InsertChat): Promise<Chat> {
    const [chat] = await db
      .insert(chats)
      .values(insertChat)
      .returning();
    return chat;
  }

  async addUserToChat(chatId: string, userId: string, role: string = "member"): Promise<void> {
    await db
      .insert(chatParticipants)
      .values({
        chatId,
        userId,
        role
      });
  }

  async removeUserFromChat(chatId: string, userId: string): Promise<void> {
    await db
      .delete(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.userId, userId)
        )
      );
  }

  async updateUserRole(chatId: string, userId: string, role: string): Promise<boolean> {
    const result = await db
      .update(chatParticipants)
      .set({ role })
      .where(
        and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.userId, userId)
        )
      );
    
    return (result.rowCount ?? 0) > 0;
  }

  async getChatParticipants(chatId: string): Promise<(User & { role: string })[]> {
    const participants = await db
      .select({
        id: users.id,
        username: users.username,
        walletAddress: users.walletAddress,
        ethBalance: users.ethBalance,
        bnbBalance: users.bnbBalance,
        avatar: users.avatar,
        bio: users.bio,
        isOnline: users.isOnline,
        lastSeen: users.lastSeen,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        role: chatParticipants.role,
      })
      .from(chatParticipants)
      .innerJoin(users, eq(chatParticipants.userId, users.id))
      .where(eq(chatParticipants.chatId, chatId));

    return participants.map(p => ({
      ...p,
      role: p.role ?? 'member'
    }));
  }

  // Message methods
  async getChatMessages(chatId: string, limit: number = 50): Promise<(Message & { senderUsername?: string, senderAvatar?: string | null, senderRole?: string })[]> {
    const results = await db
      .select({
        id: messages.id,
        chatId: messages.chatId,
        senderId: messages.senderId,
        content: messages.content,
        messageType: messages.messageType,
        transactionHash: messages.transactionHash,
        amount: messages.amount,
        tokenSymbol: messages.tokenSymbol,
        nftId: messages.nftId,
        timestamp: messages.timestamp,
        isDelivered: messages.isDelivered,
        isRead: messages.isRead,
        isPinned: messages.isPinned,
        senderUsername: users.username,
        senderAvatar: users.avatar,
        senderRole: chatParticipants.role,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .leftJoin(chatParticipants, and(
        eq(chatParticipants.userId, messages.senderId),
        eq(chatParticipants.chatId, messages.chatId)
      ))
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.timestamp))
      .limit(limit);

    return results.map(r => ({
      ...r,
      senderUsername: r.senderUsername ?? undefined,
      senderRole: r.senderRole ?? 'member'
    }));
  }

  async getMessage(messageId: string): Promise<Message | undefined> {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);
    
    return result[0];
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    const result = await db
      .delete(messages)
      .where(eq(messages.id, messageId));
    return (result.rowCount ?? 0) > 0;
  }

  async markMessageAsDelivered(messageId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isDelivered: true })
      .where(eq(messages.id, messageId));
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId));
  }

  async updateMessagePin(messageId: string, isPinned: boolean): Promise<boolean> {
    const result = await db
      .update(messages)
      .set({ isPinned })
      .where(eq(messages.id, messageId));
    return (result.rowCount ?? 0) > 0;
  }

  async getPinnedMessages(chatId: string): Promise<Message[]> {
    const results = await db
      .select()
      .from(messages)
      .where(and(eq(messages.chatId, chatId), eq(messages.isPinned, true)))
      .orderBy(asc(messages.timestamp));
    
    return results;
  }

  async deleteChat(chatId: string): Promise<boolean> {
    try {
      // Delete all messages in the chat
      await db.delete(messages).where(eq(messages.chatId, chatId));
      
      // Delete all chat participants
      await db.delete(chatParticipants).where(eq(chatParticipants.chatId, chatId));
      
      // Delete the chat itself
      await db.delete(chats).where(eq(chats.id, chatId));
      
      // If we get here without exception, deletion was successful
      return true;
    } catch (error) {
      console.error('Error deleting chat:', error);
      return false;
    }
  }

  async updateChatPin(chatId: string, isPinned: boolean): Promise<boolean> {
    const result = await db
      .update(chats)
      .set({ isPinned })
      .where(eq(chats.id, chatId));
    return (result.rowCount ?? 0) > 0;
  }



  // Block methods
  async blockUser(blockerId: string, blockedId: string): Promise<BlockedUser> {
    // Check if already blocked
    const existing = await db
      .select()
      .from(blockedUsers)
      .where(
        and(
          eq(blockedUsers.blockerId, blockerId),
          eq(blockedUsers.blockedId, blockedId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Already blocked, return the existing record
      return existing[0];
    }

    // Not blocked yet, create new block
    const [blocked] = await db
      .insert(blockedUsers)
      .values({ blockerId, blockedId })
      .returning();
    return blocked;
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    await db
      .delete(blockedUsers)
      .where(
        and(
          eq(blockedUsers.blockerId, blockerId),
          eq(blockedUsers.blockedId, blockedId)
        )
      );
  }

  async getBlockedUsers(userId: string): Promise<User[]> {
    const blocked = await db
      .select({
        id: users.id,
        username: users.username,
        walletAddress: users.walletAddress,
        ethBalance: users.ethBalance,
        bnbBalance: users.bnbBalance,
        avatar: users.avatar,
        bio: users.bio,
        isOnline: users.isOnline,
        lastSeen: users.lastSeen,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(blockedUsers)
      .innerJoin(users, eq(users.id, blockedUsers.blockedId))
      .where(eq(blockedUsers.blockerId, userId));
    
    return blocked;
  }

  async isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const [blocked] = await db
      .select()
      .from(blockedUsers)
      .where(
        and(
          eq(blockedUsers.blockerId, blockerId),
          eq(blockedUsers.blockedId, blockedId)
        )
      );
    return !!blocked;
  }

  // Ban methods
  async banUser(chatId: string, userId: string, bannedBy: string, reason?: string): Promise<BannedMember> {
    // Insert banned member record
    const [bannedMember] = await db
      .insert(bannedMembers)
      .values({
        chatId,
        userId,
        bannedBy,
        reason: reason || null,
      })
      .returning();

    // Remove user from chat participants
    await db
      .delete(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.userId, userId)
        )
      );

    return bannedMember;
  }

  async unbanUser(chatId: string, userId: string): Promise<void> {
    await db
      .delete(bannedMembers)
      .where(
        and(
          eq(bannedMembers.chatId, chatId),
          eq(bannedMembers.userId, userId)
        )
      );
  }

  async getBannedMembers(chatId: string): Promise<(User & { bannedAt: Date; bannedBy: string; reason?: string })[]> {
    const bannedMembersData = await db
      .select({
        id: users.id,
        username: users.username,
        avatar: users.avatar,
        walletAddress: users.walletAddress,
        ethBalance: users.ethBalance,
        bnbBalance: users.bnbBalance,
        bio: users.bio,
        isOnline: users.isOnline,
        lastSeen: users.lastSeen,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        bannedAt: bannedMembers.bannedAt,
        bannedBy: bannedMembers.bannedBy,
        reason: bannedMembers.reason,
      })
      .from(bannedMembers)
      .innerJoin(users, eq(users.id, bannedMembers.userId))
      .where(eq(bannedMembers.chatId, chatId));

    return bannedMembersData.map(member => ({
      id: member.id,
      username: member.username,
      avatar: member.avatar,
      walletAddress: member.walletAddress,
      ethBalance: member.ethBalance,
      bnbBalance: member.bnbBalance,
      bio: member.bio,
      isOnline: member.isOnline,
      lastSeen: member.lastSeen,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      bannedAt: member.bannedAt!,
      bannedBy: member.bannedBy,
      reason: member.reason || undefined,
    }));
  }

  async isUserBanned(chatId: string, userId: string): Promise<boolean> {
    const [banned] = await db
      .select()
      .from(bannedMembers)
      .where(
        and(
          eq(bannedMembers.chatId, chatId),
          eq(bannedMembers.userId, userId)
        )
      );

    return !!banned;
  }

  async deleteAllUserMessages(chatId: string, userId: string): Promise<number> {
    const deletedMessages = await db
      .delete(messages)
      .where(
        and(
          eq(messages.chatId, chatId),
          eq(messages.senderId, userId)
        )
      )
      .returning();

    return deletedMessages.length;
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
    const result = await db
      .select({
        userId: users.id,
        username: users.username,
        walletAddress: users.walletAddress,
        avatar: users.avatar,
        totalTransferred: sql<string>`COALESCE(SUM(CAST(${messages.amount} AS NUMERIC)), 0)::TEXT`,
        transferCount: sql<number>`COUNT(${messages.id})::INTEGER`,
        latestTransfer: sql<Date | null>`MAX(${messages.timestamp})`
      })
      .from(users)
      .leftJoin(messages, and(
        eq(messages.senderId, users.id),
        eq(messages.messageType, 'crypto'),
        eq(messages.tokenSymbol, 'OFFC')
      ))
      .groupBy(users.id, users.username, users.walletAddress, users.avatar)
      .having(sql`COUNT(${messages.id}) > 0`)
      .orderBy(sql`SUM(CAST(${messages.amount} AS NUMERIC)) DESC`);
    
    return result;
  }

  // NFT methods
  async getNftById(nftId: string): Promise<Nft | undefined> {
    const [nft] = await db.select().from(nfts).where(eq(nfts.id, nftId));
    return nft || undefined;
  }

  async getNftsByUser(userId: string): Promise<Nft[]> {
    return await db
      .select()
      .from(nfts)
      .where(eq(nfts.ownerId, userId))
      .orderBy(desc(nfts.createdAt));
  }

  async getNftsWithPrivateUrls(): Promise<Nft[]> {
    return await db
      .select()
      .from(nfts)
      .where(ilike(nfts.imageUrl, '%/.private/uploads/%'))
      .orderBy(desc(nfts.createdAt));
  }

  async createNft(nft: InsertNft): Promise<Nft> {
    const [newNft] = await db
      .insert(nfts)
      .values(nft)
      .returning();
    return newNft;
  }

  async updateNft(nftId: string, updates: Partial<InsertNft>): Promise<Nft | undefined> {
    const [updatedNft] = await db
      .update(nfts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(nfts.id, nftId))
      .returning();
    return updatedNft || undefined;
  }

  async deleteNft(nftId: string): Promise<boolean> {
    const result = await db
      .delete(nfts)
      .where(eq(nfts.id, nftId));
    
    return (result.rowCount ?? 0) > 0;
  }
}