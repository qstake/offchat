import { useState, useEffect, useCallback, Component, ErrorInfo } from "react";
import { Switch, Route, useLocation } from "wouter";
import { useTranslation } from 'react-i18next';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWallet, WalletProvider } from "@/hooks/use-wallet";
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

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Offchat] React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-green-400 font-mono text-xl mb-4">System Error</div>
            <p className="text-green-300/70 font-mono text-sm mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="bg-black border-2 border-green-400 text-green-400 px-6 py-3 font-mono hover:bg-green-400/10"
            >
              Restart App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  const { isConnected, walletAddress, currentUser } = useWallet();
  const [location, setLocation] = useLocation();

  const isAuthed = isConnected && !!currentUser;

  return (
    <Switch>
      <Route path="/roadmap" component={RoadmapPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/whitepaper" component={WhitepaperPage} />
      <Route path="/chat-conversations">
        {isAuthed ? (
          <ChatConversationsPage currentUser={currentUser} />
        ) : (
          <AuthPage />
        )}
      </Route>
      <Route path="/chat/:chatId?">
        {isAuthed ? (
          <ChatPage currentUser={currentUser} />
        ) : (
          <AuthPage />
        )}
      </Route>
      <Route path="/profile/user/:userId">
        {isAuthed ? (
          <UserProfilePage currentUser={currentUser} />
        ) : (
          <AuthPage />
        )}
      </Route>
      <Route path="/profile/group/:chatId">
        {isAuthed ? (
          <GroupProfilePage currentUser={currentUser} />
        ) : (
          <AuthPage />
        )}
      </Route>
      <Route path="/crypto-market">
        {isAuthed ? (
          <CryptoMarketPage />
        ) : (
          <AuthPage />
        )}
      </Route>
      <Route path="/crypto/:coinId">
        {isAuthed ? (
          <CryptoDetailPage />
        ) : (
          <AuthPage />
        )}
      </Route>
      <Route path="/offc-transfers">
        {isAuthed ? (
          <OFFCTransfersPage />
        ) : (
          <AuthPage />
        )}
      </Route>
      <Route path="/swap" component={SwapPage} />
      <Route path="/nft-collection">
        {isAuthed ? (
          <NFTCollectionPage currentUser={currentUser} />
        ) : (
          <AuthPage />
        )}
      </Route>
      <Route path="/">
        {isAuthed ? (
          <ChatPage currentUser={currentUser} />
        ) : (
          <AuthPage />
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <WalletProvider>
            <OfflineModeProvider>
              <ErrorBoundary>
                <div className="dark">
                  <Toaster />
                  <Router />
                </div>
              </ErrorBoundary>
            </OfflineModeProvider>
          </WalletProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
