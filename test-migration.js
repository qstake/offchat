// Simple test script to verify NFT migration functionality
import { nftMigrationService } from './server/nft-migration.js';
import { storage } from './server/storage-fix.js';

async function testMigration() {
  console.log('🧪 Testing NFT Migration Functionality');
  console.log('=====================================');

  try {
    // Test 1: Get migration status
    console.log('\n📊 Step 1: Checking migration status...');
    const status = await nftMigrationService.getMigrationStatus();
    console.log('Migration Status:', JSON.stringify(status, null, 2));

    // Test 2: Validate prerequisites
    console.log('\n✅ Step 2: Validating migration prerequisites...');
    const validation = await nftMigrationService.validateMigrationPrerequisites();
    console.log('Validation Result:', JSON.stringify(validation, null, 2));

    if (!validation.valid) {
      console.log('❌ Prerequisites not met, stopping test');
      return;
    }

    // Test 3: Get NFTs with private URLs
    console.log('\n🔍 Step 3: Finding NFTs with private URLs...');
    const brokenNfts = await storage.getNftsWithPrivateUrls();
    console.log(`Found ${brokenNfts.length} NFTs with private URLs:`);
    brokenNfts.forEach((nft, index) => {
      console.log(`  ${index + 1}. ${nft.name} (${nft.id})`);
      console.log(`     URL: ${nft.imageUrl}`);
    });

    if (brokenNfts.length === 0) {
      console.log('✅ No NFTs need migration!');
      return;
    }

    // Test 4: Run the migration
    console.log('\n🚀 Step 4: Running migration...');
    const migrationResult = await nftMigrationService.migrateNftsToPublicStorage();
    
    console.log('\n📋 Migration Results:');
    console.log('=====================');
    console.log(`Total NFTs: ${migrationResult.totalNfts}`);
    console.log(`Processed: ${migrationResult.processedNfts}`);
    console.log(`Successful: ${migrationResult.successfulMigrations}`);
    console.log(`Skipped: ${migrationResult.skippedNfts}`);
    console.log(`Failed: ${migrationResult.failedMigrations}`);
    console.log(`Duration: ${(migrationResult.duration || 0) / 1000}s`);

    if (migrationResult.migratedNfts.length > 0) {
      console.log('\n✅ Successfully migrated NFTs:');
      migrationResult.migratedNfts.forEach(nft => {
        console.log(`  - ${nft.nftName}: ${nft.oldUrl} → ${nft.newUrl}`);
      });
    }

    if (migrationResult.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      migrationResult.errors.forEach(error => {
        console.log(`  - ${error.nftName}: ${error.error}`);
      });
    }

    // Test 5: Verify results
    console.log('\n🔍 Step 5: Verifying migration results...');
    const remainingBrokenNfts = await storage.getNftsWithPrivateUrls();
    console.log(`Remaining NFTs with private URLs: ${remainingBrokenNfts.length}`);

    if (remainingBrokenNfts.length === 0) {
      console.log('🎉 Migration completed successfully! All NFTs now use public URLs.');
    } else {
      console.log('⚠️  Some NFTs still have private URLs:');
      remainingBrokenNfts.forEach(nft => {
        console.log(`  - ${nft.name}: ${nft.imageUrl}`);
      });
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testMigration().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed with error:', error);
  process.exit(1);
});