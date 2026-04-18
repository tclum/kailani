'use client';
import { useEffect, useState } from 'react';
import { Star, Trash2, Plus, X, Search } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface SpotlightUser {
  id: string;
  role: string;
  modelProfile?: { displayName: string; profileImage: string | null; location: string | null };
  photographerProfile?: { displayName: string; profileImage: string | null; location: string | null };
  brandProfile?: { brandName: string; logoUrl: string | null; location: string | null };
}

interface Spotlight {
  id: string;
  userId: string;
  type: string;
  reason: string;
  weekOf: string;
  user: SpotlightUser;
}

interface UserRow {
  id: string;
  email: string;
  role: string;
  modelProfile?: { displayName: string };
  photographerProfile?: { displayName: string };
  brandProfile?: { brandName: string };
}

function displayName(u: SpotlightUser | UserRow): string {
  if ('modelProfile' in u && u.modelProfile) return u.modelProfile.displayName;
  if ('photographerProfile' in u && u.photographerProfile) return u.photographerProfile.displayName;
  if ('brandProfile' in u && u.brandProfile) return u.brandProfile.brandName;
  if ('email' in u) return u.email;
  return 'Unknown';
}

const SPOTLIGHT_TYPES = ['model', 'brand', 'photographer', 'rising_star', 'featured'];

export default function AdminSpotlightsPage() {
  const [spotlights, setSpotlights] = useState<Spotlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [spotlightType, setSpotlightType] = useState('model');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const data = await apiFetch<Spotlight[]>('/api/spotlights/current');
      setSpotlights(data);
    } catch { /* empty */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function loadUsers(q: string) {
    if (q.length < 2) { setUsers([]); return; }
    try {
      const data = await apiFetch<{ users: UserRow[] }>(`/api/admin/users?search=${encodeURIComponent(q)}&page=1`);
      setUsers(data.users);
    } catch { /* empty */ }
  }

  async function handleCreate() {
    if (!selectedUser || !reason.trim()) return;
    setSaving(true);
    try {
      await apiFetch('/api/spotlights', {
        method: 'POST',
        body: JSON.stringify({ userId: selectedUser.id, type: spotlightType, reason: reason.trim() }),
      });
      setShowModal(false);
      setSelectedUser(null);
      setReason('');
      setUserSearch('');
      setUsers([]);
      load();
    } catch { /* empty */ }
    setSaving(false);
  }

  async function handleDelete(userId: string) {
    if (!confirm('Remove this spotlight?')) return;
    await apiFetch(`/api/spotlights/${userId}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Star size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Weekly Spotlights</h1>
            <p className="text-sm text-muted-foreground">Feature outstanding members on the homepage</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}
        >
          <Plus size={15} /> Add Spotlight
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 border-pink-300 border-t-pink-600 animate-spin" />
        </div>
      ) : spotlights.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center space-y-3">
          <Star size={32} className="text-muted-foreground mx-auto" />
          <p className="font-semibold">No spotlights this week</p>
          <p className="text-sm text-muted-foreground">Add spotlights to feature members on the homepage.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {spotlights.map((s) => (
            <SpotlightCard key={s.id} spotlight={s} onDelete={() => handleDelete(s.userId)} />
          ))}
        </div>
      )}

      {/* Add modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Add Spotlight</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>

            {/* User search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select User</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); loadUsers(e.target.value); setSelectedUser(null); }}
                  className="w-full h-9 pl-8 pr-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
              {users.length > 0 && !selectedUser && (
                <div className="rounded-xl border overflow-hidden max-h-44 overflow-y-auto">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedUser(u); setUsers([]); setSpotlightType(u.role.toLowerCase()); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors border-b last:border-b-0"
                    >
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{u.role}</span>
                      <span className="font-medium">{displayName(u)}</span>
                      <span className="text-muted-foreground text-xs truncate">{u.email}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedUser && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-50 dark:bg-pink-950/20 border border-pink-200 text-sm">
                  <span className="font-semibold text-pink-600">{displayName(selectedUser)}</span>
                  <span className="text-muted-foreground text-xs">{selectedUser.email}</span>
                  <button onClick={() => setSelectedUser(null)} className="ml-auto text-muted-foreground hover:text-foreground"><X size={14} /></button>
                </div>
              )}
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Spotlight Type</label>
              <select
                value={spotlightType}
                onChange={(e) => setSpotlightType(e.target.value)}
                className="w-full h-9 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              >
                {SPOTLIGHT_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </select>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Why are they featured?</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Outstanding editorial portfolio and professional reputation…"
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 h-9 rounded-xl border text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!selectedUser || !reason.trim() || saving}
                className="flex-1 h-9 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
                style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}
              >
                {saving ? 'Saving…' : 'Feature Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SpotlightCard({ spotlight, onDelete }: { spotlight: Spotlight; onDelete: () => void }) {
  const u = spotlight.user;
  const name = displayName(u);
  const img = u.modelProfile?.profileImage ?? u.photographerProfile?.profileImage ?? u.brandProfile?.logoUrl ?? null;
  const location = u.modelProfile?.location ?? u.photographerProfile?.location ?? u.brandProfile?.location ?? null;

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-200 to-amber-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={name} className="w-full h-full object-cover" />
          ) : (
            <Star size={20} className="text-amber-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{name}</p>
          {location && <p className="text-xs text-muted-foreground truncate">{location}</p>}
          <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            {spotlight.type.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <button onClick={onDelete} className="text-muted-foreground hover:text-red-500 transition-colors p-1">
          <Trash2 size={15} />
        </button>
      </div>
      <p className="text-xs text-muted-foreground italic line-clamp-2">"{spotlight.reason}"</p>
    </div>
  );
}
