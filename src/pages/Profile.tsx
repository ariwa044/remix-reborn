import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import bitpayLogo from '@/assets/bitpay-logo.png';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AtSign,
  Save,
  Camera
} from 'lucide-react';

interface ProfileData {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  date_of_birth: string | null;
  username: string | null;
  profile_picture_url: string | null;
}

export default function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    date_of_birth: '',
    username: '',
    profile_picture_url: null
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setProfile({
            full_name: data.full_name || user.user_metadata?.full_name || '',
            email: data.email || user.email || '',
            phone: data.phone || '',
            address: data.address || '',
            city: data.city || '',
            country: data.country || '',
            date_of_birth: data.date_of_birth || '',
            username: data.username || '',
            profile_picture_url: data.profile_picture_url
          });
        } else {
          setProfile(prev => ({
            ...prev,
            full_name: user.user_metadata?.full_name || '',
            email: user.email || ''
          }));
        }
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        country: profile.country,
        date_of_birth: profile.date_of_birth || null,
        username: profile.username
      })
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Profile updated successfully' });
    }
    setIsSaving(false);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <img src={bitpayLogo} alt="Bitpay" className="h-8 w-auto" />
          <h1 className="text-lg font-semibold text-foreground">My Profile</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        {/* Profile Picture */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {profile.profile_picture_url ? (
                <img src={profile.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-primary" />
              )}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-4">{profile.full_name || 'User'}</h2>
          <p className="text-muted-foreground">@{profile.username || 'username'}</p>
        </div>

        {/* Profile Form */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
          <div>
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="h-4 w-4" /> Full Name
            </Label>
            <Input
              id="fullName"
              value={profile.full_name || ''}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="username" className="flex items-center gap-2">
              <AtSign className="h-4 w-4" /> Username
            </Label>
            <Input
              id="username"
              value={profile.username || ''}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Email
            </Label>
            <Input
              id="email"
              type="email"
              value={profile.email || ''}
              disabled
              className="mt-1 bg-muted"
            />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
          </div>

          <div>
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> Phone Number
            </Label>
            <Input
              id="phone"
              value={profile.phone || ''}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="dob" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Date of Birth
            </Label>
            <Input
              id="dob"
              type="date"
              value={profile.date_of_birth || ''}
              onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Address
            </Label>
            <Input
              id="address"
              value={profile.address || ''}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              placeholder="Street address"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={profile.city || ''}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={profile.country || ''}
                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </main>
    </div>
  );
}