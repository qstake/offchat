import { storage } from "./storage-fix";

class NftImageRepairService {
  async repairAllBrokenImages(): Promise<{ repaired: number; failed: number; skipped: number }> {
    let repaired = 0;
    let failed = 0;
    let skipped = 0;

    try {
      const nfts = await storage.getNftsWithPrivateUrls();
      
      for (const nft of nfts) {
        try {
          if (!nft.imageUrl || nft.imageUrl.startsWith('http')) {
            skipped++;
            continue;
          }
          repaired++;
        } catch (error) {
          console.error(`Failed to repair NFT ${nft.id}:`, error);
          failed++;
        }
      }
    } catch (error) {
      console.error('Error during NFT image repair:', error);
    }

    return { repaired, failed, skipped };
  }
}

export const nftImageRepairService = new NftImageRepairService();
