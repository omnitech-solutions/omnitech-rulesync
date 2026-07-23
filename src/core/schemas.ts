import { z } from "zod";

export const agentTargetSchema = z.enum(["claudecode", "codexcli", "cursor", "windsurf", "copilot"]);
const sourceSchema = z.object({
  source: z.string().min(1),
  ref: z.string().optional(),
  skills: z.array(z.string()).default([]),
  trust: z.enum(["omnitech", "vendor", "community", "custom"]).default("custom"),
});
export const manifestSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  targets: z.array(agentTargetSchema).default(["claudecode", "codexcli", "cursor", "windsurf", "copilot"]),
  profiles: z
    .object({ include: z.array(z.string()).default([]), exclude: z.array(z.string()).default([]) })
    .default({ include: [], exclude: [] }),
  sources: z.array(sourceSchema).default([]),
  workflows: z
    .object({
      policy: z.enum(["risk-adaptive", "always-linear", "advisory"]).default("risk-adaptive"),
      include: z.array(z.string()).default([]),
      exclude: z.array(z.string()).default([]),
    })
    .default({ policy: "risk-adaptive", include: [], exclude: [] }),
});
const detectorSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("file"), pattern: z.string(), score: z.number().int().min(1).max(100) }),
  z.object({ kind: z.literal("packageDependency"), name: z.string(), score: z.number().int().min(1).max(100) }),
  z.object({ kind: z.literal("gem"), name: z.string(), score: z.number().int().min(1).max(100) }),
]);
export const profileSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string(),
  tags: z.array(z.string()).default([]),
  autoSelectScore: z.number().int().min(1).max(100).default(80),
  detect: z.array(detectorSchema).default([]),
  includes: z
    .object({
      rules: z.array(z.string()).default([]),
      skills: z.array(z.string()).default([]),
      workflows: z.array(z.string()).default([]),
    })
    .default({ rules: [], skills: [], workflows: [] }),
});
const stageSchema = z.object({
  id: z.string(),
  skills: z.array(z.string()).default([]),
  gate: z.enum(["none", "approval", "evidence"]).default("none"),
});
export const workflowSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string(),
  intents: z.array(z.string()).min(1),
  priority: z.number().int().default(0),
  signals: z.array(z.string()).default([]),
  stages: z.array(stageSchema).min(1),
});
export const lockSchema = z.object({
  schemaVersion: z.literal(1),
  generatorVersion: z.string(),
  generatedAt: z.string(),
  targetRoot: z.string(),
  profiles: z.array(z.string()),
  workflows: z.array(z.string()),
  sources: z.array(sourceSchema),
  ownedFiles: z.record(z.string(), z.string()),
});
export type Manifest = z.infer<typeof manifestSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Workflow = z.infer<typeof workflowSchema>;
export type Lockfile = z.infer<typeof lockSchema>;
