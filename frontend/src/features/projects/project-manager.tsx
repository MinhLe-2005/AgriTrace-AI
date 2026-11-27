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
import { Select } from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { useProjectMutations, useProjects } from "@/hooks/use-projects";
import { getApiErrorMessage } from "@/lib/api";
import { projectSchema } from "@/lib/validation";
import { toast } from "@/stores/toast-store";
import type { Project, ProjectInput, ProjectStatus } from "@/types/project";
import { formatDate } from "@/utils/format";

const statusTone: Record<ProjectStatus, "neutral" | "primary" | "warning" | "success"> = { PLANNING: "neutral", ACTIVE: "primary", ON_HOLD: "warning", COMPLETED: "success" };

export function ProjectManager() {
  const projects = useProjects();
  const mutations = useProjectMutations();
  const [editing, setEditing] = useState<Project | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const busy = mutations.create.isPending || mutations.update.isPending || mutations.remove.isPending;

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(project: Project) { setEditing(project); setFormOpen(true); }
  async function remove(project: Project) {
    if (!window.confirm(`Delete “${project.name}”? This cannot be undone.`)) return;
    try { await mutations.remove.mutateAsync(project.id); toast.success("Project deleted."); } catch (error) { toast.error(getApiErrorMessage(error)); }
  }

  if (projects.isPending) return <LoadingSkeleton rows={5} />;
  if (projects.isError) return <ErrorState onRetry={() => projects.refetch()} />;
  if (!projects.data?.length) return <EmptyState title="No projects yet" description="Create your first project to start tracking work." action={<Button onClick={openCreate}><Plus aria-hidden className="size-4" />New project</Button>} />;

  return <><div className="mb-5 flex justify-end"><Button onClick={openCreate}><Plus aria-hidden className="size-4" />New project</Button></div><Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3 font-semibold">Project</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Owner</th><th className="px-5 py-3 font-semibold">Created</th><th className="px-5 py-3 text-right font-semibold">Actions</th></tr></thead><tbody className="divide-y divide-border">{projects.data.map((project) => <tr key={project.id} className="hover:bg-surface/60"><td className="px-5 py-4"><p className="font-semibold">{project.name}</p>{project.description && <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">{project.description}</p>}</td><td className="px-5 py-4"><Badge tone={statusTone[project.status]}>{project.status.replace("_", " ")}</Badge></td><td className="px-5 py-4 text-muted-foreground">{project.ownerName ?? "—"}</td><td className="px-5 py-4 text-muted-foreground">{formatDate(project.createdAt)}</td><td className="px-5 py-4"><div className="flex justify-end gap-1"><Button aria-label={`Edit ${project.name}`} size="sm" variant="ghost" onClick={() => openEdit(project)}><Pencil aria-hidden className="size-4" /></Button><Button aria-label={`Delete ${project.name}`} size="sm" variant="ghost" disabled={busy} onClick={() => remove(project)}><Trash2 aria-hidden className="size-4 text-danger" /></Button></div></td></tr>)}</tbody></table></div></Card>{formOpen && <ProjectForm project={editing} onClose={() => setFormOpen(false)} />}</>;
}

function ProjectForm({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const mutations = useProjectMutations();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProjectInput>({ resolver: zodResolver(projectSchema), defaultValues: { name: project?.name ?? "", description: project?.description ?? "", status: project?.status ?? "PLANNING" } });
  async function submit(input: ProjectInput) {
    try {
      if (project) { await mutations.update.mutateAsync({ id: project.id, input }); toast.success("Project updated."); } else { await mutations.create.mutateAsync(input); toast.success("Project created."); }
      onClose();
    } catch (error) { toast.error(getApiErrorMessage(error)); }
  }
  return <Modal title={project ? "Edit project" : "New project"} onClose={onClose}><form noValidate onSubmit={handleSubmit(submit)} className="space-y-4"><Field label="Project name" error={errors.name?.message}><Input autoFocus {...register("name")} /></Field><Field label="Description" error={errors.description?.message}><textarea className="min-h-24 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" {...register("description")} /></Field><Field label="Status" error={errors.status?.message}><Select {...register("status")}><option value="PLANNING">Planning</option><option value="ACTIVE">Active</option><option value="ON_HOLD">On hold</option><option value="COMPLETED">Completed</option></Select></Field><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={isSubmitting}>{project ? "Save changes" : "Create project"}</Button></div></form></Modal>;
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) { return <label className="block space-y-1.5"><span className="text-sm font-medium">{label}</span>{children}{error && <span role="alert" className="block text-xs text-danger">{error}</span>}</label>; }
