"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import type { RankedTask } from "@/lib/ai/prioritize";
import { prioritize } from "@/lib/ai/prioritize";
import { summary } from "@/lib/ai/summary";
import { authOptions } from "@/lib/auth";
import {
  AiResponseInvalidError,
  AiResponseParseError,
  AiUnavailableError,
  CostCeilingExceededError,
  PiiRejectedError,
  ValidationError,
} from "@/lib/errors";
import { issuePat, revokePat } from "@/lib/pats";
import { addTask, getDb, softDelete, updateTaskStatus } from "@/lib/storage";

async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("unauthenticated");
  return session.user.id;
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; details?: string };

function toResult<T>(fn: () => T | Promise<T>): Promise<ActionResult<T>> {
  return Promise.resolve()
    .then(async () => ({ ok: true as const, data: await fn() }))
    .catch((e: unknown): ActionResult<T> => {
      if (e instanceof PiiRejectedError) {
        return { ok: false, error: "pii_rejected", details: e.piiType };
      }
      if (e instanceof ValidationError) {
        return { ok: false, error: "validation_error", details: e.message };
      }
      if (e instanceof CostCeilingExceededError) {
        return { ok: false, error: "cost_ceiling_exceeded" };
      }
      if (e instanceof AiUnavailableError) {
        return { ok: false, error: "ai_unavailable", details: e.reason };
      }
      if (e instanceof AiResponseParseError || e instanceof AiResponseInvalidError) {
        return { ok: false, error: "ai_response_invalid" };
      }
      return { ok: false, error: "internal" };
    });
}

// ---------- tasks ----------

export async function addTaskAction(formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  const title = String(formData.get("title") ?? "").trim();
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw.length > 0 ? notesRaw : undefined;

  const result = await toResult<undefined>(() => {
    addTask(getDb(), userId, notes !== undefined ? { title, notes } : { title });
    return undefined;
  });
  if (result.ok) revalidatePath("/app");
  return result;
}

export async function markStatusAction(
  taskId: string,
  status: "open" | "done",
): Promise<ActionResult> {
  const userId = await requireUserId();
  const result = await toResult<undefined>(() => {
    updateTaskStatus(getDb(), taskId, userId, status);
    return undefined;
  });
  if (result.ok) revalidatePath("/app");
  return result;
}

export async function softDeleteAction(taskId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const result = await toResult<undefined>(() => {
    softDelete(getDb(), taskId, userId);
    return undefined;
  });
  if (result.ok) revalidatePath("/app");
  return result;
}

// ---------- AI ----------

export async function prioritizeAction(): Promise<ActionResult<RankedTask[]>> {
  const userId = await requireUserId();
  return toResult(() => prioritize(getDb(), userId));
}

export async function summaryAction(): Promise<ActionResult<string>> {
  const userId = await requireUserId();
  return toResult(() => summary(getDb(), userId));
}

// ---------- PATs ----------

export interface IssuedPatPayload {
  id: string;
  name: string;
  token: string;
  created_at: string;
}

export async function issuePatAction(formData: FormData): Promise<ActionResult<IssuedPatPayload>> {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  const result = await toResult(() => issuePat(getDb(), userId, name));
  if (result.ok) revalidatePath("/app/settings");
  return result;
}

export async function revokePatAction(patId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const result = await toResult<undefined>(() => {
    revokePat(getDb(), patId, userId);
    return undefined;
  });
  if (result.ok) revalidatePath("/app/settings");
  return result;
}
