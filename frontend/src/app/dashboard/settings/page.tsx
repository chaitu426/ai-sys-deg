'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  CreditCard,
  Shield,
  Bell,
  Key,
  LogOut,
  LayoutGrid,
  Check,
  ShieldCheck,
  Mail,
  Github,
  Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Plan, PLAN_LIMITS } from '@/lib/plans';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Project {
  id: string;
  title: string;
  updatedAt: string;
  description?: string;
}

export default function SettingsPage() {
  const { user, logout, token } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => {
    if (activeTab === 'projects' && token) {
      const fetchProjects = async () => {
        setIsLoadingProjects(true);
        try {
          const data = await api.get<{ success: boolean; projects: Project[] }>(
            '/api/projects',
            token
          );
          if (data.success) {
            setProjects(data.projects);
          }
        } catch (error) {
          console.error('Failed to fetch projects:', error);
          toast.error('Failed to load projects');
        } finally {
          setIsLoadingProjects(false);
        }
      };
      fetchProjects();
    }
  }, [activeTab, token]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-border bg-card/50 sticky top-0 z-50 flex items-center gap-4 border-b px-6 py-4 backdrop-blur-xl">
        <button
          onClick={() => router.back()}
          className="hover:bg-muted rounded-full p-2 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Account Settings</h1>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-12 p-8">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 space-y-2">
          <TabButton
            active={activeTab === 'profile'}
            icon={User}
            label="Profile"
            onClick={() => setActiveTab('profile')}
          />
          <TabButton
            active={activeTab === 'projects'}
            icon={LayoutGrid}
            label="My Projects"
            onClick={() => setActiveTab('projects')}
          />
          <TabButton
            active={activeTab === 'billing'}
            icon={CreditCard}
            label="Plans & Billing"
            onClick={() => setActiveTab('billing')}
          />
          <TabButton
            active={activeTab === 'security'}
            icon={Shield}
            label="Security"
            onClick={() => setActiveTab('security')}
          />
          <TabButton
            active={activeTab === 'notifications'}
            icon={Bell}
            label="Notifications"
            onClick={() => setActiveTab('notifications')}
          />

          <div className="border-border mt-8 border-t pt-8">
            <button
              onClick={handleLogout}
              className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors"
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="max-w-2xl flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'profile' && (
              <div className="space-y-10">
                <div className="from-primary/20 via-primary/5 to-background border-border relative h-48 overflow-hidden rounded-3xl border bg-gradient-to-r">
                  <div className="bg-grid-white/10 absolute inset-0 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
                  <div className="absolute bottom-0 left-0 flex translate-y-1/2 items-end gap-6 p-8">
                    <div className="bg-primary text-primary-foreground ring-background flex h-32 w-32 items-center justify-center rounded-3xl text-5xl font-black shadow-2xl ring-8">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </div>
                </div>

                <div className="mt-16 flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic">
                      {user?.name || 'Architect'}
                    </h2>
                    <p className="text-muted-foreground flex items-center gap-2 font-medium">
                      <Mail size={14} />
                      {user?.email}
                    </p>
                  </div>
                  <button className="bg-foreground text-background shadow-foreground/10 rounded-full px-6 py-2 text-xs font-black tracking-widest uppercase shadow-xl transition-all hover:scale-105">
                    Edit Profile
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="border-border bg-card/30 space-y-4 rounded-2xl border p-6">
                    <h3 className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                      <User size={12} />
                      Account Details
                    </h3>
                    <div className="space-y-4">
                      <div className="grid gap-1">
                        <span className="text-muted-foreground text-[10px] font-bold uppercase">
                          Role
                        </span>
                        <p className="text-sm font-bold">Senior Systems Architect</p>
                      </div>
                      <div className="grid gap-1">
                        <span className="text-muted-foreground text-[10px] font-bold uppercase">
                          Member Since
                        </span>
                        <p className="text-sm font-bold">September 2025</p>
                      </div>
                    </div>
                  </div>
                  <div className="border-border bg-card/30 space-y-4 rounded-2xl border p-6">
                    <h3 className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                      <Globe size={12} />
                      Social Links
                    </h3>
                    <div className="flex gap-2">
                      <button className="bg-muted/50 hover:bg-primary/20 flex h-10 w-10 items-center justify-center rounded-xl transition-colors">
                        <Github size={18} />
                      </button>
                      <button className="bg-muted/50 hover:bg-primary/20 flex h-10 w-10 items-center justify-center rounded-xl transition-colors">
                        <Globe size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-10">
                <div>
                  <h2 className="mb-1 text-2xl font-bold">Plans & Subscription</h2>
                  <p className="text-muted-foreground text-sm">
                    Manage your architectural capabilities and billing history.
                  </p>
                </div>

                <div
                  className={cn(
                    'relative overflow-hidden rounded-3xl border p-10 shadow-2xl transition-all',
                    user?.plan === 'PREMIUM'
                      ? 'border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-transparent to-purple-500/5 shadow-purple-500/10'
                      : user?.plan === 'PRO'
                        ? 'border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-transparent to-blue-500/5 shadow-blue-500/10'
                        : 'border-border from-muted/50 to-muted/20 bg-gradient-to-br'
                  )}
                >
                  <div className="absolute top-0 right-0 p-8">
                    <span
                      className={cn(
                        'rounded-full px-4 py-2 text-[10px] font-black tracking-[0.2em] uppercase shadow-lg',
                        user?.subscriptionStatus === 'active'
                          ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                          : 'bg-zinc-500 text-white'
                      )}
                    >
                      {user?.subscriptionStatus || 'Incomplete'}
                    </span>
                  </div>

                  <div className="mb-8 flex flex-col gap-1">
                    <p className="text-muted-foreground text-[10px] font-black tracking-widest uppercase opacity-60">
                      Current Architecture Status
                    </p>
                    <h3 className="flex items-center gap-3 text-4xl font-black tracking-tighter uppercase italic">
                      {PLAN_LIMITS[(user?.plan as Plan) || Plan.FREE].label}
                      <span className="text-muted-foreground text-sm font-black not-italic opacity-40">
                        EDITION
                      </span>
                    </h3>
                  </div>

                  <div className="mb-10 grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm font-bold">
                        <div className="bg-primary h-2 w-2 rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                        <span>
                          {PLAN_LIMITS[(user?.plan as Plan) || Plan.FREE].maxProjects === -1
                            ? 'Unlimited'
                            : PLAN_LIMITS[(user?.plan as Plan) || Plan.FREE].maxProjects}{' '}
                          Projects
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm font-bold">
                        <div className="bg-primary h-2 w-2 rounded-full" />
                        <span>
                          {PLAN_LIMITS[(user?.plan as Plan) || Plan.FREE].agents.length} AI Agents
                        </span>
                      </div>
                    </div>
                    {user?.currentPeriodEnd && (
                      <div className="bg-foreground/5 border-foreground/5 rounded-2xl border p-4 backdrop-blur-sm">
                        <p className="text-muted-foreground mb-1 text-[10px] font-black tracking-widest uppercase">
                          Renewal Date
                        </p>
                        <p className="text-sm font-black">
                          {new Date(user.currentPeriodEnd).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <button className="bg-primary text-primary-foreground shadow-primary/30 rounded-full px-8 py-3 text-xs font-black tracking-widest uppercase shadow-xl transition-all hover:scale-105 active:scale-95">
                      Upgrade Plan
                    </button>
                    <button className="bg-muted hover:bg-muted/80 text-foreground rounded-full px-8 py-3 text-xs font-black tracking-widest uppercase transition-all">
                      Manage Payment Method
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase">
                    <CreditCard size={12} />
                    Payment History
                  </h3>

                  <div className="border-border bg-card/30 overflow-hidden rounded-2xl border">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead className="bg-muted/30 border-border border-b">
                        <tr>
                          <th className="px-6 py-4 font-black tracking-widest uppercase">Date</th>
                          <th className="px-6 py-4 font-black tracking-widest uppercase">
                            Description
                          </th>
                          <th className="px-6 py-4 text-right font-black tracking-widest uppercase">
                            Amount
                          </th>
                          <th className="px-6 py-4 text-right font-black tracking-widest uppercase">
                            Receipt
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-border/50 divide-y">
                        <tr className="hover:bg-muted/10 transition-colors">
                          <td className="text-muted-foreground px-6 py-4 font-mono">2026-01-27</td>
                          <td className="px-6 py-4 font-bold tracking-tight">
                            Architect Plan Subscription
                          </td>
                          <td className="px-6 py-4 text-right font-black">$49.00</td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-primary font-bold hover:underline">
                              Download
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td
                            colSpan={4}
                            className="text-muted-foreground px-6 py-10 text-center italic"
                          >
                            No further transactions found
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-8">
                <div>
                  <h2 className="mb-1 text-2xl font-bold">My Projects</h2>
                  <p className="text-muted-foreground text-sm">
                    View and manage your architectural designs and workspaces.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {isLoadingProjects ? (
                    <div className="text-muted-foreground bg-muted/20 border-border flex flex-col items-center justify-center rounded-2xl border border-dashed py-12">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="mb-4"
                      >
                        <LayoutGrid size={24} />
                      </motion.div>
                      <p className="text-sm">Loading projects...</p>
                    </div>
                  ) : projects.length > 0 ? (
                    projects.map((project) => (
                      <motion.div
                        key={project.id}
                        whileHover={{ scale: 1.01 }}
                        className="border-border bg-card/50 hover:bg-card hover:border-primary/30 group cursor-pointer rounded-2xl border p-6 transition-all"
                        onClick={() => router.push(`/dashboard/${project.id}`)}
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div>
                            <h3 className="group-hover:text-primary text-lg font-bold transition-colors">
                              {project.title}
                            </h3>
                            <p className="text-muted-foreground text-xs">
                              Last updated {new Date(project.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full">
                            <Globe size={14} />
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
                          {project.description ||
                            'System architecture design project exploring modern microservices and infrastructure scaling strategies.'}
                        </p>
                        <div className="border-border/50 flex items-center gap-4 border-t pt-4">
                          <span className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase">
                            <Check size={10} className="text-emerald-500" />
                            Analyzed
                          </span>
                          <span className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase">
                            <Check size={10} className="text-emerald-500" />
                            Designed
                          </span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="bg-muted/10 border-border flex flex-col items-center justify-center rounded-2xl border border-dashed py-20">
                      <LayoutGrid size={32} className="text-muted-foreground mb-4 opacity-20" />
                      <p className="text-muted-foreground mb-4 text-sm">No projects found</p>
                      <button
                        onClick={() => router.push('/dashboard')}
                        className="bg-primary text-primary-foreground shadow-primary/20 rounded-full px-6 py-2 text-xs font-bold transition-all hover:shadow-lg"
                      >
                        Create Your First Design
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8">
                <div>
                  <h2 className="mb-1 text-2xl font-bold">Security & Privacy</h2>
                  <p className="text-muted-foreground text-sm">
                    Protect your account and maintain architectural integrity.
                  </p>
                </div>

                <div className="border-border bg-card/50 space-y-6 rounded-2xl border p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold">Two-Factor Authentication</h3>
                        <p className="text-muted-foreground text-xs">
                          Add an extra layer of security to your account.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                      className={cn(
                        'focus-visible:ring-ring relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                        is2FAEnabled ? 'bg-primary' : 'bg-muted'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
                          is2FAEnabled ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>

                  <div className="border-border/50 border-t pt-6">
                    <h4 className="mb-4 text-sm font-bold">Update Password</h4>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <label className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                          Current Password
                        </label>
                        <input
                          type="password"
                          className="border-input bg-background/50 focus-visible:ring-primary flex h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-1"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                          New Password
                        </label>
                        <input
                          type="password"
                          className="border-input bg-background/50 focus-visible:ring-primary flex h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-1"
                        />
                      </div>
                      <div className="flex justify-end pt-2">
                        <button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg px-6 py-2 text-xs font-bold transition-all">
                          Update Password
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-border bg-card/30 space-y-4 rounded-2xl border p-6">
                  <h3 className="text-muted-foreground text-xs font-black tracking-widest uppercase">
                    Active Sessions
                  </h3>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <Globe size={14} className="text-muted-foreground" />
                      <div>
                        <p className="font-medium">Chrome on Linux</p>
                        <p className="text-muted-foreground text-[10px]">
                          Current session • active now
                        </p>
                      </div>
                    </div>
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-widest text-emerald-500 uppercase">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <Bell size={24} className="text-muted-foreground" />
                </div>
                <h3 className="mb-1 text-lg font-medium">Coming Soon</h3>
                <p className="text-muted-foreground text-sm">
                  Notification preferences are currently under development.
                </p>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function TabButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: any;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
        active
          ? 'bg-primary text-primary-foreground shadow-md'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}
