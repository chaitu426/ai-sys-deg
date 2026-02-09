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

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  plan: string;
  paymentMethod?: string;
  receiptUrl?: string;
  createdAt: string;
}

export default function SettingsPage() {
  const { user, logout, token } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => {
    if (activeTab === 'projects' && token && projects.length === 0) {
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

    if (activeTab === 'billing' && token && payments.length === 0) {
      const fetchPayments = async () => {
        setIsLoadingPayments(true);
        try {
          const data = await api.get<{ success: boolean; payments: Payment[] }>(
            '/api/payments',
            token
          );
          if (data.success) {
            setPayments(data.payments);
          }
        } catch (error) {
          console.error('Failed to fetch payments:', error);
        } finally {
          setIsLoadingPayments(false);
        }
      };
      fetchPayments();
    }
  }, [activeTab, token, projects.length, payments.length]);

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
        <aside className="w-72 flex-shrink-0 space-y-1">
          <div className="mb-6 px-4">
            <p className="text-muted-foreground text-[10px] font-black tracking-[0.2em] uppercase opacity-50">
              Personal Setup
            </p>
          </div>
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

          <div className="pt-6 pb-2 px-4">
            <p className="text-muted-foreground text-[10px] font-black tracking-[0.2em] uppercase opacity-50">
              Workspace
            </p>
          </div>
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

          <div className="mt-12 px-2">
            <button
              onClick={handleLogout}
              className="group hover:bg-destructive/5 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-zinc-500 transition-all hover:text-destructive"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 transition-colors group-hover:bg-destructive/10 group-hover:text-destructive">
                <LogOut size={16} />
              </div>
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
                  <div className="bg-grid-white/[0.03] absolute inset-0 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
                  <div className="absolute bottom-0 left-0 flex translate-y-1/2 items-end gap-6 p-8">
                    <div className="bg-zinc-900 text-zinc-100 ring-background flex h-32 w-32 items-center justify-center rounded-3xl text-5xl font-black shadow-2xl ring-8 border border-white/10">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </div>
                </div>

                <div className="mt-16 flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic text-zinc-100">
                      {user?.name || 'Architect'}
                    </h2>
                    <p className="text-muted-foreground flex items-center gap-2 font-medium">
                      <Mail size={14} />
                      {user?.email}
                    </p>
                  </div>
                  <button className="bg-zinc-100 text-zinc-900 shadow-zinc-100/10 rounded-full px-6 py-2 text-xs font-black tracking-widest uppercase shadow-xl transition-all hover:scale-105 active:scale-95">
                    Update Profile
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="border-white/5 bg-zinc-900/50 space-y-4 rounded-2xl border p-6 backdrop-blur-md">
                    <h3 className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase opacity-60">
                      <User size={12} />
                      Account Pulse
                    </h3>
                    <div className="space-y-4">
                      <div className="grid gap-1">
                        <span className="text-muted-foreground text-[10px] font-bold uppercase opacity-50">
                          Primary Role
                        </span>
                        <p className="text-sm font-bold text-zinc-200">Systems Architect</p>
                      </div>
                      <div className="grid gap-1">
                        <span className="text-muted-foreground text-[10px] font-bold uppercase opacity-50">
                          Deployment Date
                        </span>
                        <p className="text-sm font-bold text-zinc-200">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric'
                          }) : 'Sept 2025'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border-white/5 bg-zinc-900/50 space-y-4 rounded-2xl border p-6 backdrop-blur-md">
                    <h3 className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase opacity-60">
                      <Globe size={12} />
                      Connected Grid
                    </h3>
                    <div className="flex gap-2">
                      <button className="bg-zinc-800/50 hover:bg-primary/20 flex h-10 w-10 items-center justify-center rounded-xl transition-all border border-white/5 hover:border-primary/30">
                        <Github size={18} />
                      </button>
                      <button className="bg-zinc-800/50 hover:bg-primary/20 flex h-10 w-10 items-center justify-center rounded-xl transition-all border border-white/5 hover:border-primary/30">
                        <Globe size={18} />
                      </button>
                    </div>
                    <p className="text-muted-foreground text-[10px] font-medium leading-relaxed opacity-50">
                      Sync your architectural portfolio with external services.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-10">
                <div>
                  <h2 className="mb-1 text-2xl font-bold text-zinc-100">Plans & Subscription</h2>
                  <p className="text-muted-foreground text-sm">
                    Manage your architectural capabilities and billing history.
                  </p>
                </div>

                <div
                  className={cn(
                    'relative overflow-hidden rounded-3xl border p-10 shadow-2xl transition-all duration-500 border-white/5 bg-gradient-to-br from-zinc-900/50 to-black/50 backdrop-blur-xl'
                  )}
                >
                  <div className="absolute top-0 right-0 p-8">
                    <span
                      className={cn(
                        'rounded-full px-4 py-1.5 text-[9px] font-black tracking-[0.2em] uppercase shadow-lg border backdrop-blur-md',
                        user?.subscriptionStatus === 'active'
                          ? 'bg-white/10 text-white border-white/20'
                          : 'bg-zinc-500/10 text-zinc-400 border-white/5'
                      )}
                    >
                      {user?.subscriptionStatus || 'Trial'}
                    </span>
                  </div>

                  <div className="mb-8 flex flex-col gap-1">
                    <p className="text-muted-foreground text-[10px] font-black tracking-widest uppercase opacity-40">
                      Active Strategy
                    </p>
                    <h3 className="flex items-center gap-3 text-4xl font-black tracking-tighter uppercase italic text-zinc-100">
                      {PLAN_LIMITS[(user?.plan as Plan) || Plan.FREE].label}
                      <span className="text-muted-foreground text-xs font-black not-italic opacity-20">
                        SYSTEM
                      </span>
                    </h3>
                  </div>

                  <div className="mb-10 grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm font-bold text-zinc-300">
                        <div className="bg-white h-1.5 w-1.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                        <span>
                          {PLAN_LIMITS[(user?.plan as Plan) || Plan.FREE].maxProjects === -1
                            ? 'Unlimited'
                            : PLAN_LIMITS[(user?.plan as Plan) || Plan.FREE].maxProjects}{' '}
                          Projects
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm font-bold text-zinc-300">
                        <div className="bg-white h-1.5 w-1.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                        <span>
                          {PLAN_LIMITS[(user?.plan as Plan) || Plan.FREE].agents.length} Agent Suites
                        </span>
                      </div>
                    </div>
                    {user?.currentPeriodEnd && (
                      <div className="bg-white/5 border-white/5 rounded-2xl border p-4 backdrop-blur-sm">
                        <p className="text-muted-foreground mb-1 text-[10px] font-black tracking-widest uppercase opacity-50">
                          Next Iteration
                        </p>
                        <p className="text-sm font-black text-zinc-200">
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
                    <button className="bg-zinc-100 text-zinc-900 shadow-zinc-100/10 rounded-full px-8 py-2.5 text-xs font-black tracking-widest uppercase shadow-xl transition-all hover:scale-105 active:scale-95">
                      Change Strategy
                    </button>
                    <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/5 rounded-full px-8 py-2.5 text-xs font-black tracking-widest uppercase transition-all">
                      Billing Portal
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase opacity-60">
                    <CreditCard size={12} />
                    Transaction Ledger
                  </h3>

                  <div className="border-white/5 bg-zinc-900/30 overflow-hidden rounded-2xl border backdrop-blur-sm">
                    {isLoadingPayments ? (
                      <div className="p-12 text-center">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="inline-block mb-2">
                          <CreditCard size={20} className="text-muted-foreground opacity-20" />
                        </motion.div>
                        <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase opacity-40">Decrypting ledger...</p>
                      </div>
                    ) : payments.length > 0 ? (
                      <table className="w-full border-collapse text-left text-xs">
                        <thead className="bg-white/5 border-white/5 border-b">
                          <tr>
                            <th className="px-6 py-4 font-black tracking-widest uppercase text-zinc-500">Date</th>
                            <th className="px-6 py-4 font-black tracking-widest uppercase text-zinc-500">Strategy</th>
                            <th className="px-6 py-4 text-right font-black tracking-widest uppercase text-zinc-500">Credits</th>
                            <th className="px-6 py-4 text-right font-black tracking-widest uppercase text-zinc-500">Invoice</th>
                          </tr>
                        </thead>
                        <tbody className="divide-white/5 divide-y">
                          {payments.map((p) => (
                            <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="text-muted-foreground px-6 py-4 font-mono opacity-60 group-hover:opacity-100 transition-opacity">
                                {new Date(p.createdAt).toISOString().split('T')[0]}
                              </td>
                              <td className="px-6 py-4 font-bold tracking-tight text-zinc-200">
                                {p.plan} Edition
                              </td>
                              <td className="px-6 py-4 text-right font-black text-zinc-100">
                                ${p.amount.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {p.receiptUrl ? (
                                  <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">
                                    Download
                                  </a>
                                ) : (
                                  <span className="text-zinc-600 font-bold italic">Generated</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-muted-foreground px-6 py-10 text-center italic text-[11px] opacity-40">
                        No transactions found in this dimension
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-8">
                <div>
                  <h2 className="mb-1 text-2xl font-bold text-zinc-100">My Projects</h2>
                  <p className="text-muted-foreground text-sm">
                    View and manage your architectural designs and workspaces.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {isLoadingProjects ? (
                    <div className="text-muted-foreground bg-zinc-900/30 border-white/5 flex flex-col items-center justify-center rounded-2xl border border-dashed py-12 backdrop-blur-sm">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="mb-4 text-primary"
                      >
                        <LayoutGrid size={24} />
                      </motion.div>
                      <p className="text-[10px] font-black tracking-widest uppercase opacity-40">Scanning archives...</p>
                    </div>
                  ) : projects.length > 0 ? (
                    projects.map((project) => (
                      <motion.div
                        key={project.id}
                        whileHover={{ y: -2 }}
                        className="border-white/5 bg-zinc-900/40 hover:bg-zinc-800/50 hover:border-primary/30 group cursor-pointer rounded-2xl border p-6 transition-all backdrop-blur-md"
                        onClick={() => router.push(`/dashboard/${project.id}`)}
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="group-hover:text-primary text-lg font-bold transition-colors text-zinc-100">
                              {project.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-white/50" />
                              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider opacity-60">
                                Last sync {new Date(project.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="bg-zinc-800/80 text-zinc-400 group-hover:text-primary group-hover:bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl transition-all border border-white/5 group-hover:border-primary/20">
                            <ArrowLeft className="rotate-[135deg]" size={14} />
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-6 line-clamp-2 text-sm leading-relaxed opacity-70">
                          {project.description ||
                            'Architectural blueprint exploring systemic dependencies, infrastructure scaling, and high-availability patterns.'}
                        </p>
                        <div className="border-white/5 flex items-center gap-4 border-t pt-4">
                          <span className="text-muted-foreground flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase opacity-50">
                            <Check size={10} />
                            Blueprint Validated
                          </span>
                          <span className="text-muted-foreground flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase opacity-50">
                            <Check size={10} />
                            Agents Synced
                          </span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="bg-zinc-900/10 border-white/5 flex flex-col items-center justify-center rounded-3xl border border-dashed py-20 backdrop-blur-sm">
                      <div className="bg-zinc-800/50 p-6 rounded-full mb-6 border border-white/5">
                        <LayoutGrid size={32} className="text-zinc-700" />
                      </div>
                      <p className="text-zinc-500 mb-6 text-sm font-medium">Your architectural digital twin is empty</p>
                      <button
                        onClick={() => router.push('/dashboard')}
                        className="bg-zinc-100 text-zinc-900 shadow-zinc-100/10 rounded-full px-10 py-3 text-xs font-black tracking-widest uppercase transition-all hover:scale-105 active:scale-95 shadow-xl"
                      >
                        Create First System
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8">
                <div>
                  <h2 className="mb-1 text-2xl font-bold text-zinc-100">Security Infrastructure</h2>
                  <p className="text-muted-foreground text-sm">
                    Configure access controls and authentication protocols.
                  </p>
                </div>

                <div className="border-white/5 bg-zinc-900/50 space-y-8 rounded-3xl border p-8 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="flex items-center gap-2 text-sm font-black tracking-widest uppercase text-zinc-200">
                        <ShieldCheck size={14} className="text-white" />
                        Multi-Factor Auth
                      </h4>
                      <p className="text-muted-foreground text-[11px] font-medium opacity-60">
                        Add an extra layer of encryption to your architectural workspace.
                      </p>
                    </div>
                    <button
                      onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ring-2 ring-white/5',
                        is2FAEnabled ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-zinc-800'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-xl',
                          is2FAEnabled ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>

                  <div className="border-white/5 border-t pt-8">
                    <h4 className="mb-6 text-sm font-black tracking-widest uppercase text-zinc-200">Access Credentials</h4>
                    <div className="space-y-6">
                      <div className="grid gap-2">
                        <label className="text-muted-foreground text-[10px] font-black tracking-widest uppercase opacity-50">
                          Current Matrix Password
                        </label>
                        <input
                          type="password"
                          className="border-white/5 bg-zinc-950/50 focus:border-primary/50 flex h-11 w-full rounded-xl border px-4 py-2 text-sm outline-none transition-all focus:bg-zinc-950"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-muted-foreground text-[10px] font-black tracking-widest uppercase opacity-50">
                          New Secure Protocol
                        </label>
                        <input
                          type="password"
                          className="border-white/5 bg-zinc-950/50 focus:border-primary/50 flex h-11 w-full rounded-xl border px-4 py-2 text-sm outline-none transition-all focus:bg-zinc-950"
                        />
                      </div>
                      <div className="flex justify-end pt-2">
                        <button className="bg-zinc-100 text-zinc-900 rounded-full px-8 py-2.5 text-xs font-black tracking-widest uppercase transition-all hover:scale-105 active:scale-95 shadow-xl shadow-zinc-100/10">
                          Sync New Credentials
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-white/5 bg-zinc-900/50 space-y-6 rounded-3xl border p-8 backdrop-blur-md">
                  <h3 className="text-muted-foreground flex items-center gap-2 text-[10px] font-black tracking-widest uppercase opacity-60">
                    <Shield size={12} />
                    Active Access Matrix
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-zinc-800 flex h-10 w-10 items-center justify-center rounded-xl border border-white/5">
                        <Globe size={16} className="text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-zinc-200">Chrome on Linux</p>
                        <p className="text-muted-foreground text-[10px] font-medium opacity-50">
                          Primary Node • Active Session
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[9px] font-black tracking-widest text-white uppercase border border-white/20">
                      Authorized
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                <div className="bg-zinc-900/50 border-white/5 mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border backdrop-blur-sm">
                  <Bell size={32} className="text-zinc-700" />
                </div>
                <h3 className="mb-2 text-xl font-black tracking-tighter uppercase italic text-zinc-200">Coming Soon</h3>
                <p className="text-muted-foreground max-w-xs text-xs font-medium leading-relaxed opacity-60">
                  Real-time notification synchronization is currently being established in our next iteration.
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
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300',
        active
          ? 'bg-zinc-800 text-zinc-100 shadow-xl shadow-black/20'
          : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-300',
          active
            ? 'border-white/20 bg-white/10 text-white'
            : 'border-zinc-800 bg-zinc-900/50 text-zinc-500 group-hover:bg-zinc-800 group-hover:text-zinc-300'
        )}
      >
        <Icon size={16} />
      </div>
      {label}
      {active && (
        <motion.div
          layoutId="tab-active"
          className="bg-white absolute right-2 h-1.5 w-1.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
        />
      )}
    </button>
  );
}
