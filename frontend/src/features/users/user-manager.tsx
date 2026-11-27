"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { useUserMutations, useUsers } from "@/hooks/use-users";
import { getApiErrorMessage } from "@/lib/api";
import { userCreateSchema, userSchema } from "@/lib/validation";
import { toast } from "@/stores/toast-store";
import type { User, UserInput } from "@/types/user";
import { formatDate } from "@/utils/format";

export function UserManager() {
  const users = useUsers();
  const mutations = useUserMutations();
  const [editing, setEditing] = useState<User | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const busy = mutations.create.isPending || mutations.update.isPending || mutations.remove.isPending;
  async function remove(user: User) { if (!window.confirm(`Delete “${user.name}”? This cannot be undone.`)) return; try { await mutations.remove.mutateAsync(user.id); toast.success("User deleted."); } catch (error) { toast.error(getApiErrorMessage(error)); } }
  if (users.isPending) return <LoadingSkeleton rows={5} />;
  if (users.isError) return <ErrorState onRetry={() => users.refetch()} />;
  if (!users.data?.length) return <EmptyState type="users" title="No users yet" description="Create a user account to give your team access." action={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus aria-hidden className="size-4" />New user</Button>} />;
  return <><div className="mb-5 flex justify-end"><Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus aria-hidden className="size-4" />New user</Button></div><Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3 font-semibold">User</th><th className="px-5 py-3 font-semibold">Roles</th><th className="px-5 py-3 font-semibold">Joined</th><th className="px-5 py-3 text-right font-semibold">Actions</th></tr></thead><tbody className="divide-y divide-border">{users.data.map((user) => <tr key={user.id} className="hover:bg-surface/60"><td className="px-5 py-4"><p className="font-semibold">{user.name}</p><p className="mt-1 text-xs text-muted-foreground">{user.email}</p></td><td className="px-5 py-4"><div className="flex gap-1">{user.roles.map((role) => <Badge key={role} tone={role === "ADMIN" ? "primary" : "neutral"}>{role}</Badge>)}</div></td><td className="px-5 py-4 text-muted-foreground">{formatDate(user.createdAt)}</td><td className="px-5 py-4"><div className="flex justify-end gap-1"><Button aria-label={`Edit ${user.name}`} size="sm" variant="ghost" onClick={() => { setEditing(user); setFormOpen(true); }}><Pencil aria-hidden className="size-4" /></Button><Button aria-label={`Delete ${user.name}`} size="sm" variant="ghost" disabled={busy} onClick={() => remove(user)}><Trash2 aria-hidden className="size-4 text-danger" /></Button></div></td></tr>)}</tbody></table></div></Card>{formOpen && <UserForm user={editing} onClose={() => setFormOpen(false)} />}</>;
}

function UserForm({ user, onClose }: { user: User | null; onClose: () => void }) {
  const mutations = useUserMutations();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<UserInput>({ resolver: zodResolver(user ? userSchema : userCreateSchema), defaultValues: { name: user?.name ?? "", email: user?.email ?? "", password: "", roles: user?.roles ?? ["USER"] } });
  async function submit(values: UserInput) { try { const input = { ...values, password: values.password || undefined }; if (user) { await mutations.update.mutateAsync({ id: user.id, input }); toast.success("User updated."); } else { await mutations.create.mutateAsync(input); toast.success("User created."); } onClose(); } catch (error) { toast.error(getApiErrorMessage(error)); } }
  return <Modal title={user ? "Edit user" : "New user"} onClose={onClose}><form noValidate onSubmit={handleSubmit(submit)} className="space-y-4"><Field label="Full name" error={errors.name?.message}><Input autoFocus {...register("name")} /></Field><Field label="Email address" error={errors.email?.message}><Input type="email" disabled={Boolean(user)} {...register("email")} /></Field><Field label={user ? "New password (not supported by this API)" : "Password"} error={errors.password?.message}>{user ? <Input disabled placeholder="Password changes are unavailable here" /> : <Input type="password" autoComplete="new-password" {...register("password")} />}</Field><fieldset className="space-y-2"><legend className="text-sm font-medium">Roles</legend><label className="flex items-center gap-2 text-sm"><input type="checkbox" value="USER" {...register("roles")} />User</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" value="ADMIN" {...register("roles")} />Administrator</label>{errors.roles?.message && <span role="alert" className="block text-xs text-danger">{errors.roles.message}</span>}</fieldset><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={isSubmitting}>{user ? "Save changes" : "Create user"}</Button></div></form></Modal>;
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) { return <label className="block space-y-1.5"><span className="text-sm font-medium">{label}</span>{children}{error && <span role="alert" className="block text-xs text-danger">{error}</span>}</label>; }
