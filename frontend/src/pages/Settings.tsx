import { useState } from "react";
import { Link } from "react-router-dom";
import {
  User, Shield, Bell, Palette, Download, Info,
  ChevronRight, ExternalLink, LogOut
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Card, CardContent, Badge, Avatar } from "../components/ui";

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

export default function Settings() {
  const { user, profile, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Guest";

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="space-y-8 max-w-xl mx-auto py-4 animate-in" aria-label="Settings page">
      {/* Page Header */}
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-500">Settings</p>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Account & Preferences</h1>
      </div>

      {/* Profile Card */}
      {user ? (
        <div className="flex items-center gap-4 p-5 bg-slate-900 rounded-2xl border border-slate-800">
          <Avatar
            src={profile?.avatar_url}
            name={displayName}
            size="lg"
            active
          />
          <div className="flex-1 min-w-0">
            <p className="font-black text-white truncate">{displayName}</p>
            <p className="text-xs text-slate-400 font-semibold truncate">{user.email}</p>
            {profile?.isl_level && (
              <Badge variant="teal" className="mt-1">ISL Level: {profile.isl_level}</Badge>
            )}
          </div>
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

      {/* Account */}
      <SettingsSection title="Account">
        <SettingsRow
          icon={<User className="h-4.5 w-4.5" />}
          label="Edit Profile"
          description="Change display name, interests, and avatar"
          onClick={() => {/* TODO: open profile edit modal */}}
        />
        <SettingsRow
          icon={<Shield className="h-4.5 w-4.5" />}
          label="Privacy & Data"
          description="Your data is never sold. ISL progress stays yours."
          right={<Badge variant="success" className="text-[10px]">Secure</Badge>}
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
          description="Font size, high contrast — use the ⚙ icon in the header"
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
