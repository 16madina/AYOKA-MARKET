import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ConversationFilters } from "./ConversationFilters";

interface ConversationListProps {
  userId: string;
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId?: string;
}

export const ConversationList = ({
  userId,
  onSelectConversation,
  selectedConversationId,
}: ConversationListProps) => {
  const [filter, setFilter] = useState<'all' | 'buying' | 'selling'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      // Get all related data separately
      const conversationIds = data.map((c: any) => c.id);
      const profileIds = [...new Set([
        ...data.map((c: any) => c.buyer_id),
        ...data.map((c: any) => c.seller_id),
      ])];
      const listingIds = data.map((c: any) => c.listing_id);

      const [
        { data: profiles },
        { data: listings },
        { data: messages },
      ] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url, is_online, last_seen").in("id", profileIds),
        supabase.from("listings").select("id, title, images, price").in("id", listingIds),
        supabase
          .from("messages")
          .select("conversation_id, content, is_read, created_at, receiver_id")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: true }),
      ]);

      // Map data together
      return data.map((conv: any) => {
        const convMessages = messages?.filter((m: any) => m.conversation_id === conv.id) || [];
        const lastMessage = convMessages[convMessages.length - 1];
        const unreadCount = convMessages.filter(
          (m: any) => m.receiver_id === userId && !m.is_read
        ).length;

        return {
          ...conv,
          buyer: profiles?.find((p: any) => p.id === conv.buyer_id),
          seller: profiles?.find((p: any) => p.id === conv.seller_id),
          listing: listings?.find((l: any) => l.id === conv.listing_id),
          lastMessage,
          unreadCount,
        };
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Aucune conversation pour le moment</p>
        <p className="text-sm mt-2">
          Contactez un vendeur depuis la page d'une annonce
        </p>
      </div>
    );
  }

  // Filter conversations
  const filteredConversations = conversations.filter((conv: any) => {
    // Filter by role
    if (filter === 'buying' && conv.buyer_id !== userId) return false;
    if (filter === 'selling' && conv.seller_id !== userId) return false;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const otherUser = conv.buyer_id === userId ? conv.seller : conv.buyer;
      const matchesUser = otherUser?.full_name?.toLowerCase().includes(query);
      const matchesListing = conv.listing?.title?.toLowerCase().includes(query);
      const matchesMessage = conv.lastMessage?.content?.toLowerCase().includes(query);
      
      if (!matchesUser && !matchesListing && !matchesMessage) return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-2">
      <ConversationFilters filter={filter} onFilterChange={setFilter} />
      
      {/* Search bar */}
      <div className="px-4 pb-2">
        <Input
          placeholder="Rechercher dans les conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>
      {filteredConversations.map((conv: any) => {
        const otherUser = conv.buyer_id === userId ? conv.seller : conv.buyer;
        const initials = otherUser?.full_name
          ?.split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase() || "?";
        const hasUnread = conv.unreadCount > 0;

        return (
          <Card
            key={conv.id}
            className={`p-3 cursor-pointer transition-colors hover:bg-accent ${
              selectedConversationId === conv.id ? "bg-accent" : ""
            } ${hasUnread ? "border-l-4 border-l-primary" : ""}`}
            onClick={() => onSelectConversation(conv.id)}
          >
            <div className="flex items-start gap-3">
              <div className="relative shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={otherUser?.avatar_url || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {otherUser?.is_online && (
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-background" />
                )}
                {hasUnread && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`truncate ${hasUnread ? 'font-bold' : 'font-semibold'}`}>
                        {otherUser?.full_name || "Utilisateur"}
                      </p>
                      {hasUnread && (
                        <Badge variant="default" className="h-5 min-w-[20px] px-1.5 text-xs shrink-0">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.listing?.title}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(conv.last_message_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>
                </div>
                {conv.lastMessage && (
                  <p className={`text-sm truncate mt-1 ${hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {conv.lastMessage.content}
                  </p>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
