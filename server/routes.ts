import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage-fix";
import { insertMessageSchema, insertUserSchema, insertChatSchema, insertFriendshipSchema, insertBlockedUserSchema, insertNftSchema, updateNftSchema, createNftSchema } from "@shared/schema";
import { z } from "zod";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import type { User } from "@shared/schema";
import { ethers } from "ethers";

interface WebSocketClient extends WebSocket {
  userId?: string;
  chatId?: string;
  isGlobalConnection?: boolean;
}

// Extended Request interface to include authenticated user
interface AuthenticatedRequest extends Request {
  user?: User;
}

// Authentication middleware
async function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Get wallet address from header or query parameter
    const walletAddress = req.headers['x-wallet-address'] as string || req.query.walletAddress as string;
    
    if (!walletAddress) {
      return res.status(401).json({ message: "Authentication required. Please provide wallet address." });
    }

    // Validate wallet address format (basic Ethereum address validation)
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(401).json({ message: "Invalid wallet address format." });
    }

    // Get user from database by wallet address
    const user = await storage.getUserByWalletAddress(walletAddress);
    
    if (!user) {
      return res.status(401).json({ message: "User not found. Please create an account first." });
    }

    // Set authenticated user on request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: "Authentication failed." });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time chat with proper CORS
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    verifyClient: (info: { origin: string; secure: boolean; req: any }) => {
      // Allow all origins in development
      return true;
    }
  });

  // Store active connections
  const clients = new Map<string, WebSocketClient>();

  wss.on('connection', (ws: WebSocketClient, req) => {
    console.log('New WebSocket connection');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join':
            console.log(`User ${message.userId} joining chat ${message.chatId}`);
            
            ws.userId = message.userId;
            ws.chatId = message.chatId;
            clients.set(message.userId, ws);
            
            console.log(`User ${message.userId} successfully joined chat ${message.chatId}`);
            
            // Update user online status
            await storage.updateUserOnlineStatus(message.userId, true);
            
            // Broadcast user online status to other clients
            await broadcastToChat(message.chatId, {
              type: 'user_status',
              userId: message.userId,
              isOnline: true
            }, message.userId);
            break;
            
          case 'join_global':
            // Global connection for friend notifications
            console.log(`User ${message.userId} joining global WebSocket for friend notifications`);
            
            // For global connections, we want to allow multiple connections
            // but prioritize the latest one for notifications
            ws.userId = message.userId;
            ws.isGlobalConnection = true;
            clients.set(message.userId, ws);
            
            // Update user online status
            await storage.updateUserOnlineStatus(message.userId, true);
            console.log(`User ${message.userId} connected globally for friend notifications`);
            break;

          case 'send_message':
            console.log('Received message:', message);
            
            // Check if sender is blocked by any chat participants
            const participants = await storage.getChatParticipants(message.chatId);
            let isBlocked = false;
            
            for (const participant of participants) {
              if (participant.id !== message.senderId) {
                const blocked = await storage.isUserBlocked(participant.id, message.senderId);
                if (blocked) {
                  console.log(`Message blocked: User ${participant.id} has blocked sender ${message.senderId}`);
                  isBlocked = true;
                  break;
                }
              }
            }
            
            // Validate NFT message if nftId is present
            if (message.nftId && !isBlocked) {
              try {
                // Verify NFT exists
                const nft = await storage.getNftById(message.nftId);
                if (!nft) {
                  console.log(`Message rejected: NFT ${message.nftId} not found`);
                  ws.send(JSON.stringify({
                    type: 'error',
                    message: 'NFT not found'
                  }));
                  break;
                }
                
                // Verify sender owns the NFT
                if (nft.ownerId !== message.senderId) {
                  console.log(`Message rejected: User ${message.senderId} does not own NFT ${message.nftId}`);
                  ws.send(JSON.stringify({
                    type: 'error',
                    message: 'You do not own this NFT'
                  }));
                  break;
                }
                
                // Enforce messageType = 'nft' for NFT messages
                message.messageType = 'nft';
                console.log(`NFT message validated: User ${message.senderId} owns NFT ${message.nftId}`);
              } catch (error) {
                console.error('Error validating NFT message:', error);
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Failed to validate NFT'
                }));
                break;
              }
            }
            
            // Only process and broadcast message if sender is not blocked
            if (!isBlocked) {
              const newMessage = await storage.createMessage({
                chatId: message.chatId,
                senderId: message.senderId,
                content: message.content,
                messageType: message.messageType || 'text',
                transactionHash: message.transactionHash,
                amount: message.amount,
                tokenSymbol: message.tokenSymbol,
                nftId: message.nftId
              });

              console.log('Message saved to DB:', newMessage);

              // Broadcast message to all clients in the chat
              console.log(`Broadcasting new message to chat ${message.chatId}:`, newMessage);
              await broadcastToChat(message.chatId, {
                type: 'new_message',
                message: newMessage
              });
            } else {
              console.log('Message rejected: Sender is blocked by one or more recipients');
            }
            break;

          case 'typing':
            await broadcastToChat(message.chatId, {
              type: 'typing',
              userId: message.userId,
              isTyping: message.isTyping
            }, message.userId);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {
      if (ws.userId) {
        clients.delete(ws.userId);
        await storage.updateUserOnlineStatus(ws.userId, false);
        
        // Broadcast user offline status
        if (ws.chatId) {
          await broadcastToChat(ws.chatId, {
            type: 'user_status',
            userId: ws.userId,
            isOnline: false
          }, ws.userId);
        }
      }
    });
  });

  async function broadcastToChat(chatId: string, message: any, excludeUserId?: string) {
    // Get all participants of this chat
    const participants = await storage.getChatParticipants(chatId);
    console.log(`Broadcasting to chat ${chatId} participants:`, participants.map(p => p.id));
    
    participants.forEach(participant => {
      const client = clients.get(participant.id);
      console.log(`Client for user ${participant.id}:`, client ? 'connected' : 'not found');
      
      if (client && 
          client.readyState === WebSocket.OPEN && 
          participant.id !== excludeUserId) {
        try {
          console.log(`Sending message to user ${participant.id}:`, message);
          client.send(JSON.stringify(message));
          console.log(`✓ Message sent to user: ${participant.id}`);
        } catch (error) {
          console.error(`Failed to send message to user ${participant.id}:`, error);
          // Remove dead connection
          clients.delete(participant.id);
        }
      } else if (participant.id !== excludeUserId) {
        console.log(`Cannot send to user ${participant.id}: ${!client ? 'no client' : 'client not ready'}`);
      }
    });
  }

  // REST API endpoints
  app.get("/api/users/username/:username", async (req, res) => {
    try {
      const username = req.params.username;
      const user = await storage.getUserByUsername(username);
      
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/wallet/:walletAddress", async (req, res) => {
    try {
      const walletAddress = req.params.walletAddress;
      const user = await storage.getUserByWalletAddress(walletAddress);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });


  app.get("/api/chats/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const chats = await storage.getUserChats(userId);
      
      // Get last message for each chat
      const chatsWithMessages = await Promise.all(
        chats.map(async (chat) => {
          try {
            const messages = await storage.getChatMessages(chat.id);
            const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
            
            // Get other participant for direct messages
            let chatName = chat.name;
            let otherUserId = null;
            let avatar = chat.avatar; // Use group avatar by default
            if (!chat.isGroup) {
              const participants = await storage.getChatParticipants(chat.id);
              const otherUser = participants.find(p => p.id !== userId);
              if (otherUser) {
                chatName = otherUser.username;
                otherUserId = otherUser.id;
                avatar = otherUser.avatar; // Use user avatar for direct chats
              }
            }
            
            return {
              ...chat,
              name: chatName,
              otherUserId,
              avatar,
              lastMessage: lastMessage ? lastMessage.content : 'No messages yet',
              lastMessageTime: lastMessage ? lastMessage.timestamp : chat.createdAt,
              lastMessageSender: lastMessage ? lastMessage.senderId : null
            };
          } catch (error) {
            console.error(`Error getting chat data for ${chat.id}:`, error);
            return {
              ...chat,
              lastMessage: 'Error',
              lastMessageTime: chat.createdAt
            };
          }
        })
      );
      
      // Sort by last message time
      chatsWithMessages.sort((a, b) => {
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        return timeB - timeA;
      });
      
      res.json(chatsWithMessages);
    } catch (error) {
      console.error('Error fetching user chats:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/messages/:chatId", async (req, res) => {
    try {
      const messages = await storage.getChatMessages(req.params.chatId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/messages/:messageId", async (req, res) => {
    try {
      const messageId = req.params.messageId;
      const { userId, deleteForEveryone } = req.body;
      
      const message = await storage.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      const chat = await storage.getChat(message.chatId);
      const isDirectMessage = chat && !chat.isGroup;
      
      const canDelete = message.senderId === userId || isDirectMessage;
      
      if (!canDelete) {
        const participants = await storage.getChatParticipants(message.chatId);
        const userRole = participants.find(p => p.id === userId)?.role;
        if (userRole !== 'admin' && userRole !== 'owner') {
          return res.status(403).json({ message: "You don't have permission to delete this message" });
        }
      }
      
      const deleted = await storage.deleteMessage(messageId);
      
      if (deleted) {
        if (deleteForEveryone) {
          broadcastToChat(message.chatId, {
            type: 'message_deleted',
            messageId: messageId,
            chatId: message.chatId
          });
        }
        res.json({ message: "Message deleted successfully" });
      } else {
        res.status(404).json({ message: "Message not found" });
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Pin/Unpin message endpoints
  app.patch("/api/messages/:messageId/pin", async (req, res) => {
    try {
      const messageId = req.params.messageId;
      const { isPinned } = req.body;
      
      const updated = await storage.updateMessagePin(messageId, isPinned);
      
      if (updated) {
        res.json({ message: isPinned ? "Message pinned successfully" : "Message unpinned successfully" });
      } else {
        res.status(404).json({ message: "Message not found" });
      }
    } catch (error) {
      console.error('Error updating message pin status:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/messages/:chatId/pinned", async (req, res) => {
    try {
      const chatId = req.params.chatId;
      const pinnedMessages = await storage.getPinnedMessages(chatId);
      res.json(pinnedMessages);
    } catch (error) {
      console.error('Error fetching pinned messages:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Pin/Unpin chat endpoint
  app.patch("/api/chats/:chatId/pin", async (req, res) => {
    try {
      const chatId = req.params.chatId;
      const { isPinned } = req.body;
      
      const updated = await storage.updateChatPin(chatId, isPinned);
      
      if (updated) {
        res.json({ message: isPinned ? "Chat pinned successfully" : "Chat unpinned successfully" });
      } else {
        res.status(404).json({ message: "Chat not found" });
      }
    } catch (error) {
      console.error('Error updating chat pin status:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/chats/:chatId", async (req, res) => {
    try {
      const chatId = req.params.chatId;
      const { deleteForEveryone } = req.body || {};
      
      const existingChat = await storage.getChat(chatId);
      
      if (!existingChat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      if (deleteForEveryone) {
        await broadcastToChat(chatId, {
          type: 'chat_deleted',
          chatId: chatId
        });
      }
      
      const deleted = await storage.deleteChat(chatId);
      
      if (deleted) {
        res.json({ message: "Chat deleted successfully" });
      } else {
        res.status(404).json({ message: "Chat deletion failed" });
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User management endpoints

  app.post("/api/users", async (req, res) => {
    try {
      console.log('Creating user with data:', req.body);
      const userData = insertUserSchema.parse(req.body);
      console.log('Parsed user data:', userData);
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error: any) {
      console.error('User creation error:', error);
      if (error instanceof z.ZodError) {
        console.error('Validation error details:', error.errors);
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      const errMsg = error?.message || String(error);
      if (errMsg.includes('users_username_unique') || errMsg.includes('duplicate key') && errMsg.includes('username')) {
        return res.status(409).json({ message: "Username already taken", code: "USERNAME_TAKEN" });
      }
      if (errMsg.includes('users_wallet_address_unique') || errMsg.includes('duplicate key') && errMsg.includes('wallet_address')) {
        return res.status(409).json({ message: "Wallet already registered", code: "WALLET_EXISTS" });
      }
      res.status(500).json({ message: "Internal server error", error: errMsg });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const updates = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUserProfile(userId, updates);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Enhanced test endpoint with database verification
  app.get("/api/test", async (req, res) => {
    console.log('TEST ENDPOINT HIT');
    try {
      // Test database connection
      const dbTest = await storage.getUser('test-connection-check');
      console.log('✅ Database connection verified');
      
      res.json({
        test: 'working',
        database: 'connected',
        environment: process.env.NODE_ENV || 'development',
        storage_type: process.env.DATABASE_URL ? 'PostgreSQL DATABASE' : 'MEMORY',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      res.status(500).json({
        test: 'working',
        database: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: process.env.NODE_ENV || 'development',
        storage_type: process.env.DATABASE_URL ? 'PostgreSQL DATABASE' : 'MEMORY',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Health check endpoint with comprehensive system verification
  app.get("/api/health", async (req, res) => {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: { status: 'unknown', details: {} },
        objectStorage: { status: 'unknown', details: {} },
        environment: { status: 'unknown', details: {} }
      },
      runtime: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      }
    };

    let overallHealthy = true;

    // Test database connection
    try {
      await storage.getUser('health-check-test');
      healthCheck.services.database = {
        status: 'healthy',
        details: {
          type: process.env.DATABASE_URL ? 'PostgreSQL DATABASE' : 'MEMORY',
          ssl_enabled: process.env.NODE_ENV === 'production',
          url_configured: !!process.env.DATABASE_URL
        }
      };
      console.log('✅ Health check: Database OK');
    } catch (error) {
      healthCheck.services.database = {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          type: process.env.DATABASE_URL ? 'PostgreSQL DATABASE' : 'MEMORY'
        }
      };
      overallHealthy = false;
      console.error('❌ Health check: Database failed:', error);
    }

    // Test object storage
    try {
      const objectStorageService = new ObjectStorageService();
      const publicPaths = objectStorageService.getPublicObjectSearchPaths();
      const privatePath = objectStorageService.getPrivateObjectDir();
      
      healthCheck.services.objectStorage = {
        status: 'healthy',
        details: {
          public_paths_configured: publicPaths.length > 0,
          private_path_configured: !!privatePath,
          public_paths_count: publicPaths.length
        }
      };
      console.log('✅ Health check: Object Storage OK');
    } catch (error) {
      healthCheck.services.objectStorage = {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
      overallHealthy = false;
      console.error('❌ Health check: Object Storage failed:', error);
    }

    // Check environment variables
    const requiredEnvVars = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      PUBLIC_OBJECT_SEARCH_PATHS: !!process.env.PUBLIC_OBJECT_SEARCH_PATHS,
      PRIVATE_OBJECT_DIR: !!process.env.PRIVATE_OBJECT_DIR
    };

    const missingEnvVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    healthCheck.services.environment = {
      status: missingEnvVars.length === 0 ? 'healthy' : 'warning',
      details: {
        required_vars: requiredEnvVars,
        missing_vars: missingEnvVars,
        node_env: process.env.NODE_ENV || 'development'
      }
    };

    if (missingEnvVars.length > 0) {
      console.warn('⚠️  Health check: Missing environment variables:', missingEnvVars);
    } else {
      console.log('✅ Health check: Environment variables OK');
    }

    healthCheck.status = overallHealthy ? 'healthy' : 'unhealthy';
    
    const statusCode = overallHealthy ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  });

  // Crypto history proxy with in-memory cache
  const historyCache: Record<string, { data: any; timestamp: number }> = {};
  const HISTORY_CACHE_TTL = 120_000;

  app.get("/api/crypto/history/:coinId", async (req, res) => {
    const { coinId } = req.params;
    const days = req.query.days || '7';
    const cacheKey = `history_${coinId}_${days}`;
    const cached = historyCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < HISTORY_CACHE_TTL) {
      return res.json(cached.data);
    }

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=usd&days=${days}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Offchat/1.0'
          }
        }
      );

      if (!response.ok) {
        if (cached) {
          console.warn(`CoinGecko history ${response.status}, serving stale cache`);
          return res.json(cached.data);
        }
        throw new Error(`CoinGecko API responded with status: ${response.status}`);
      }

      const data = await response.json();
      historyCache[cacheKey] = { data, timestamp: Date.now() };
      res.json(data);
    } catch (error) {
      console.error(`Failed to fetch crypto history for ${coinId}:`, error);
      if (cached) {
        return res.json(cached.data);
      }
      res.status(502).json({ message: "Failed to fetch price history" });
    }
  });

  // Test object storage upload and retrieval
  app.post("/api/test/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      
      // Get a signed upload URL for public storage
      const uploadURL = await objectStorageService.getPublicObjectEntityUploadURL();
      
      // Extract the UUID from the URL to create the object path
      const urlParts = uploadURL.split('/');
      const uuid = urlParts[urlParts.length - 1].split('?')[0];
      const objectPath = `/objects/uploads/${uuid}`;
      
      res.json({ 
        uploadURL, 
        objectPath,
        testMessage: 'Upload a file to the uploadURL, then access it via the objectPath'
      });
    } catch (error) {
      console.error('Test upload error:', error);
      res.status(500).json({ error: 'Failed to generate test upload URL' });
    }
  });

  // Test endpoint for production NFT image resolution
  app.get("/api/test/nft-resolution", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const testPath = req.query.path as string || '/objects/uploads/test-image.jpg';
      
      // Test environment detection
      const isProduction = objectStorageService.isProductionEnvironment();
      
      // Test URL resolution
      let resolvedUrl = null;
      let directUrl = null;
      
      try {
        directUrl = await objectStorageService.getDirectCloudStorageUrl(testPath, 3600);
      } catch (error) {
        console.log('Direct URL generation failed:', error);
      }
      
      // Construct base URL for testing
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const testResult = {
        timestamp: new Date().toISOString(),
        environment: {
          isProduction,
          NODE_ENV: process.env.NODE_ENV,
          REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT,
          REPL_SLUG: process.env.REPL_SLUG,
          REPLIT_DEV_DOMAIN: process.env.REPLIT_DEV_DOMAIN,
          HOSTNAME: process.env.HOSTNAME,
          HOST: req.get('host'),
          PROTOCOL: req.protocol
        },
        urlResolution: {
          testPath,
          baseUrl,
          directUrl,
          resolverEndpoint: `${baseUrl}/api/objects/resolve?path=${encodeURIComponent(testPath)}`
        },
        storageConfig: {
          publicPaths: process.env.PUBLIC_OBJECT_SEARCH_PATHS,
          privatePath: process.env.PRIVATE_OBJECT_DIR
        }
      };
      
      console.log('NFT Resolution Test Result:', testResult);
      
      res.json({
        success: true,
        message: 'NFT image resolution test completed',
        ...testResult
      });
    } catch (error) {
      console.error('NFT resolution test error:', error);
      res.status(500).json({ 
        success: false,
        error: 'NFT resolution test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });


  // User search endpoint  
  app.get("/api/search-users", async (req, res) => {
    const query = req.query.q as string;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: "Query must be at least 2 characters" });
    }
    
    try {
      const users = await storage.searchUsers(query.trim(), req.query.exclude as string);
      res.json(users);
    } catch (error) {
      console.error('Search failed:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });


  // Friend system endpoints
  app.post("/api/friends/request", async (req, res) => {
    try {
      const { requesterId, addresseeId } = insertFriendshipSchema.pick({ 
        requesterId: true, 
        addresseeId: true 
      }).parse(req.body);
      
      // Check if users exist
      const requester = await storage.getUser(requesterId);
      const addressee = await storage.getUser(addresseeId);
      
      if (!requester || !addressee) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if friendship already exists
      const existingFriendship = await storage.checkFriendship(requesterId, addresseeId);
      if (existingFriendship) {
        return res.status(400).json({ message: "Friendship request already exists" });
      }
      
      const friendship = await storage.sendFriendRequest(requesterId, addresseeId);
      
      // Send real-time notification to the addressee
      const addresseeWs = clients.get(addresseeId);
      if (addresseeWs && addresseeWs.readyState === WebSocket.OPEN) {
        console.log(`Sending friend request notification to user: ${addresseeId}`);
        try {
          const notificationData = {
            type: 'friend_request_received',
            friendship: friendship,
            requester: {
              id: requester.id,
              username: requester.username,
              avatar: requester.avatar
            }
          };
          console.log('Sending friend request notification:', notificationData);
          addresseeWs.send(JSON.stringify(notificationData));
          console.log(`Friend request notification sent successfully to: ${addresseeId}`);
        } catch (error) {
          console.error(`Failed to send friend request notification to ${addresseeId}:`, error);
        }
      } else {
        console.log(`User ${addresseeId} not connected to WebSocket`);
      }
      
      res.status(201).json(friendship);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/friends/:friendshipId/accept", async (req, res) => {
    try {
      const friendshipId = req.params.friendshipId;
      
      // Get friendship details BEFORE accepting to get user IDs
      const friendship = await storage.getFriendship(friendshipId);
      if (!friendship) {
        return res.status(404).json({ message: "Friendship not found" });
      }
      
      await storage.acceptFriendRequest(friendshipId);
      
      // Send notifications to ALL connected clients for now (simpler approach)
      console.log(`Broadcasting friend request acceptance for: ${friendshipId} between users: ${friendship.requesterId}, ${friendship.addresseeId}`);
      
      for (const [userId, client] of clients) {
        if (client && client.readyState === WebSocket.OPEN) {
          try {
            client.send(JSON.stringify({
              type: 'friend_request_accepted',
              friendshipId: friendshipId,
              requesterId: friendship.requesterId,
              addresseeId: friendship.addresseeId
            }));
            console.log(`✓ Friend acceptance notification sent to: ${userId}`);
          } catch (error) {
            console.error(`Failed to send acceptance notification to ${userId}:`, error);
            // Remove dead connection
            clients.delete(userId);
          }
        }
      }
      
      res.json({ message: "Friend request accepted" });
    } catch (error) {
      console.error('Error accepting friend request:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/friends/:friendshipId/reject", async (req, res) => {
    try {
      const friendshipId = req.params.friendshipId;
      
      // Get friendship details before rejecting  
      // Note: We'll handle notification without friendship details for now
      
      await storage.rejectFriendRequest(friendshipId);
      
      // Send notifications to both users involved in the friendship
      console.log(`Broadcasting friend request rejection for: ${friendshipId}`);
      for (const [userId, ws] of clients) {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({
              type: 'friend_request_rejected',
              friendshipId: friendshipId
            }));
            console.log(`Friend rejection notification sent to: ${userId}`);
          } catch (error) {
            console.error(`Failed to send rejection notification to ${userId}:`, error);
          }
        }
      }
      
      res.json({ message: "Friend request rejected" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/friends/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/friends/:userId/requests", async (req, res) => {
    try {
      const userId = req.params.userId;
      const requests = await storage.getFriendRequests(userId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/friends/:userId/sent", async (req, res) => {
    try {
      const userId = req.params.userId;
      const sentRequests = await storage.getSentFriendRequests(userId);
      res.json(sentRequests);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Enhanced chat endpoints
  app.post("/api/chats", async (req, res) => {
    try {
      const chatData = insertChatSchema.parse(req.body);
      
      // Don't process avatar during creation - will be done via separate endpoint
      
      const chat = await storage.createChat(chatData);
      res.status(201).json(chat);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid chat data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Check group username availability
  app.get("/api/chats/username/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const existingChat = await storage.getChatByUsername(username);
      
      if (existingChat) {
        res.status(200).json({ available: false, message: "Username is taken" });
      } else {
        res.status(404).json({ available: true, message: "Username is available" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Search groups by username or name
  app.get("/api/chats/search/:query", async (req, res) => {
    try {
      const { query } = req.params;
      const groups = await storage.searchGroups(query);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Join group by username or ID
  app.post("/api/chats/:chatId/join", async (req, res) => {
    try {
      const { chatId } = req.params;
      const { userId } = req.body;
      
      // Check if chat exists and is a group
      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      if (!chat.isGroup) {
        return res.status(400).json({ message: "This is not a group chat" });
      }
      
      // Add user to group
      await storage.addUserToChat(chatId, userId, "member");
      res.json({ message: "Successfully joined the group" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/chats/:chatId/participants", async (req, res) => {
    try {
      const chatId = req.params.chatId;
      const { userId, role = "member" } = req.body;
      
      await storage.addUserToChat(chatId, userId, role);
      res.json({ message: "User added to chat" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });


  app.delete("/api/chats/:chatId/participants/:userId", async (req, res) => {
    try {
      const { chatId, userId } = req.params;
      await storage.removeUserFromChat(chatId, userId);
      res.json({ message: "User removed from chat" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Promote user to admin
  app.patch("/api/chats/:chatId/participants/:userId/promote", async (req, res) => {
    try {
      const { chatId, userId } = req.params;
      const { requesterId } = req.body; // Who is making the request
      
      // Check if requester is owner or admin
      const participants = await storage.getChatParticipants(chatId);
      const requester = participants.find(p => p.id === requesterId);
      
      if (!requester || (requester.role !== 'owner' && requester.role !== 'admin')) {
        return res.status(403).json({ message: "Only admins and owners can promote users" });
      }
      
      const success = await storage.updateUserRole(chatId, userId, 'admin');
      if (success) {
        res.json({ message: "User promoted to admin successfully" });
      } else {
        res.status(404).json({ message: "User not found in chat" });
      }
    } catch (error) {
      console.error('Error promoting user:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Demote user from admin
  app.patch("/api/chats/:chatId/participants/:userId/demote", async (req, res) => {
    try {
      const { chatId, userId } = req.params;
      const { requesterId } = req.body;
      
      // Check if requester is owner or admin
      const participants = await storage.getChatParticipants(chatId);
      const requester = participants.find(p => p.id === requesterId);
      const target = participants.find(p => p.id === userId);
      
      if (!requester || (requester.role !== 'owner' && requester.role !== 'admin')) {
        return res.status(403).json({ message: "Only admins and owners can demote users" });
      }
      
      // Can't demote owner
      if (target?.role === 'owner') {
        return res.status(403).json({ message: "Cannot demote group owner" });
      }
      
      const success = await storage.updateUserRole(chatId, userId, 'member');
      if (success) {
        res.json({ message: "User demoted to member successfully" });
      } else {
        res.status(404).json({ message: "User not found in chat" });
      }
    } catch (error) {
      console.error('Error demoting user:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/chats/:chatId/participants", async (req, res) => {
    try {
      const chatId = req.params.chatId;
      const participants = await storage.getChatParticipants(chatId);
      res.json(participants);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get other participant in a direct chat (partner info)
  app.get('/api/chats/:chatId/partner/:userId', async (req, res) => {
    try {
      const { chatId, userId } = req.params;
      
      // Get chat info
      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      // If it's a group chat, return group info
      if (chat.isGroup) {
        return res.json({
          isGroup: true,
          name: chat.name || 'Group Chat',
          username: chat.username,
          avatar: chat.avatar,
          description: chat.description,
          participantCount: await storage.getChatParticipants(chatId).then(p => p.length)
        });
      }

      // For direct chat, get the other participant
      const participants = await storage.getChatParticipants(chatId);
      const partner = participants.find(p => p.id !== userId);
      
      if (!partner) {
        return res.status(404).json({ error: 'Partner not found' });
      }

      res.json({
        isGroup: false,
        id: partner.id,
        username: partner.username,
        avatar: partner.avatar,
        bio: partner.bio,
        isOnline: partner.isOnline,
        walletAddress: partner.walletAddress
      });
    } catch (error) {
      console.error('Failed to fetch chat partner:', error);
      res.status(500).json({ error: 'Failed to fetch chat partner' });
    }
  });

  // Profile picture upload routes
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const { isPublic } = req.body;
      
      let uploadURL: string;
      if (isPublic) {
        // For public uploads (like NFT images), use public directory
        uploadURL = await objectStorageService.getPublicObjectEntityUploadURL();
      } else {
        // For private uploads (like profile pictures), use private directory
        uploadURL = await objectStorageService.getObjectEntityUploadURL();
      }
      
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Update user avatar after successful upload
  app.put("/api/users/:userId/avatar", async (req, res) => {
    try {
      const { userId } = req.params;
      const { avatarURL } = req.body;

      if (!avatarURL) {
        return res.status(400).json({ error: "avatarURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        avatarURL,
        {
          owner: userId,
          visibility: "public", // Profile pictures are public
        },
      );

      // Update user's avatar in database
      await storage.updateUserAvatar(userId, objectPath);

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting user avatar:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update group avatar after successful upload
  app.put("/api/chats/:chatId/avatar", async (req, res) => {
    try {
      const { chatId } = req.params;
      const { avatarURL, userId } = req.body; // Add userId for permission check

      if (!avatarURL) {
        return res.status(400).json({ error: "avatarURL is required" });
      }

      // Check if user is admin or owner
      if (userId) {
        const participants = await storage.getChatParticipants(chatId);
        const userRole = participants.find(p => p.id === userId)?.role;
        if (userRole !== 'admin' && userRole !== 'owner') {
          return res.status(403).json({ error: "Only admins and owners can change group avatar" });
        }
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        avatarURL,
        {
          owner: 'group-' + chatId,
          visibility: "public", // Group pictures are public
        },
      );

      // Update group's avatar in database
      await storage.updateChatAvatar(chatId, objectPath);

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting group avatar:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update group info (name, description) 
  app.patch("/api/chats/:chatId", async (req, res) => {
    try {
      const { chatId } = req.params;
      const { name, description, userId } = req.body;

      // Check if user is admin or owner
      const participants = await storage.getChatParticipants(chatId);
      const userRole = participants.find(p => p.id === userId)?.role;
      if (userRole !== 'admin' && userRole !== 'owner') {
        return res.status(403).json({ error: "Only admins and owners can edit group info" });
      }

      // Update group info
      const success = await storage.updateChatInfo(chatId, { name, description });
      if (success) {
        res.json({ message: "Group info updated successfully" });
      } else {
        res.status(404).json({ error: "Group not found" });
      }
    } catch (error) {
      console.error("Error updating group info:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update media file ACL after upload
  app.put("/api/media/acl", async (req, res) => {
    try {
      const { mediaURL, ownerId } = req.body;

      if (!mediaURL || !ownerId) {
        return res.status(400).json({ error: "mediaURL and ownerId are required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        mediaURL,
        {
          owner: ownerId,
          visibility: "public", // Media files are public for sharing in chat
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting media ACL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve profile pictures and media
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      // Enhanced error handling with proper path validation
      if (!req.path || !req.path.startsWith('/objects/')) {
        console.error(`Invalid object path: ${req.path}`);
        return res.status(400).json({ error: 'Invalid object path' });
      }
      
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", {
        path: req.path,
        params: req.params,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: 'Object not found' });
      }
      
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // API endpoint to resolve object URLs for production environments
  app.get("/api/objects/resolve", async (req, res) => {
    try {
      const { path } = req.query;
      
      console.log('Object resolve request:', {
        path,
        query: req.query,
        headers: req.headers,
        hostname: req.hostname,
        protocol: req.protocol
      });
      
      if (!path || typeof path !== 'string') {
        console.error('Invalid path parameter:', path);
        return res.status(400).json({ error: 'Path parameter is required' });
      }

      const objectStorageService = new ObjectStorageService();
      const isProduction = objectStorageService.isProductionEnvironment();
      
      console.log('Environment detection for resolve:', {
        isProduction,
        path,
        hostname: req.hostname
      });
      
      // For production environments, return direct cloud storage URL
      if (isProduction) {
        console.log('Production environment detected, generating direct cloud storage URL...');
        const directUrl = await objectStorageService.getDirectCloudStorageUrl(path, 86400); // 24 hour TTL
        
        if (directUrl) {
          console.log('Direct URL generated successfully:', directUrl);
          return res.json({ 
            resolved: true,
            url: directUrl,
            type: 'direct_cloud_storage',
            ttl: 86400,
            environment: 'production'
          });
        } else {
          console.error('Failed to generate direct URL for:', path);
          // Fallback: try to construct a local path with base URL
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          const fallbackUrl = `${baseUrl}${path}`;
          console.log('Using fallback URL:', fallbackUrl);
          
          return res.json({ 
            resolved: true,
            url: fallbackUrl,
            type: 'fallback_local',
            ttl: null,
            environment: 'production',
            warning: 'Using fallback URL due to cloud storage access issue'
          });
        }
      } else {
        console.log('Development environment detected, using local path...');
        // For development, return the local path with base URL
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const localUrl = `${baseUrl}${path}`;
        
        return res.json({ 
          resolved: true,
          url: localUrl,
          type: 'local_path',
          ttl: null,
          environment: 'development'
        });
      }
    } catch (error) {
      console.error("Error resolving object URL:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        path: req.query.path
      });
      return res.status(500).json({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Ban a user from a group
  app.post("/api/chats/:chatId/ban", async (req, res) => {
    try {
      const chatId = req.params.chatId;
      const { userId, bannedBy, reason } = req.body;
      
      // Check if the banner is admin/owner
      const participants = await storage.getChatParticipants(chatId);
      const bannerRole = participants.find(p => p.id === bannedBy)?.role;
      
      if (bannerRole !== 'admin' && bannerRole !== 'owner') {
        return res.status(403).json({ message: "You don't have permission to ban users" });
      }
      
      const bannedMember = await storage.banUser(chatId, userId, bannedBy, reason);
      
      // Send WebSocket notification to kicked user to redirect them
      broadcastToChat(chatId, {
        type: 'user_kicked',
        userId: userId,
        chatId: chatId,
        reason: reason || 'You have been banned from this group'
      });
      
      res.json({ message: "User banned successfully", bannedMember });
    } catch (error) {
      console.error('Error banning user:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Remove/kick a user from a group (without ban)
  app.post("/api/chats/:chatId/kick", async (req, res) => {
    try {
      const chatId = req.params.chatId;
      const { userId, removedBy } = req.body;
      
      // Check if the remover is admin/owner
      const participants = await storage.getChatParticipants(chatId);
      const removerRole = participants.find(p => p.id === removedBy)?.role;
      
      if (removerRole !== 'admin' && removerRole !== 'owner') {
        return res.status(403).json({ message: "You don't have permission to remove users" });
      }
      
      await storage.removeUserFromChat(chatId, userId);
      
      // Send WebSocket notification to kicked user to redirect them
      broadcastToChat(chatId, {
        type: 'user_kicked',
        userId: userId,
        chatId: chatId,
        reason: 'You have been removed from this group'
      });
      
      res.json({ message: "User removed successfully" });
    } catch (error) {
      console.error('Error removing user:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Unban a user from a group
  app.post("/api/chats/:chatId/unban", async (req, res) => {
    try {
      const chatId = req.params.chatId;
      const { userId, unbannedBy } = req.body;
      
      // Check if the unbanner is admin/owner
      const participants = await storage.getChatParticipants(chatId);
      const unbannerRole = participants.find(p => p.id === unbannedBy)?.role;
      
      if (unbannerRole !== 'admin' && unbannerRole !== 'owner') {
        return res.status(403).json({ message: "You don't have permission to unban users" });
      }
      
      await storage.unbanUser(chatId, userId);
      res.json({ message: "User unbanned successfully" });
    } catch (error) {
      console.error('Error unbanning user:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get banned members of a group
  app.get("/api/chats/:chatId/banned", async (req, res) => {
    try {
      const chatId = req.params.chatId;
      const bannedMembers = await storage.getBannedMembers(chatId);
      res.json(bannedMembers);
    } catch (error) {
      console.error('Error fetching banned members:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete all messages from a user in a chat
  app.delete("/api/chats/:chatId/messages/:userId", async (req, res) => {
    try {
      const chatId = req.params.chatId;
      const userId = req.params.userId;
      const { requesterId } = req.body;
      
      // Check if the requester is admin/owner
      const participants = await storage.getChatParticipants(chatId);
      const requesterRole = participants.find(p => p.id === requesterId)?.role;
      
      if (requesterRole !== 'admin' && requesterRole !== 'owner') {
        return res.status(403).json({ message: "You don't have permission to delete user messages" });
      }
      
      const deletedCount = await storage.deleteAllUserMessages(chatId, userId);
      res.json({ message: `Deleted ${deletedCount} messages successfully`, deletedCount });
    } catch (error) {
      console.error('Error deleting user messages:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Block user endpoint
  app.post('/api/users/block', async (req, res) => {
    try {
      const { blockerId, blockedId } = insertBlockedUserSchema.parse(req.body);
      
      const blocked = await storage.blockUser(blockerId, blockedId);
      res.json(blocked);
    } catch (error: any) {
      console.error('Error blocking user:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to block user' });
    }
  });

  // Get blocked users
  app.get('/api/users/:userId/blocked', async (req, res) => {
    try {
      const { userId } = req.params;
      const blockedUsers = await storage.getBlockedUsers(userId);
      res.json(blockedUsers);
    } catch (error: any) {
      console.error('Error fetching blocked users:', error);
      res.status(500).json({ error: 'Failed to fetch blocked users' });
    }
  });

  // Unblock user endpoint
  app.delete('/api/users/block/:blockerId/:blockedId', async (req, res) => {
    try {
      const { blockerId, blockedId } = req.params;
      await storage.unblockUser(blockerId, blockedId);
      res.json({ message: 'User unblocked successfully' });
    } catch (error: any) {
      console.error('Error unblocking user:', error);
      res.status(500).json({ error: 'Failed to unblock user' });
    }
  });


  // OFFC Transfer Leaderboard API
  app.get('/api/offc-transfers/leaderboard', async (req, res) => {
    try {
      const leaderboardData = await storage.getOFFCTransferLeaderboard();
      res.json(leaderboardData);
    } catch (error) {
      console.error("Error fetching OFFC transfer leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch OFFC transfer leaderboard" });
    }
  });

  // NFT endpoints
  app.get('/api/nfts/user/:userIdOrWallet', async (req, res) => {
    try {
      const userIdOrWallet = req.params.userIdOrWallet;
      console.log('Fetching NFTs for user:', userIdOrWallet);
      
      let userId = userIdOrWallet;
      
      // If it looks like a wallet address (starts with 0x), convert to user ID
      if (userIdOrWallet.startsWith('0x')) {
        const user = await storage.getUserByWalletAddress(userIdOrWallet);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        userId = user.id;
        console.log('Converted wallet address to user ID:', userId);
      }
      
      const nfts = await storage.getNftsByUser(userId);
      console.log('Found NFTs:', nfts.length);
      res.json(nfts);
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/nfts/:nftId', async (req, res) => {
    try {
      const nftId = req.params.nftId;
      console.log('Fetching NFT:', nftId);
      const nft = await storage.getNftById(nftId);
      
      if (!nft) {
        return res.status(404).json({ message: "NFT not found" });
      }
      
      res.json(nft);
    } catch (error) {
      console.error('Error fetching NFT:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Helper function to fetch NFT metadata from blockchain
  async function fetchNftMetadataFromBlockchain(contractAddress: string, tokenId: string, chain: string) {
    try {
      // For demo purposes, we'll use a mock service
      // In production, you'd use OpenSea API, Alchemy, Moralis, etc.
      
      // Mock delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return mock metadata - in production, make actual API calls
      return {
        imageUrl: `https://picsum.photos/400/400?random=${tokenId}`,
        name: `NFT #${tokenId}`,
        description: `On-chain NFT from contract ${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`,
        attributes: [
          { trait_type: "Contract", value: contractAddress },
          { trait_type: "Chain", value: chain },
        ],
      };
    } catch (error) {
      console.error("Error fetching NFT metadata:", error);
      throw new Error("Failed to fetch NFT metadata from blockchain");
    }
  }

  app.post('/api/nfts', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      console.log('Creating NFT with data:', req.body, 'for user:', req.user?.id);
      
      // Validate request body using secure schema (no ownerId)
      const nftData = createNftSchema.parse(req.body);
      
      // Handle on-chain NFT metadata fetching
      let finalNftData = nftData;
      if (nftData.imageUrl === "FETCH_FROM_BLOCKCHAIN") {
        console.log(`Fetching metadata for on-chain NFT: ${nftData.contractAddress}#${nftData.tokenId}`);
        
        try {
          const blockchainMetadata = await fetchNftMetadataFromBlockchain(
            nftData.contractAddress,
            nftData.tokenId,
            nftData.chain
          );
          
          finalNftData = {
            ...nftData,
            imageUrl: blockchainMetadata.imageUrl,
            name: nftData.name || blockchainMetadata.name,
            description: nftData.description || blockchainMetadata.description,
            metadata: {
              blockchainAttributes: blockchainMetadata.attributes,
              ...(typeof nftData.metadata === 'object' && nftData.metadata !== null ? nftData.metadata : {}),
              isOnChainNft: true,
            },
          };
        } catch (error) {
          return res.status(400).json({ 
            message: "Failed to fetch NFT data from blockchain. Please check contract address and token ID." 
          });
        }
      }
      
      // Set ownerId to authenticated user ID server-side
      const nftWithOwner = {
        ...finalNftData,
        ownerId: req.user!.id
      };
      
      const nft = await storage.createNft(nftWithOwner);
      console.log('NFT created successfully:', nft);
      
      res.status(201).json(nft);
    } catch (error) {
      console.error('Error creating NFT:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid NFT data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put('/api/nfts/:nftId', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const nftId = req.params.nftId;
      console.log('Updating NFT:', nftId, 'by user:', req.user?.id);
      
      // Check if NFT exists and get current owner
      const existingNft = await storage.getNftById(nftId);
      if (!existingNft) {
        return res.status(404).json({ message: "NFT not found" });
      }
      
      // Check if user is the owner (using authenticated user ID)
      if (existingNft.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Only the owner can update this NFT" });
      }
      
      // Validate update data using secure schema (only mutable fields)
      const updateData = updateNftSchema.parse(req.body);
      
      const updatedNft = await storage.updateNft(nftId, updateData);
      
      if (!updatedNft) {
        return res.status(404).json({ message: "NFT not found" });
      }
      
      console.log('NFT updated successfully:', updatedNft);
      res.json(updatedNft);
    } catch (error) {
      console.error('Error updating NFT:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid NFT data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/nfts/:nftId', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const nftId = req.params.nftId;
      console.log('Deleting NFT:', nftId, 'by user:', req.user?.id);
      
      // Check if NFT exists and get current owner
      const existingNft = await storage.getNftById(nftId);
      if (!existingNft) {
        return res.status(404).json({ message: "NFT not found" });
      }
      
      // Check if user is the owner (using authenticated user ID)
      if (existingNft.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Only the owner can delete this NFT" });
      }
      
      const deleted = await storage.deleteNft(nftId);
      
      if (deleted) {
        console.log('NFT deleted successfully');
        res.json({ message: "NFT deleted successfully" });
      } else {
        res.status(404).json({ message: "NFT not found" });
      }
    } catch (error) {
      console.error('Error deleting NFT:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Import the migration service at the top of the function
  const { nftMigrationService } = await import("./nft-migration");
  
  // Import and setup object storage diagnostics
  const { setupObjectStorageDiagnostics } = await import("./object-storage-diagnostics");
  setupObjectStorageDiagnostics(app);

  // NFT Storage Migration endpoints
  app.post("/api/migration/nft-storage", async (req, res) => {
    try {
      console.log('🚀 Migration endpoint called');
      
      // Validate prerequisites first
      const validation = await nftMigrationService.validateMigrationPrerequisites();
      if (!validation.valid) {
        return res.status(400).json({
          message: "Migration prerequisites not met",
          errors: validation.errors
        });
      }

      // Start the migration
      const result = await nftMigrationService.migrateNftsToPublicStorage();
      
      // Return detailed results
      res.json({
        message: "Migration completed",
        ...result
      });
    } catch (error) {
      console.error('💥 Migration endpoint error:', error);
      res.status(500).json({
        message: "Migration failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get migration status
  app.get("/api/migration/nft-storage/status", async (req, res) => {
    try {
      const status = await nftMigrationService.getMigrationStatus();
      res.json(status);
    } catch (error) {
      console.error('Error getting migration status:', error);
      res.status(500).json({
        message: "Failed to get migration status",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Validate migration prerequisites
  app.get("/api/migration/nft-storage/validate", async (req, res) => {
    try {
      const validation = await nftMigrationService.validateMigrationPrerequisites();
      res.json(validation);
    } catch (error) {
      console.error('Error validating migration prerequisites:', error);
      res.status(500).json({
        message: "Failed to validate migration prerequisites",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Production Database Migration endpoint
  app.post("/api/migration/production", async (req, res) => {
    try {
      console.log('🚀 Starting production database migration...');
      
      const migrationResult = {
        startTime: new Date(),
        userMigration: { success: false, message: '', error: null as string | null },
        nftMigrations: [] as Array<{ id: string, name: string, success: boolean, message: string, error: string | null }>,
        totalNfts: 0,
        successfulNfts: 0,
        failedNfts: 0
      };

      // Step 1: Get development user data
      const targetUserId = '13eef25a-6cc3-4904-80aa-a955c5d67f07';
      const devUser = await storage.getUser(targetUserId);
      
      if (!devUser) {
        return res.status(404).json({
          message: "User not found in development database",
          userId: targetUserId
        });
      }

      console.log(`Found user: ${devUser.username} (${devUser.walletAddress})`);

      // Step 2: Migrate user to production
      console.log('👤 Step 2: Migrating user to production...');
      try {
        const userPayload = {
          username: devUser.username,
          walletAddress: devUser.walletAddress,
          avatar: devUser.avatar,
          bio: devUser.bio
        };

        const userResponse = await fetch('https://offchatapp.com/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Wallet-Address': devUser.walletAddress || ''
          },
          body: JSON.stringify(userPayload)
        });

        const userResult = await userResponse.json();
        
        if (userResponse.ok) {
          migrationResult.userMigration = {
            success: true,
            message: `User ${devUser.username} migrated successfully`,
            error: null
          };
        } else {
          // Check if user already exists
          if (userResult.message && userResult.message.includes('already exists')) {
            migrationResult.userMigration = {
              success: true,
              message: `User ${devUser.username} already exists in production`,
              error: null
            };
            console.log('ℹ️ User already exists in production');
          } else {
            throw new Error(`User migration failed: ${JSON.stringify(userResult)}`);
          }
        }
      } catch (error) {
        migrationResult.userMigration = {
          success: false,
          message: 'User migration failed',
          error: error instanceof Error ? error.message : 'Unknown user migration error'
        };
        console.error('❌ User migration failed:', error);
      }

      // Step 3: Get NFTs from development
      console.log('🖼️ Step 3: Fetching NFTs from development database...');
      const devNfts = await storage.getNftsByUser(targetUserId);
      migrationResult.totalNfts = devNfts.length;
      
      console.log(`Found ${devNfts.length} NFTs to migrate`);

      // Step 4: Migrate each NFT to production
      console.log('📦 Step 4: Migrating NFTs to production...');
      
      for (const nft of devNfts) {
        const nftResult = {
          id: nft.id,
          name: nft.name,
          success: false,
          message: '',
          error: null as string | null
        };

        try {
          const nftPayload = {
            contractAddress: nft.contractAddress,
            tokenId: nft.tokenId,
            name: nft.name,
            description: nft.description,
            imageUrl: nft.imageUrl,
            collectionName: nft.collectionName,
            chain: nft.chain,
            metadata: nft.metadata
          };

          console.log(`  📦 Migrating NFT: ${nft.name} (${nft.id})`);
          
          const nftResponse = await fetch('https://offchatapp.com/api/nfts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Wallet-Address': devUser.walletAddress || ''
            },
            body: JSON.stringify(nftPayload)
          });

          const nftResponseData = await nftResponse.json();
          
          if (nftResponse.ok) {
            nftResult.success = true;
            nftResult.message = `NFT ${nft.name} migrated successfully`;
            migrationResult.successfulNfts++;
          } else {
            // Check if NFT already exists
            if (nftResponseData.message && nftResponseData.message.includes('already exists')) {
              nftResult.success = true;
              nftResult.message = `NFT ${nft.name} already exists in production`;
              migrationResult.successfulNfts++;
              console.log(`  ℹ️ NFT already exists: ${nft.name}`);
            } else {
              throw new Error(`NFT migration failed: ${JSON.stringify(nftResponseData)}`);
            }
          }
        } catch (error) {
          nftResult.success = false;
          nftResult.message = `NFT ${nft.name} migration failed`;
          nftResult.error = error instanceof Error ? error.message : 'Unknown NFT migration error';
          migrationResult.failedNfts++;
          console.error(`  ❌ NFT migration failed: ${nft.name}`, error);
        }

        migrationResult.nftMigrations.push(nftResult);
      }

      // Step 5: Summary
      const endTime = new Date();
      const duration = endTime.getTime() - migrationResult.startTime.getTime();
      
      console.log('\n📊 Migration Summary:');
      console.log(`NFTs migrated: ${migrationResult.successfulNfts}/${migrationResult.totalNfts}`);
      console.log(`Duration: ${(duration / 1000).toFixed(2)} seconds`);

      res.json({
        message: "Production migration completed",
        duration,
        ...migrationResult,
        endTime
      });

    } catch (error) {
      console.error('💥 Production migration error:', error);
      res.status(500).json({
        message: "Production migration failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get production migration status - verify production data
  app.get("/api/migration/production/status", async (req, res) => {
    try {
      
      const targetWallet = '0x3B67FA28F5b551e6A134e234866ee8A95579B166';
      
      // Check production user
      const userResponse = await fetch(`https://offchatapp.com/api/users/wallet/${targetWallet}`);
      const userExists = userResponse.ok;
      let userInfo = null;
      if (userExists) {
        userInfo = await userResponse.json();
      }

      // Check production NFTs
      const nftResponse = await fetch(`https://offchatapp.com/api/nfts/user/${targetWallet}`);
      const nftsExist = nftResponse.ok;
      let nftInfo = null;
      if (nftsExist) {
        nftInfo = await nftResponse.json();
      }

      // Check development data for comparison
      const devUser = await storage.getUserByWalletAddress(targetWallet);
      const devNfts = devUser ? await storage.getNftsByUser(devUser.id) : [];

      res.json({
        production: {
          userExists,
          userInfo,
          nftsExist,
          nftCount: nftsExist && Array.isArray(nftInfo) ? nftInfo.length : 0,
          nftInfo
        },
        development: {
          userExists: !!devUser,
          userInfo: devUser,
          nftCount: devNfts.length,
          nftInfo: devNfts
        },
        migrationNeeded: !userExists || !nftsExist || (nftsExist && Array.isArray(nftInfo) && nftInfo.length !== devNfts.length)
      });

    } catch (error) {
      console.error('Error checking production migration status:', error);
      res.status(500).json({
        message: "Failed to check production migration status",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // NFT Image Repair endpoints
  app.post("/api/admin/repair-nft-images", async (req, res) => {
    try {
      
      const { nftImageRepairService } = await import('./nft-image-repair');
      const results = await nftImageRepairService.repairAllBrokenImages();
      
      res.json({
        message: "NFT image repair completed",
        ...results
      });
    } catch (error) {
      console.error('NFT image repair error:', error);
      res.status(500).json({
        message: "NFT image repair failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });


  // Crypto Prices API - Uses Ankr RPC for on-chain ERC-20 prices, CoinGecko as primary list source
  const ANKR_API_KEY = process.env.ANKR_API_KEY;
  const ANKR_MULTICHAIN_URL = ANKR_API_KEY ? `https://rpc.ankr.com/multichain/${ANKR_API_KEY}` : null;

  const ANKR_TOKENS: Record<string, { blockchain: string; contractAddress: string }> = {
    'chainlink': { blockchain: 'eth', contractAddress: '0x514910771af9ca656af840dff83e8264ecf986ca' },
    'uniswap': { blockchain: 'eth', contractAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984' },
    'aave': { blockchain: 'eth', contractAddress: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9' },
    'pancakeswap-token': { blockchain: 'bsc', contractAddress: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82' },
    'the-graph': { blockchain: 'eth', contractAddress: '0xc944e90c64b2c07662a292be6244bdf05cda44a7' },
  };

  const COINGECKO_IDS = [
    'bitcoin','ethereum','binancecoin','solana','ripple','cardano','dogecoin',
    'chainlink','avalanche-2','uniswap','litecoin','tron','near','aave',
    'polkadot','shiba-inu','pepe','sui','aptos','render-token','injective-protocol',
    'fetch-ai','arbitrum','optimism','the-graph','filecoin','immutable-x',
    'celestia','sei-network','jupiter-ag','starknet','mantle','beam-2',
    'kaspa','bonk','floki','wif','ondo-finance','pendle','ethena',
    'pancakeswap-token','gala','axie-infinity','the-sandbox','decentraland',
    'theta-token','polygon-ecosystem-token','fantom','hedera-hashgraph','internet-computer',
    'cosmos','algorand','vechain','elrond-erd-2','quant-network',
    'maker','lido-dao','rocket-pool','eigenlayer','worldcoin-wld',
    'pyth-network','jito-governance-token','raydium','jupiter-exchange-solana',
    'bittensor','ai16z','virtual-protocol','grass','io-net','akash-network'
  ].join(',');

  let cachedPrices: any[] = [];
  let lastPriceFetch = 0;
  const PRICE_CACHE_TTL = 45000;
  let isFetchingPrices = false;

  async function fetchAnkrPrice(blockchain: string, contractAddress: string): Promise<number | null> {
    if (!ANKR_MULTICHAIN_URL) return null;
    try {
      const body = {
        jsonrpc: '2.0',
        method: 'ankr_getTokenPrice',
        params: { blockchain, contractAddress },
        id: 1
      };
      const response = await fetch(ANKR_MULTICHAIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000)
      });
      if (!response.ok) return null;
      const data = await response.json();
      if (data.result?.usdPrice) {
        return parseFloat(data.result.usdPrice);
      }
      return null;
    } catch {
      return null;
    }
  }

  async function doFetchPrices(): Promise<any[]> {
    const results: any[] = [];
    let rank = 1;

    const cgResult = await Promise.resolve(
      fetch(
        `https://api.coingecko.com/api/v3/coins/markets?ids=${COINGECKO_IDS}&vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`,
        { signal: AbortSignal.timeout(8000) }
      ).then(r => r.ok ? r.json() : null).catch(() => null)
    );

    const cgData = cgResult;
    if (Array.isArray(cgData)) {
      for (const coin of cgData) {
        results.push({
          id: coin.id, symbol: coin.symbol, name: coin.name,
          current_price: coin.current_price, price_change_percentage_24h: coin.price_change_percentage_24h || 0,
          market_cap: coin.market_cap || 0, market_cap_rank: coin.market_cap_rank || rank++,
          image: coin.image, price_change_24h: coin.price_change_24h || 0
        });
      }
    }

    if (ANKR_MULTICHAIN_URL) {
      const ankrEntries = Object.entries(ANKR_TOKENS);
      const ankrPrices = await Promise.allSettled(
        ankrEntries.map(async ([cgId, info]) => {
          const price = await fetchAnkrPrice(info.blockchain, info.contractAddress);
          return { cgId, price };
        })
      );
      for (const r of ankrPrices) {
        if (r.status === 'fulfilled' && r.value.price !== null && r.value.price > 0) {
          const existing = results.find((item: any) => item.id === r.value.cgId);
          if (existing) existing.current_price = r.value.price;
        }
      }
    }

    results.sort((a: any, b: any) => (a.market_cap_rank || 999) - (b.market_cap_rank || 999));
    return results;
  }

  async function fetchAllPrices(): Promise<any[]> {
    const now = Date.now();
    if (cachedPrices.length > 0 && now - lastPriceFetch < PRICE_CACHE_TTL) {
      return cachedPrices;
    }

    if (cachedPrices.length > 0 && !isFetchingPrices) {
      isFetchingPrices = true;
      doFetchPrices().then(results => {
        if (results.length > 0) {
          cachedPrices = results;
          lastPriceFetch = Date.now();
        }
      }).catch(() => {}).finally(() => { isFetchingPrices = false; });
      return cachedPrices;
    }

    if (isFetchingPrices && cachedPrices.length > 0) {
      return cachedPrices;
    }

    isFetchingPrices = true;
    try {
      const results = await doFetchPrices();
      if (results.length > 0) {
        cachedPrices = results;
        lastPriceFetch = now;
      }
      return results;
    } finally {
      isFetchingPrices = false;
    }
  }

  setTimeout(() => {
    doFetchPrices().then(results => {
      if (results.length > 0) {
        cachedPrices = results;
        lastPriceFetch = Date.now();
        console.log(`Pre-fetched ${results.length} crypto prices`);
      }
    }).catch(() => {});
  }, 2000);

  app.get("/api/crypto/prices", async (_req, res) => {
    try {
      const prices = await fetchAllPrices();
      res.json(prices);
    } catch (error) {
      console.error('Crypto prices API error:', error);
      res.status(500).json({ message: 'Failed to fetch crypto prices' });
    }
  });

  app.get("/api/crypto/price/:coinId", async (req, res) => {
    try {
      const { coinId } = req.params;
      const ankrInfo = ANKR_TOKENS[coinId];
      if (ankrInfo) {
        const price = await fetchAnkrPrice(ankrInfo.blockchain, ankrInfo.contractAddress);
        if (price !== null) {
          return res.json({ id: coinId, price, source: 'ankr' });
        }
      }
      const cgRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currency=usd&include_24hr_change=true`, { signal: AbortSignal.timeout(5000) });
      if (cgRes.ok) {
        const data = await cgRes.json();
        if (data[coinId]) {
          return res.json({ id: coinId, price: data[coinId].usd, change24h: data[coinId].usd_24h_change, source: 'coingecko' });
        }
      }
      res.status(404).json({ message: 'Price not found' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch price' });
    }
  });

  return httpServer;
}
