import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, index, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  walletAddress: text("wallet_address").unique(),
  ethBalance: text("eth_balance").default("0"),
  bnbBalance: text("bnb_balance").default("0"),
  avatar: text("avatar"),
  bio: text("bio"),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chats = pgTable("chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name"),
  username: text("username").unique(), // For group handles/usernames
  avatar: text("avatar"),
  description: text("description"), // Group description
  isGroup: boolean("is_group").default(false),
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").notNull().references(() => chats.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // text, crypto_transaction, nft
  transactionHash: text("transaction_hash"),
  amount: text("amount"),
  tokenSymbol: text("token_symbol"),
  nftId: varchar("nft_id").references(() => nfts.id, { onDelete: "set null" }),
  timestamp: timestamp("timestamp").defaultNow(),
  isDelivered: boolean("is_delivered").default(false),
  isRead: boolean("is_read").default(false),
  isPinned: boolean("is_pinned").default(false),
});

export const chatParticipants = pgTable("chat_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").default("member"), // member, admin, owner
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Friends system
export const friendships = pgTable("friendships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  addresseeId: varchar("addressee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending, accepted, blocked
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// NFTs table
export const nfts = pgTable(
  "nfts",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    contractAddress: text("contract_address").notNull(),
    tokenId: text("token_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    collectionName: text("collection_name"),
    chain: text("chain").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_nfts_owner_id").on(table.ownerId),
    uniqueIndex("UNQ_nfts_contract_token_chain").on(
      table.contractAddress,
      table.tokenId,
      table.chain
    ),
  ],
);

// Banned members for groups
export const bannedMembers = pgTable("banned_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bannedBy: varchar("banned_by").notNull().references(() => users.id),
  reason: text("reason"),
  bannedAt: timestamp("banned_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages, { relationName: "sender" }),
  chatParticipants: many(chatParticipants),
  sentFriendRequests: many(friendships, { relationName: "requester" }),
  receivedFriendRequests: many(friendships, { relationName: "addressee" }),
  ownedNfts: many(nfts),
}));

export const chatsRelations = relations(chats, ({ many }) => ({
  messages: many(messages),
  participants: many(chatParticipants),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  nft: one(nfts, {
    fields: [messages.nftId],
    references: [nfts.id],
  }),
}));

export const chatParticipantsRelations = relations(chatParticipants, ({ one }) => ({
  user: one(users, {
    fields: [chatParticipants.userId],
    references: [users.id],
  }),
  chat: one(chats, {
    fields: [chatParticipants.chatId],
    references: [chats.id],
  }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  requester: one(users, {
    fields: [friendships.requesterId],
    references: [users.id],
    relationName: "requester",
  }),
  addressee: one(users, {
    fields: [friendships.addresseeId],
    references: [users.id],
    relationName: "addressee",
  }),
}));

export const nftsRelations = relations(nfts, ({ one, many }) => ({
  owner: one(users, {
    fields: [nfts.ownerId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const bannedMembersRelations = relations(bannedMembers, ({ one }) => ({
  user: one(users, {
    fields: [bannedMembers.userId],
    references: [users.id],
    relationName: "bannedUser",
  }),
  bannedByUser: one(users, {
    fields: [bannedMembers.bannedBy],
    references: [users.id],
    relationName: "banningUser",
  }),
  chat: one(chats, {
    fields: [bannedMembers.chatId],
    references: [chats.id],
  }),
}));


// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  walletAddress: true,
  ethBalance: true,
  bnbBalance: true,
  avatar: true,
  bio: true,
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  username: true,
  walletAddress: true,
  ethBalance: true,
  bnbBalance: true,
  avatar: true,
  bio: true,
});

export const insertChatSchema = createInsertSchema(chats).pick({
  name: true,
  username: true,
  avatar: true,
  description: true,
  isGroup: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  chatId: true,
  senderId: true,
  content: true,
  messageType: true,
  transactionHash: true,
  amount: true,
  tokenSymbol: true,
  nftId: true,
});

export const insertChatParticipantSchema = createInsertSchema(chatParticipants).pick({
  chatId: true,
  userId: true,
  role: true,
});

export const insertFriendshipSchema = createInsertSchema(friendships).pick({
  requesterId: true,
  addresseeId: true,
  status: true,
});

export const insertNftSchema = createInsertSchema(nfts).pick({
  ownerId: true,
  contractAddress: true,
  tokenId: true,
  name: true,
  description: true,
  imageUrl: true,
  collectionName: true,
  chain: true,
  metadata: true,
});

// Secure update schema that omits immutable fields
export const updateNftSchema = createInsertSchema(nfts).pick({
  name: true,
  description: true,
  imageUrl: true,
  metadata: true,
});

// Schema for creating NFTs (excludes ownerId which will be set server-side)
export const createNftSchema = createInsertSchema(nfts).pick({
  contractAddress: true,
  tokenId: true,
  name: true,
  description: true,
  imageUrl: true,
  collectionName: true,
  chain: true,
  metadata: true,
});

export const insertBannedMemberSchema = createInsertSchema(bannedMembers).pick({
  chatId: true,
  userId: true,
  bannedBy: true,
  reason: true,
});

export const blockedUsers = pgTable("blocked_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  blockerId: varchar("blocker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  blockedId: varchar("blocked_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBlockedUserSchema = createInsertSchema(blockedUsers).pick({
  blockerId: true,
  blockedId: true,
});


// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type ChatParticipant = typeof chatParticipants.$inferSelect;
export type InsertChatParticipant = z.infer<typeof insertChatParticipantSchema>;
export type Friendship = typeof friendships.$inferSelect & {
  requesterName?: string;
  requesterAvatar?: string | null;
};
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type BannedMember = typeof bannedMembers.$inferSelect;
export type InsertBannedMember = z.infer<typeof insertBannedMemberSchema>;
export type BlockedUser = typeof blockedUsers.$inferSelect;
export type InsertBlockedUser = z.infer<typeof insertBlockedUserSchema>;
export type Nft = typeof nfts.$inferSelect;
export type InsertNft = z.infer<typeof insertNftSchema>;
export type UpdateNft = z.infer<typeof updateNftSchema>;
export type CreateNft = z.infer<typeof createNftSchema>;
