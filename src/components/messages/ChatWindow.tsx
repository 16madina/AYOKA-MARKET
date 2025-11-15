import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ChatWindowProps {
  conversationId: string;
  userId: string;
}

export const ChatWindow = ({ conversationId, userId }: ChatWindowProps) => {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversation } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          listing:listing_id (title, images, price)
        `)
        .eq("id", conversationId)
        .single();

      if (error) throw error;

      // Get buyer and seller profiles separately
      const { data: buyerProfile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", data.buyer_id)
        .single();

      const { data: sellerProfile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", data.seller_id)
        .single();

      return {
        ...data,
        buyer: buyerProfile,
        seller: sellerProfile,
      };
    },
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Get sender profiles
      const senderIds = [...new Set(data.map((m: any) => m.sender_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", senderIds);

      const messagesWithSender = data.map((m: any) => ({
        ...m,
        sender: profiles?.find((p) => p.id === m.sender_id),
      }));

      // Mark messages as read
      const unreadIds = data
        .filter((m: any) => m.receiver_id === userId && !m.is_read)
        .map((m: any) => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .in("id", unreadIds);
      }

      return messagesWithSender;
    },
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const receiverId = conversation?.buyer_id === userId
        ? conversation?.seller_id
        : conversation?.buyer_id;

      const { error } = await supabase.from("messages").insert({
        sender_id: userId,
        receiver_id: receiverId,
        listing_id: conversation?.listing_id,
        content,
        conversation_id: conversationId,
      } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
      setMessage("");
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessage.mutate(message);
  };

  const otherUser = conversation?.buyer_id === userId
    ? conversation?.seller
    : conversation?.buyer;

  if (!conversation) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <Card className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={otherUser?.avatar_url || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {otherUser?.full_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{otherUser?.full_name || "Utilisateur"}</p>
            <p className="text-sm text-muted-foreground">{conversation.listing?.title}</p>
          </div>
        </div>
      </Card>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center text-muted-foreground">Chargement...</div>
        ) : (
          <>
            {messages?.map((msg: any) => {
              const isMine = msg.sender_id === userId;
              const initials = msg.sender?.full_name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase() || "?";

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isMine ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.sender?.avatar_url || ""} />
                    <AvatarFallback className="bg-muted text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col ${isMine ? "items-end" : ""}`}>
                    <div
                      className={`rounded-lg p-3 max-w-md ${
                        isMine
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(msg.created_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <Card className="p-4 border-t">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Votre message..."
            disabled={sendMessage.isPending}
          />
          <Button type="submit" disabled={sendMessage.isPending || !message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
};
