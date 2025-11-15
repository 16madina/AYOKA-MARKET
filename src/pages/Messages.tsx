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

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    searchParams.get("conversation")
  );

  const { data: user } = useQuery({
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

  useEffect(() => {
    const convId = searchParams.get("conversation");
    if (convId) {
      setSelectedConversationId(convId);
    }
  }, [searchParams]);

  if (!user) return null;

  return (
    <div className="min-h-screen pb-24 bg-muted/30">
      <div className="max-w-screen-xl mx-auto p-4 md:p-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <h1 className="text-3xl font-bold mb-6">Messages</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation list */}
          <Card className="p-4 lg:col-span-1">
            <ConversationList
              userId={user.id}
              onSelectConversation={setSelectedConversationId}
              selectedConversationId={selectedConversationId || undefined}
            />
          </Card>

          {/* Chat window */}
          <Card className="lg:col-span-2 overflow-hidden">
            {selectedConversationId ? (
              <ChatWindow
                conversationId={selectedConversationId}
                userId={user.id}
              />
            ) : (
              <div className="h-[600px] flex items-center justify-center text-muted-foreground">
                <p>Sélectionnez une conversation pour commencer</p>
              </div>
            )}
          </Card>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Messages;
