
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, MapPin, GraduationCap, Clock, Music, Wand2, Heart, PawPrint, Sparkles, Globe, Upload } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const prompts = [
  { id: 'decadeOfBirth', label: 'Decade I was born', icon: Sparkles },
  { id: 'work', label: 'My work', icon: Briefcase },
  { id: 'alwaysWantedToGo', label: "Where I’ve always wanted to go", icon: Globe },
  { id: 'pets', label: 'Pets', icon: PawPrint },
  { id: 'school', label: 'Where I went to school', icon: GraduationCap },
  { id: 'spendTooMuchTime', label: 'I spend too much time', icon: Clock },
  { id: 'favoriteSong', label: 'My favourite song in secondary school', icon: Music },
  { id: 'mostUselessSkill', label: 'My most useless skill', icon: Wand2 },
  { id: 'funFact', label: 'My fun fact', icon: Sparkles },
  { id: 'obsessedWith', label: "I’m obsessed with", icon: Heart },
];

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, hasHydrated, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [intro, setIntro] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [travelStamps, setTravelStamps] = useState<string[]>([]);
  const [newStamp, setNewStamp] = useState('');

  const [profileFields, setProfileFields] = useState({
    decadeOfBirth: '',
    work: '',
    alwaysWantedToGo: '',
    pets: '',
    school: '',
    spendTooMuchTime: '',
    favoriteSong: '',
    mostUselessSkill: '',
    funFact: '',
    obsessedWith: '',
  });

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const loadProfile = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const res = await fetch(`${apiUrl}/api/users/me`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        });

        if (res.ok) {
          const data = await res.json();
          const profile = data.profile || {};
          setProfileFields({
            decadeOfBirth: profile.decadeOfBirth || '',
            work: profile.work || '',
            alwaysWantedToGo: profile.alwaysWantedToGo || '',
            pets: profile.pets || '',
            school: profile.school || '',
            spendTooMuchTime: profile.spendTooMuchTime || '',
            favoriteSong: profile.favoriteSong || '',
            mostUselessSkill: profile.mostUselessSkill || '',
            funFact: profile.funFact || '',
            obsessedWith: profile.obsessedWith || '',
          });
          setIntro(profile.intro || '');
          setInterests(profile.interests || []);
          setTravelStamps(profile.travelStamps || []);
          if (data.avatar?.url) {
            setAvatarPreview(data.avatar.url);
          }
        }
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [hasHydrated, isAuthenticated, router, token]);

  const handleFieldChange = (key: keyof typeof profileFields, value: string) => {
    setProfileFields((prev) => ({ ...prev, [key]: value }));
  };

  const addInterest = () => {
    if (!newInterest.trim()) return;
    setInterests((prev) => [...prev, newInterest.trim()]);
    setNewInterest('');
  };

  const removeInterest = (index: number) => {
    setInterests((prev) => prev.filter((_, i) => i !== index));
  };

  const addStamp = () => {
    if (!newStamp.trim()) return;
    setTravelStamps((prev) => [...prev, newStamp.trim()]);
    setNewStamp('');
  };

  const removeStamp = (index: number) => {
    setTravelStamps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAvatarChange = (file: File | null) => {
    setAvatarFile(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const formData = new FormData();

      formData.append('profile', JSON.stringify({
        ...profileFields,
        intro,
        interests,
        travelStamps,
      }));

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await fetch(`${apiUrl}/api/users/profile`, {
        method: 'PUT',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to update profile');
      } else {
        if (data.user) {
          updateUser({
            id: data.user._id || data.user.id,
            email: data.user.email,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            role: data.user.role,
            profile: data.user.profile,
            avatar: data.user.avatar,
          });
        }
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Left Column */}
          <div className="md:col-span-1 flex flex-col items-center">
            <div className="relative">
              <div className="w-40 h-40 rounded-full bg-neutral-900 text-white text-5xl font-bold flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.firstName?.[0] || 'U'
                )}
              </div>
              <label className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white border border-neutral-200 rounded-full px-4 py-1 text-sm shadow-sm cursor-pointer flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Add
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarChange(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

          {/* Right Column */}
          <div className="md:col-span-2">
            <h1 className="text-3xl font-bold mb-2">My profile</h1>
            <p className="text-neutral-600 mb-8">
              Hosts and guests can see your profile and it may appear across AirLite to help us build trust in our community.
              <span className="underline ml-1">Learn more</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {prompts.map((prompt) => {
                const Icon = prompt.icon;
                return (
                  <div key={prompt.id} className="flex flex-col gap-2 py-4 border-b border-neutral-200">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-neutral-600" />
                      <span className="text-neutral-800">{prompt.label}</span>
                    </div>
                    <input
                      value={profileFields[prompt.id as keyof typeof profileFields]}
                      onChange={(e) => handleFieldChange(prompt.id as keyof typeof profileFields, e.target.value)}
                      className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                      placeholder="Add"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Interests Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold">My interests</h2>
          <p className="text-neutral-600 mt-2">
            Find common ground with other guests and hosts by adding interests to your profile.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            {interests.map((interest, idx) => (
              <button
                key={`${interest}-${idx}`}
                onClick={() => removeInterest(idx)}
                className="px-4 py-2 rounded-full border border-neutral-300 text-sm"
              >
                {interest} ✕
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <input
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              className="flex-1 border border-neutral-200 rounded-lg px-3 py-2"
              placeholder="Add an interest"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addInterest();
                }
              }}
            />
            <button
              onClick={addInterest}
              className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-gray-50 transition"
            >
              Add
            </button>
          </div>
        </div>

        {/* About Me Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold">About me</h2>
          <div className="mt-4 border border-dashed border-neutral-300 rounded-2xl p-6">
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              className="w-full bg-transparent outline-none text-neutral-800"
              placeholder="Write something fun and punchy."
              rows={4}
            />
          </div>
        </div>

        {/* Where I've been */}
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Where I’ve been</h2>
              <p className="text-neutral-600 mt-1">Pick the stamps you want other people to see on your profile.</p>
            </div>
            <div className="w-12 h-7 bg-neutral-200 rounded-full relative">
              <div className="w-6 h-6 bg-white rounded-full absolute top-0.5 left-0.5 shadow" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-6">
            {travelStamps.length > 0 ? (
              travelStamps.map((label, i) => (
                <button
                  key={`${label}-${i}`}
                  onClick={() => removeStamp(i)}
                  className="border border-neutral-200 rounded-2xl p-6 flex flex-col items-center justify-center"
                >
                  <MapPin className="w-8 h-8 mb-3 text-neutral-600" />
                  <span className="text-sm text-neutral-600">{label}</span>
                  <span className="text-xs text-neutral-400 mt-2">Remove</span>
                </button>
              ))
            ) : (
              ['Next destination', 'Next destination', 'Next destination', 'Next destination'].map((label, i) => (
                <div key={i} className="border border-neutral-200 rounded-2xl p-6 flex flex-col items-center justify-center text-neutral-400">
                  <MapPin className="w-8 h-8 mb-3" />
                  <span className="text-sm text-neutral-600">{label}</span>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <input
              value={newStamp}
              onChange={(e) => setNewStamp(e.target.value)}
              className="flex-1 border border-neutral-200 rounded-lg px-3 py-2"
              placeholder="Add a travel stamp"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addStamp();
                }
              }}
            />
            <button
              onClick={addStamp}
              className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-gray-50 transition"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-black text-white px-6 py-3 rounded-lg shadow disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Done'}
        </button>
      </div>

      {error && (
        <div className="fixed bottom-6 left-6 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}
    </main>
  );
}
