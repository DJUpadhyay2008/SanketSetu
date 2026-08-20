import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  User, Shield, Bell, Palette, Download, Info,
  ChevronRight, ExternalLink, LogOut, Camera, Upload, X, Check, MapPin, Calendar, Phone
} from "lucide-react";
import { useAuth, type UserProfile } from "../hooks/useAuth";
import { Card, CardContent, Badge, Avatar, Button } from "../components/ui";

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <section className="space-y-2" aria-label={title}>
      <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 pl-1">
        {title}
      </h2>
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardContent className="divide-y divide-slate-100 dark:divide-slate-800 !py-0 !px-0">
          {children}
        </CardContent>
      </Card>
    </section>
  );
}

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

function SettingsRow({ icon, label, description, right, onClick, danger }: SettingsRowProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`flex items-center gap-4 px-4 py-3.5 w-full text-left transition-colors ${
        onClick ? "hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer" : ""
      } ${danger ? "text-rose-500 dark:text-rose-400" : ""}`}
    >
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
        danger
          ? "bg-rose-50 dark:bg-rose-950/30 text-rose-500"
          : "bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400"
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${danger ? "text-rose-500 dark:text-rose-400" : "text-slate-800 dark:text-slate-200"}`}>
          {label}
        </p>
        {description && (
          <p className="text-[11px] font-semibold text-slate-400 leading-snug">{description}</p>
        )}
      </div>
      {right ?? (onClick && (
        <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
      ))}
    </Tag>
  );
}

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=250",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"
];

const INDIAN_STATES = [
  "Gujarat", "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", 
  "Uttar Pradesh", "Rajasthan", "West Bengal", "Telangana", "Kerala", 
  "Punjab", "Madhya Pradesh", "Haryana", "Bihar", "Odisha", "Central"
];

const DISABILITY_CATEGORIES = [
  "Deaf / Hard of Hearing",
  "DeafBlind / Tactile Signer",
  "CODA (Child of Deaf Adult)",
  "Hearing Ally / Friend",
  "ISL Learner / Advocate",
  "Certified Interpreter",
  "Civic / Healthcare Officer"
];

const INTEREST_TOPICS = [
  "Everyday Communication",
  "Healthcare ISL",
  "Emergency Reporting",
  "Civic Rights",
  "Workplace Access",
  "Legal Rights",
  "Travel & Transport",
  "Education"
];

export default function Settings() {
  const { user, profile, logout, updateProfile } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    display_name: profile?.display_name || "",
    avatar_url: profile?.avatar_url || "",
    gender: profile?.gender || "",
    dob: profile?.dob || "",
    state: profile?.state || "Gujarat",
    city: profile?.city || "",
    phone: profile?.phone || "",
    bio: profile?.bio || "",
    disability_category: profile?.disability_category || "Deaf / Hard of Hearing",
    isl_level: profile?.isl_level || "1",
    interests: profile?.interests || ["Everyday Communication", "Healthcare ISL"]
  });

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Guest";

  const handleOpenEdit = () => {
    setFormData({
      display_name: profile?.display_name || user?.email?.split("@")[0] || "",
      avatar_url: profile?.avatar_url || "",
      gender: profile?.gender || "Prefer not to say",
      dob: profile?.dob || "",
      state: profile?.state || "Gujarat",
      city: profile?.city || "",
      phone: profile?.phone || "",
      bio: profile?.bio || "",
      disability_category: profile?.disability_category || "Deaf / Hard of Hearing",
      isl_level: profile?.isl_level || "1",
      interests: profile?.interests || ["Everyday Communication", "Healthcare ISL"]
    });
    setIsEditingProfile(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormData(prev => ({ ...prev, avatar_url: event.target?.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleInterest = (topic: string) => {
    setFormData(prev => {
      const current = prev.interests || [];
      if (current.includes(topic)) {
        return { ...prev, interests: current.filter(t => t !== topic) };
      } else {
        return { ...prev, interests: [...current, topic] };
      }
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(formData);
      setSuccessMsg("Profile details saved successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
      setIsEditingProfile(false);
    } catch (err) {
      alert("Failed to save profile changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto py-4 animate-in" aria-label="Settings page">
      {/* Page Header */}
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-500">Settings</p>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Account & Profile</h1>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-black flex items-center justify-between shadow-sm animate-in">
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-500 hover:text-emerald-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Profile Overview Card */}
      {user ? (
        <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-36 w-36 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar
                  src={profile?.avatar_url}
                  name={displayName}
                  size="xl"
                  active
                />
                <button
                  onClick={handleOpenEdit}
                  title="Change photo"
                  className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-teal-600 text-white flex items-center justify-center border-2 border-slate-900 hover:bg-teal-500 transition-transform active:scale-90 shadow-md cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white">{displayName}</h2>
                  {profile?.gender && (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                      {profile.gender}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-semibold">{user.email}</p>
                
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {profile?.state && (
                    <Badge variant="muted" className="text-[10px] bg-slate-800 text-slate-300 border-0 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-teal-400" /> {profile.city ? `${profile.city}, ` : ""}{profile.state}
                    </Badge>
                  )}
                  {profile?.disability_category && (
                    <Badge variant="saffron" className="text-[10px]">
                      {profile.disability_category}
                    </Badge>
                  )}
                  {profile?.isl_level && (
                    <Badge variant="teal" className="text-[10px]">
                      ISL Level: {profile.isl_level}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={handleOpenEdit}
              className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
            >
              Edit Profile
            </Button>
          </div>

          {/* Profile Extra Info Details */}
          {(profile?.bio || profile?.dob || profile?.phone) && (
            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              {profile.bio && (
                <div className="sm:col-span-2 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">About</p>
                  <p className="text-slate-300 leading-relaxed italic">{profile.bio}</p>
                </div>
              )}
              {profile.dob && (
                <div className="flex items-center gap-2 text-slate-400 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-teal-400" />
                  <span>DOB: <strong className="text-white">{profile.dob}</strong></span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-2 text-slate-400 font-medium">
                  <Phone className="h-3.5 w-3.5 text-teal-400" />
                  <span>Phone: <strong className="text-white">{profile.phone}</strong></span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between p-5 bg-slate-900 rounded-2xl border border-slate-800">
          <p className="text-sm font-bold text-slate-400">Not signed in</p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Sign In
          </Link>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in my-8">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <User className="h-5 w-5 text-teal-500" /> Edit Personal Profile
              </h3>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
              
              {/* Photo Upload & Presets */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  <Avatar
                    src={formData.avatar_url}
                    name={formData.display_name || "User"}
                    size="xl"
                  />
                  <div className="space-y-2 flex-1">
                    <div className="flex gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5" /> Upload Photo
                      </Button>
                      {formData.avatar_url && (
                        <Button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, avatar_url: "" }))}
                          className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 hover:bg-rose-100 cursor-pointer"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Or Pick Avatar Preset:
                      </span>
                      <div className="flex gap-2">
                        {PRESET_AVATARS.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Preset ${idx}`}
                            onClick={() => setFormData(prev => ({ ...prev, avatar_url: url }))}
                            className={`h-8 w-8 rounded-full object-cover cursor-pointer border-2 transition-transform hover:scale-110 ${
                              formData.avatar_url === url ? "border-teal-500 scale-105 shadow-md" : "border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Details Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full / Display Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Full / Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.display_name || ""}
                    onChange={e => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Gender
                  </label>
                  <select
                    value={formData.gender || "Prefer not to say"}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-teal-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dob || ""}
                    onChange={e => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* State */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    State / UT
                  </label>
                  <select
                    value={formData.state || "Gujarat"}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-teal-500"
                  >
                    {INDIAN_STATES.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city || ""}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Ahmedabad / Mumbai"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Disability Category / Role */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Category / Accessibility Role
                  </label>
                  <select
                    value={formData.disability_category || "Deaf / Hard of Hearing"}
                    onChange={e => setFormData({ ...formData, disability_category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-teal-500"
                  >
                    {DISABILITY_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* ISL Skill Level */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    ISL Skill Level
                  </label>
                  <select
                    value={formData.isl_level || "1"}
                    onChange={e => setFormData({ ...formData, isl_level: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-teal-500"
                  >
                    <option value="1">Level 1 - Beginner (Everyday Signs & Alphabet)</option>
                    <option value="2">Level 2 - Intermediate (Healthcare & Emergency)</option>
                    <option value="3">Level 3 - Advanced / Fluent (Civic & Professional)</option>
                  </select>
                </div>

                {/* Bio / About */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    About Yourself (Bio)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.bio || ""}
                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Share a short bio about yourself, your learning goals, or accessibility experience..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Learning Interests Multi-select */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Learning & Accessibility Interests
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_TOPICS.map(topic => {
                    const isSelected = (formData.interests || []).includes(topic);
                    return (
                      <button
                        type="button"
                        key={topic}
                        onClick={() => toggleInterest(topic)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          isSelected
                            ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                            : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        {isSelected && "✓ "}
                        {topic}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <Button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-black text-xs px-5 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  {saving ? (
                    <span>Saving Changes...</span>
                  ) : (
                    <>
                      <Check className="h-4 w-4" /> Save Profile
                    </>
                  )}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Account Settings Section */}
      <SettingsSection title="Account & Profile Management">
        <SettingsRow
          icon={<User className="h-4.5 w-4.5" />}
          label="Edit Profile Details"
          description="Update photo, name, state, gender, date of birth, and bio"
          onClick={handleOpenEdit}
        />
        <SettingsRow
          icon={<Shield className="h-4.5 w-4.5" />}
          label="Privacy & Data Integrity"
          description="Your profile details stay private and protected"
          right={<Badge variant="success" className="text-[10px]">Protected</Badge>}
        />
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection title="Notifications">
        <SettingsRow
          icon={<Bell className="h-4.5 w-4.5" />}
          label="Notification Preferences"
          description="Manage practice reminders and streak alerts"
          onClick={() => {}}
        />
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection title="Appearance & Accessibility">
        <SettingsRow
          icon={<Palette className="h-4.5 w-4.5" />}
          label="Accessibility Controls"
          description="Font size, high contrast — use the ⚙ icon in top header"
          right={
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Header → ⚙
            </span>
          }
        />
      </SettingsSection>

      {/* Offline */}
      <SettingsSection title="Offline Learning">
        <SettingsRow
          icon={<Download className="h-4.5 w-4.5" />}
          label="Downloaded Courses"
          description="Manage offline course storage"
          onClick={() => {}}
          right={
            <Link
              to="/offline"
              className="text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1 hover:underline"
            >
              Open <ExternalLink className="h-3 w-3" />
            </Link>
          }
        />
      </SettingsSection>

      {/* About */}
      <SettingsSection title="About">
        <SettingsRow
          icon={<Info className="h-4.5 w-4.5" />}
          label="Sanket Setu"
          description="v1.0 · Hackathon 2026 · ISL-Ready India Initiative"
          right={<Badge variant="muted">v1.0</Badge>}
        />
      </SettingsSection>

      {/* Danger Zone */}
      {user && (
        <SettingsSection title="Danger Zone">
          <SettingsRow
            icon={<LogOut className="h-4.5 w-4.5" />}
            label={loggingOut ? "Signing out…" : "Sign Out"}
            description="You'll need to sign in again with email and password to resume"
            onClick={handleLogout}
            danger
          />
        </SettingsSection>
      )}
    </div>
  );
}
