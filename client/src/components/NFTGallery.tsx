import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { resolveImageUrl, resolveObjectStorageUrl } from "@/lib/utils";
import { 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  Copy, 
  ExternalLink, 
  Image as ImageIcon,
  Grid3x3,
  SortAsc,
  Plus,
  ChevronDown,
  Share,
  AlertTriangle,
  Loader2
} from "lucide-react";
import type { Nft } from "@shared/schema";

interface NFTGalleryProps {
  userWalletAddress: string;
  userId: string;
  onCreateNew?: () => void;
  isOwner?: boolean;
}

// Chain color mapping for badges
const chainColors: Record<string, { bg: string; text: string }> = {
  ethereum: { bg: "bg-blue-500", text: "text-white" },
  polygon: { bg: "bg-purple-500", text: "text-white" },
  bsc: { bg: "bg-yellow-500", text: "text-black" },
  arbitrum: { bg: "bg-blue-400", text: "text-white" },
  optimism: { bg: "bg-red-500", text: "text-white" },
};

// NFT Card Component
function NFTCard({ nft, onClick, isOwner }: { nft: Nft; onClick: () => void; isOwner?: boolean }) {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  // Resolve the image URL on component mount
  useEffect(() => {
    async function loadImageUrl() {
      if (!nft.imageUrl) {
        setImageLoading(false);
        return;
      }

      try {
        // Use the new production-compatible URL resolver
        const url = await resolveObjectStorageUrl(nft.imageUrl);
        setResolvedImageUrl(url);
      } catch (error) {
        console.error('Error resolving NFT image URL:', error);
        // Fallback to basic URL resolution
        setResolvedImageUrl(resolveImageUrl(nft.imageUrl));
      } finally {
        setImageLoading(false);
      }
    }

    loadImageUrl();
  }, [nft.imageUrl]);

  const shortAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getChainBadgeColor = (chain: string) => {
    return chainColors[chain.toLowerCase()] || { bg: "bg-gray-500", text: "text-white" };
  };

  return (
    <Card 
      className="group cursor-pointer transition-all duration-150 hover:scale-[1.02] hover:shadow-xl bg-black/95 border-2 border-green-400/30 backdrop-blur-sm hover:border-green-400/60 glass-card"
      onClick={onClick}
      data-testid={`card-nft-${nft.id}`}
    >
      <div className="relative">
        {/* Matrix-style border effects */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <CardHeader className="p-0">
          <div className="relative aspect-square overflow-hidden rounded-t-lg bg-black/50">
            {imageLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-green-400" />
              </div>
            ) : !imageError && resolvedImageUrl ? (
              nft.imageUrl && (nft.imageUrl.includes('.mp4') || nft.imageUrl.includes('.webm') || nft.imageUrl.includes('.mov')) ? (
                <video
                  src={resolvedImageUrl}
                  className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-110"
                  loop
                  muted
                  autoPlay
                  playsInline
                  onError={handleImageError}
                  data-testid={`video-nft-${nft.id}`}
                />
              ) : (
                <img
                  src={resolvedImageUrl}
                  alt={nft.name}
                  className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-110"
                  onError={handleImageError}
                  loading="lazy"
                  data-testid={`img-nft-${nft.id}`}
                />
              )
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-900/20 to-black/50 flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-green-400/50" />
              </div>
            )}
            
            {/* Overlay with quick actions */}
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-black/80 border-green-400/50 text-green-400 hover:bg-green-400/10"
                  data-testid={`button-view-${nft.id}`}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Chain badge */}
            <div className="absolute top-2 right-2">
              <Badge 
                className={`${getChainBadgeColor(nft.chain).bg} ${getChainBadgeColor(nft.chain).text} font-mono text-xs uppercase tracking-wide`}
                data-testid={`badge-chain-${nft.id}`}
              >
                {nft.chain}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          <div>
            <CardTitle className="text-green-300 font-mono text-lg font-bold line-clamp-1 mb-1" data-testid={`text-name-${nft.id}`}>
              {nft.name}
            </CardTitle>
            {nft.collectionName && (
              <p className="text-green-300/70 text-sm font-mono line-clamp-1" data-testid={`text-collection-${nft.id}`}>
                {nft.collectionName}
              </p>
            )}
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-green-400/70">
              <span>{t('nft.contract')}:</span>
              <span className="font-medium" data-testid={`text-contract-${nft.id}`}>
                {shortAddress(nft.contractAddress)}
              </span>
            </div>
            <div className="flex items-center justify-between text-green-400/70">
              <span>{t('nft.tokenId')}:</span>
              <span className="font-medium" data-testid={`text-tokenid-${nft.id}`}>
                #{nft.tokenId}
              </span>
            </div>
          </div>

          {/* Matrix-style progress bar effect */}
          <div className="h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent"></div>
        </CardContent>
      </div>
    </Card>
  );
}

