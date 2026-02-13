import { storage } from "./storage-fix";

// Simple working search endpoint
export function addSearchRoute(app: any) {
  app.get("/api/users/search", async (req: any, res: any) => {
    const query = req.query.q as string;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: "Query must be at least 2 characters" });
    }
    
    try {
      const users = await storage.searchUsers(query.trim(), req.query.exclude as string);
      console.log('Search completed:', users.length, 'users found');
      res.json(users);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}