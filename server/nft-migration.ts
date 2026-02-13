import { storage } from "./storage-fix";
import { ObjectStorageService } from "./objectStorage";
import type { Nft } from "@shared/schema";

export interface MigrationResult {
  totalNfts: number;
  processedNfts: number;
  successfulMigrations: number;
  failedMigrations: number;
  skippedNftsCount: number;
  errors: Array<{
    nftId: string;
    nftName: string;
    error: string;
  }>;
  migratedNfts: Array<{
    nftId: string;
    nftName: string;
    oldUrl: string;
    newUrl: string;
  }>;
  skippedNfts: Array<{
    nftId: string;
    nftName: string;
    reason: string;
  }>;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

export class NFTMigrationService {
  private objectStorageService: ObjectStorageService;

  constructor() {
    this.objectStorageService = new ObjectStorageService();
  }

  /**
   * Main migration function that moves NFT images from private to public storage
   * and updates database URLs
   */
  async migrateNftsToPublicStorage(): Promise<MigrationResult> {
    const result: MigrationResult = {
      totalNfts: 0,
      processedNfts: 0,
      successfulMigrations: 0,
      failedMigrations: 0,
      skippedNftsCount: 0,
      errors: [],
      migratedNfts: [],
      skippedNfts: [],
      startTime: new Date()
    };

    console.log('🚀 Starting NFT migration to public storage...');
    console.log(`Migration started at: ${result.startTime.toISOString()}`);

    try {
      // Step 1: Find all NFTs with broken private URLs
      const nftsWithPrivateUrls = await storage.getNftsWithPrivateUrls();
      result.totalNfts = nftsWithPrivateUrls.length;

      console.log(`Found ${result.totalNfts} NFTs with private URLs that need migration`);

      if (result.totalNfts === 0) {
        result.endTime = new Date();
        result.duration = result.endTime.getTime() - result.startTime.getTime();
        return result;
      }

      // Step 2: Process each NFT
      console.log('🔄 Step 2: Processing each NFT...');
      for (const nft of nftsWithPrivateUrls) {
        result.processedNfts++;
        console.log(`\n📦 Processing NFT ${result.processedNfts}/${result.totalNfts}: "${nft.name}" (ID: ${nft.id})`);

        const migrationStepResult = await this.migrateIndividualNft(nft);

        if (migrationStepResult.success) {
          if (migrationStepResult.skipped) {
            result.skippedNftsCount++;
            result.skippedNfts.push({
              nftId: nft.id,
              nftName: nft.name,
              reason: migrationStepResult.skipReason || 'Unknown reason'
            });
            console.log(`⏭️  Skipped: ${migrationStepResult.skipReason}`);
          } else {
            result.successfulMigrations++;
            result.migratedNfts.push({
              nftId: nft.id,
              nftName: nft.name,
              oldUrl: nft.imageUrl || '',
              newUrl: migrationStepResult.newUrl || ''
            });
          }
        } else {
          result.failedMigrations++;
          result.errors.push({
            nftId: nft.id,
            nftName: nft.name,
            error: migrationStepResult.error || 'Unknown error'
          });
        }
      }

      // Step 3: Summary
      console.log('\n📊 Migration Summary:');
      console.log(`Total NFTs found: ${result.totalNfts}`);
      console.log(`Processed: ${result.processedNfts}`);
      console.log(`⏭️  Skipped: ${result.skippedNftsCount}`);

      if (result.errors.length > 0) {
        console.log('\n🚨 Errors encountered:');
        result.errors.forEach(error => {
          console.log(`  - ${error.nftName} (${error.nftId}): ${error.error}`);
        });
      }

    } catch (error) {
      console.error('💥 Critical error during migration:', error);
      result.errors.push({
        nftId: 'MIGRATION_SYSTEM',
        nftName: 'Migration System',
        error: error instanceof Error ? error.message : 'Unknown critical error'
      });
    }

    result.endTime = new Date();
    result.duration = result.endTime.getTime() - result.startTime.getTime();
    
    console.log(`\n🏁 Migration completed at: ${result.endTime.toISOString()}`);
    console.log(`⏱️  Total duration: ${(result.duration / 1000).toFixed(2)} seconds`);

    return result;
  }

  /**
   * Migrates a single NFT from private to public storage
   */
  private async migrateIndividualNft(nft: Nft): Promise<{
    success: boolean;
    skipped?: boolean;
    skipReason?: string;
    newUrl?: string;
    error?: string;
  }> {
    try {
      // Check if NFT has a valid imageUrl
      if (!nft.imageUrl) {
        return {
          success: true,
          skipped: true,
          skipReason: 'No image URL present'
        };
      }

      // Check if already using public URL (idempotent check)
      if (!nft.imageUrl.includes('/.private/uploads/')) {
        return {
          success: true,
          skipped: true,
          skipReason: 'Already using public URL format'
        };
      }

      // Extract object path from the URL
      const objectPath = this.objectStorageService.normalizeObjectEntityPath(nft.imageUrl);
      
      if (!objectPath.startsWith('/objects/')) {
        return {
          success: true,
          skipped: true,
          skipReason: 'Invalid object path format'
        };
      }

      console.log(`  🔄 Copying object from private to public storage...`);
      
      // Copy object from private to public storage
      const copyResult = await this.objectStorageService.copyObjectToPublicStorage(objectPath, nft.ownerId);
      
      if (!copyResult.success) {
        return {
          success: false,
          error: `Failed to copy object: ${copyResult.error}`
        };
      }

      console.log(`  🗄️  Updating database with new URL...`);

      // Transform the URL to public format
      const newImageUrl = this.objectStorageService.transformPrivateToPublicUrl(nft.imageUrl);

      // Update the NFT in the database
      const updatedNft = await storage.updateNft(nft.id, {
        imageUrl: newImageUrl
      });

      if (!updatedNft) {
        return {
          success: false,
          error: 'Failed to update NFT in database'
        };
      }

      return {
        success: true,
        newUrl: newImageUrl
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during individual migration'
      };
    }
  }

  /**
   * Checks the current migration status - how many NFTs still need migration
   */
  async getMigrationStatus(): Promise<{
    totalNfts: number;
    nftsNeedingMigration: number;
    nftsAlreadyMigrated: number;
    readyForMigration: boolean;
  }> {
    try {
      // Get all NFTs with private URLs (still need migration)
      const nftsWithPrivateUrls = await storage.getNftsWithPrivateUrls();
      
      // For a rough estimate, we can assume all other NFTs are either migrated or don't have images
      // In a real scenario, you might want to query all NFTs and categorize them
      
      return {
        totalNfts: nftsWithPrivateUrls.length,
        nftsNeedingMigration: nftsWithPrivateUrls.length,
        nftsAlreadyMigrated: 0, // This would require a more complex query
        readyForMigration: nftsWithPrivateUrls.length > 0
      };
    } catch (error) {
      console.error('Error checking migration status:', error);
      throw new Error('Failed to check migration status');
    }
  }

  /**
   * Validates that the migration can be performed
   */
  async validateMigrationPrerequisites(): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Check if public object search paths are configured
      const publicPaths = this.objectStorageService.getPublicObjectSearchPaths();
      if (!publicPaths || publicPaths.length === 0) {
        errors.push('No public object search paths configured');
      }

      // Check if private object directory is configured
      const privateDir = this.objectStorageService.getPrivateObjectDir();
      if (!privateDir) {
        errors.push('No private object directory configured');
      }

    } catch (error) {
      errors.push(`Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export a singleton instance
export const nftMigrationService = new NFTMigrationService();