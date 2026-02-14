import { useState, useEffect, useCallback } from "react";
import { Switch, Route, useLocation } from "wouter";
import { useTranslation } from 'react-i18next';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWallet } from "@/hooks/use-wallet";
import { OfflineModeProvider } from "@/hooks/use-offline-mode";
import { ThemeProvider } from "@/contexts/theme-context";
import AuthPage from "@/pages/auth";
import ChatPage from "@/pages/chat";
import ChatConversationsPage from "@/pages/chat-conversations";
import UserProfilePage from "./pages/user-profile";
import GroupProfilePage from "./pages/group-profile";
import CryptoDetailPage from "./pages/crypto-detail";
import CryptoMarketPage from "./pages/crypto-market";
import OFFCTransfersPage from "./pages/offc-transfers";
import NFTCollectionPage from "./pages/nft-collection";
import RoadmapPage from "./pages/roadmap";
import AboutPage from "./pages/about";
import TermsPage from "./pages/terms";
import PrivacyPage from "./pages/privacy";
import WhitepaperPage from "./pages/whitepaper";
import SwapPage from "@/pages/swap";
import NotFound from "@/pages/not-found";

function LoadingScreen() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-green-400 font-mono tracking-widest text-sm">{t('common.loading')}</p>
      </div>
    </div>
  );
}

function Router() {
  const { isConnected, walletAddress } = useWallet();
  const [location, setLocation] = useLocation();
  
  // Check if user exists when wallet is connected
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['/api/users/wallet', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return null;
      try {
        const response = await fetch(`/api/users/wallet/${walletAddress}`);
        if (response.status === 404) {
          const offlineUser = localStorage.getItem('offchat_offline_user');
          if (offlineUser) {
            const parsed = JSON.parse(offlineUser);
            if (parsed.walletAddress === walletAddress) return parsed;
          }
          return null;
        }
        if (!response.ok) throw new Error('Failed to fetch user');
        const user = await response.json();
        const offlineFull = localStorage.getItem('offchat_offline_user_full');
        if (offlineFull) {
          localStorage.removeItem('offchat_offline_user');
          localStorage.removeItem('offchat_offline_user_full');
        }
        return user;
      } catch (error) {
        const offlineUser = localStorage.getItem('offchat_offline_user');
        if (offlineUser) {
          const parsed = JSON.parse(offlineUser);
          if (parsed.walletAddress === walletAddress) return parsed;
        }
        return null;
      }
    },
    enabled: !!walletAddress && isConnected,
    retry: false,
  });

  useEffect(() => {
    const syncOfflineUser = async () => {
      const offlineFull = localStorage.getItem('offchat_offline_user_full');
      if (!offlineFull || !navigator.onLine) return;
      try {
        const userData = JSON.parse(offlineFull);
        const response = await fetch('/api/users', {
          method: 'POST',
          body: JSON.stringify(userData),
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          localStorage.removeItem('offchat_offline_user');
          localStorage.removeItem('offchat_offline_user_full');
          queryClient.invalidateQueries({ queryKey: ['/api/users/wallet'] });
        }
      } catch (e) {
        console.log('Will sync offline user later');
      }
    };
    window.addEventListener('online', syncOfflineUser);
    syncOfflineUser();
    return () => window.removeEventListener('online', syncOfflineUser);
  }, [walletAddress]);

  return (
    <Switch>
      <Route path="/roadmap" component={RoadmapPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/whitepaper" component={WhitepaperPage} />
      <Route path="/chat-conversations">
        {isConnected && currentUser ? (
          <ChatConversationsPage currentUser={currentUser} />
        ) : userLoading ? (
          <LoadingScreen />
        ) : (
          <AuthPage />
        )}
      </Route>
      <Route path="/chat/:chatId?">
        {isConnected && currentUser ? (
          <ChatPage currentUser={currentUser} />
        ) : isConnected && userLoading ? (
          <LoadingScreen />
        ) : (
          <AuthPage />
        )}
      </Route>
      <Route path="/profile/user/:userId">
        {isConnected && currentUser ? (
          <UserProfilePage currentUser={currentUser} />
        ) : isConnected && userLoading ? (
          <LoadingScreen />
        ) : (
          <AuthPage />
        )}
      </Route>
      <Route path="/profile/group/:chatId">
        {isConnected && currentUser ? (
          <GroupProfilePage currentUser={currentUser} />
        ) : isConnected && userLoading ? (
          <LoadingScreen />
        ) : (
          <AuthPage />
        )}
      </Route>
      <Route path="/crypto-market">
        {isConnected && currentUser ? (
          <CryptoMarketPage />
        ) : isConnected && userLoading ? (
          <LoadingScreen />
        ) : (
          <AuthPage />
        )}
      </Route>
      <Route path="/crypto/:coinId">
        {isConnected && currentUser ? (
          <CryptoDetailPage />
        ) : isConnected && userLoading ? (
          <LoadingScreen />
        ) : (
          <AuthPage />
        )}
      </Route>
      <Route path="/offc-transfers">
        {isConnected && currentUser ? (
          <OFFCTransfersPage />
        ) : isConnected && userLoading ? (
          <LoadingScreen />
        ) : (
          <AuthPage />
        )}
      </Route>
      <Route path="/swap" component={SwapPage} />
      <Route path="/nft-collection">
        {isConnected && currentUser ? (
          <NFTCollectionPage currentUser={currentUser} />
        ) : isConnected && userLoading ? (
          <LoadingScreen />
        ) : (
          <AuthPage />
        )}
      </Route>
      <Route path="/" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <OfflineModeProvider>
            <div className="dark">
              <Toaster />
              <Router />
            </div>
          </OfflineModeProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
