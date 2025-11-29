import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";

interface PriceOfferHistoryProps {
  conversationId: string;
}

export const PriceOfferHistory = ({ conversationId }: PriceOfferHistoryProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const { data: offers = [] } = useQuery({
    queryKey: ["price-offers-history", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_offers")
        .select(`
          *,
          sender:sender_id(full_name),
          receiver:receiver_id(full_name)
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  if (offers.length === 0) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "accepted":
        return "Acceptée";
      case "rejected":
        return "Refusée";
      default:
        return "En attente";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      default:
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <Card className="p-2 bg-muted/30 border-muted">
        <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">📋 Historique ({offers.length})</span>
          </div>
          <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2 space-y-1.5">
          {offers.map((offer: any) => (
            <div
              key={offer.id}
              className="flex items-center justify-between p-1.5 rounded bg-background/50 border border-border/50"
            >
              <div className="flex items-center gap-1.5">
                {getStatusIcon(offer.status)}
                <div>
                  <p className="text-xs font-semibold">
                    {offer.amount.toLocaleString()} FCFA
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {offer.sender?.full_name || "Utilisateur"}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <Badge variant="outline" className={`text-[10px] h-4 px-1 ${getStatusColor(offer.status)}`}>
                  {getStatusText(offer.status)}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(offer.created_at), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
              </div>
            </div>
          ))}
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
