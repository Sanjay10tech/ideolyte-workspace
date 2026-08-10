"use server";

import { createClient } from "@/lib/supabase/server";

export interface ClientDashboardData {
  projects: { id: string; name: string; status: string; progress: number; deadline: string | null }[];
  taskStats: { total: number; completed: number; inProgress: number; review: number; todo: number };
  milestones: { id: string; title: string; status: string; project_name: string }[];
}

export async function getClientDashboardData(): Promise<ClientDashboardData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { projects: [], taskStats: { total: 0, completed: 0, inProgress: 0, review: 0, todo: 0 }, milestones: [] };

  // Get client_id
  const { data: client } = await supabase.from("clients").select("id").eq("profile_id", user.id).single();
  if (!client) return { projects: [], taskStats: { total: 0, completed: 0, inProgress: 0, review: 0, todo: 0 }, milestones: [] };

  const clientId = (client as { id: string }).id;

  // Fetch projects, tasks, milestones in parallel
  const [{ data: projectsData }, { data: tasksData }, { data: milestonesData }] = await Promise.all([
    supabase.from("projects").select("id, name, status, progress, deadline").eq("client_id", clientId).order("created_at", { ascending: false }),
    supabase.from("tasks").select("status, project_id").in("project_id", 
      (await supabase.from("projects").select("id").eq("client_id", clientId)).data?.map((p: { id: string }) => p.id) || []
    ),
    supabase.from("milestones").select("id, title, status, project_id, projects(name)").in("project_id",
      (await supabase.from("projects").select("id").eq("client_id", clientId)).data?.map((p: { id: string }) => p.id) || []
    ).order("due_date", { ascending: true }),
  ]);

  const projects = (projectsData || []) as { id: string; name: string; status: string; progress: number; deadline: string | null }[];
  const tasks = (tasksData || []) as { status: string }[];
  const milestones = (milestonesData || []) as unknown as { id: string; title: string; status: string; projects: { name: string } }[];

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === "completed").length,
    inProgress: tasks.filter(t => t.status === "in-progress").length,
    review: tasks.filter(t => t.status === "review").length,
    todo: tasks.filter(t => t.status === "todo").length,
  };

  return {
    projects,
    taskStats,
    milestones: milestones.map(m => ({ id: m.id, title: m.title, status: m.status, project_name: m.projects?.name || "" })),
  };
}
