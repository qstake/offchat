import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Trophy, TrendingUp, Users, RefreshCw, ExternalLink } from "lucide-react";
import MatrixBackground from "@/components/matrix-background";
import { format } from "date-fns";

interface LeaderboardEntry {
  userId: string;
  username: string;
  walletAddress: string | null;
  totalTransferred: string;
  transferCount: number;
  latestTransfer: Date | null;
  avatar?: string | null;
}

export default function OFFCTransfersPage() {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = "$OFFC Transfers - Offchat | Token Transactions";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Send and receive $OFFC tokens on Offchat. View transaction history and manage your $OFFC token transfers across supported blockchain networks.');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', '$OFFC Transfers - Offchat | Token Transactions');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', 'Send and receive $OFFC tokens on Offchat. View transaction history and manage your $OFFC token transfers across supported blockchain networks.');
  }, []);

  const [, setLocation] = useLocation();
  
  // Fetch OFFC transfer leaderboard data
  const { data: leaderboardData, isLoading, refetch } = useQuery({
    queryKey: ['/api/offc-transfers/leaderboard'],
    queryFn: async () => {
      const response = await fetch('/api/offc-transfers/leaderboard');
      if (!response.ok) throw new Error('Failed to fetch OFFC transfer leaderboard');
      return response.json() as LeaderboardEntry[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const formatOFFCAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toLocaleString();
  };

  const formatWalletAddress = (address: string | null) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  const getRankColor = (index: number) => {
    if (index === 0) return "text-yellow-400";
    if (index === 1) return "text-gray-300";
    if (index === 2) return "text-amber-600";
    return "text-green-400";
  };

  return (
    <div className="min-h-screen bg-black text-green-400 relative overflow-hidden">
      <MatrixBackground />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Professional Header - Mobile Optimized */}
        <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6 border-b border-green-400/20 bg-black/60 backdrop-blur-md" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation('/')}
              className="text-green-400 hover:text-green-300 hover:bg-green-400/10 p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 sm:gap-3">
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold font-mono tracking-tight">
                <span className="hidden sm:inline">{t('transfers.leaderboardTitle')}</span>
                <span className="sm:hidden">{t('transfers.leaderboardShort')}</span>
              </h1>
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            className="border-green-400/30 text-green-400 hover:bg-green-400/10 text-xs sm:text-sm px-2 sm:px-4"
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('transfers.refresh')}</span>
            <span className="sm:hidden">↻</span>
          </Button>
        </div>

        {/* Main Content - Mobile First Design */}
        <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            
            {/* Professional Stats Cards - Mobile Responsive */}
            <div className="grid grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              <Card className="bg-gradient-to-br from-black/60 to-black/40 border-green-400/30 backdrop-blur-sm shadow-xl">
                <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                  <CardTitle className="text-green-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{t('transfers.totalTransfers')}</span>
                    <span className="sm:hidden">{t('transfers.transfers')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-lg sm:text-xl lg:text-2xl font-mono text-green-300 font-bold">
                    {leaderboardData?.reduce((sum, entry) => sum + entry.transferCount, 0) || 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-black/60 to-black/40 border-green-400/30 backdrop-blur-sm shadow-xl">
                <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                  <CardTitle className="text-green-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{t('transfers.totalVolume')}</span>
                    <span className="sm:hidden">{t('crypto.volume')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-lg sm:text-xl lg:text-2xl font-mono text-green-300 font-bold">
                    {formatOFFCAmount(
                      leaderboardData?.reduce((sum, entry) => sum + parseFloat(entry.totalTransferred), 0).toString() || "0"
                    )}
                    <span className="text-xs sm:text-sm text-green-400/80 ml-1">OFFC</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-black/60 to-black/40 border-green-400/30 backdrop-blur-sm shadow-xl">
                <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                  <CardTitle className="text-green-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base">
                    <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{t('transfers.activeTraders')}</span>
                    <span className="sm:hidden">{t('transfers.traders')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-lg sm:text-xl lg:text-2xl font-mono text-green-300 font-bold">
                    {leaderboardData?.length || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Professional Leaderboard - Mobile Optimized */}
            <Card className="bg-gradient-to-br from-black/60 to-black/40 border-green-400/30 backdrop-blur-sm shadow-xl">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-green-300 flex items-center gap-2 text-base sm:text-lg">
                  <Trophy className="h-5 w-5" />
                  {t('transfers.topTransferers')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                {isLoading ? (
                  <div className="text-center py-6 sm:py-8">
                    <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto text-green-400 mb-3 sm:mb-4" />
                    <p className="text-green-400/70 text-sm sm:text-base">{t('transfers.loadingLeaderboard')}</p>
                  </div>
                ) : !leaderboardData || leaderboardData.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <Trophy className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-green-400/50 mb-3 sm:mb-4" />
                    <p className="text-green-400/70 text-sm sm:text-base">{t('transfers.noTransfers')}</p>
                    <p className="text-green-400/50 text-xs sm:text-sm mt-2">{t('transfers.startTransferring')}</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {leaderboardData.map((entry, index) => (
                      <div
                        key={entry.userId}
                        className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-gradient-to-r from-black/40 to-black/20 border border-green-400/20 hover:border-green-400/40 transition-all duration-150 hover:shadow-lg hover:bg-gradient-to-r hover:from-green-400/5 hover:to-black/20"
                        data-testid={`leaderboard-entry-${index}`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
                          {/* Rank - More Compact on Mobile */}
                          <div className={`text-lg sm:text-xl font-bold font-mono min-w-[2rem] sm:min-w-[3rem] ${getRankColor(index)} text-center`}>
                            {getRankIcon(index)}
                          </div>
                          
                          {/* User Info - Responsive Layout */}
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                              <AvatarImage src={entry.avatar || undefined} />
                              <AvatarFallback className="bg-green-400/20 text-green-400 text-xs sm:text-sm">
                                {entry.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-green-300 text-sm sm:text-base truncate">{entry.username}</div>
                              <div className="text-xs sm:text-sm text-green-400/70 font-mono truncate">
                                {formatWalletAddress(entry.walletAddress)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Stats - Responsive Layout */}
                        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 text-right flex-shrink-0">
                          <div>
                            <div className="text-sm sm:text-base lg:text-lg font-bold text-green-300 font-mono">
                              {formatOFFCAmount(entry.totalTransferred)}
                              <span className="text-xs text-green-400/80 ml-1">OFFC</span>
                            </div>
                            <div className="text-xs sm:text-sm text-green-400/70">
                              {entry.transferCount} tx{entry.transferCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                          
                          <div className="hidden sm:block text-xs sm:text-sm text-green-400/50 min-w-0">
                            {entry.latestTransfer ? format(new Date(entry.latestTransfer), 'MMM dd') : 'N/A'}
                          </div>
                          
                          {entry.walletAddress && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://bscscan.com/address/${entry.walletAddress}`, '_blank')}
                              className="text-green-400/70 hover:text-green-400 hover:bg-green-400/10 p-1 sm:p-2 h-8 w-8 sm:h-auto sm:w-auto"
                              data-testid={`button-view-wallet-${index}`}
                            >
                              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Professional Footer Info - Mobile Optimized */}
            <Card className="bg-gradient-to-br from-black/60 to-black/40 border-green-400/30 backdrop-blur-sm shadow-xl">
              <CardContent className="p-4 sm:p-6">
                <div className="text-center text-green-400/70">
                  <p className="text-xs sm:text-sm flex items-center justify-center gap-2">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    {t('transfers.autoUpdate')}
                  </p>
                  <p className="text-xs mt-2 text-green-400/50">
                    {t('transfers.trackingInfo')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}