// Detailed NFT Modal Component
function NFTDetailModal({ 
  nft, 
  isOpen, 
  onClose, 
  onDelete, 
  isOwner = false 
}: { 
  nft: Nft; 
  isOpen: boolean; 
  onClose: () => void; 
  onDelete?: () => void; 
  isOwner?: boolean; 
}) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  // Resolve the image URL on component mount and when NFT changes
  useEffect(() => {
    async function loadImageUrl() {
      if (!nft.imageUrl) {
        setImageLoading(false);
        return;
      }

      setImageLoading(true);
      setImageError(false);

      try {
        // Use the new production-compatible URL resolver
        const url = await resolveObjectStorageUrl(nft.imageUrl);
        setResolvedImageUrl(url);
      } catch (error) {
        console.error('Error resolving NFT image URL in modal:', error);
        // Fallback to basic URL resolution
        setResolvedImageUrl(resolveImageUrl(nft.imageUrl));
      } finally {
        setImageLoading(false);
      }
    }

    loadImageUrl();
  }, [nft.imageUrl]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: t('nft.copied'),
        description: t('nft.copiedToClipboard', { label }),
      });
    } catch (error) {
      toast({
        title: t('nft.copyFailed'),
        description: t('nft.unableToCopy'),
        variant: "destructive",
      });
    }
  };

  const openInExplorer = (contractAddress: string, tokenId: string, chain: string) => {
    let explorerUrl = '';
    switch (chain.toLowerCase()) {
      case 'ethereum':
        explorerUrl = `https://etherscan.io/nft/${contractAddress}/${tokenId}`;
        break;
      case 'polygon':
        explorerUrl = `https://polygonscan.com/nft/${contractAddress}/${tokenId}`;
        break;
      case 'bsc':
        explorerUrl = `https://bscscan.com/nft/${contractAddress}/${tokenId}`;
        break;
      default:
        explorerUrl = `https://etherscan.io/nft/${contractAddress}/${tokenId}`;
    }
    window.open(explorerUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border-2 border-green-400/30 backdrop-blur-sm">
        {/* Matrix-style border effects */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-green-400/20"></div>
        
        <DialogHeader className="border-b border-green-400/20 pb-4">
          <DialogTitle className="text-green-300 font-mono text-xl tracking-wide" data-testid="text-nft-detail-title">
            {t('nft.assetDetails')}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden border-2 border-green-400/30 bg-black/50">
              {imageLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-green-400" />
                </div>
              ) : !imageError && resolvedImageUrl ? (
                <img
                  src={resolvedImageUrl}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                  data-testid="img-nft-detail"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-900/20 to-black/50 flex items-center justify-center">
                  <ImageIcon className="w-24 h-24 text-green-400/50" />
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(nft.contractAddress, "Contract Address")}
                className="bg-black border-green-400/30 text-green-400 hover:bg-green-400/5 font-mono text-xs"
                data-testid="button-copy-contract"
              >
                <Copy className="w-3 h-3 mr-1" />
                {t('nft.copyContract')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openInExplorer(nft.contractAddress, nft.tokenId, nft.chain)}
                className="bg-black border-green-400/30 text-green-400 hover:bg-green-400/5 font-mono text-xs"
                data-testid="button-open-explorer"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                {t('nft.viewOnExplorer')}
              </Button>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-green-300 font-mono" data-testid="text-nft-name">
                {nft.name}
              </h3>
              
              {nft.collectionName && (
                <div>
                  <span className="text-green-400/70 text-xs font-mono tracking-wide">{t('nft.collection')}</span>
                  <p className="text-green-300 text-lg font-mono" data-testid="text-nft-collection">
                    {nft.collectionName}
                  </p>
                </div>
              )}

              {nft.description && (
                <div>
                  <span className="text-green-400/70 text-xs font-mono tracking-wide">{t('nft.description')}</span>
                  <p className="text-green-300/90 text-sm leading-relaxed" data-testid="text-nft-description">
                    {nft.description}
                  </p>
                </div>
              )}
            </div>

            <Separator className="bg-green-400/20" />

            {/* Technical Details */}
            <div className="space-y-4">
              <h4 className="text-green-400 font-mono text-sm tracking-wide">{t('nft.blockchainData')}</h4>
              
              <div className="grid grid-cols-1 gap-3 font-mono text-sm">
                <div className="flex justify-between items-center p-3 bg-black/40 rounded border border-green-400/20">
                  <span className="text-green-400/70">{t('nft.chain')}:</span>
                  <Badge className={`${chainColors[nft.chain.toLowerCase()]?.bg || 'bg-gray-500'} ${chainColors[nft.chain.toLowerCase()]?.text || 'text-white'} font-mono uppercase`}>
                    {nft.chain}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-black/40 rounded border border-green-400/20">
                  <span className="text-green-400/70">{t('nft.contract')}:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(nft.contractAddress, "Contract Address")}
                    className="h-auto p-1 text-green-300 hover:text-green-400"
                    data-testid="button-copy-contract-inline"
                  >
                    <span className="font-mono text-xs">{nft.contractAddress}</span>
                    <Copy className="w-3 h-3 ml-2" />
                  </Button>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-black/40 rounded border border-green-400/20">
                  <span className="text-green-400/70">{t('nft.tokenId')}:</span>
                  <span className="text-green-300 font-bold" data-testid="text-token-id">#{nft.tokenId}</span>
                </div>
              </div>
            </div>

            {/* Metadata Section */}
            {!!nft.metadata && (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMetadata(!showMetadata)}
                  className="w-full justify-between text-green-400 hover:text-green-300 font-mono text-sm p-2"
                  data-testid="button-toggle-metadata"
                >
                  <span>{t('nft.metadata')}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showMetadata ? 'rotate-180' : ''}`} />
                </Button>
                
                {showMetadata && (
                  <div className="bg-black/60 border border-green-400/20 rounded p-4 max-h-48 overflow-y-auto">
                    <pre className="text-xs text-green-300/80 font-mono whitespace-pre-wrap" data-testid="text-metadata">
                      {safeStringifyMetadata(nft.metadata)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Owner Actions */}
            {isOwner && onDelete && (
              <>
                <Separator className="bg-green-400/20" />
                <div className="flex justify-end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-400/50 text-red-400 hover:bg-red-400/10 font-mono text-xs"
                        data-testid="button-delete-nft"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        {t('nft.deleteNft')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-black/95 border-red-400/50">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-400 font-mono">
                          {t('nft.confirmDeletion')}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-red-300/80">
                          {t('nft.deleteConfirmMessage', { name: nft.name })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-black border-green-400/30 text-green-400 hover:bg-green-400/5">
                          {t('common.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={onDelete}
                          className="bg-red-500 hover:bg-red-600 text-white font-mono"
                          data-testid="button-confirm-delete"
                        >
                          {t('common.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to safely stringify metadata
const safeStringifyMetadata = (metadata: unknown): string => {
  if (!metadata) return 'No metadata available';
  try {
    return JSON.stringify(metadata, null, 2);
  } catch (error) {
    return 'Unable to parse metadata';
  }
};

// Main NFT Gallery Component
export function NFTGallery({ userWalletAddress, userId, onCreateNew, isOwner = false }: NFTGalleryProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "collection" | "created">("created");
  const [selectedNft, setSelectedNft] = useState<Nft | null>(null);

  // Fetch user's NFTs
  const { data: nfts, isLoading, error } = useQuery({
    queryKey: ["/api/nfts/user", userId],
    queryFn: async () => {
      const response = await fetch(`/api/nfts/user/${userId}`, {
        headers: {
          "x-wallet-address": userWalletAddress,
        },
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error(`Failed to fetch NFTs: ${response.statusText}`);
      }
      return await response.json();
    },
    enabled: !!userId && !!userWalletAddress,
  });

  // Delete NFT mutation
  const deleteNftMutation = useMutation({
    mutationFn: async (nftId: string) => {
      const response = await fetch(`/api/nfts/${nftId}`, {
        method: "DELETE",
        headers: {
          "x-wallet-address": userWalletAddress,
        },
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to delete NFT: ${response.statusText}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: t('nft.deletedSuccessfully'),
        description: t('nft.deletedDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/nfts/user", userId] });
      setSelectedNft(null);
    },
    onError: (error: any) => {
      toast({
        title: t('nft.errorDeletingNft'),
        description: error.message || t('nft.failedToDelete'),
        variant: "destructive",
      });
    },
  });

  // Filter and sort NFTs
  const filteredAndSortedNfts: Nft[] = nfts
    ? (nfts as Nft[])
        .filter((nft: Nft) => {
          const matchesSearch = searchQuery === "" || 
            nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (nft.collectionName?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
          return matchesSearch;
        })
        .sort((a: Nft, b: Nft) => {
          switch (sortBy) {
            case "name":
              return a.name.localeCompare(b.name);
            case "collection":
              return (a.collectionName || "").localeCompare(b.collectionName || "");
            case "created":
            default:
              return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          }
        })
    : [];

  const handleDeleteNft = (nftId: string) => {
    deleteNftMutation.mutate(nftId);
  };


  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="bg-black/95 border-green-400/30">
          <div className="p-0">
            <Skeleton className="aspect-square w-full bg-green-400/20" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4 bg-green-400/20" />
              <Skeleton className="h-4 w-1/2 bg-green-400/10" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full bg-green-400/10" />
                <Skeleton className="h-3 w-full bg-green-400/10" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  // Empty state component
  const EmptyState = () => (
    <Card className="bg-black/95 border-2 border-green-400/30 backdrop-blur-sm text-center p-12">
      <div className="space-y-6">
        <div className="relative">
          <Grid3x3 className="w-24 h-24 text-green-400/50 mx-auto" />
          <div className="absolute -inset-4 bg-green-400/10 rounded-full blur-xl opacity-50"></div>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-green-400 font-mono" data-testid="text-empty-title">
            {t('nft.noNftsFound')}
          </h3>
          <p className="text-green-300/70 text-sm max-w-md mx-auto" data-testid="text-empty-description">
            {searchQuery 
              ? t('nft.noNftsMatchSearch', { query: searchQuery })
              : isOwner 
                ? t('nft.emptyCollectionOwner')
                : t('nft.emptyCollectionOther')
            }
          </p>
        </div>
        
        {isOwner && onCreateNew && !searchQuery && (
          <Button
            onClick={onCreateNew}
            className="bg-green-500 hover:bg-green-600 text-black font-mono font-bold tracking-wide"
            data-testid="button-create-first-nft"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('nft.createFirstNft')}
          </Button>
        )}
      </div>
    </Card>
  );

  if (error) {
    return (
      <Card className="bg-red-500/10 border-red-400/50 text-center p-12">
        <div className="space-y-4">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto" />
          <div>
            <h3 className="text-xl font-bold text-red-400 font-mono mb-2" data-testid="text-error-title">
              {t('nft.failedToLoadNfts')}
            </h3>
            <p className="text-red-300/80 text-sm" data-testid="text-error-message">
              {error instanceof Error ? error.message : "An unexpected error occurred"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/nfts/user", userId] })}
            className="border-red-400/50 text-red-400 hover:bg-red-400/10 font-mono"
            data-testid="button-retry"
          >
            {t('common.retry')}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-green-400 font-mono tracking-wide mb-2" data-testid="text-gallery-title">
            {t('nft.title')}
          </h2>
          <p className="text-green-300/70 text-sm font-mono">
            {isLoading ? t('common.loading') : t('nft.nftsFound', { count: filteredAndSortedNfts.length })}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-400/50" />
            <Input
              placeholder={t('nft.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/90 border-green-400/30 text-green-300 placeholder:text-green-500/50 font-mono focus:border-green-400"
              data-testid="input-search"
            />
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-40 bg-black/90 border-green-400/30 text-green-300 font-mono" data-testid="select-sort">
              <div className="flex items-center gap-2">
                <SortAsc className="w-4 h-4" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-black/95 border-green-400/30">
              <SelectItem value="created" className="text-green-300 font-mono">{t('nft.dateCreated')}</SelectItem>
              <SelectItem value="name" className="text-green-300 font-mono">{t('nft.name')}</SelectItem>
              <SelectItem value="collection" className="text-green-300 font-mono">{t('nft.collection')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Create NFT Button */}
          {isOwner && onCreateNew && (
            <Button
              onClick={onCreateNew}
              className="bg-green-500 hover:bg-green-600 text-black font-mono font-bold tracking-wide"
              data-testid="button-create-nft"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('nft.createNft')}
            </Button>
          )}
        </div>
      </div>

      {/* Matrix-style separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent"></div>

      {/* Gallery Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : filteredAndSortedNfts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="grid-nfts">
          {filteredAndSortedNfts.map((nft: Nft) => {
            return (
              <NFTCard
                key={nft.id}
                nft={nft}
                onClick={() => setSelectedNft(nft)}
                isOwner={isOwner}
              />
            );
          })}
        </div>
      )}

      {/* Detailed View Modal */}
      {selectedNft && (
        <NFTDetailModal
          nft={selectedNft}
          isOpen={!!selectedNft}
          onClose={() => setSelectedNft(null)}
          onDelete={() => handleDeleteNft(selectedNft.id)}
          isOwner={isOwner}
        />
      )}
    </div>
  );
}

export default NFTGallery;