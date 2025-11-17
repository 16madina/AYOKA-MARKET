import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ConversationList } from "@/components/messages/ConversationList";
import { ChatWindow } from "@/components/messages/ChatWindow";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    searchParams.get("conversation")
  );

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        throw new Error("Non authentifié");
      }
      return user;
    },
  });

  const { markConversationAsRead } = useUnreadMessages(user?.id);

  useEffect(() => {
    const convId = searchParams.get("conversation");
    if (convId) {
      setSelectedConversationId(convId);
    }
  }, [searchParams]);

  // Marquer les messages comme lus quand on sélectionne une conversation
  useEffect(() => {
    if (selectedConversationId && user?.id) {
      markConversationAsRead(selectedConversationId);
    }
    // markConversationAsRead est mémorisé avec useCallback, sûr de ne pas l'inclure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId, user?.id]);

  if (isLoadingUser) {
    return (
      <div className="min-h-screen pb-16 md:pb-0 bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen pb-16 md:pb-0 bg-muted/30">
      <div className="max-w-screen-xl mx-auto h-screen flex flex-col">
        {/* Header - Hidden on mobile when chat is open */}
        <div className={`${selectedConversationId ? 'hidden md:block' : 'block'} bg-card border-b border-border p-4`}>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="md:inline-flex"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Messages</h1>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conversation list - Full width on mobile, sidebar on desktop */}
          <div className={`${
            selectedConversationId ? 'hidden md:flex' : 'flex'
          } w-full md:w-96 flex-shrink-0 border-r border-border bg-card overflow-hidden`}>
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                userId={user.id}
                onSelectConversation={setSelectedConversationId}
                selectedConversationId={selectedConversationId || undefined}
              />
            </div>
          </div>

          {/* Chat window - Full width on mobile when selected, beside list on desktop */}
          <div className={`${
            selectedConversationId ? 'flex' : 'hidden md:flex'
          } flex-1 bg-card overflow-hidden`}>
            {selectedConversationId ? (
              <div className="flex-1 flex flex-col">
                {/* Mobile back button */}
                <div className="md:hidden flex items-center gap-2 p-3 border-b border-border bg-card">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedConversationId(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </div>
                <ChatWindow
                  conversationId={selectedConversationId}
                  userId={user.id}
                />
              </div>
            ) : (
              <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
                <p>Sélectionnez une conversation pour commencer</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Messages;
