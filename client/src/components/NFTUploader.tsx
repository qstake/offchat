import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Upload, Image as ImageIcon, Loader2, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { createNftSchema } from "@shared/schema";
import type { CreateNft } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

interface NFTUploaderProps {
  onSuccess?: (nft: any) => void;
  onCancel?: () => void;
  userWalletAddress?: string;
  userId?: string;
}

// Extended validation schema with conditional requirements based on NFT type
const nftFormSchema = createNftSchema.extend({
  contractAddress: z.string().optional(),
  tokenId: z.string().optional(),
  chain: z.enum(["ethereum", "polygon", "bsc", "arbitrum", "optimism"], {
    required_error: "Please select a blockchain",
  }),
  metadata: z.string().optional().refine((val) => {
    if (!val || val.trim() === "") return true;
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, "Metadata must be valid JSON"),
  isOnChainNft: z.boolean().optional(),
}).refine((data) => {
  // If it's an on-chain NFT, require contract address and token ID
  if (data.isOnChainNft) {
    return data.contractAddress && data.tokenId && 
           /^0x[a-fA-F0-9]{40}$/.test(data.contractAddress) &&
           /^\d+$/.test(data.tokenId);
  }
  return true;
}, {
  message: "Contract address and Token ID are required for on-chain NFTs",
  path: ["contractAddress"],
});

type NFTFormData = z.infer<typeof nftFormSchema>;

export function NFTUploader({ onSuccess, onCancel, userWalletAddress, userId }: NFTUploaderProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isOnChainNft, setIsOnChainNft] = useState(false);

  // Cleanup image preview URL on component unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const form = useForm<NFTFormData>({
    resolver: zodResolver(nftFormSchema),
    defaultValues: {
      name: "",
      description: "",
      contractAddress: "",
      tokenId: "",
      collectionName: "",
      chain: "ethereum",
      imageUrl: "",
      metadata: "",
      isOnChainNft: false,
    },
  });


  // Mutation for creating NFT
  const createNftMutation = useMutation({
    mutationFn: async (nftData: CreateNft) => {
      if (!userWalletAddress) {
        throw new Error("Wallet address is required");
      }

      // Use fetch with proper headers since apiRequest doesn't support custom headers
      const response = await fetch("/api/nfts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": userWalletAddress,
        },
        body: JSON.stringify(nftData),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      return await response.json();
    },
    onSuccess: (nft) => {
      toast({
        title: t('nft.createdSuccessfully'),
        description: t('nft.addedToCollection', { name: nft.name }),
      });
      
      // Fix cache invalidation to match NFTGallery query key
      if (userId) {
        // Optimistic update - add NFT to cache immediately for instant UI feedback
        queryClient.setQueryData(["/api/nfts/user", userId], (oldData: any) => {
          if (oldData && Array.isArray(oldData)) {
            return [nft, ...oldData]; // Add new NFT to beginning of list
          }
          return [nft]; // If no existing data, create new array with the NFT
        });
        
        // Invalidate queries to ensure server data is refetched
        queryClient.invalidateQueries({ queryKey: ["/api/nfts/user", userId] });
      }
      
      form.reset();
      setImagePreview("");
      setUploadedImageUrl("");
      onSuccess?.(nft);
    },
    onError: (error: any) => {
      toast({
        title: t('nft.errorCreatingNft'),
        description: error.message || t('nft.failedToCreate'),
        variant: "destructive",
      });
      
      // Revert optimistic update on error if we have userId
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["/api/nfts/user", userId] });
      }
    },
  });

  // Image upload handlers
  const handleGetUploadParameters = async () => {
    try {
      const response = await fetch("/api/objects/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": userWalletAddress || "",
        },
        body: JSON.stringify({ isPublic: true }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to get upload URL");
      const { uploadURL } = await response.json();
      return { method: "PUT" as const, url: uploadURL };
    } catch (error) {
      console.error("Error getting upload parameters:", error);
      throw error;
    }
  };

  const handleImageSelect = (file: File) => {
    // Create local preview URL immediately when file is selected
    const previewURL = URL.createObjectURL(file);
    setImagePreview(previewURL);
    setIsUploadingImage(true);
  };

  const handleImageUploadComplete = async (result: { successful: { uploadURL?: string }[] }) => {
    try {
      if (result.successful && result.successful.length > 0) {
        const uploadedFile = result.successful[0];
        const imageURL = uploadedFile.uploadURL;
        
        if (imageURL) {
          setUploadedImageUrl(imageURL);
          form.setValue("imageUrl", imageURL);
          
          toast({
            title: t('nft.imageUploaded'),
            description: t('nft.imageUploadedDesc'),
          });
        }
      }
    } catch (error) {
      console.error("Error handling image upload:", error);
      setImagePreview("");
      toast({
        title: t('nft.uploadFailed'),
        description: t('nft.failedToUploadImage'),
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onSubmit = async (data: NFTFormData) => {
    // Only require image for personal NFTs
    if (!data.isOnChainNft && !uploadedImageUrl) {
      toast({
        title: t('nft.imageRequired'),
        description: t('nft.pleaseUploadImage'),
        variant: "destructive",
      });
      return;
    }

    // Parse metadata if provided
    let parsedMetadata: any = undefined;
    if (data.metadata && data.metadata.trim()) {
      try {
        parsedMetadata = JSON.parse(data.metadata);
      } catch (error) {
        toast({
          title: t('nft.invalidMetadata'),
          description: t('nft.metadataMustBeJson'),
          variant: "destructive",
        });
        return;
      }
    }

    // Handle different NFT types
    let contractAddress: string;
    let tokenId: string;
    let imageUrl: string;

    if (data.isOnChainNft) {
      // On-chain NFT: use provided contract and token ID
      contractAddress = data.contractAddress!;
      tokenId = data.tokenId!;
      // For on-chain NFTs, we'll fetch the image from blockchain
      imageUrl = "FETCH_FROM_BLOCKCHAIN"; // Backend will handle this
    } else {
      // Personal NFT: generate auto values
      contractAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
      tokenId = Date.now().toString();
      imageUrl = uploadedImageUrl;
    }

    const nftData: CreateNft = {
      name: data.name,
      description: data.description || undefined,
      contractAddress,
      tokenId,
      collectionName: data.collectionName || undefined,
      chain: data.chain,
      imageUrl,
      metadata: parsedMetadata,
    };

    createNftMutation.mutate(nftData);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="bg-black/95 border-2 border-green-400/30 backdrop-blur-sm">
        {/* Matrix-style border effects */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-green-400/20"></div>
        
        <CardHeader className="text-center border-b border-green-400/20">
          <CardTitle className="text-xl font-mono text-green-300 tracking-widest">
            {t('nft.creationProtocol')}
          </CardTitle>
          <div className="w-20 h-px bg-green-400 mx-auto my-2"></div>
          <CardDescription className="text-green-300/70 font-mono text-xs tracking-wide">
            {t('nft.mintDigitalAsset')}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Image Upload Section - Only for Personal NFTs */}
              {!isOnChainNft && (
                <div className="space-y-4">
                  <h3 className="text-sm font-mono text-green-300 tracking-wide text-center">
                    {t('nft.assetImageUpload')}
                  </h3>
                
                <div className="flex flex-col items-center space-y-4">
                  {/* Image Preview */}
                  {imagePreview ? (
                    <div className="relative w-48 h-48 border-2 border-green-400/50 bg-black/50 rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="NFT Preview"
                        className="w-full h-full object-cover"
                        data-testid="img-nft-preview"
                      />
                      {isUploadingImage && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
                        </div>
                      )}
                      {uploadedImageUrl && !isUploadingImage && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-6 h-6 text-green-400" data-testid="icon-upload-success" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-48 h-48 border-2 border-green-400/30 border-dashed bg-black/30 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 text-green-400/50 mx-auto mb-2" />
                        <p className="text-green-400/70 font-mono text-xs">
                          {t('nft.noImageSelected')}
                        </p>
                      </div>
                    </div>
                  )}

                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={10485760} // 10MB
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleImageUploadComplete}
                    onFileSelect={handleImageSelect}
                    buttonClassName="bg-black border-2 border-green-400/30 text-green-400 hover:bg-green-400/5 font-mono text-xs px-6 py-3 tracking-wide"
                    data-testid="button-upload-nft-image"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploadingImage ? t('nft.uploading') : t('nft.selectFile')}
                  </ObjectUploader>
                </div>
              </div>
              )}

              {/* On-Chain NFT Info - No image upload needed */}
              {isOnChainNft && (
                <div className="space-y-4 p-4 bg-green-400/5 border border-green-400/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-mono text-green-400">{t('nft.onChainNftReference')}</span>
                  </div>
                  <p className="text-xs text-green-300/70 font-mono">
                    {t('nft.onChainNftReferenceDesc')}
                  </p>
                </div>
              )}

              {/* NFT Type Selection */}
              <div className="space-y-4 border-t border-green-400/20 pt-6">
                <h3 className="text-sm font-mono text-green-300 tracking-wide text-center">
                  {t('nft.nftTypeSelection')}
                </h3>
                
                <div className="flex items-center justify-between p-4 bg-black/50 border border-green-400/30 rounded-lg">
                  <div className="space-y-1">
                    <label className="text-sm font-mono text-green-400">
                      {isOnChainNft ? t('nft.onChainNft') : t('nft.personalArtCollection')}
                    </label>
                    <p className="text-xs text-green-300/70 font-mono max-w-md">
                      {isOnChainNft 
                        ? t('nft.onChainNftDesc')
                        : t('nft.personalArtDesc')}
                    </p>
                  </div>
                  <Switch
                    checked={isOnChainNft}
                    onCheckedChange={(checked) => {
                      setIsOnChainNft(checked);
                      form.setValue("isOnChainNft", checked);
                      if (!checked) {
                        form.setValue("contractAddress", "");
                        form.setValue("tokenId", "");
                      }
                    }}
                    className="data-[state=checked]:bg-green-400"
                    data-testid="switch-nft-type"
                  />
                </div>
              </div>

              {/* NFT Details Section */}
              <div className="space-y-6">
                <h3 className="text-sm font-mono text-green-300 tracking-wide text-center">
                  {t('nft.metadataConfiguration')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name Field */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono text-green-400 tracking-wide">
                          {t('nft.nftName')} *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t('nft.enterNftName')}
                            className="bg-black/90 border-2 border-green-400/30 text-green-300 placeholder:text-green-500/50 font-mono focus:border-green-400 focus:ring-1 focus:ring-green-400/20"
                            data-testid="input-nft-name"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs font-mono" />
                      </FormItem>
                    )}
                  />

                  {/* Collection Name Field */}
                  <FormField
                    control={form.control}
                    name="collectionName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono text-green-400 tracking-wide">
                          {t('nft.collection')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder={t('nft.enterCollectionName')}
                            className="bg-black/90 border-2 border-green-400/30 text-green-300 placeholder:text-green-500/50 font-mono focus:border-green-400 focus:ring-1 focus:ring-green-400/20"
                            data-testid="input-collection-name"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs font-mono" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description Field */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono text-green-400 tracking-wide">
                        {t('nft.description')}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          placeholder={t('nft.describeYourNft')}
                          className="bg-black/90 border-2 border-green-400/30 text-green-300 placeholder:text-green-500/50 font-mono h-20 resize-none focus:border-green-400 focus:ring-1 focus:ring-green-400/20"
                          data-testid="textarea-nft-description"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs font-mono" />
                    </FormItem>
                  )}
                />

                {/* On-Chain NFT Fields - Only show when isOnChainNft is true */}
                {isOnChainNft && (
                  <div className="space-y-4 p-4 bg-green-400/5 border border-green-400/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <Info className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-mono text-green-400">{t('nft.onChainNftInfo')}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Contract Address Field */}
                      <FormField
                        control={form.control}
                        name="contractAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-mono text-green-400 tracking-wide">
                              {t('nft.contractAddress')} *
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="0x..."
                                className="bg-black/90 border-2 border-green-400/30 text-green-300 placeholder:text-green-500/50 font-mono focus:border-green-400 focus:ring-1 focus:ring-green-400/20"
                                data-testid="input-contract-address"
                              />
                            </FormControl>
                            <FormDescription className="text-green-300/50 text-xs font-mono">
                              {t('nft.contractAddressHint')}
                            </FormDescription>
                            <FormMessage className="text-red-400 text-xs font-mono" />
                          </FormItem>
                        )}
                      />

                      {/* Token ID Field */}
                      <FormField
                        control={form.control}
                        name="tokenId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-mono text-green-400 tracking-wide">
                              {t('nft.tokenId')} *
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t('nft.tokenIdPlaceholder')}
                                className="bg-black/90 border-2 border-green-400/30 text-green-300 placeholder:text-green-500/50 font-mono focus:border-green-400 focus:ring-1 focus:ring-green-400/20"
                                data-testid="input-token-id"
                              />
                            </FormControl>
                            <FormDescription className="text-green-300/50 text-xs font-mono">
                              {t('nft.tokenIdHint')}
                            </FormDescription>
                            <FormMessage className="text-red-400 text-xs font-mono" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Personal Art Collection Info */}
                {!isOnChainNft && (
                  <div className="p-4 bg-green-400/5 border border-green-400/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-mono text-green-400">{t('nft.personalArtCollection')}</span>
                    </div>
                    <p className="text-xs text-green-300/70 font-mono">
                      {t('nft.personalArtStorageDesc')}
                    </p>
                  </div>
                )}

                {/* Blockchain Selection - Always visible */}
                <FormField
                  control={form.control}
                  name="chain"
                  render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono text-green-400 tracking-wide">
                          {t('nft.blockchain')} *
                        </FormLabel>
                        <FormDescription className="text-green-300/50 text-xs font-mono mb-2">
                          {isOnChainNft 
                            ? t('nft.selectBlockchainOnChain')
                            : t('nft.selectBlockchainPersonal')}
                        </FormDescription>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger 
                              className="bg-black/95 border-2 border-green-400/50 text-green-300 font-mono focus:border-green-400 focus:ring-2 focus:ring-green-400/30 hover:border-green-400/70 transition-colors h-11"
                              data-testid="select-blockchain"
                            >
                              <SelectValue placeholder="Select blockchain...">
                                <div className="flex items-center gap-2">
                                  {field.value === 'ethereum' && <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/1027.png" alt="ETH" className="w-4 h-4 rounded-full" />}
                                  {field.value === 'polygon' && <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/3890.png" alt="Polygon" className="w-4 h-4 rounded-full" />}
                                  {field.value === 'bsc' && <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/1839.png" alt="BSC" className="w-4 h-4 rounded-full" />}
                                  {field.value === 'arbitrum' && <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/11841.png" alt="Arbitrum" className="w-4 h-4 rounded-full" />}
                                  {field.value === 'optimism' && <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/11840.png" alt="Optimism" className="w-4 h-4 rounded-full" />}
                                  <span className="capitalize">{field.value || 'Select blockchain...'}</span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent 
                            className="bg-black/95 border-2 border-green-400/50 text-green-300 shadow-2xl shadow-green-400/20"
                            position="popper"
                            side="bottom"
                            align="start"
                            sideOffset={4}
                            style={{ zIndex: 99999 }}
                          >
                            <SelectItem 
                              value="ethereum" 
                              data-testid="option-ethereum"
                              className="hover:bg-green-400/20 focus:bg-green-400/20 cursor-pointer font-mono text-green-300 hover:text-green-200 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/1027.png" alt="ETH" className="w-5 h-5 rounded-full" />
                                <span>Ethereum</span>
                              </div>
                            </SelectItem>
                            <SelectItem 
                              value="polygon" 
                              data-testid="option-polygon"
                              className="hover:bg-green-400/20 focus:bg-green-400/20 cursor-pointer font-mono text-green-300 hover:text-green-200 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/3890.png" alt="Polygon" className="w-5 h-5 rounded-full" />
                                <span>Polygon</span>
                              </div>
                            </SelectItem>
                            <SelectItem 
                              value="bsc" 
                              data-testid="option-bsc"
                              className="hover:bg-green-400/20 focus:bg-green-400/20 cursor-pointer font-mono text-green-300 hover:text-green-200 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/1839.png" alt="BNB" className="w-5 h-5 rounded-full" />
                                <span>BSC</span>
                              </div>
                            </SelectItem>
                            <SelectItem 
                              value="arbitrum" 
                              data-testid="option-arbitrum"
                              className="hover:bg-green-400/20 focus:bg-green-400/20 cursor-pointer font-mono text-green-300 hover:text-green-200 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/11841.png" alt="Arbitrum" className="w-5 h-5 rounded-full" />
                                <span>Arbitrum</span>
                              </div>
                            </SelectItem>
                            <SelectItem 
                              value="optimism" 
                              data-testid="option-optimism"
                              className="hover:bg-green-400/20 focus:bg-green-400/20 cursor-pointer font-mono text-green-300 hover:text-green-200 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/11840.png" alt="Optimism" className="w-5 h-5 rounded-full" />
                                <span>Optimism</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400 text-xs font-mono" />
                      </FormItem>
                  )}
                />

                {/* Additional Metadata Field */}
                <FormField
                  control={form.control}
                  name="metadata"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono text-green-400 tracking-wide">
                        {t('nft.additionalMetadata')}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder='{"trait_type": "value", "attributes": []}'
                          className="bg-black/90 border-2 border-green-400/30 text-green-300 placeholder:text-green-500/50 font-mono h-20 resize-none focus:border-green-400 focus:ring-1 focus:ring-green-400/20"
                          data-testid="textarea-metadata"
                        />
                      </FormControl>
                      <FormDescription className="text-green-300/50 text-xs font-mono">
                        {t('nft.optionalJsonMetadata')}
                      </FormDescription>
                      <FormMessage className="text-red-400 text-xs font-mono" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-green-400/20">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1 bg-black border-2 border-green-400/30 text-green-400 hover:bg-green-400/5 font-mono tracking-wide"
                    data-testid="button-cancel-nft-upload"
                  >
                    {t('common.cancel')}
                  </Button>
                )}
                
                <Button
                  type="submit"
                  disabled={createNftMutation.isPending || !uploadedImageUrl}
                  className="flex-1 bg-black border-2 border-green-400 text-green-400 hover:bg-green-400/10 font-mono tracking-wide disabled:border-green-600/30 disabled:text-green-600/50"
                  data-testid="button-create-nft"
                >
                  {createNftMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('nft.creatingNft')}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t('nft.createNft')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}