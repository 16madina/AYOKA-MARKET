import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Users, Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { NotificationType, notificationLabels } from '@/types/notifications';

interface UserWithToken {
  id: string;
  full_name: string | null;
  email?: string;
  push_token: string | null;
}

const AdminNotifications = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [users, setUsers] = useState<UserWithToken[]>([]);
  const [stats, setStats] = useState({ total: 0, withToken: 0 });
  
  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notificationType, setNotificationType] = useState<NotificationType>('promo');
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Check admin access
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        if (!roles) {
          navigate('/');
          toast({
            title: 'Accès refusé',
            description: 'Vous devez être administrateur pour accéder à cette page',
            variant: 'destructive'
          });
          return;
        }

        setIsAdmin(true);
        await loadUsers();
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  const loadUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, push_token')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get emails from edge function
      const { data: emailData } = await supabase.functions.invoke('get-user-emails', {
        body: { userIds: profiles?.map(p => p.id) || [] }
      });

      const usersWithEmail = profiles?.map(profile => ({
        ...profile,
        email: emailData?.emails?.[profile.id] || undefined
      })) || [];

      setUsers(usersWithEmail);
      setStats({
        total: usersWithEmail.length,
        withToken: usersWithEmail.filter(u => u.push_token).length
      });
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir le titre et le message',
        variant: 'destructive'
      });
      return;
    }

    if (targetType === 'specific' && !selectedUserId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un utilisateur',
        variant: 'destructive'
      });
      return;
    }

    setIsSending(true);

    try {
      if (targetType === 'all') {
        // Send to all users with push tokens
        const usersWithTokens = users.filter(u => u.push_token);
        
        if (usersWithTokens.length === 0) {
          toast({
            title: 'Aucun destinataire',
            description: 'Aucun utilisateur n\'a activé les notifications',
            variant: 'destructive'
          });
          return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const user of usersWithTokens) {
          const { error } = await supabase.functions.invoke('send-push-notification', {
            body: {
              userId: user.id,
              title,
              body,
              data: {
                type: notificationType
              }
            }
          });

          if (error) {
            errorCount++;
          } else {
            successCount++;
          }
        }

        toast({
          title: 'Notifications envoyées',
          description: `${successCount} envoyée(s), ${errorCount} échouée(s)`
        });
      } else {
        // Send to specific user
        const { error } = await supabase.functions.invoke('send-push-notification', {
          body: {
            userId: selectedUserId,
            title,
            body,
            data: {
              type: notificationType
            }
          }
        });

        if (error) throw error;

        toast({
          title: 'Notification envoyée',
          description: 'La notification a été envoyée avec succès'
        });
      }

      // Reset form
      setTitle('');
      setBody('');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer la notification',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin')}
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Notifications Push
            </h1>
            <p className="text-sm text-muted-foreground">
              Envoyer des notifications aux utilisateurs
            </p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Utilisateurs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/10">
                  <Bell className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.withToken}</p>
                  <p className="text-xs text-muted-foreground">Avec notifications</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Send Notification Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Envoyer une notification</CardTitle>
            <CardDescription>
              Créez et envoyez une notification push aux utilisateurs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Notification Type */}
            <div className="space-y-2">
              <Label>Type de notification</Label>
              <Select
                value={notificationType}
                onValueChange={(value) => setNotificationType(value as NotificationType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(notificationLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target */}
            <div className="space-y-2">
              <Label>Destinataires</Label>
              <Select
                value={targetType}
                onValueChange={(value) => setTargetType(value as 'all' | 'specific')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner les destinataires" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Tous les utilisateurs ({stats.withToken})
                  </SelectItem>
                  <SelectItem value="specific">
                    Utilisateur spécifique
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* User Selection */}
            {targetType === 'specific' && (
              <div className="space-y-2">
                <Label>Utilisateur</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un utilisateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(u => u.push_token)
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <span>{user.full_name || 'Sans nom'}</span>
                            {user.email && (
                              <span className="text-muted-foreground text-xs">
                                ({user.email})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Nouvelle promotion !"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground text-right">
                {title.length}/50
              </p>
            </div>

            {/* Body */}
            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Ex: Profitez de -20% sur toutes les annonces ce weekend !"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">
                {body.length}/200
              </p>
            </div>

            {/* Preview */}
            {(title || body) && (
              <div className="p-3 bg-muted rounded-lg border border-border">
                <p className="text-xs text-muted-foreground mb-2">Aperçu:</p>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{title || 'Titre'}</p>
                    <p className="text-sm text-muted-foreground">{body || 'Message'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Send Button */}
            <Button
              onClick={handleSendNotification}
              disabled={isSending || !title.trim() || !body.trim()}
              className="w-full"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer la notification
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Users with tokens list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Utilisateurs avec notifications</CardTitle>
            <CardDescription>
              Liste des utilisateurs ayant activé les notifications push
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.filter(u => u.push_token).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun utilisateur n'a encore activé les notifications
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {users
                  .filter(u => u.push_token)
                  .map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {user.full_name || 'Sans nom'}
                        </p>
                        {user.email && (
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        <Bell className="h-3 w-3 mr-1" />
                        Activé
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminNotifications;
