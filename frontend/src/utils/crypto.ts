/**
 * Web Crypto API utilities for real client-side SHA-256 hashing and integrity verification.
 * Adheres to zero-trust principles: never trust off-chain files without cryptographic verification.
 */

export async function computeSha256(data: string | ArrayBuffer): Promise<string> {
  const source: any = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', source);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function computeFileSha256(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  return computeSha256(arrayBuffer);
}

export function compareHashes(hashA: string, hashB: string): {
  isMatch: boolean;
  diffIndices: number[];
} {
  const cleanA = hashA.toLowerCase().trim();
  const cleanB = hashB.toLowerCase().trim();

  if (cleanA === cleanB) {
    return { isMatch: true, diffIndices: [] };
  }

  const diffIndices: number[] = [];
  const maxLen = Math.max(cleanA.length, cleanB.length);
  for (let i = 0; i < maxLen; i++) {
    if (cleanA[i] !== cleanB[i]) {
      diffIndices.push(i);
    }
  }

  return { isMatch: false, diffIndices };
}

export function formatTruncatedHash(hash: string, lead = 8, trail = 8): string {
  if (!hash) return '';
  if (hash.length <= lead + trail) return hash;
  return `${hash.slice(0, lead)}...${hash.slice(-trail)}`;
}

export function generateMockDid(role: string, name: string): string {
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `did:aegis:bel:${role.toLowerCase()}:${clean.slice(0, 8)}`;
}
