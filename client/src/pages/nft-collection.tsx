import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Nft } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Package, 
  Plus, 
  Upload, 
  Grid3x3, 
  List, 
  Search,
  Filter,
  Eye,
  Image as ImageIcon,
  Sparkles,
  RefreshCw
} from "lucide-react";
import MatrixBackground from "@/components/matrix-background";
import { NFTGallery } from "@/components/NFTGallery";
import { NFTUploader } from "@/components/NFTUploader";
const offchatLogo = "/logo.png";

interface NFTCollectionPageProps {
  currentUser: {
    id: string;
    username: string;
    walletAddress: string;
    avatar?: string | null;
    bio?: string | null;
    isOnline: boolean;
    createdAt: string;
  };
}

export default function NFTCollectionPage({ currentUser }: NFTCollectionPageProps) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Set page title and meta
  useEffect(() => {
    document.title = "My NFT Collection - Offchat";
    
    // Add meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'View and manage your NFT collection in Offchat - secure Web3 digital asset management platform.');
    
    // Add Open Graph tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', 'My NFT Collection - Offchat');
    
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', 'View and manage your NFT collection in Offchat - secure Web3 digital asset management platform.');
  }, []);

  // Remove duplicate NFT fetching - let NFTGallery handle it
  const [isLoading, setIsLoading] = useState(false);
  const nftCollection: Nft[] = []; // Will be handled by NFTGallery
  
  const refetch = () => {
    // NFTGallery will handle refetch
  };

  const handleUploadSuccess = (nft: Nft) => {
    setIsUploadDialogOpen(false);
    refetch(); // Refresh the collection
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleBack = () => {
    setLocation("/chat");
  };

  return (
    <div className="min-h-screen bg-black text-green-400 relative overflow-hidden">
      <MatrixBackground />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Professional Header - Mobile Optimized */}
        <header className="flex items-center justify-between p-3 sm:p-4 lg:p-6 border-b border-green-400/20 bg-black/80 backdrop-blur-md">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-green-400 hover:text-green-300 hover:bg-green-400/10 p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <img 
                  src={offchatLogo} 
                  alt="Offchat Logo" 
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded"
                />
                <div className="absolute -inset-1 bg-green-400/20 rounded blur animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold font-mono tracking-wide" data-testid="text-page-title">
                  <span className="hidden sm:inline">{t('nft.myCollection')}</span>
                  <span className="sm:hidden">{t('nft.title')}</span>
                </h1>
                <p className="text-xs text-green-300/70 font-mono tracking-wide">
                  Digital Asset Management
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-green-400/30 text-green-400 hover:bg-green-400/10 text-xs sm:text-sm px-2 sm:px-3"
              data-testid="button-refresh"
            >
              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => setIsUploadDialogOpen(true)}
              className="bg-green-400/20 border border-green-400/50 text-green-400 hover:bg-green-400/30 font-mono text-xs sm:text-sm px-3 sm:px-4"
              data-testid="button-upload-nft"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">{t('nft.upload')}</span>
              <span className="sm:hidden">{t('nft.upload')}</span>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            
            {/* Collection Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Card className="bg-gradient-to-br from-black/80 to-black/60 border-green-400/30 backdrop-blur-sm glass-card">
                <CardHeader className="pb-2 p-4">
                  <CardTitle className="text-green-300 flex items-center gap-2 text-sm font-mono tracking-wide">
                    <Package className="h-4 w-4" />
                    Total NFTs
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-mono text-green-300 font-bold" data-testid="text-total-nfts">
                    {nftCollection.length}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-black/80 to-black/60 border-green-400/30 backdrop-blur-sm glass-card">
                <CardHeader className="pb-2 p-4">
                  <CardTitle className="text-green-300 flex items-center gap-2 text-sm font-mono tracking-wide">
                    <Grid3x3 className="h-4 w-4" />
                    Chains
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-mono text-green-300 font-bold" data-testid="text-chain-count">
                    {new Set(nftCollection.map((nft) => nft.chain)).size}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-black/80 to-black/60 border-green-400/30 backdrop-blur-sm glass-card">
                <CardHeader className="pb-2 p-4">
                  <CardTitle className="text-green-300 flex items-center gap-2 text-sm font-mono tracking-wide">
                    <Sparkles className="h-4 w-4" />
                    Collections
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-mono text-green-300 font-bold" data-testid="text-collection-count">
                    {new Set(nftCollection.map((nft) => nft.collectionName).filter(Boolean)).size || 0}
                  </div>
                </CardContent>
              </Card>
            </div>


            {/* View Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-black/60 border border-green-400/40 text-green-400 font-mono text-xs">
                  MATRIX NFT PROTOCOL
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`${viewMode === "grid" 
                    ? "bg-green-400/20 text-green-400 border-green-400/50" 
                    : "border-green-400/30 text-green-400 hover:bg-green-400/10"
                  }`}
                  data-testid="button-grid-view"
                >
                  <Grid3x3 className="h-3 w-3" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`${viewMode === "list" 
                    ? "bg-green-400/20 text-green-400 border-green-400/50" 
                    : "border-green-400/30 text-green-400 hover:bg-green-400/10"
                  }`}
                  data-testid="button-list-view"
                >
                  <List className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* NFT Collection Content - Always show NFTGallery */}
            <div className="bg-black/40 border border-green-400/20 rounded-lg p-4 backdrop-blur-sm">
              <NFTGallery
                userWalletAddress={currentUser.walletAddress}
                userId={currentUser.id}
                onCreateNew={() => setIsUploadDialogOpen(true)}
                isOwner={true}
              />
            </div>

            {/* Matrix-style footer info */}
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/60 border border-green-400/20 rounded">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400/70 font-mono text-xs tracking-wider">
                  SECURE NFT STORAGE PROTOCOL ACTIVE
                </span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload NFT Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border-2 border-green-400/30 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-green-300 font-mono text-xl tracking-wide" data-testid="text-upload-dialog-title">
              {t('nft.upload')}
            </DialogTitle>
          </DialogHeader>
          <NFTUploader
            onSuccess={handleUploadSuccess}
            onCancel={() => setIsUploadDialogOpen(false)}
            userWalletAddress={currentUser.walletAddress}
            userId={currentUser.id}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}