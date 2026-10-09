import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigError, loadConfig } from './env';

// Randomly generated per run; these are not real credentials.
const kek = () => randomBytes(32).toString('base64');
const validEnv = (): NodeJS.ProcessEnv => ({
  NODE_ENV: 'development',
  DATABASE_URL: 'postgresql://user:pw@localhost:5432/db',
  AEGIS_KEK_V1: kek(),
});

function problemsOf(env: NodeJS.ProcessEnv): string[] {
  try {
    loadConfig(env);
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    return (e as ConfigError).problems;
  }
  throw new Error('expected loadConfig to throw');
}

describe('loadConfig', () => {
  it('accepts a valid configuration and applies defaults', () => {
    const cfg = loadConfig(validEnv());
    expect(cfg.PORT).toBe(3000);
    expect(cfg.LEDGER_DRIVER).toBe('memory');
    expect(cfg.MINIO_ENDPOINT).toBe('http://localhost:9000');
  });

  describe('SR-22', () => {
    it('refuses LEDGER_DRIVER=memory in production', () => {
      const problems = problemsOf({
        ...validEnv(),
        NODE_ENV: 'production',
        LEDGER_DRIVER: 'memory',
      });
      expect(problems.join('\n')).toMatch(/LEDGER_DRIVER.*memory.*production/);
    });

    it('refuses the implicit memory default in production', () => {
      const env = { ...validEnv(), NODE_ENV: 'production' };
      expect(problemsOf(env).join('\n')).toMatch(/LEDGER_DRIVER/);
    });

    it('reports the production-ledger problem together with other problems', () => {
      const env = { NODE_ENV: 'production', DATABASE_URL_FILE: undefined };
      const text = problemsOf(env).join('\n');
      expect(text).toMatch(/LEDGER_DRIVER/);
      expect(text).toMatch(/AEGIS_KEK_V1/);
      expect(text).toMatch(/DATABASE_URL/);
    });

    it('accepts fabric in production', () => {
      const cfg = loadConfig({ ...validEnv(), NODE_ENV: 'production', LEDGER_DRIVER: 'fabric' });
      expect(cfg.LEDGER_DRIVER).toBe('fabric');
    });

    it('refuses a missing KEK', () => {
      const env = validEnv();
      delete env.AEGIS_KEK_V1;
      expect(problemsOf(env).join('\n')).toMatch(/AEGIS_KEK_V1/);
    });

    it('refuses a KEK that is too short', () => {
      const short = randomBytes(16).toString('base64');
      expect(problemsOf({ ...validEnv(), AEGIS_KEK_V1: short }).join('\n')).toMatch(/32 bytes/);
    });

    it('refuses a KEK that is too long or not base64', () => {
      const long = randomBytes(48).toString('base64');
      expect(problemsOf({ ...validEnv(), AEGIS_KEK_V1: long }).join('\n')).toMatch(/32 bytes/);
      expect(problemsOf({ ...validEnv(), AEGIS_KEK_V1: 'not base64!!' }).join('\n')).toMatch(
        /base64/,
      );
    });
  });

  it('requires DATABASE_URL and rejects non-postgres URLs', () => {
    const env = validEnv();
    delete env.DATABASE_URL;
    expect(problemsOf(env).join('\n')).toMatch(/DATABASE_URL/);
    expect(problemsOf({ ...validEnv(), DATABASE_URL: 'mysql://x' }).join('\n')).toMatch(
      /postgresql/,
    );
  });

  it('rejects an invalid PORT and an unknown NODE_ENV', () => {
    expect(problemsOf({ ...validEnv(), PORT: '99999' }).join('\n')).toMatch(/PORT/);
    expect(problemsOf({ ...validEnv(), NODE_ENV: 'staging' }).join('\n')).toMatch(/NODE_ENV/);
  });

  it('never includes secret values in error messages', () => {
    const secretKek = randomBytes(16).toString('base64');
    const secretUrl = 'mysql://admin:SuperSecretPw@host/db';
    try {
      loadConfig({ ...validEnv(), AEGIS_KEK_V1: secretKek, DATABASE_URL: secretUrl });
      throw new Error('expected loadConfig to throw');
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).not.toContain(secretKek);
      expect(msg).not.toContain('SuperSecretPw');
    }
  });

  describe('*_FILE secrets', () => {
    let dir: string;
    beforeEach(() => {
      dir = mkdtempSync(join(tmpdir(), 'aegis-cfg-'));
    });
    afterEach(() => rmSync(dir, { recursive: true, force: true }));

    it('reads secrets from files and trims trailing whitespace', () => {
      const k = kek();
      writeFileSync(join(dir, 'kek'), `${k}\n`);
      writeFileSync(join(dir, 'db'), 'postgresql://u:p@localhost:5432/d\n');
      const cfg = loadConfig({
        AEGIS_KEK_V1_FILE: join(dir, 'kek'),
        DATABASE_URL_FILE: join(dir, 'db'),
      });
      expect(cfg.AEGIS_KEK_V1).toBe(k);
      expect(cfg.DATABASE_URL).toBe('postgresql://u:p@localhost:5432/d');
    });

    it('reports an unreadable file without leaking its path contents', () => {
      const env = {
        ...validEnv(),
        AEGIS_KEK_V1: undefined,
        AEGIS_KEK_V1_FILE: join(dir, 'missing'),
      };
      expect(problemsOf(env).join('\n')).toMatch(/AEGIS_KEK_V1_FILE.*cannot read/);
    });

    it('rejects setting both the variable and its _FILE form', () => {
      writeFileSync(join(dir, 'kek'), kek());
      const env = { ...validEnv(), AEGIS_KEK_V1_FILE: join(dir, 'kek') };
      expect(problemsOf(env).join('\n')).toMatch(/either AEGIS_KEK_V1 or AEGIS_KEK_V1_FILE/);
    });
  });
});
