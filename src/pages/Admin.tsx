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
import { Users, FileText, ShieldAlert, Mail, MessageSquare, Ban, CheckCircle, XCircle, Eye, Phone, Search, Filter, Bell } from "lucide-react";
import { User } from "@supabase/supabase-js";
import BottomNav from "@/components/BottomNav";
import { InactiveListingsReminder } from "@/components/admin/InactiveListingsReminder";
import AdBannerManagement from "@/components/admin/AdBannerManagement";

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
      subject: "Bienvenue sur BAZARAM !",
      message: "Bonjour,\n\nNous sommes ravis de vous accueillir sur BAZARAM, votre marketplace pour l'économie circulaire.\n\nN'hésitez pas à explorer nos fonctionnalités et à publier vos premières annonces.\n\nSi vous avez des questions, notre équipe est là pour vous aider.\n\nCordialement,\nL'équipe BAZARAM"
    },
    verification_reminder: {
      subject: "Vérifiez votre compte BAZARAM",
      message: "Bonjour,\n\nNous avons remarqué que votre compte n'est pas encore vérifié.\n\nLa vérification de votre compte vous permet de:\n- Publier des annonces\n- Contacter les vendeurs\n- Bénéficier de la confiance des autres utilisateurs\n\nMerci de vérifier votre adresse email dès que possible.\n\nCordialement,\nL'équipe BAZARAM"
    },
    listing_approved: {
      subject: "Votre annonce a été approuvée",
      message: "Bonjour,\n\nBonne nouvelle ! Votre annonce a été approuvée par notre équipe de modération.\n\nElle est maintenant visible par tous les utilisateurs de BAZARAM.\n\nNous vous souhaitons une excellente vente !\n\nCordialement,\nL'équipe BAZARAM"
    },
    listing_rejected: {
      subject: "Votre annonce nécessite des modifications",
      message: "Bonjour,\n\nVotre annonce a été examinée par notre équipe de modération.\n\nMalheureusement, elle ne respecte pas certaines de nos conditions d'utilisation.\n\nMerci de la modifier et de la republier.\n\nN'hésitez pas à nous contacter si vous avez des questions.\n\nCordialement,\nL'équipe BAZARAM"
    },
    promotion: {
      subject: "Profitez de nos nouveautés !",
      message: "Bonjour,\n\nNous avons de grandes nouvelles à partager avec vous !\n\nDécouvrez les dernières fonctionnalités de BAZARAM et profitez d'une expérience encore meilleure.\n\nConnectez-vous dès maintenant pour en savoir plus.\n\nCordialement,\nL'équipe BAZARAM"
    },
    inactive_user: {
      subject: "Vous nous manquez sur BAZARAM",
      message: "Bonjour,\n\nCela fait un moment que nous ne vous avons pas vu sur BAZARAM.\n\nDe nouvelles annonces sont publiées chaque jour, et votre communauté vous attend !\n\nRevenez découvrir les dernières offres et republier vos annonces.\n\nÀ très bientôt,\nL'équipe BAZARAM"
    },
    warning: {
      subject: "Avertissement concernant votre compte",
      message: "Bonjour,\n\nNous avons détecté un comportement non conforme à nos conditions d'utilisation sur votre compte.\n\nMerci de prendre connaissance de nos règles et de les respecter.\n\nEn cas de récidive, votre compte pourrait être suspendu.\n\nCordialement,\nL'équipe BAZARAM"
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

  // Send message (placeholder)
  const handleSendMessage = async (userId: string) => {
    toast.info("Fonctionnalité de messagerie à implémenter avec un service externe");
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
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <ShieldAlert className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Panneau d'administration</h1>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="listings" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Annonces
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Signalements
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Rappels
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Publicités
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom, email ou téléphone..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
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
                      className="w-full md:w-auto"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Envoyer email ({selectedUsers.length})
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tous les utilisateurs ({filteredUsers.length} / {users?.length || 0})</CardTitle>
                {filteredUsers.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleAllUsers}
                  >
                    {selectedUsers.length === filteredUsers.length ? "Désélectionner tout" : "Sélectionner tout"}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucun utilisateur trouvé</p>
                ) : (
                  filteredUsers.map((profile) => (
                    <Card key={profile.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedUsers.includes(profile.id)}
                          onCheckedChange={() => toggleUserSelection(profile.id)}
                          className="mt-1"
                        />
                        <div className="flex items-start justify-between flex-1">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{profile.full_name || "Utilisateur"}</h3>
                              {profile.is_banned && (
                                <Badge variant="destructive">Banni</Badge>
                              )}
                              {profile.email_verified && (
                                <Badge variant="default" className="bg-green-600">Vérifié</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1 space-y-1">
                              <p className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                {(profile as any).email || "Email non disponible"}
                              </p>
                              {profile.phone && (
                                <p className="flex items-center gap-2">
                                  <Phone className="h-3 w-3" />
                                  {profile.phone}
                                </p>
                              )}
                              <p>Localisation: {profile.city}, {profile.country}</p>
                              <p>Inscrit: {new Date(profile.created_at).toLocaleDateString()}</p>
                              <p>Ventes: {profile.total_sales || 0}</p>
                              <p>Note: {profile.rating_average || 0}/5 ({profile.rating_count || 0} avis)</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 min-w-[100px]">
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
                                <Button size="sm" variant="outline" onClick={() => setSelectedUser(profile)} className="h-8 text-xs px-2">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  Message
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Envoyer un message</DialogTitle>
                                </DialogHeader>
                                <Textarea
                                  placeholder="Votre message..."
                                  value={messageContent}
                                  onChange={(e) => setMessageContent(e.target.value)}
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
          <TabsContent value="listings" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par titre ou description..."
                      value={listingSearch}
                      onChange={(e) => setListingSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={listingStatusFilter} onValueChange={setListingStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
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
                    <SelectTrigger className="w-full md:w-48">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Annonces ({filteredListings.length} / {listings?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredListings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune annonce trouvée</p>
                ) : (
                  filteredListings.map(listing => (
                    <Card key={listing.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{listing.title}</h3>
                          <p className="text-sm text-muted-foreground">{listing.description}</p>
                          <p className="text-sm mt-1">Catégorie: {listing.categories?.name || "N/A"}</p>
                          <p className="text-sm mt-1">Prix: {listing.price} €</p>
                          <p className="text-sm mt-1">Statut: {listing.moderation_status}</p>
                        </div>
                        <div className="flex gap-2">
                          {listing.moderation_status === "pending" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleApproveListing(listing.id)}>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approuver
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="destructive">
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Rejeter
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Rejeter l'annonce</DialogTitle>
                                    <DialogDescription>Indiquez la raison du rejet</DialogDescription>
                                  </DialogHeader>
                                  <Textarea
                                    placeholder="Raison du rejet..."
                                    value={messageContent}
                                    onChange={(e) => setMessageContent(e.target.value)}
                                    rows={6}
                                  />
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setMessageContent("")}>
                                      Annuler
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        handleRejectListing(listing.id, messageContent);
                                        setMessageContent("");
                                      }}
                                      disabled={!messageContent.trim()}
                                    >
                                      Confirmer
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                          <Button size="sm" variant="outline" onClick={() => navigate(`/listing/${listing.id}`)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par titre d'annonce ou nom du signalant..."
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={reportStatusFilter} onValueChange={setReportStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
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
                    <SelectTrigger className="w-full md:w-48">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Signalements ({filteredReports.length} / {reports?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredReports.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucun signalement trouvé</p>
                ) : (
                  filteredReports.map(report => (
                    <Card key={report.id} className="p-4">
                      <div className="flex gap-4">
                        {report.listings?.images?.[0] && (
                          <div className="w-24 h-24 flex-shrink-0 rounded overflow-hidden bg-muted">
                            <img 
                              src={report.listings.images[0]} 
                              alt={report.listings.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{report.listings?.title || "Annonce supprimée"}</h3>
                              {report.listings?.price && (
                                <p className="text-sm font-medium text-primary mt-1">
                                  {report.listings.price.toLocaleString()} FCFA
                                </p>
                              )}
                              <div className="mt-2 space-y-1">
                                <p className="text-sm">
                                  <span className="font-medium">Raison:</span>{" "}
                                  <Badge variant={report.reason === 'fraud' || report.reason === 'inappropriate' ? 'destructive' : 'secondary'}>
                                    {report.reason === 'inappropriate' ? 'Contenu inapproprié' : 
                                     report.reason === 'fraud' ? 'Arnaque/Fraude' :
                                     report.reason === 'spam' ? 'Spam' : 'Autre'}
                                  </Badge>
                                </p>
                                {report.description && (
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium">Description:</span> {report.description}
                                  </p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium">Signalé par:</span> {report.reporter_profile?.full_name || "Inconnu"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium">Date:</span> {new Date(report.created_at).toLocaleDateString('fr-FR', { 
                                    day: '2-digit', 
                                    month: 'long', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                                <p className="text-sm">
                                  <span className="font-medium">Statut:</span>{" "}
                                  <Badge variant={
                                    report.status === 'pending' ? 'default' :
                                    report.status === 'resolved' ? 'secondary' : 'outline'
                                  }>
                                    {report.status === 'pending' ? 'En attente' :
                                     report.status === 'resolved' ? 'Résolu' : 'Rejeté'}
                                  </Badge>
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              {report.listings?.id && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => navigate(`/listing/${report.listings.id}`)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Voir annonce
                                </Button>
                              )}
                              {report.status === "pending" && (
                                <>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="destructive">
                                        <Ban className="h-4 w-4 mr-1" />
                                        Supprimer + Bannir
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Supprimer l'annonce et bannir l'utilisateur ?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Cette action va :
                                          <ul className="list-disc list-inside mt-2 space-y-1">
                                            <li>Supprimer définitivement l'annonce</li>
                                            <li>Bannir le vendeur de la plateforme</li>
                                            <li>Marquer le signalement comme résolu</li>
                                            <li>Notifier l'utilisateur ayant signalé</li>
                                          </ul>
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <Input
                                        placeholder="Raison du bannissement..."
                                        value={banReason}
                                        onChange={(e) => setBanReason(e.target.value)}
                                      />
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={async () => {
                                            if (!report.listing_id) {
                                              toast.error("Impossible de trouver l'annonce");
                                              return;
                                            }
                                            
                                            // Get listing to find user_id
                                            const { data: listing } = await supabase
                                              .from("listings")
                                              .select("user_id")
                                              .eq("id", report.listing_id)
                                              .single();
                                            
                                            if (!listing?.user_id) {
                                              toast.error("Impossible de trouver le vendeur");
                                              return;
                                            }
                                            
                                            // Delete listing
                                            await supabase
                                              .from("listings")
                                              .delete()
                                              .eq("id", report.listing_id);
                                            
                                            // Ban user
                                            await handleBanUser(listing.user_id);
                                            
                                            // Resolve report
                                            await handleResolveReport(report.id);
                                            
                                            toast.success("Annonce supprimée et vendeur banni");
                                            setBanReason("");
                                          }}
                                          disabled={!banReason.trim()}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Résoudre
                                  </Button>
                                  
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button size="sm" variant="ghost">
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Rejeter
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Rejeter le signalement</DialogTitle>
                                        <DialogDescription>
                                          Le signalement sera marqué comme non fondé.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <Textarea
                                        placeholder="Notes pour le rejet (optionnel)..."
                                        value={messageContent}
                                        onChange={(e) => setMessageContent(e.target.value)}
                                        rows={4}
                                      />
                                      <DialogFooter>
                                        <Button variant="outline" onClick={() => setMessageContent("")}>
                                          Annuler
                                        </Button>
                                        <Button
                                          onClick={() => {
                                            handleDismissReport(report.id, messageContent);
                                            setMessageContent("");
                                          }}
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
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
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
      <InactiveListingsReminder />
      <AdBannerManagement />
    </div>
  );
};

export default Admin;
