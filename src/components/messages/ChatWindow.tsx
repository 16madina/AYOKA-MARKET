import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, MapPin, MoreVertical, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { QuickReplies } from "./QuickReplies";
import { MediaUpload } from "./MediaUpload";
import { LocationPicker } from "./LocationPicker";
import { PriceOfferDialog } from "./PriceOfferDialog";
import { PriceOfferCard } from "./PriceOfferCard";
import { PriceOfferHistory } from "./PriceOfferHistory";
import { MessageReactions } from "./MessageReactions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { usePresence } from "@/hooks/usePresence";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TransactionCompleteDialog } from "@/components/transactions/TransactionCompleteDialog";

interface ChatWindowProps {
  conversationId: string;
  userId: string;
}

export const ChatWindow = ({ conversationId, userId }: ChatWindowProps) => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Enable presence tracking
  usePresence(userId);

  // Check if current user has verified email
  const { data: currentUserProfile } = useQuery({
    queryKey: ["currentUserProfile", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("email_verified")
        .eq("id", userId)
        .single();
      return data;
    },
  });

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
      // Check if email is verified
      if (!currentUserProfile?.email_verified) {
        throw new Error("Email not verified");
      }

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
    onError: (error: Error) => {
      if (error.message === "Email not verified") {
        toast({
          title: "Email non vérifié",
          description: "Vous devez vérifier votre email avant d'envoyer des messages.",
          variant: "destructive",
        });
        // Show a button to go to profile
        setTimeout(() => {
          toast({
            title: "Vérifiez votre email",
            description: "Consultez votre profil pour renvoyer l'email de vérification.",
            action: (
              <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
                Voir mon profil
              </Button>
            ),
          });
        }, 500);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'envoyer le message",
          variant: "destructive",
        });
      }
    },
  });

  const sendImageMessage = useMutation({
    mutationFn: async (mediaUrl: string) => {
      // Check if email is verified
      if (!currentUserProfile?.email_verified) {
        throw new Error("Email not verified");
      }

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
    onError: (error: Error) => {
      if (error.message === "Email not verified") {
        toast({
          title: "Email non vérifié",
          description: "Vous devez vérifier votre email avant d'envoyer des messages.",
          variant: "destructive",
        });
        setTimeout(() => {
          toast({
            title: "Vérifiez votre email",
            description: "Consultez votre profil pour renvoyer l'email de vérification.",
            action: (
              <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
                Voir mon profil
              </Button>
            ),
          });
        }, 500);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'envoyer l'image",
          variant: "destructive",
        });
      }
    },
  });

  const sendLocationMessage = useMutation({
    mutationFn: async (location: { lat: number; lng: number; name: string }) => {
      // Check if email is verified
      if (!currentUserProfile?.email_verified) {
        throw new Error("Email not verified");
      }

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
    onError: (error: Error) => {
      if (error.message === "Email not verified") {
        toast({
          title: "Email non vérifié",
          description: "Vous devez vérifier votre email avant d'envoyer des messages.",
          variant: "destructive",
        });
        setTimeout(() => {
          toast({
            title: "Vérifiez votre email",
            description: "Consultez votre profil pour renvoyer l'email de vérification.",
            action: (
              <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
                Voir mon profil
              </Button>
            ),
          });
        }, 500);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'envoyer la localisation",
          variant: "destructive",
        });
      }
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

  const deleteConversation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Conversation supprimée",
        description: "La conversation a été supprimée avec succès",
      });
      navigate("/messages");
    },
  });

  const toggleMute = useMutation({
    mutationFn: async () => {
      const mutedBy = conversation?.muted_by || [];
      const newMutedBy = isMuted
        ? mutedBy.filter((id: string) => id !== userId)
        : [...mutedBy, userId];

      const { error } = await supabase
        .from("conversations")
        .update({ muted_by: newMutedBy })
        .eq("id", conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      setIsMuted(!isMuted);
      toast({
        title: isMuted ? "Notifications activées" : "Notifications coupées",
        description: isMuted 
          ? "Vous recevrez à nouveau les notifications" 
          : "Vous ne recevrez plus de notifications pour cette conversation",
      });
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
              <DropdownMenuItem onClick={() => setShowTransactionDialog(true)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Transaction complétée
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toggleMute.mutate()}>
                {isMuted ? "🔔 Activer" : "🔇 Couper"} les notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                ⚠️ Signaler cette conversation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowBlockDialog(true)}>
                🚫 Bloquer l'utilisateur
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                🗑️ Supprimer la conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Listing Info - Compact */}
        <div 
          className="mt-2 p-2 bg-muted/20 rounded flex items-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => navigate(`/listing/${conversation.listing_id}`)}
        >
          {conversation.listing?.images?.[0] && (
            <img 
              src={conversation.listing.images[0]} 
              alt={conversation.listing.title}
              className="w-10 h-10 object-cover rounded"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate leading-tight">{conversation.listing?.title}</p>
            <p className="text-xs text-primary font-semibold">
              {conversation.listing?.price === 0 ? 'Gratuit' : `${conversation.listing?.price.toLocaleString()} FCFA`}
            </p>
          </div>
        </div>
        
        {/* Price Offer History */}
        <div className="mt-2">
          <PriceOfferHistory conversationId={conversationId} />
        </div>
      </Card>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 pb-32 space-y-6">
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
                  className={`flex gap-3 ${isMine ? "flex-row-reverse" : ""} group`}
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
                          className="rounded-lg max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedImage(msg.media_url)}
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
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-medium">📍 Position partagée</p>
                              <p className="text-xs opacity-90 break-words">
                                {msg.location_name || `${msg.location_lat?.toFixed(4)}, ${msg.location_lng?.toFixed(4)}`}
                              </p>
                              {msg.location_lat && msg.location_lng && (
                                <a
                                  href={`https://www.google.com/maps?q=${msg.location_lat},${msg.location_lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs underline opacity-80 hover:opacity-100"
                                >
                                  Voir sur la carte
                                </a>
                              )}
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
                      <div className="space-y-1">
                        <div
                          className={`rounded-lg p-3 ${
                            isMine
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(msg.created_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                            {msg.is_read && isMine && " · Lu"}
                          </span>
                        </div>
                        <MessageReactions messageId={msg.id} userId={userId} />
                      </div>
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

      {/* Quick Replies - Only show for first message */}
      {messages && messages.length === 0 && (
        <QuickReplies userId={userId} onSelect={(msg) => setMessage(msg)} />
      )}

      {/* Input - Fixed at bottom */}
      <div className="bg-background border-t shrink-0">
        <Card className="border-0 shadow-lg rounded-none">
          <form onSubmit={handleSend} className="p-3">
            <div className="flex items-center gap-2">
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
              <Input
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Tapez votre message..."
                className="flex-1"
                disabled={isBlocked}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e as any);
                  }
                }}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!message.trim() || isBlocked} 
                className="h-10 w-10 rounded-full shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      </div>

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

      {/* Delete Conversation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette conversation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Tous les messages seront supprimés définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConversation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Conversation Dialog */}
      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Signaler cette conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de signaler cette conversation. Notre équipe examinera le contenu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              toast({
                title: "Conversation signalée",
                description: "Merci pour votre signalement. Notre équipe va examiner cette conversation.",
              });
              setShowReportDialog(false);
            }}>
              Signaler
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Viewer Dialog */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-white/80 transition-colors z-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <img 
            src={selectedImage} 
            alt="Vue agrandie"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Transaction Complete Dialog */}
      <TransactionCompleteDialog
        open={showTransactionDialog}
        onOpenChange={setShowTransactionDialog}
        listingId={conversation?.listing_id || ""}
        sellerId={conversation?.seller_id || ""}
        buyerId={conversation?.buyer_id || ""}
        price={conversation?.listing?.price || 0}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
          toast({
            title: "Transaction complétée",
            description: "Vous pouvez maintenant laisser un avis",
          });
        }}
      />
    </div>
  );
};
