import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import type { Request, Response } from "express";

export function setupObjectStorageDiagnostics(app: any) {
  // Diagnostic endpoint to test object storage functionality
  app.get("/api/diagnostics/object-storage", async (req: Request, res: Response) => {
    try {
      const objectStorageService = new ObjectStorageService();
      
      const diagnostics = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        tests: {} as any
      };
      
      // Test 1: Check environment variables
      diagnostics.tests.environmentVariables = {
        PUBLIC_OBJECT_SEARCH_PATHS: process.env.PUBLIC_OBJECT_SEARCH_PATHS || 'NOT_SET',
        PRIVATE_OBJECT_DIR: process.env.PRIVATE_OBJECT_DIR || 'NOT_SET',
        hasPublicPaths: !!process.env.PUBLIC_OBJECT_SEARCH_PATHS,
        hasPrivateDir: !!process.env.PRIVATE_OBJECT_DIR
      };
      
      // Test 2: Try to get environment paths
      try {
        const publicPaths = objectStorageService.getPublicObjectSearchPaths();
        const privateDir = objectStorageService.getPrivateObjectDir();
        diagnostics.tests.pathRetrieval = {
          success: true,
          publicPaths,
          privateDir
        };
      } catch (error) {
        diagnostics.tests.pathRetrieval = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
      
      // Test 3: Try to get upload URLs
      try {
        const publicUploadUrl = await objectStorageService.getPublicObjectEntityUploadURL();
        const privateUploadUrl = await objectStorageService.getObjectEntityUploadURL();
        diagnostics.tests.uploadUrls = {
          success: true,
          publicUploadUrl: publicUploadUrl ? 'GENERATED' : 'FAILED',
          privateUploadUrl: privateUploadUrl ? 'GENERATED' : 'FAILED'
        };
      } catch (error) {
        diagnostics.tests.uploadUrls = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
      
      // Test 4: Test specific object paths (using real NFT URLs from DB)
      const testPaths = [
        '/objects/uploads/226200f1-42df-4b46-a420-1a032ae713ae',
        '/objects/uploads/d81f98b5-69f0-42c5-950d-5133864645d2'
      ];
      
      diagnostics.tests.objectAccess = {};
      
      for (const testPath of testPaths) {
        try {
          const objectFile = await objectStorageService.getObjectEntityFile(testPath);
          const [exists] = await objectFile.exists();
          diagnostics.tests.objectAccess[testPath] = {
            success: true,
            exists,
            bucketName: objectFile.bucket.name,
            fileName: objectFile.name
          };
        } catch (error) {
          diagnostics.tests.objectAccess[testPath] = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            isObjectNotFoundError: error instanceof ObjectNotFoundError
          };
        }
      }
      
      // Test 5: Sidecar endpoint test
      try {
        const response = await fetch('http://127.0.0.1:1106/credential');
        const credentialData = await response.json();
        diagnostics.tests.sidecarEndpoint = {
          success: true,
          status: response.status,
          hasCredentials: !!credentialData
        };
      } catch (error) {
        diagnostics.tests.sidecarEndpoint = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
      
      res.json(diagnostics);
    } catch (error) {
      console.error('Diagnostics error:', error);
      res.status(500).json({
        error: 'Diagnostics failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Test endpoint to directly serve an object
  app.get("/api/diagnostics/test-object/:objectId", async (req: Request, res: Response) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = `/objects/uploads/${req.params.objectId}`;
      
      console.log(`Testing object path: ${objectPath}`);
      
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      const [exists] = await objectFile.exists();
      
      if (!exists) {
        return res.status(404).json({
          error: 'Object does not exist',
          path: objectPath,
          bucket: objectFile.bucket.name,
          file: objectFile.name
        });
      }
      
      // Try to serve the object
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error('Test object error:', error);
      res.status(500).json({
        error: 'Failed to serve object',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}