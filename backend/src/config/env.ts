import { readFileSync } from 'node:fs';
import { z } from 'zod';

/** Thrown for any invalid/missing configuration. Messages name variables, never values. */
export class ConfigError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Invalid configuration:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    this.name = 'ConfigError';
  }
}

/** Variables that may be supplied via a `<NAME>_FILE` path (Docker/K8s secret style). */
const FILE_SUPPORTED = ['DATABASE_URL', 'AEGIS_KEK_V1'] as const;

const kek = z
  .string({ error: 'is required (base64-encoded 32-byte key)' })
  .refine((v) => /^[A-Za-z0-9+/]+={0,2}$/.test(v), { error: 'must be base64' })
  .refine((v) => Buffer.from(v, 'base64').length === 32, {
    error: 'must decode to exactly 32 bytes (AES-256)',
  });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z
    .string({ error: 'is required (set DATABASE_URL or DATABASE_URL_FILE)' })
    .refine((v) => /^postgres(ql)?:\/\//.test(v), { error: 'must be a postgresql:// URL' }),
  MINIO_ENDPOINT: z.url({ error: 'must be a URL' }).default('http://localhost:9000'),
  LEDGER_DRIVER: z.enum(['memory', 'fabric']).default('memory'),
  AEGIS_KEK_V1: kek,
});

export type AppConfig = z.infer<typeof schema>;

function resolveFileVars(
  env: NodeJS.ProcessEnv,
  problems: string[],
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = { ...env };
  for (const name of FILE_SUPPORTED) {
    const filePath = env[`${name}_FILE`];
    if (!filePath) continue;
    if (env[name]) {
      problems.push(`${name}: set either ${name} or ${name}_FILE, not both`);
      continue;
    }
    try {
      out[name] = readFileSync(filePath, 'utf8').trim();
    } catch {
      problems.push(`${name}_FILE: cannot read the file at the given path`);
    }
  }
  return out;
}

/** Validates the environment once at startup. Never includes secret values in errors. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const problems: string[] = [];
  const resolved = resolveFileVars(env, problems);
  // SR-22: the in-memory ledger must never run in production. Checked on raw values (not inside the
  // schema) so it is reported together with any other problem rather than hidden behind it.
  if (resolved.NODE_ENV === 'production' && (resolved.LEDGER_DRIVER ?? 'memory') === 'memory') {
    problems.push("LEDGER_DRIVER: must not be 'memory' when NODE_ENV=production");
  }
  const parsed = schema.safeParse(resolved);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      problems.push(`${issue.path.join('.') || 'config'}: ${issue.message}`);
    }
  }
  if (problems.length > 0 || !parsed.success) throw new ConfigError(problems);
  return parsed.data;
}
