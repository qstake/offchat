import { DatabaseStorage } from "./database-storage";
import { MemStorage } from "./storage";

// Unified database strategy: Always use DatabaseStorage when DATABASE_URL is available
// This ensures both development and production use the same PostgreSQL instance
// allowing NFTs and other data to be shared across environments
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();

console.log('=== DATABASE CONFIGURATION ===');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Storage type:', process.env.DATABASE_URL ? 'PostgreSQL DATABASE' : 'MEMORY');
console.log('Database URL configured:', !!process.env.DATABASE_URL);
console.log('Unified database access enabled: NFTs will be shared across environments');
console.log('================================');