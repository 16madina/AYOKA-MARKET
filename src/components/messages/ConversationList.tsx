import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

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
        supabase.from("profiles").select("id, full_name, avatar_url").in("id", profileIds),
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

  return (
    <div className="space-y-2">
      {conversations.map((conv: any) => {
        const otherUser = conv.buyer_id === userId ? conv.seller : conv.buyer;
        const initials = otherUser?.full_name
          ?.split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase() || "?";

        return (
          <Card
            key={conv.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedConversationId === conv.id ? "bg-muted" : ""
            }`}
            onClick={() => onSelectConversation(conv.id)}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={otherUser?.avatar_url || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {otherUser?.full_name || "Utilisateur"}
                    </p>
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
                    {conv.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
                {conv.lastMessage && (
                  <p className="text-sm text-muted-foreground truncate mt-1">
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
