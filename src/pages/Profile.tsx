import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Upload, User } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  profile_picture_url: string | null;
}

function Profile() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
      } else {
        setUserId(user.id);
        setUserName(user.user_metadata?.name || '');
        setUserEmail(user.email || '');
        await loadProfile(user.id);
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const loadProfile = async (uid: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    if (error) {
      console.error('Error loading profile:', error);
    } else if (data) {
      setProfile(data);
      setProfilePictureUrl(data.profile_picture_url);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      if (profile?.profile_picture_url) {
        const oldPath = profile.profile_picture_url.split('/').slice(-2).join('/');
        await supabase.storage
          .from('profile-pictures')
          .remove([oldPath]);
      }

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          profile_picture_url: publicUrl,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (dbError) {
        throw dbError;
      }

      setProfilePictureUrl(publicUrl);
      await loadProfile(userId);
      alert('Profile picture uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1E2A5A] to-[#1A2847] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E2A5A] to-[#1A2847]">
      <header className="h-[75px] bg-white/10 backdrop-blur-[10px] border-b border-white/[0.18] shadow-[0_4px_16px_rgba(0,0,0,0.15)] sticky top-0 z-50">
        <div className="h-full max-w-6xl mx-auto px-8 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Profile</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-white/10 text-white font-medium py-[0.65rem] px-6 rounded-[10px] transition-all duration-300 hover:bg-white/20"
            >
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="bg-white text-[#1E2A5A] font-bold py-[0.65rem] px-6 rounded-[10px] transition-all duration-300 hover:bg-[#F8FAFC] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6 md:px-10 py-14">
        <h2 className="text-[2.2rem] font-bold text-white mb-8">Profile Picture</h2>

        <div className="bg-white/10 backdrop-blur-[10px] border border-white/[0.18] rounded-[14px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
          <div className="flex flex-col items-center space-y-6">
            <div className="w-48 h-48 rounded-full overflow-hidden bg-white/5 border-4 border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)] flex items-center justify-center">
              {profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-24 h-24 text-white/40" />
              )}
            </div>

            <div className="text-center">
              <p className="text-white/80 text-lg font-medium">
                {userName} ({userEmail})
              </p>
            </div>

            <label
              htmlFor="file-upload"
              className={`flex items-center gap-3 bg-white text-[#1E2A5A] font-bold py-3 px-8 rounded-xl transition-all duration-300 cursor-pointer ${
                uploading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-[#F8FAFC] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-[1.02]'
              }`}
            >
              <Upload className="w-5 h-5" />
              {uploading ? 'Uploading...' : 'Upload Profile Picture'}
            </label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />

            {profilePictureUrl && (
              <p className="text-white/50 text-xs max-w-md break-all text-center">
                Current image: {profilePictureUrl.split('/').pop()}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;
