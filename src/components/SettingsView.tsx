/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Save,
  Database,
  ShieldAlert,
  User,
  CheckCircle,
  Users,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { userSchema, UserFormValues } from '../validation';
import { usersApi } from '../lib/api/users';
import { ApiError } from '../lib/api/http';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { useCRM } from '../context/CRMContext';
import { CRMUser } from '../types';

interface SettingsViewProps {
  onResetData: () => void;
  currentUser: { name: string; role: string };
  onUpdateCurrentUser: (name: string, role: string) => void;
}

const inputClasses =
  'w-full h-10 px-3 bg-background border border-border rounded-md outline-none text-xs text-foreground placeholder:text-muted-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus:border-primary';

export default function SettingsView({ onResetData, currentUser, onUpdateCurrentUser }: SettingsViewProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const { leads, deals, contacts, tasks, activities } = useCRM();

  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileRole, setProfileRole] = useState(currentUser.role);
  const [saveAlert, setSaveAlert] = useState(false);

  // currentUser resolves asynchronously (session check), so it's still the
  // "Guest" placeholder on first render — sync the form fields once the real
  // profile arrives instead of leaving them stuck on the initial mount value.
  useEffect(() => {
    setProfileName(currentUser.name);
    setProfileRole(currentUser.role);
  }, [currentUser.name, currentUser.role]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCurrentUser(profileName, profileRole);
    setSaveAlert(true);
    setTimeout(() => setSaveAlert(false), 3000);
  };

  // ---------------------------------------------------------------------
  // Team management
  // ---------------------------------------------------------------------
  const [members, setMembers] = useState<CRMUser[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setTeamLoading(true);
    usersApi
      .list()
      .then((list) => {
        if (!cancelled) setMembers(list);
      })
      .catch((error) => {
        showToast(error instanceof ApiError ? error.message : 'Could not load team members.', 'error');
      })
      .finally(() => {
        if (!cancelled) setTeamLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: '', email: '', role: '' },
  });

  const editForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: '', email: '', role: '' },
  });

  async function handleAddMember(values: UserFormValues) {
    try {
      const created = await usersApi.create(values);
      setMembers((prev) => [...prev, created]);
      showToast(`"${created.name}" added to the team.`, 'success');
      addForm.reset();
      setShowAddForm(false);
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Could not add team member.', 'error');
    }
  }

  function startEdit(member: CRMUser) {
    setEditingId(member.id);
    editForm.reset({ name: member.name, email: member.email, role: member.role });
  }

  function cancelEdit() {
    setEditingId(null);
    editForm.reset();
  }

  async function handleEditMember(values: UserFormValues) {
    if (!editingId) return;
    try {
      const updated = await usersApi.update(editingId, values);
      setMembers((prev) => prev.map((m) => (m.id === editingId ? updated : m)));
      showToast(`"${updated.name}" updated.`, 'success');
      cancelEdit();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Could not update team member.', 'error');
    }
  }

  async function handleRemoveMember(member: CRMUser) {
    const ok = await confirm({
      title: 'Remove team member',
      description: `Remove "${member.name}" from the team? They will no longer appear as an assignee option.`,
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    try {
      await usersApi.remove(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      showToast(`"${member.name}" removed.`, 'success');
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Could not remove team member.', 'error');
    }
  }

  // ---------------------------------------------------------------------
  // Data export / refresh / logout
  // ---------------------------------------------------------------------
  function handleExportData() {
    const state = JSON.stringify({ leads, deals, contacts, tasks, activities }, null, 2);
    const blob = new Blob([state], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `crm_workspace_export_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleLogout() {
    await logout();
    router.push('/auth');
  }

  return (
    <div className="space-y-6 max-w-2xl select-none text-xs text-foreground">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">System & Tenant Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile, your team, and workspace data.
        </p>
      </div>

      {saveAlert && (
        <div role="status" aria-live="polite" className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-md font-semibold flex items-center space-x-2.5">
          <CheckCircle className="h-4.5 w-4.5" />
          <span>Profile saved successfully.</span>
        </div>
      )}

      {/* Profile */}
      <Card className="border border-border rounded-lg overflow-hidden">
        <form onSubmit={handleSaveSettings}>
          <div className="p-5 space-y-5">
            <div className="pb-3 border-b border-border flex items-center space-x-2 font-bold text-foreground">
              <User className="h-4.5 w-4.5 text-primary" />
              <span className="text-xs uppercase tracking-wider">Your Profile</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="settings-profile-name" className="block font-semibold mb-1.5">User Profile Name</label>
                <input
                  id="settings-profile-name"
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="settings-profile-role" className="block font-semibold mb-1.5">Corporate Position Title</label>
                <input
                  id="settings-profile-role"
                  type="text"
                  value={profileRole}
                  onChange={(e) => setProfileRole(e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-border bg-muted/50 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Saved to your account and synced across sessions</span>
            <Button
              type="submit"
              className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="h-4 w-4" />
              Save Profile
            </Button>
          </div>
        </form>
      </Card>

      {/* Team management */}
      <Card className="border border-border rounded-lg overflow-hidden">
        <CardHeader className="px-5 pb-3 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-foreground">
            <Users className="h-4.5 w-4.5 text-primary" />
            Team Members
          </CardTitle>
          <CardDescription className="text-xs">
            People in your workspace who can be assigned leads, deals, and tasks.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pt-4 pb-5 space-y-3">
          {teamLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading team members…
            </div>
          ) : (
            <ul className="space-y-2">
              {members.map((member) => (
                <li key={member.id} className="border border-border rounded-md p-3">
                  {editingId === member.id ? (
                    <form onSubmit={editForm.handleSubmit(handleEditMember)} className="space-y-2.5" noValidate>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label htmlFor={`edit-name-${member.id}`} className="sr-only">Name</label>
                          <input
                            id={`edit-name-${member.id}`}
                            type="text"
                            {...editForm.register('name')}
                            className={inputClasses}
                            placeholder="Name"
                          />
                          {editForm.formState.errors.name && (
                            <p className="mt-1 text-[11px] text-destructive">{editForm.formState.errors.name.message}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor={`edit-email-${member.id}`} className="sr-only">Email</label>
                          <input
                            id={`edit-email-${member.id}`}
                            type="email"
                            {...editForm.register('email')}
                            className={inputClasses}
                            placeholder="Email"
                          />
                          {editForm.formState.errors.email && (
                            <p className="mt-1 text-[11px] text-destructive">{editForm.formState.errors.email.message}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor={`edit-role-${member.id}`} className="sr-only">Role</label>
                          <input
                            id={`edit-role-${member.id}`}
                            type="text"
                            {...editForm.register('role')}
                            className={inputClasses}
                            placeholder="Role"
                          />
                          {editForm.formState.errors.role && (
                            <p className="mt-1 text-[11px] text-destructive">{editForm.formState.errors.role.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={editForm.formState.isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                          {editForm.formState.isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          Save
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold',
                            member.avatarColor
                          )}
                          aria-hidden="true"
                        >
                          {member.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
                            {member.name}
                            {user?.id === member.id && (
                              <span className="text-[10px] font-normal text-muted-foreground">(you)</span>
                            )}
                          </div>
                          <div className="text-muted-foreground truncate">{member.email} · {member.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${member.name}`}
                          onClick={() => startEdit(member)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${member.name}`}
                          onClick={() => handleRemoveMember(member)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
              {members.length === 0 && (
                <li className="text-muted-foreground text-center py-4">No team members yet.</li>
              )}
            </ul>
          )}

          {showAddForm ? (
            <form onSubmit={addForm.handleSubmit(handleAddMember)} className="border border-border rounded-md p-3 space-y-2.5" noValidate>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="add-member-name" className="block font-semibold mb-1">Name</label>
                  <input id="add-member-name" type="text" {...addForm.register('name')} className={inputClasses} placeholder="Jordan Lee" />
                  {addForm.formState.errors.name && (
                    <p className="mt-1 text-[11px] text-destructive">{addForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="add-member-email" className="block font-semibold mb-1">Email</label>
                  <input id="add-member-email" type="email" {...addForm.register('email')} className={inputClasses} placeholder="jordan@company.com" />
                  {addForm.formState.errors.email && (
                    <p className="mt-1 text-[11px] text-destructive">{addForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="add-member-role" className="block font-semibold mb-1">Role</label>
                  <input id="add-member-role" type="text" {...addForm.register('role')} className={inputClasses} placeholder="Account Executive" />
                  {addForm.formState.errors.role && (
                    <p className="mt-1 text-[11px] text-destructive">{addForm.formState.errors.role.message}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    addForm.reset();
                    setShowAddForm(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={addForm.formState.isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5">
                  {addForm.formState.isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Add member
                </Button>
              </div>
            </form>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add team member
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Workspace data */}
      <Card className="border border-border rounded-lg p-5 space-y-4">
        <div className="pb-2 border-b border-border flex items-center space-x-2 text-destructive font-bold">
          <ShieldAlert className="h-4.5 w-4.5" />
          <span className="text-xs uppercase tracking-wider">Workspace Data</span>
        </div>

        <p className="leading-relaxed text-muted-foreground">
          Refresh pulls the latest leads, deals, contacts, tasks, and activity from the server — it does not delete or
          overwrite anything. Export downloads a snapshot of your current workspace data as JSON.
        </p>

        <div className="flex flex-col sm:flex-row gap-3.5">
          <Button
            type="button"
            variant="outline"
            onClick={onResetData}
            className="px-4 py-2.5 rounded-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 text-primary" />
            Refresh Workspace Data
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleExportData}
            className="px-4 py-2.5 rounded-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Database className="h-3.5 w-3.5 text-primary" />
            Export Workspace Data (JSON)
          </Button>
        </div>
      </Card>

      {/* Session */}
      <Card className="border border-border rounded-lg p-5 space-y-4">
        <div className="pb-2 border-b border-border flex items-center space-x-2 font-bold text-foreground">
          <LogOut className="h-4.5 w-4.5 text-primary" />
          <span className="text-xs uppercase tracking-wider">Session</span>
        </div>
        <p className="leading-relaxed text-muted-foreground">
          Signed in as <span className="font-semibold text-foreground">{user?.email ?? 'unknown'}</span>.
        </p>
        <Button
          type="button"
          variant="destructive"
          onClick={handleLogout}
          className="px-4 py-2.5 rounded-md flex items-center justify-center gap-1.5 cursor-pointer w-fit"
        >
          <LogOut className="h-3.5 w-3.5" />
          Log out
        </Button>
      </Card>
    </div>
  );
}
