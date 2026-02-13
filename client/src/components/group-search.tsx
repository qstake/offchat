import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Users, UserPlus, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Group {
  id: string;
  name: string;
  username: string | null;
  avatar: string | null;
  description: string | null;
  isGroup: boolean;
  createdAt: string;
}

interface GroupSearchProps {
  currentUserId: string;
}

export default function GroupSearch({ currentUserId }: GroupSearchProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search groups query
  const { data: searchResults = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/chats/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/chats/search/${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: searchQuery.length >= 2,
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const response = await fetch(`/api/chats/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUserId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to join group');
      }
      return response.json();
    },
    onSuccess: (data, groupId) => {
      const group = searchResults.find((g: Group) => g.id === groupId);
      toast({
        title: t('groups.groupJoined'),
        description: t('groups.groupJoinedDesc', { name: group?.name }),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      setIsOpen(false);
      setSearchQuery("");
    },
    onError: (error: any) => {
      toast({
        title: t('groups.joinFailed'),
        description: error.message || t('groups.failedToJoin'),
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (searchQuery.trim().length >= 2) {
      refetch();
    }
  };

  const handleJoinGroup = (groupId: string) => {
    joinGroupMutation.mutate(groupId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="cyber-button w-full bg-black/40 border-primary/30 hover:bg-primary/10 hover:border-primary/50 text-primary h-10 px-4 text-sm font-mono transition-all duration-150 neon-glow"
        >
          <Search className="w-4 h-4 mr-2" />
          {t('groups.findGroups')}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-[90vw] sm:max-w-lg max-h-[85vh] overflow-hidden bg-black/95 border-primary/20 backdrop-blur-md p-0 rounded-xl">
        <div className="glass-card border-primary/10">
          <DialogHeader className="p-4 pb-3 border-b border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <DialogTitle className="text-primary font-mono flex items-center gap-2 text-lg tracking-wider">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <Search className="w-4 h-4" />
              {t('groups.groupMatrixScanner')}
            </DialogTitle>
            <DialogDescription className="text-xs text-primary/60 font-mono mt-1">
              {t('groups.discoverGroups')}
            </DialogDescription>
          </DialogHeader>
        
          <div className="p-4 space-y-6 max-h-[calc(85vh-120px)] overflow-y-auto">
            {/* Matrix Search Interface */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                <span className="text-sm font-mono text-primary/80 uppercase tracking-wider">{t('groups.groupDiscovery')}</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary/60" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t('groups.searchPlaceholder')}
                  className="cyber-input pl-10 bg-black/40 border-primary/20 hover:border-primary/30 focus:border-primary/50 text-primary placeholder:text-primary/40 font-mono transition-all duration-150"
                />
              </div>
              <p className="text-xs font-mono text-primary/50 flex items-center gap-1">
                <div className="w-1 h-1 bg-primary/50 rounded-full"></div>
                {t('groups.minCharsRequired')}
              </p>
            </div>

            {/* Matrix Scan Results */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                <span className="text-sm font-mono text-primary/80 uppercase tracking-wider">{t('groups.scanResults')}</span>
              </div>
              
              {isLoading && searchQuery.length >= 2 && (
                <div className="flex flex-col items-center justify-center py-8 space-y-2">
                  <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <div className="text-primary/60 text-xs font-mono">{t('groups.scanningGroups')}</div>
                </div>
              )}
              
              {!isLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <Search className="w-8 h-8 text-primary/30" />
                  <div className="text-center">
                    <div className="text-primary/60 text-xs font-mono mb-1">{t('groups.noGroupsDetected')}</div>
                    <div className="text-primary/40 text-[10px] font-mono">{t('groups.noMatchesFound', { query: searchQuery })}</div>
                  </div>
                </div>
              )}
              
              {searchResults.length > 0 && (
                <div className="border border-primary/20 rounded-lg bg-black/40 backdrop-blur-sm">
                  <ScrollArea className="h-64 p-3">
                    <div className="space-y-3">
                      {searchResults.map((group: Group) => (
                        <div
                          key={group.id}
                          className="glass-card border-primary/20 hover:border-primary/40 bg-black/40 hover:bg-black/60 transition-all duration-150 group p-3 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            {/* Matrix Group Avatar */}
                            <div className="relative shrink-0">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                                {group.avatar && group.avatar.length > 1 ? (
                                  <img src={group.avatar} alt="Group" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    {group.avatar && group.avatar.length === 1 ? (
                                      <span className="text-primary font-mono text-lg font-bold">{group.avatar}</span>
                                    ) : (
                                      <Users className="w-5 h-5 text-primary" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Group Matrix Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-mono font-semibold text-sm text-primary group-hover:text-primary/80 transition-colors leading-tight truncate">
                                  › {group.name}
                                </h3>
                                {group.username && (
                                  <span className="text-[10px] text-primary/60 font-mono bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                                    @{group.username}
                                  </span>
                                )}
                              </div>
                              {group.description && (
                                <p className="text-xs text-primary/60 font-mono truncate mb-1">
                                  {group.description}
                                </p>
                              )}
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-[10px] h-4 px-2 font-mono bg-primary/10 border-primary/30 text-primary">
                                  {t('groups.groupMatrix')}
                                </Badge>
                                <div className="text-[9px] text-primary/40 font-mono">
                                  {new Date(group.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            
                            {/* Join Matrix Button */}
                            <Button
                              size="sm"
                              onClick={() => handleJoinGroup(group.id)}
                              disabled={joinGroupMutation.isPending}
                              className="cyber-button bg-primary/20 hover:bg-primary/30 border-primary/50 hover:border-primary text-primary h-8 px-3 text-xs font-mono transition-all duration-150 shrink-0"
                            >
                              {joinGroupMutation.isPending ? (
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                  {t('groups.joining')}
                                </div>
                              ) : (
                                <>
                                  <UserPlus className="w-3 h-3 mr-1" />
                                  {t('groups.join')}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>

            {/* Matrix Instructions */}
            <div className="text-center space-y-3 pt-2 border-t border-primary/20">
              <div className="flex items-center justify-center space-x-2 text-xs text-primary/60 font-mono">
                <Hash className="w-3 h-3" />
                <span>{t('groups.searchProtocol')}</span>
              </div>
              <p className="text-[10px] text-primary/40 font-mono">
                {t('groups.joinPublicGroups')}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}