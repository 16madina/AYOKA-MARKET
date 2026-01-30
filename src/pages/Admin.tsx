import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, FileText, ShieldAlert, Mail, MessageSquare, Ban, CheckCircle, XCircle, Eye, Phone, Search, Filter, Bell, ImageOff, Trash2 } from "lucide-react";
import { User } from "@supabase/supabase-js";
import BottomNav from "@/components/BottomNav";
import { InactiveListingsReminder } from "@/components/admin/InactiveListingsReminder";
import AdBannerManagement from "@/components/admin/AdBannerManagement";
import { ImageModerationDashboard } from "@/components/admin/ImageModerationDashboard";

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [messageContent, setMessageContent] = useState("");
  const [banReason, setBanReason] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("custom");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkEmailDialog, setShowBulkEmailDialog] = useState(false);

  // Email templates
  const emailTemplates = {
    custom: {
      subject: "",
      message: ""
    },
    welcome: {
      subject: "Bienvenue sur AYOKA MARKET !",
      message: "Bonjour,\n\nNous sommes ravis de vous accueillir sur AYOKA MARKET, votre marketplace pour l'économie circulaire.\n\nN'hésitez pas à explorer nos fonctionnalités et à publier vos premières annonces.\n\nSi vous avez des questions, notre équipe est là pour vous aider.\n\nCordialement,\nL'équipe AYOKA MARKET"
    },
    verification_reminder: {
      subject: "Vérifiez votre compte AYOKA MARKET",
      message: "Bonjour,\n\nNous avons remarqué que votre compte n'est pas encore vérifié.\n\nLa vérification de votre compte vous permet de:\n- Publier des annonces\n- Contacter les vendeurs\n- Bénéficier de la confiance des autres utilisateurs\n\nMerci de vérifier votre adresse email dès que possible.\n\nCordialement,\nL'équipe AYOKA MARKET"
    },
    listing_approved: {
      subject: "Votre annonce a été approuvée",
      message: "Bonjour,\n\nBonne nouvelle ! Votre annonce a été approuvée par notre équipe de modération.\n\nElle est maintenant visible par tous les utilisateurs de AYOKA MARKET.\n\nNous vous souhaitons une excellente vente !\n\nCordialement,\nL'équipe AYOKA MARKET"
    },
    listing_rejected: {
      subject: "Votre annonce nécessite des modifications",
      message: "Bonjour,\n\nVotre annonce a été examinée par notre équipe de modération.\n\nMalheureusement, elle ne respecte pas certaines de nos conditions d'utilisation.\n\nMerci de la modifier et de la republier.\n\nN'hésitez pas à nous contacter si vous avez des questions.\n\nCordialement,\nL'équipe AYOKA MARKET"
    },
    promotion: {
      subject: "Profitez de nos nouveautés !",
      message: "Bonjour,\n\nNous avons de grandes nouvelles à partager avec vous !\n\nDécouvrez les dernières fonctionnalités de AYOKA MARKET et profitez d'une expérience encore meilleure.\n\nConnectez-vous dès maintenant pour en savoir plus.\n\nCordialement,\nL'équipe AYOKA MARKET"
    },
    inactive_user: {
      subject: "Vous nous manquez sur AYOKA MARKET",
      message: "Bonjour,\n\nCela fait un moment que nous ne vous avons pas vu sur AYOKA MARKET.\n\nDe nouvelles annonces sont publiées chaque jour, et votre communauté vous attend !\n\nRevenez découvrir les dernières offres et republier vos annonces.\n\nÀ très bientôt,\nL'équipe AYOKA MARKET"
    },
    warning: {
      subject: "Avertissement concernant votre compte",
      message: "Bonjour,\n\nNous avons détecté un comportement non conforme à nos conditions d'utilisation sur votre compte.\n\nMerci de prendre connaissance de nos règles et de les respecter.\n\nEn cas de récidive, votre compte pourrait être suspendu.\n\nCordialement,\nL'équipe AYOKA MARKET"
    }
  };
  
  // Filter states
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState<string>("all");
  const [listingSearch, setListingSearch] = useState("");
  const [listingStatusFilter, setListingStatusFilter] = useState<string>("all");
  const [listingCategoryFilter, setListingCategoryFilter] = useState<string>("all");
  const [reportSearch, setReportSearch] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState<string>("all");
  const [reportReasonFilter, setReportReasonFilter] = useState<string>("all");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      // Check if user is admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      if (!roles) {
        toast.error("Accès refusé");
        navigate("/profile");
        return;
      }
      setIsAdmin(true);
    };

    checkAuth();
  }, [navigate]);

  // Fetch all users
  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (profilesError) throw profilesError;

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        return profilesData;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-emails`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          console.error('Failed to fetch emails');
          return profilesData;
        }

        const { emails } = await response.json();
        const emailMap = new Map<string, string>();
        emails?.forEach((item: any) => {
          if (item.email) {
            emailMap.set(item.id, item.email);
          }
        });

        return profilesData?.map(profile => ({
          ...profile,
          email: emailMap.get(profile.id) || null
        })) || [];
      } catch (error) {
        console.error('Error fetching emails:', error);
        return profilesData;
      }
    },
    enabled: isAdmin,
  });

  // Fetch all listings
  const { data: listings, refetch: refetchListings } = useQuery({
    queryKey: ["admin-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          categories(name),
          profiles(full_name, phone)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch all categories
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch all reports
  const { data: reports, refetch: refetchReports } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select(`
          *,
          listings(id, title, images, price)
        `)
        .order("created_at", { ascending: false});
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const reporterIds = data.map(r => r.reporter_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .in("id", reporterIds);
        
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        
        return data.map(report => ({
          ...report,
          reporter_profile: profilesMap.get(report.reporter_id)
        })) as any;
      }
      
      return data as any;
    },
    enabled: isAdmin,
  });

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter(user => {
      const matchesSearch = userSearch === "" || 
        user.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.phone?.includes(userSearch) ||
        (user as any).email?.toLowerCase().includes(userSearch.toLowerCase());
      
      const matchesStatus = userStatusFilter === "all" ||
        (userStatusFilter === "banned" && user.is_banned) ||
        (userStatusFilter === "active" && !user.is_banned) ||
        (userStatusFilter === "verified" && user.email_verified);
      
      return matchesSearch && matchesStatus;
    });
  }, [users, userSearch, userStatusFilter]);

  // Filtered listings
  const filteredListings = useMemo(() => {
    if (!listings) return [];
    
    return listings.filter(listing => {
      const matchesSearch = listingSearch === "" ||
        listing.title?.toLowerCase().includes(listingSearch.toLowerCase()) ||
        listing.description?.toLowerCase().includes(listingSearch.toLowerCase());
      
      const matchesStatus = listingStatusFilter === "all" ||
        listing.moderation_status === listingStatusFilter;
      
      const matchesCategory = listingCategoryFilter === "all" ||
        listing.category_id === listingCategoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [listings, listingSearch, listingStatusFilter, listingCategoryFilter]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    if (!reports) return [];
    
    return reports.filter(report => {
      const matchesStatus = reportStatusFilter === "all" || report.status === reportStatusFilter;
      const matchesReason = reportReasonFilter === "all" || report.reason === reportReasonFilter;
      
      const searchLower = reportSearch.toLowerCase();
      const matchesSearch = reportSearch === "" || 
        report.listings?.title?.toLowerCase().includes(searchLower) ||
        report.reporter_profile?.full_name?.toLowerCase().includes(searchLower);
      
      return matchesStatus && matchesReason && matchesSearch;
    });
  }, [reports, reportStatusFilter, reportReasonFilter, reportSearch]);

  // Ban user
  const handleBanUser = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({
        is_banned: true,
        banned_at: new Date().toISOString(),
        banned_reason: banReason,
      })
      .eq("id", userId);

    if (error) {
      toast.error("Erreur lors du bannissement");
      return;
    }

    toast.success("Utilisateur banni");
    refetchUsers();
    setBanReason("");
  };

  // Unban user
  const handleUnbanUser = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({
        is_banned: false,
        banned_at: null,
        banned_reason: null,
      })
      .eq("id", userId);

    if (error) {
      toast.error("Erreur lors du débannissement");
      return;
    }

    toast.success("Utilisateur débanni");
    refetchUsers();
  };

  // Approve listing
  const handleApproveListing = async (listingId: string) => {
    const { error } = await supabase
      .from("listings")
      .update({
        moderation_status: "approved",
        moderated_at: new Date().toISOString(),
        moderated_by: user?.id,
      })
      .eq("id", listingId);

    if (error) {
      toast.error("Erreur lors de l'approbation");
      return;
    }

    toast.success("Annonce approuvée");
    refetchListings();
  };

  // Reject listing
  const handleRejectListing = async (listingId: string, notes: string) => {
    const { error } = await supabase
      .from("listings")
      .update({
        moderation_status: "rejected",
        moderated_at: new Date().toISOString(),
        moderated_by: user?.id,
        moderation_notes: notes,
        status: "inactive",
      })
      .eq("id", listingId);

    if (error) {
      toast.error("Erreur lors du rejet");
      return;
    }

    toast.success("Annonce rejetée");
    refetchListings();
  };

  // Delete listing (admin only)
  const handleDeleteListing = async (listingId: string) => {
    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", listingId);

    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }

    toast.success("Annonce supprimée définitivement");
    refetchListings();
  };

  // Send message to user via system notification
  const handleSendMessage = async (userId: string) => {
    if (!messageContent.trim()) {
      toast.error("Veuillez saisir un message");
      return;
    }

    try {
      const { error } = await supabase
        .from('system_notifications')
        .insert({
          user_id: userId,
          title: '📩 Message de l\'équipe AYOKA MARKET',
          message: messageContent,
          notification_type: 'admin_message',
          is_read: false,
          metadata: {
            from: 'Admin AYOKA MARKET',
            sent_at: new Date().toISOString()
          }
        });

      if (error) throw error;

      toast.success("Message envoyé avec succès");
      setMessageContent("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Erreur lors de l'envoi du message");
    }
  };

  // Send single email
  const handleSendEmail = async (email: string, subject: string, message: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error("Session expirée");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-admin-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, subject, message }),
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de l\'email');
      }

      toast.success("Email envoyé avec succès");
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error("Erreur lors de l'envoi de l'email");
    }
  };

  // Send bulk email
  const handleBulkEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast.error("Veuillez remplir le sujet et le message");
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error("Veuillez sélectionner au moins un utilisateur");
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error("Session expirée");
        return;
      }

      const selectedUserData = users?.filter(u => selectedUsers.includes(u.id)) || [];
      const emailPromises = selectedUserData
        .filter(u => (u as any).email)
        .map(u => 
          fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-admin-email`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.session.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                email: (u as any).email, 
                subject: emailSubject, 
                message: emailMessage 
              }),
            }
          )
        );

      await Promise.all(emailPromises);

      toast.success(`Email envoyé à ${selectedUsers.length} utilisateur(s)`);
      setShowBulkEmailDialog(false);
      setEmailSubject("");
      setEmailMessage("");
      setSelectedTemplate("custom");
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      toast.error("Erreur lors de l'envoi des emails");
    }
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Toggle all users selection
  const toggleAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  // Send SMS (placeholder)
  const handleSendSMS = async (phone: string) => {
    toast.info(`SMS à envoyer au: ${phone}`);
  };

  // Resolve report
  const handleResolveReport = async (reportId: string) => {
    const { error } = await supabase
      .from("reports")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id,
      })
      .eq("id", reportId);

    if (error) {
      toast.error("Erreur lors de la résolution");
      return;
    }

    toast.success("Signalement résolu");
    refetchReports();
  };

  // Dismiss report
  const handleDismissReport = async (reportId: string, notes: string) => {
    const { error } = await supabase
      .from("reports")
      .update({
        status: "dismissed",
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id,
        admin_notes: notes,
      })
      .eq("id", reportId);

    if (error) {
      toast.error("Erreur lors du rejet");
      return;
    }

    toast.success("Signalement rejeté");
    refetchReports();
  };

  if (!isAdmin) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Header - Stack on mobile, row on desktop */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <ShieldAlert className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
            <h1 className="text-xl sm:text-3xl font-bold">Admin</h1>
          </div>
          <Button
            onClick={() => navigate('/admin/notifications')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Bell className="h-4 w-4" />
            <span className="sm:inline">Push Notifications</span>
          </Button>
        </div>

        <Tabs defaultValue="users" className="space-y-4 sm:space-y-6">
          {/* Tabs - Scrollable on mobile */}
          <div className="overflow-x-auto -mx-2 px-2 scrollbar-hide">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-6 h-auto gap-0.5 sm:gap-1 p-1">
              <TabsTrigger value="users" className="flex items-center gap-1.5 sm:gap-2 py-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span>Utilisateurs</span>
              </TabsTrigger>
              <TabsTrigger value="listings" className="flex items-center gap-1.5 sm:gap-2 py-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span>Annonces</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-1.5 sm:gap-2 py-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                <span>Signalements</span>
              </TabsTrigger>
              <TabsTrigger value="moderation" className="flex items-center gap-1.5 sm:gap-2 py-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                <ImageOff className="h-4 w-4 flex-shrink-0" />
                <span>Modération</span>
              </TabsTrigger>
              <TabsTrigger value="reminders" className="flex items-center gap-1.5 sm:gap-2 py-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                <Bell className="h-4 w-4 flex-shrink-0" />
                <span>Rappels</span>
              </TabsTrigger>
              <TabsTrigger value="ads" className="flex items-center gap-1.5 sm:gap-2 py-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span>Publicités</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-3 sm:space-y-4">
            <Card>
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <div className="flex flex-col gap-2 sm:gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nom, email, téléphone..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                      <SelectTrigger className="flex-1 text-sm h-9">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="active">Actifs</SelectItem>
                        <SelectItem value="banned">Bannis</SelectItem>
                        <SelectItem value="verified">Vérifiés</SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedUsers.length > 0 && (
                      <Button
                        onClick={() => setShowBulkEmailDialog(true)}
                        size="sm"
                        className="flex-shrink-0"
                      >
                        <Mail className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Email ({selectedUsers.length})</span>
                        <span className="sm:hidden">{selectedUsers.length}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 sm:px-6 py-3 sm:py-4">
                <CardTitle className="text-base sm:text-lg">Utilisateurs ({filteredUsers.length}/{users?.length || 0})</CardTitle>
                {filteredUsers.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleAllUsers}
                    className="text-xs h-8"
                  >
                    {selectedUsers.length === filteredUsers.length ? "Tout désélectionner" : "Tout sélectionner"}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 px-2 sm:px-6">
                {filteredUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">Aucun utilisateur trouvé</p>
                ) : (
                  filteredUsers.map((profile) => (
                    <Card key={profile.id} className="p-3 sm:p-4">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Checkbox
                          checked={selectedUsers.includes(profile.id)}
                          onCheckedChange={() => toggleUserSelection(profile.id)}
                          className="mt-0.5"
                        />
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between flex-1 gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <h3 className="font-semibold text-sm sm:text-base truncate">{profile.full_name || "Utilisateur"}</h3>
                              {profile.is_banned && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Banni</Badge>
                              )}
                              {profile.email_verified && (
                                <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">Vérifié</Badge>
                              )}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground mt-1 space-y-0.5">
                              <p className="flex items-center gap-1.5 truncate">
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{(profile as any).email || "Email non disponible"}</span>
                              </p>
                              {profile.phone && (
                                <p className="flex items-center gap-1.5">
                                  <Phone className="h-3 w-3 flex-shrink-0" />
                                  {profile.phone}
                                </p>
                              )}
                              <p className="truncate">{profile.city}, {profile.country}</p>
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                                <span>Inscrit: {new Date(profile.created_at).toLocaleDateString('fr-FR')}</span>
                                <span>Ventes: {profile.total_sales || 0}</span>
                                <span>★ {profile.rating_average || 0}/5</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap sm:flex-col gap-1.5 sm:min-w-[90px]">
                            {/* User action buttons */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/seller/${profile.id}`)}
                              className="h-8 text-xs px-2"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Voir
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => {
                                  setSelectedUser(profile);
                                  setMessageContent("");
                                }} className="h-8 text-xs px-2">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  Message
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Envoyer un message</DialogTitle>
                                  <DialogDescription>
                                    Message envoyé par Admin AYOKA MARKET dans les notifications de l'utilisateur
                                  </DialogDescription>
                                </DialogHeader>
                                <Textarea
                                  placeholder="Votre message..."
                                  value={messageContent}
                                  onChange={(e) => setMessageContent(e.target.value)}
                                  rows={6}
                                />
                                <DialogFooter>
                                  <Button onClick={() => handleSendMessage(profile.id)}>
                                    Envoyer
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            {profile.phone && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendSMS(profile.phone)}
                                className="h-8 text-xs px-2"
                              >
                                SMS
                              </Button>
                            )}
                            {(profile as any).email && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedUser(profile);
                                      setSelectedTemplate("custom");
                                      setEmailSubject("");
                                      setEmailMessage("");
                                    }}
                                    className="h-8 text-xs px-2"
                                  >
                                    <Mail className="h-3 w-3 mr-1" />
                                    Email
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Envoyer un email</DialogTitle>
                                    <DialogDescription>
                                      Envoyer un email à {(profile as any).email}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium mb-1 block">Template</label>
                                      <Select 
                                        value={selectedTemplate} 
                                        onValueChange={(value) => {
                                          setSelectedTemplate(value);
                                          const template = emailTemplates[value as keyof typeof emailTemplates];
                                          setEmailSubject(template.subject);
                                          setEmailMessage(template.message);
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Choisir un template" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="custom">✍️ Email personnalisé</SelectItem>
                                          <SelectItem value="welcome">👋 Bienvenue</SelectItem>
                                          <SelectItem value="verification_reminder">✅ Rappel de vérification</SelectItem>
                                          <SelectItem value="listing_approved">✓ Annonce approuvée</SelectItem>
                                          <SelectItem value="listing_rejected">✗ Annonce rejetée</SelectItem>
                                          <SelectItem value="promotion">🎉 Promotion</SelectItem>
                                          <SelectItem value="inactive_user">💤 Utilisateur inactif</SelectItem>
                                          <SelectItem value="warning">⚠️ Avertissement</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium mb-1 block">Sujet</label>
                                      <Input
                                        placeholder="Sujet de l'email..."
                                        value={emailSubject}
                                        onChange={(e) => setEmailSubject(e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium mb-1 block">Message</label>
                                      <Textarea
                                        placeholder="Votre message..."
                                        value={emailMessage}
                                        onChange={(e) => setEmailMessage(e.target.value)}
                                        rows={8}
                                        className="font-mono text-sm"
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button 
                                      onClick={() => {
                                        handleSendEmail((profile as any).email, emailSubject, emailMessage);
                                        setSelectedTemplate("custom");
                                        setEmailSubject("");
                                        setEmailMessage("");
                                      }}
                                      disabled={!emailSubject || !emailMessage}
                                    >
                                      Envoyer
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                            {profile.is_banned ? (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleUnbanUser(profile.id)}
                                className="h-8 text-xs px-2"
                              >
                                Débannir
                              </Button>
                            ) : (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive" className="h-8 text-xs px-2">
                                    <Ban className="h-3 w-3 mr-1" />
                                    Bannir
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Bannir l'utilisateur</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Cette action bannira l'utilisateur. Indiquez la raison:
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <Input
                                    placeholder="Raison du bannissement..."
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                  />
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleBanUser(profile.id)}>
                                      Confirmer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk Email Dialog */}
          <Dialog open={showBulkEmailDialog} onOpenChange={setShowBulkEmailDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Envoyer un email en masse ({selectedUsers.length} utilisateur(s))</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Template</label>
                  <Select value={selectedTemplate} onValueChange={(value) => {
                    setSelectedTemplate(value);
                    if (value && value !== 'custom') {
                      const template = emailTemplates[value as keyof typeof emailTemplates];
                      setEmailSubject(template.subject);
                      setEmailMessage(template.message);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">✍️ Email personnalisé</SelectItem>
                      <SelectItem value="welcome">👋 Bienvenue</SelectItem>
                      <SelectItem value="verification_reminder">✅ Rappel de vérification</SelectItem>
                      <SelectItem value="listing_approved">✓ Annonce approuvée</SelectItem>
                      <SelectItem value="listing_rejected">✗ Annonce rejetée</SelectItem>
                      <SelectItem value="promotion">🎉 Promotion</SelectItem>
                      <SelectItem value="inactive_user">💤 Utilisateur inactif</SelectItem>
                      <SelectItem value="warning">⚠️ Avertissement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sujet</label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Sujet de l'email"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Contenu de l'email"
                    rows={10}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowBulkEmailDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleBulkEmail}>
                  Envoyer à {selectedUsers.length} utilisateur(s)
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Listings Tab */}
          <TabsContent value="listings" className="space-y-3 sm:space-y-4">
            <Card>
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <div className="flex flex-col gap-2 sm:gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Titre ou description..."
                      value={listingSearch}
                      onChange={(e) => setListingSearch(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={listingStatusFilter} onValueChange={setListingStatusFilter}>
                      <SelectTrigger className="flex-1 text-sm h-9">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="approved">Approuvés</SelectItem>
                        <SelectItem value="rejected">Rejetés</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={listingCategoryFilter} onValueChange={setListingCategoryFilter}>
                      <SelectTrigger className="flex-1 text-sm h-9">
                        <SelectValue placeholder="Catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        {categories?.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                <CardTitle className="text-base sm:text-lg">Annonces ({filteredListings.length}/{listings?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 px-2 sm:px-6">
                {filteredListings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">Aucune annonce trouvée</p>
                ) : (
                  filteredListings.map(listing => (
                    <Card key={listing.id} className="p-3 sm:p-4">
                      <div className="flex gap-3">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                          {listing.images?.[0] ? (
                            <img 
                              src={listing.images[0]} 
                              alt={listing.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageOff className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base truncate">{listing.title}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{listing.description}</p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs">
                            <span className="text-muted-foreground">{listing.categories?.name || "N/A"}</span>
                            <span className="font-medium text-primary">{listing.price?.toLocaleString()} FCFA</span>
                            <Badge variant={listing.moderation_status === 'approved' ? 'secondary' : listing.moderation_status === 'rejected' ? 'destructive' : 'default'} className="text-[10px]">
                              {listing.moderation_status === 'pending' ? 'En attente' : listing.moderation_status === 'approved' ? 'Approuvé' : 'Rejeté'}
                            </Badge>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {listing.moderation_status === "pending" && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleApproveListing(listing.id)} className="h-7 text-xs px-2">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  OK
                                </Button>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="destructive" className="h-7 text-xs px-2">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Non
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="mx-4 max-w-[calc(100%-2rem)] sm:max-w-lg">
                                    <DialogHeader>
                                      <DialogTitle>Rejeter l'annonce</DialogTitle>
                                      <DialogDescription>Indiquez la raison du rejet</DialogDescription>
                                    </DialogHeader>
                                    <Textarea
                                      placeholder="Raison du rejet..."
                                      value={messageContent}
                                      onChange={(e) => setMessageContent(e.target.value)}
                                      rows={4}
                                    />
                                    <DialogFooter className="flex-col sm:flex-row gap-2">
                                      <Button variant="outline" onClick={() => setMessageContent("")} className="w-full sm:w-auto">
                                        Annuler
                                      </Button>
                                      <Button
                                        onClick={() => {
                                          handleRejectListing(listing.id, messageContent);
                                          setMessageContent("");
                                        }}
                                        disabled={!messageContent.trim()}
                                        className="w-full sm:w-auto"
                                      >
                                        Confirmer
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </>
                            )}
                            <Button size="sm" variant="outline" onClick={() => navigate(`/listing/${listing.id}`)} className="h-7 text-xs px-2">
                              <Eye className="h-3 w-3 mr-1" />
                              Voir
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive" className="h-7 text-xs px-2">
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Supprimer
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="mx-4 max-w-[calc(100%-2rem)] sm:max-w-lg">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer l'annonce</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action est irréversible. L'annonce "{listing.title}" sera définitivement supprimée.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                  <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteListing(listing.id)}
                                    className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Supprimer définitivement
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-3 sm:space-y-4">
            <Card>
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <div className="flex flex-col gap-2 sm:gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Titre ou signalant..."
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={reportStatusFilter} onValueChange={setReportStatusFilter}>
                      <SelectTrigger className="flex-1 text-sm h-9">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="resolved">Résolus</SelectItem>
                        <SelectItem value="dismissed">Rejetés</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={reportReasonFilter} onValueChange={setReportReasonFilter}>
                      <SelectTrigger className="flex-1 text-sm h-9">
                        <SelectValue placeholder="Raison" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="spam">Spam</SelectItem>
                        <SelectItem value="inappropriate">Inapproprié</SelectItem>
                        <SelectItem value="fraud">Fraude</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                <CardTitle className="text-base sm:text-lg">Signalements ({filteredReports.length}/{reports?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 px-2 sm:px-6">
                {filteredReports.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">Aucun signalement trouvé</p>
                ) : (
                  filteredReports.map(report => (
                    <Card key={report.id} className="p-2 sm:p-4">
                      <div className="flex gap-2 sm:gap-4">
                        {/* Image and action buttons column */}
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                          {report.listings?.images?.[0] && (
                            <div className="w-16 h-16 sm:w-24 sm:h-24 flex-shrink-0 rounded overflow-hidden bg-muted">
                              <img 
                                src={report.listings.images[0]} 
                                alt={report.listings.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          {/* Action buttons under image */}
                          <div className="flex flex-col gap-1 sm:gap-1.5 w-16 sm:w-24">
                            {report.listings?.id && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => navigate(`/listing/${report.listings.id}`)}
                                className="h-6 sm:h-7 text-[9px] sm:text-[10px] px-1 sm:px-1.5 w-full"
                              >
                                <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-0.5" />
                                <span className="hidden sm:inline">Voir</span>
                              </Button>
                            )}
                            {report.status === "pending" && (
                              <>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive" className="h-6 sm:h-7 text-[9px] sm:text-[10px] px-1 sm:px-1.5 w-full">
                                      <Ban className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-0.5" />
                                      <span className="hidden sm:inline">Ban</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="mx-4 max-w-[calc(100%-2rem)] sm:max-w-lg">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-base sm:text-lg">Supprimer et bannir ?</AlertDialogTitle>
                                      <AlertDialogDescription className="text-xs sm:text-sm">
                                        Cette action va :
                                        <ul className="list-disc list-inside mt-2 space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
                                          <li>Supprimer l'annonce</li>
                                          <li>Bannir le vendeur</li>
                                          <li>Résoudre le signalement</li>
                                        </ul>
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <Input
                                      placeholder="Raison du bannissement..."
                                      value={banReason}
                                      onChange={(e) => setBanReason(e.target.value)}
                                      className="text-sm"
                                    />
                                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                      <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={async () => {
                                          if (!report.listing_id) {
                                            toast.error("Impossible de trouver l'annonce");
                                            return;
                                          }
                                          
                                          const { data: listing } = await supabase
                                            .from("listings")
                                            .select("user_id")
                                            .eq("id", report.listing_id)
                                            .single();
                                          
                                          if (!listing?.user_id) {
                                            toast.error("Impossible de trouver le vendeur");
                                            return;
                                          }
                                          
                                          await supabase
                                            .from("listings")
                                            .delete()
                                            .eq("id", report.listing_id);
                                          
                                          await handleBanUser(listing.user_id);
                                          await handleResolveReport(report.id);
                                          
                                          toast.success("Annonce supprimée et vendeur banni");
                                          setBanReason("");
                                        }}
                                        disabled={!banReason.trim()}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                                      >
                                        Confirmer
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                                
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleResolveReport(report.id)}
                                  className="h-6 sm:h-7 text-[9px] sm:text-[10px] px-1 sm:px-1.5 w-full"
                                >
                                  <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-0.5" />
                                  <span className="hidden sm:inline">OK</span>
                                </Button>
                                
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="h-6 sm:h-7 text-[9px] sm:text-[10px] px-1 sm:px-1.5 w-full">
                                      <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-0.5" />
                                      <span className="hidden sm:inline">Non</span>
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="mx-4 max-w-[calc(100%-2rem)] sm:max-w-lg">
                                    <DialogHeader>
                                      <DialogTitle>Rejeter le signalement</DialogTitle>
                                      <DialogDescription className="text-xs sm:text-sm">
                                        Le signalement sera marqué comme non fondé.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <Textarea
                                      placeholder="Notes pour le rejet (optionnel)..."
                                      value={messageContent}
                                      onChange={(e) => setMessageContent(e.target.value)}
                                      rows={3}
                                      className="text-sm"
                                    />
                                    <DialogFooter className="flex-col sm:flex-row gap-2">
                                      <Button variant="outline" onClick={() => setMessageContent("")} className="w-full sm:w-auto">
                                        Annuler
                                      </Button>
                                      <Button
                                        onClick={() => {
                                          handleDismissReport(report.id, messageContent);
                                          setMessageContent("");
                                        }}
                                        className="w-full sm:w-auto"
                                      >
                                        Confirmer
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Report details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base truncate">{report.listings?.title || "Annonce supprimée"}</h3>
                          {report.listings?.price && (
                            <p className="text-xs sm:text-sm font-medium text-primary mt-0.5 sm:mt-1">
                              {report.listings.price.toLocaleString()} FCFA
                            </p>
                          )}
                          <div className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1">
                            <div className="flex flex-wrap items-center gap-1">
                              <Badge variant={report.reason === 'fraud' || report.reason === 'inappropriate' ? 'destructive' : 'secondary'} className="text-[10px] sm:text-xs">
                                {report.reason === 'inappropriate' ? 'Inapproprié' : 
                                 report.reason === 'fraud' ? 'Fraude' :
                                 report.reason === 'spam' ? 'Spam' : 'Autre'}
                              </Badge>
                              <Badge variant={
                                report.status === 'pending' ? 'default' :
                                report.status === 'resolved' ? 'secondary' : 'outline'
                              } className="text-[10px] sm:text-xs">
                                {report.status === 'pending' ? 'En attente' :
                                 report.status === 'resolved' ? 'Résolu' : 'Rejeté'}
                              </Badge>
                            </div>
                            {report.description && (
                              <p className="text-[10px] sm:text-sm text-muted-foreground line-clamp-2">{report.description}</p>
                            )}
                            <p className="text-[10px] sm:text-sm text-muted-foreground">
                              Par: {report.reporter_profile?.full_name || "Inconnu"}
                            </p>
                            <p className="text-[10px] sm:text-sm text-muted-foreground">
                              {new Date(report.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Image Moderation Tab */}
          <TabsContent value="moderation" className="space-y-4">
            <ImageModerationDashboard />
          </TabsContent>

          {/* Reminders Tab */}
          <TabsContent value="reminders" className="space-y-4">
            <InactiveListingsReminder />
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads" className="space-y-4">
            <AdBannerManagement />
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
};

export default Admin;
