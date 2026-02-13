import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// The object storage client is used to interact with the object storage service.
export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// The object storage service is used to interact with the object storage service.
export class ObjectStorageService {
  constructor() {}

  // Gets the public object search paths.
  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }

  // Gets the private object directory.
  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  // Search for a public object from the search paths.
  async searchPublicObject(filePath: string): Promise<File | null> {
    try {
      const publicSearchPaths = this.getPublicObjectSearchPaths();
      
      for (const searchPath of publicSearchPaths) {
        const fullPath = `${searchPath}/${filePath}`;

        // Full path format: /<bucket_name>/<object_name>
        const { bucketName, objectName } = parseObjectPath(fullPath);
        const bucket = objectStorageClient.bucket(bucketName);
        const file = bucket.file(objectName);

        // Check if file exists
        const [exists] = await file.exists();
        
        if (exists) {
          return file;
        }
      }
    } catch (error) {
      console.error(`Error searching public objects for ${filePath}:`, error);
    }

    return null;
  }

  // Downloads an object to the response.
  async downloadObject(file: File, res: Response, cacheTtlSec: number = 3600) {
    try {
      // Get file metadata
      const [metadata] = await file.getMetadata();
      // Get the ACL policy for the object.
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      // Set appropriate headers
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `${
          isPublic ? "public" : "private"
        }, max-age=${cacheTtlSec}`,
      });

      // Stream the file to the response
      const stream = file.createReadStream();

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Gets the upload URL for an object entity.
  async getObjectEntityUploadURL(): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }

    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;

    const { bucketName, objectName } = parseObjectPath(fullPath);

    // Sign URL for PUT method with TTL
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900,
    });
  }

  // Gets the upload URL for a public object entity.
  async getPublicObjectEntityUploadURL(): Promise<string> {
    const publicObjectPaths = this.getPublicObjectSearchPaths();
    if (!publicObjectPaths || publicObjectPaths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var."
      );
    }

    // Use the first public path for uploads
    const publicObjectDir = publicObjectPaths[0];
    const objectId = randomUUID();
    const fullPath = `${publicObjectDir}/uploads/${objectId}`;

    const { bucketName, objectName } = parseObjectPath(fullPath);

    // Sign URL for PUT method with TTL
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900,
    });
  }

  // Gets the object entity file from the object path.
  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join("/");
    
    // First try private directory
    try {
      let entityDir = this.getPrivateObjectDir();
      if (!entityDir.endsWith("/")) {
        entityDir = `${entityDir}/`;
      }
      const objectEntityPath = `${entityDir}${entityId}`;
      
      const { bucketName, objectName } = parseObjectPath(objectEntityPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const objectFile = bucket.file(objectName);
      const [exists] = await objectFile.exists();
      
      if (exists) {
        return objectFile;
      }
    } catch (error) {
      console.error(`Error checking private storage for ${entityId}:`, error);
    }
    
    // If not found in private directory, search in public locations
    const publicFile = await this.searchPublicObject(entityId);
    if (publicFile) {
      return publicFile;
    }
    
    // Not found in either private or public locations
    throw new ObjectNotFoundError();
  }

  normalizeObjectEntityPath(
    rawPath: string,
  ): string {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
  
    // Extract the path from the URL by removing query parameters and domain
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
  
    // First check if the path starts with the private directory
    let privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir.endsWith("/")) {
      privateObjectDir = `${privateObjectDir}/`;
    }
  
    if (rawObjectPath.startsWith(privateObjectDir)) {
      // Extract the entity ID from the private path
      const entityId = rawObjectPath.slice(privateObjectDir.length);
      return `/objects/${entityId}`;
    }
  
    // If not found in private directory, iterate through all public search paths
    try {
      const publicSearchPaths = this.getPublicObjectSearchPaths();
      for (const publicPath of publicSearchPaths) {
        let normalizedPublicPath = publicPath;
        if (!normalizedPublicPath.endsWith("/")) {
          normalizedPublicPath = `${normalizedPublicPath}/`;
        }
        
        if (rawObjectPath.startsWith(normalizedPublicPath)) {
          // Extract the entity ID from the public path
          const entityId = rawObjectPath.slice(normalizedPublicPath.length);
          return `/objects/${entityId}`;
        }
      }
    } catch (error) {
      // PUBLIC_OBJECT_SEARCH_PATHS not set, skip public matching
      // Fall back to returning original path
    }
  
    // Return original path if not found in any directory
    return rawObjectPath;
  }

  // Tries to set the ACL policy for the object entity and return the normalized path.
  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }

    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }

  // Checks if the user can access the object entity.
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: File;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }

  // Copies an object from private storage to public storage
  async copyObjectToPublicStorage(privateObjectPath: string, ownerId: string): Promise<{
    success: boolean;
    publicPath?: string;
    error?: string;
  }> {
    try {
      // Get the private object file
      const privateFile = await this.getObjectEntityFile(privateObjectPath);
      
      // Extract entity ID from the private path
      const entityId = privateObjectPath.replace('/objects/', '');
      
      // Get public paths
      const publicSearchPaths = this.getPublicObjectSearchPaths();
      if (!publicSearchPaths || publicSearchPaths.length === 0) {
        throw new Error('No public storage paths configured');
      }
      
      // Use the first public path for the destination
      const publicObjectDir = publicSearchPaths[0];
      const publicObjectPath = `${publicObjectDir}/uploads/${entityId}`;
      const { bucketName: publicBucketName, objectName: publicObjectName } = parseObjectPath(publicObjectPath);
      
      // Create destination file
      const publicBucket = objectStorageClient.bucket(publicBucketName);
      const publicFile = publicBucket.file(publicObjectName);
      
      // Check if public file already exists
      const [publicExists] = await publicFile.exists();
      if (publicExists) {
        console.log(`Public object already exists: ${publicObjectPath}`);
        return {
          success: true,
          publicPath: `/objects/${entityId}`
        };
      }
      
      // Copy the file
      await privateFile.copy(publicFile);
      
      // Set public ACL on the copied object
      await setObjectAclPolicy(publicFile, {
        owner: ownerId,
        visibility: "public"
      });
      
      console.log(`Successfully copied object from ${privateObjectPath} to ${publicObjectPath}`);
      
      return {
        success: true,
        publicPath: `/objects/${entityId}`
      };
      
    } catch (error) {
      console.error('Error copying object to public storage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Transforms a private URL to its equivalent public URL format
  transformPrivateToPublicUrl(privateUrl: string): string {
    if (!privateUrl) return privateUrl;
    
    // Transform from /.private/uploads/{id} to /public/uploads/{id}
    return privateUrl.replace('/.private/uploads/', '/public/uploads/');
  }

  // Generates a direct cloud storage URL for production environments
  async getDirectCloudStorageUrl(objectPath: string, ttlSec: number = 3600): Promise<string | null> {
    try {
      if (!objectPath.startsWith("/objects/")) {
        return null;
      }

      const objectFile = await this.getObjectEntityFile(objectPath);
      
      // Generate a signed URL for public access
      const bucketName = objectFile.bucket.name;
      const objectName = objectFile.name;
      
      return await signObjectURL({
        bucketName,
        objectName,
        method: "GET",
        ttlSec
      });
    } catch (error) {
      console.error(`Error generating direct cloud storage URL for ${objectPath}:`, error);
      return null;
    }
  }

  // Check if we're running in a production environment where /objects/ route isn't accessible
  isProductionEnvironment(): boolean {
    // Check for production indicators
    const isProduction = 
      process.env.NODE_ENV === 'production' ||
      process.env.REPLIT_DEPLOYMENT === 'production' ||
      // Check if we're running on a published Replit domain
      (typeof process !== 'undefined' && 
       process.env.REPL_SLUG && 
       !process.env.REPLIT_DEV_DOMAIN) ||
      // Explicitly check for offchatapp.com domain
      (typeof process !== 'undefined' && process.env.REPL_SLUG === 'offchatapp') ||
      // Check if we're running on any production domain (not .replit.dev)
      (typeof process !== 'undefined' && 
       process.env.HOSTNAME && 
       !process.env.HOSTNAME.includes('.replit.dev'));
    
    console.log('Production environment detection:', {
      NODE_ENV: process.env.NODE_ENV,
      REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT,
      REPL_SLUG: process.env.REPL_SLUG,
      REPLIT_DEV_DOMAIN: process.env.REPLIT_DEV_DOMAIN,
      HOSTNAME: process.env.HOSTNAME,
      isProduction
    });
    
    return Boolean(isProduction);
  }
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return {
    bucketName,
    objectName,
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on Replit`
    );
  }

  const { signed_url: signedURL } = await response.json();
  return signedURL;
}