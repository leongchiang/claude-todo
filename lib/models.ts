import { z } from "zod";

export const ProviderSchema = z.enum(["google", "microsoft"]);
export type Provider = z.infer<typeof ProviderSchema>;

export const UserSchema = z.object({
  id: z.string().min(1),
  provider: ProviderSchema,
  provider_user_id: z.string().min(1),
  email: z.string().email().nullable(),
  display_name: z.string().nullable(),
  created_at: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const UpsertUserInputSchema = z.object({
  provider: ProviderSchema,
  provider_user_id: z.string().min(1),
  email: z.string().email().nullable(),
  display_name: z.string().nullable(),
});
export type UpsertUserInput = z.infer<typeof UpsertUserInputSchema>;

export const TaskStatusSchema = z.enum(["open", "done"]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().min(1),
  title: z.string().min(1).max(200),
  notes: z.string().max(2000).nullable(),
  status: TaskStatusSchema,
  created_at: z.string(),
  completed_at: z.string().nullable(),
  deleted_at: z.string().nullable(),
});
export type Task = z.infer<typeof TaskSchema>;

export const NewTaskInputSchema = z.object({
  title: z.string().min(1, "title is required").max(200, "title must be ≤200 chars"),
  notes: z.string().max(2000, "notes must be ≤2000 chars").optional(),
});
export type NewTaskInput = z.infer<typeof NewTaskInputSchema>;

export const ListTasksOptsSchema = z.object({
  status: z.enum(["open", "done", "all"]).default("open"),
  cursor: z.string().nullable().optional(),
  limit: z.number().int().min(1).max(50).default(50),
});
export type ListTasksOpts = z.infer<typeof ListTasksOptsSchema>;

export interface ListTasksResult {
  items: Task[];
  next_cursor: string | null;
}
