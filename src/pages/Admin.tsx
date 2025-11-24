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

  // Fetch all users with their emails
  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (profilesError) throw profilesError;

      // Fetch user emails from edge function
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

        // Merge profile data with emails
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

  // Fetch categories for filtering
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
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Fetch reporter profiles separately
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

  // Filtered data using useMemo for performance
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter(user => {
      // Search filter
      const matchesSearch = userSearch === "" || 
        user.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.phone?.includes(userSearch);
      
      // Status filter
      const matchesStatus = userStatusFilter === "all" ||
        (userStatusFilter === "banned" && user.is_banned) ||
        (userStatusFilter === "active" && !user.is_banned) ||
        (userStatusFilter === "verified" && user.email_verified);
      
      return matchesSearch && matchesStatus;
    });
  }, [users, userSearch, userStatusFilter]);

  const filteredListings = useMemo(() => {
    if (!listings) return [];
    
    return listings.filter(listing => {
      // Search filter
      const matchesSearch = listingSearch === "" ||
        listing.title?.toLowerCase().includes(listingSearch.toLowerCase()) ||
        listing.description?.toLowerCase().includes(listingSearch.toLowerCase());
      
      // Status filter
      const matchesStatus = listingStatusFilter === "all" ||
        listing.moderation_status === listingStatusFilter;
      
      // Category filter
      const matchesCategory = listingCategoryFilter === "all" ||
        listing.category_id === listingCategoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [listings, listingSearch, listingStatusFilter, listingCategoryFilter]);

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    
    return reports.filter(report => {
      // Status filter
      const matchesStatus = reportStatusFilter === "all" || report.status === reportStatusFilter;
      
      // Reason filter
      const matchesReason = reportReasonFilter === "all" || report.reason === reportReasonFilter;
      
      // Search filter (by listing title or reporter name)
      const searchLower = reportSearch.toLowerCase();
      const matchesSearch = reportSearch === "" || 
        report.listings?.title?.toLowerCase().includes(searchLower) ||
        report.reporter_profile?.full_name?.toLowerCase().includes(searchLower);
      
      return matchesStatus && matchesReason && matchesSearch;
    });
  }, [reports, reportStatusFilter, reportReasonFilter, reportSearch]);

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

  const handleSendMessage = async (userId: string) => {
    toast.info("Fonctionnalité de messagerie à implémenter avec un service externe");
  };

  const handleSendEmail = async (email: string) => {
    toast.info(`Email à envoyer à: ${email}`);
  };

  const handleSendSMS = async (phone: string) => {
    toast.info(`SMS à envoyer au: ${phone}`);
  };

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
          <TabsList className="grid w-full grid-cols-4">
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
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom ou téléphone..."
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tous les utilisateurs ({filteredUsers.length} / {users?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucun utilisateur trouvé</p>
                ) : (
                  filteredUsers.map((profile) => (
                    <Card key={profile.id} className="p-4">
                    <div className="flex items-start justify-between">
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
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/seller/${profile.id}`)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Voir
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setSelectedUser(profile)}>
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
                          >
                            SMS
                          </Button>
                        )}
                        {profile.is_banned ? (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleUnbanUser(profile.id)}
                          >
                            Débannir
                          </Button>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
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
                  </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par titre..."
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
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Toutes les annonces ({filteredListings.length} / {listings?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredListings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune annonce trouvée</p>
                ) : (
                  filteredListings.map((listing) => (
                    <Card key={listing.id} className="p-3">
                    <div className="flex gap-3">
                      <img
                        src={listing.images?.[0] || "/placeholder.svg"}
                        alt={listing.title}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{listing.title}</h3>
                            <p className="text-sm font-bold text-primary">
                              {listing.price > 0 ? `${listing.price.toLocaleString()} FCFA` : "Gratuit"}
                            </p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              <Badge className="text-xs py-0" variant={
                                listing.moderation_status === "approved" ? "default" :
                                listing.moderation_status === "rejected" ? "destructive" :
                                "secondary"
                              }>
                                {listing.moderation_status === "approved" ? "Approuvé" :
                                 listing.moderation_status === "rejected" ? "Rejeté" :
                                 "En attente"}
                              </Badge>
                              <Badge className="text-xs py-0" variant="outline">{listing.categories?.name}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Par: {listing.profiles?.full_name || "Utilisateur"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Vues: {listing.views === 1 ? "1 vue" : `${listing.views || 0} vues`} | Créé: {new Date(listing.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                              onClick={() => navigate(`/listing/${listing.id}`)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Voir
                            </Button>
                            {listing.moderation_status !== "approved" && (
                              <Button
                                size="sm"
                                variant="default"
                                className="h-8 px-2"
                                onClick={() => handleApproveListing(listing.id)}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approuver
                              </Button>
                            )}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="destructive" className="h-8 px-2" onClick={() => setSelectedListing(listing)}>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Rejeter
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Rejeter l'annonce</DialogTitle>
                                  <DialogDescription>
                                    Indiquez la raison du rejet:
                                  </DialogDescription>
                                </DialogHeader>
                                <Textarea
                                  placeholder="Raison du rejet..."
                                  value={messageContent}
                                  onChange={(e) => setMessageContent(e.target.value)}
                                />
                                <DialogFooter>
                                  <Button
                                    variant="destructive"
                                    onClick={() => {
                                      if (selectedListing) {
                                        handleRejectListing(selectedListing.id, messageContent);
                                        setMessageContent("");
                                      }
                                    }}
                                  >
                                    Confirmer le rejet
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
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

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par titre ou signaleur..."
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
                      <SelectItem value="inappropriate">Inapproprié</SelectItem>
                      <SelectItem value="scam">Arnaque</SelectItem>
                      <SelectItem value="spam">Spam</SelectItem>
                      <SelectItem value="fake">Contrefait</SelectItem>
                      <SelectItem value="misleading">Trompeur</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tous les signalements ({filteredReports.length} / {reports?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredReports.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucun signalement trouvé</p>
                ) : (
                  filteredReports.map((report) => (
                    <Card key={report.id} className="p-3">
                    <div className="flex gap-3">
                      <img
                        src={report.listings?.images?.[0] || "/placeholder.svg"}
                        alt={report.listings?.title}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{report.listings?.title}</h3>
                            <p className="text-sm font-bold text-primary">
                              {report.listings?.price > 0 ? `${report.listings.price.toLocaleString()} FCFA` : "Gratuit"}
                            </p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              <Badge className="text-xs py-0" variant={
                                report.status === "resolved" ? "default" :
                                report.status === "dismissed" ? "secondary" :
                                report.status === "reviewing" ? "outline" :
                                "destructive"
                              }>
                                {report.status === "resolved" ? "Résolu" :
                                 report.status === "dismissed" ? "Rejeté" :
                                 report.status === "reviewing" ? "En cours" :
                                 "En attente"}
                              </Badge>
                              <Badge className="text-xs py-0" variant="outline">
                                {report.reason === "inappropriate" ? "Contenu inapproprié" :
                                 report.reason === "scam" ? "Arnaque" :
                                 report.reason === "spam" ? "Spam" :
                                 report.reason === "fake" ? "Contrefait" :
                                 report.reason === "misleading" ? "Trompeur" :
                                 "Autre"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Signalé par: {report.reporter_profile?.full_name || "Utilisateur"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(report.created_at).toLocaleDateString()} à {new Date(report.created_at).toLocaleTimeString()}
                            </p>
                            <div className="mt-1 p-2 bg-muted rounded-md">
                              <p className="text-xs"><strong>Détails:</strong> {report.description}</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-xs"
                              onClick={() => navigate(`/listing/${report.listing_id}`)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Voir annonce
                            </Button>
                            {report.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-8 px-2 text-xs"
                                  onClick={() => handleResolveReport(report.id)}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Résoudre
                                </Button>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="h-8 px-2 text-xs">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Rejeter
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Rejeter le signalement</DialogTitle>
                                      <DialogDescription>
                                        Indiquez pourquoi ce signalement n'est pas valide:
                                      </DialogDescription>
                                    </DialogHeader>
                                    <Textarea
                                      placeholder="Notes administratives..."
                                      value={messageContent}
                                      onChange={(e) => setMessageContent(e.target.value)}
                                    />
                                    <DialogFooter>
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          handleDismissReport(report.id, messageContent);
                                          setMessageContent("");
                                        }}
                                      >
                                        Confirmer le rejet
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
                {(!reports || reports.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun signalement pour le moment
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reminders Tab */}
          <TabsContent value="reminders">
            <InactiveListingsReminder />
          </TabsContent>

          <TabsContent value="ads">
            <AdBannerManagement />
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
};

export default Admin;
