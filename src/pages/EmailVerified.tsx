import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const EmailVerified = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // Handle email verification from URL params
    const handleVerification = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const userId = searchParams.get('userId');
      
      if (userId) {
        try {
          // Call the confirm-email edge function
          const { error } = await supabase.functions.invoke('confirm-email', {
            body: { userId }
          });
          
          if (error) {
            console.error("Error confirming email:", error);
            throw error;
          }
          
          console.log("Email verified successfully");
        } catch (error) {
          console.error("Failed to verify email:", error);
        }
      }
      
      setIsProcessing(false);
    };

    handleVerification();
  }, []);

  useEffect(() => {
    if (isProcessing) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, isProcessing]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="flex justify-center">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
          </div>
          <p className="text-muted-foreground">
            Vérification de votre email en cours...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <div className="relative bg-primary/10 p-6 rounded-full">
              <CheckCircle className="h-16 w-16 text-primary" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Email vérifié avec succès !
          </h1>
          <p className="text-muted-foreground">
            Votre adresse email a été confirmée. Vous pouvez maintenant profiter de toutes les fonctionnalités de DJASSA Market.
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Redirection automatique dans {countdown} secondes...</span>
          </div>

          <Button 
            onClick={() => navigate("/")} 
            className="w-full"
          >
            Accéder à l'application maintenant
          </Button>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Merci de faire partie de la communauté DJASSA Market
          </p>
        </div>
      </Card>
    </div>
  );
};

export default EmailVerified;
