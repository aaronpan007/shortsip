import { Task, TaskStep } from "./types";

const tasks = new Map<string, Task>();

export function createTask(title: string): Task {
  const id = crypto.randomUUID();
  const task: Task = {
    id,
    title,
    status: "pending",
    currentStep: "script",
    progress: 0,
    createdAt: new Date().toISOString(),
  };
  tasks.set(id, task);
  return task;
}

export function getTask(id: string): Task | undefined {
  return tasks.get(id);
}

export function updateTask(id: string, updates: Partial<Task>): Task | undefined {
  const task = tasks.get(id);
  if (!task) return undefined;
  Object.assign(task, updates);
  return task;
}

export function getAllTasks(): Task[] {
  return Array.from(tasks.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function deleteTask(id: string): boolean {
  return tasks.delete(id);
}

export function stepToProgress(step: TaskStep): number {
  const map: Record<TaskStep, number> = {
    script: 25,
    audio: 50,
    lipsync: 75,
    subtitle: 90,
    completed: 100,
  };
  return map[step] || 0;
}
