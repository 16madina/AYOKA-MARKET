import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, MapPin, MoreVertical, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { QuickReplies } from "./QuickReplies";
import { MediaUpload } from "./MediaUpload";
import { LocationPicker } from "./LocationPicker";
import { PriceOfferDialog } from "./PriceOfferDialog";
import { PriceOfferCard } from "./PriceOfferCard";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePresence } from "@/hooks/usePresence";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ChatWindowProps {
  conversationId: string;
  userId: string;
}

export const ChatWindow = ({ conversationId, userId }: ChatWindowProps) => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Enable presence tracking
  usePresence(userId);

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

      // Get buyer and seller profiles with presence
      const { data: buyerProfile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, is_online, last_seen, typing_in_conversation")
        .eq("id", data.buyer_id)
        .single();

      const { data: sellerProfile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, is_online, last_seen, typing_in_conversation")
        .eq("id", data.seller_id)
        .single();

      return {
        ...data,
        buyer: buyerProfile,
        seller: sellerProfile,
      };
    },
  });

  // Check if other user is blocked
  const { data: isBlocked } = useQuery({
    queryKey: ["blocked", userId, conversation?.buyer_id, conversation?.seller_id],
    queryFn: async () => {
      if (!conversation) return false;
      const otherId = conversation.buyer_id === userId ? conversation.seller_id : conversation.buyer_id;
      
      const { data } = await supabase
        .from("blocked_users")
        .select("id")
        .or(`and(blocker_id.eq.${userId},blocked_id.eq.${otherId}),and(blocker_id.eq.${otherId},blocked_id.eq.${userId})`)
        .maybeSingle();

      return !!data;
    },
    enabled: !!conversation,
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

  const sendTextMessage = useMutation({
    mutationFn: async ({ content, type = 'text' }: { content: string; type?: string }) => {
      const receiverId = conversation?.buyer_id === userId
        ? conversation?.seller_id
        : conversation?.buyer_id;

      const { error } = await supabase.from("messages").insert({
        sender_id: userId,
        receiver_id: receiverId,
        listing_id: conversation?.listing_id,
        content,
        conversation_id: conversationId,
        message_type: type,
      } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
      setMessage("");
      stopTyping();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    },
  });

  const sendImageMessage = useMutation({
    mutationFn: async (mediaUrl: string) => {
      const receiverId = conversation?.buyer_id === userId
        ? conversation?.seller_id
        : conversation?.buyer_id;

      const { error } = await supabase.from("messages").insert({
        sender_id: userId,
        receiver_id: receiverId,
        listing_id: conversation?.listing_id,
        content: "📷 Photo",
        conversation_id: conversationId,
        message_type: 'image',
        media_url: mediaUrl,
      } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
    },
  });

  const sendLocationMessage = useMutation({
    mutationFn: async (location: { lat: number; lng: number; name: string }) => {
      const receiverId = conversation?.buyer_id === userId
        ? conversation?.seller_id
        : conversation?.buyer_id;

      const { error } = await supabase.from("messages").insert({
        sender_id: userId,
        receiver_id: receiverId,
        listing_id: conversation?.listing_id,
        content: `📍 ${location.name}`,
        conversation_id: conversationId,
        message_type: 'location',
        location_lat: location.lat,
        location_lng: location.lng,
        location_name: location.name,
      } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
    },
  });

  const blockUser = useMutation({
    mutationFn: async () => {
      const otherId = conversation?.buyer_id === userId 
        ? conversation?.seller_id 
        : conversation?.buyer_id;

      const { error } = await supabase
        .from("blocked_users")
        .insert({
          blocker_id: userId,
          blocked_id: otherId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked"] });
      toast({
        title: "Utilisateur bloqué",
        description: "Vous ne recevrez plus de messages de cet utilisateur",
      });
      setShowBlockDialog(false);
    },
  });

  // Handle typing indicator
  const handleTyping = async () => {
    if (!isTyping) {
      setIsTyping(true);
      await supabase
        .from("profiles")
        .update({ typing_in_conversation: conversationId })
        .eq("id", userId);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(stopTyping, 2000);
  };

  const stopTyping = async () => {
    setIsTyping(false);
    await supabase
      .from("profiles")
      .update({ typing_in_conversation: null })
      .eq("id", userId);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription for messages
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

  // Realtime subscription for presence and typing
  useEffect(() => {
    if (!conversation) return;

    const otherId = conversation.buyer_id === userId ? conversation.seller_id : conversation.buyer_id;
    
    const channel = supabase
      .channel(`presence:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${otherId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          setOtherUserTyping(newData.typing_in_conversation === conversationId);
          queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, conversation, userId, queryClient]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendTextMessage.mutate({ content: message });
  };

  const otherUser = conversation?.buyer_id === userId
    ? conversation?.seller
    : conversation?.buyer;

  if (!conversation) return null;

  if (isBlocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Conversation bloquée</h3>
        <p className="text-muted-foreground">
          Cette conversation est bloquée. Vous ne pouvez plus échanger de messages.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <Card className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar>
                <AvatarImage src={otherUser?.avatar_url || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {otherUser?.full_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                </AvatarFallback>
              </Avatar>
              {otherUser?.is_online && (
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
              )}
            </div>
            <div>
              <p className="font-semibold">{otherUser?.full_name || "Utilisateur"}</p>
              <p className="text-xs text-muted-foreground">
                {otherUser?.is_online ? (
                  "En ligne"
                ) : otherUser?.last_seen ? (
                  `Vu ${formatDistanceToNow(new Date(otherUser.last_seen), { addSuffix: true, locale: fr })}`
                ) : (
                  "Hors ligne"
                )}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowBlockDialog(true)}>
                Bloquer l'utilisateur
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Listing Info */}
        <div className="mt-3 p-2 bg-muted/30 rounded-lg flex items-center gap-2">
          {conversation.listing?.images?.[0] && (
            <img 
              src={conversation.listing.images[0]} 
              alt={conversation.listing.title}
              className="w-12 h-12 object-cover rounded"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{conversation.listing?.title}</p>
            <p className="text-sm text-primary font-semibold">
              {conversation.listing?.price === 0 ? 'Gratuit' : `${conversation.listing?.price.toLocaleString()} FCFA`}
            </p>
          </div>
        </div>
      </Card>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                  <div className={`flex flex-col ${isMine ? "items-end" : ""} max-w-md`}>
                    {msg.message_type === 'price_offer' ? (
                      <PriceOfferCard 
                        messageId={msg.id} 
                        userId={userId}
                        conversationId={conversationId}
                        listingId={conversation?.listing_id || msg.listing_id}
                      />
                    ) : msg.message_type === 'image' ? (
                      <div className="space-y-1">
                        <img 
                          src={msg.media_url} 
                          alt="Shared media"
                          className="rounded-lg max-h-64 object-cover"
                        />
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      </div>
                    ) : msg.message_type === 'location' ? (
                      <div className="space-y-1">
                        <div className={`rounded-lg p-3 ${isMine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <div>
                              <p className="text-sm font-medium">Position partagée</p>
                              <p className="text-xs opacity-80">{msg.location_name}</p>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div
                          className={`rounded-lg p-3 ${
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
                          {msg.is_read && isMine && " · Lu"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {otherUserTyping && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={otherUser?.avatar_url || ""} />
                </Avatar>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm text-muted-foreground italic">En train d'écrire...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Quick Replies */}
      <QuickReplies userId={userId} onSelect={(msg) => setMessage(msg)} />

      {/* Input */}
      <Card className="p-6 border-t">
        <form onSubmit={handleSend} className="space-y-3">
          <div className="flex gap-2">
            <MediaUpload onUpload={(url) => sendImageMessage.mutate(url)} userId={userId} />
            <LocationPicker onSelectLocation={(loc) => sendLocationMessage.mutate(loc)} />
            {conversation?.listing?.price !== undefined && conversation.listing.price > 0 && (
              <PriceOfferDialog
                conversationId={conversationId}
                listingId={conversation.listing_id}
                listingPrice={conversation.listing.price}
                senderId={userId}
                receiverId={conversation.buyer_id === userId ? conversation.seller_id : conversation.buyer_id}
              />
            )}
          </div>
          <div className="flex gap-3">
            <Textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Écrire un message..."
              className="flex-1 min-h-[100px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e as any);
                }
              }}
            />
            <Button type="submit" size="icon" disabled={!message.trim()} className="h-10 w-10">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </Card>

      {/* Block User Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous ne recevrez plus de messages de cet utilisateur et ne pourrez plus lui en envoyer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => blockUser.mutate()}>
              Bloquer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
