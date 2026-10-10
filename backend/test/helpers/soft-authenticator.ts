/**
 * Software authenticator for e2e tests.
 * Generates real CBOR-encoded WebAuthn registration and authentication responses
 * signed with an ephemeral ES256 (P-256) key pair.
 */
import { createHash, generateKeyPairSync, createSign } from 'node:crypto';
import * as cbor from 'cbor';

export interface SoftAuthenticator {
  credentialId: Buffer;
  register(options: {
    challenge: string;
    rpId: string;
    origin: string;
    userId: string;
  }): Promise<SoftRegistrationResponse>;
  authenticate(options: {
    challenge: string;
    rpId: string;
    origin: string;
  }): Promise<SoftAuthenticationResponse>;
}

export interface SoftRegistrationResponse {
  id: string;
  rawId: string;
  type: 'public-key';
  response: {
    clientDataJSON: string;
    attestationObject: string;
    transports: string[];
  };
}

export interface SoftAuthenticationResponse {
  id: string;
  rawId: string;
  type: 'public-key';
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle: string | null;
  };
}

export function createSoftAuthenticator(): SoftAuthenticator {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const credentialId = Buffer.from(
    createHash('sha256')
      .update(publicKey.export({ type: 'spki', format: 'der' }))
      .digest(),
  );
  let signCount = 0;

  // Build COSE-encoded public key (ES256)
  function buildCoseKey(): Buffer {
    const spki = publicKey.export({ type: 'spki', format: 'der' });
    // P-256 SPKI: 2-byte outer SEQ header + 21-byte algorithm SEQUENCE + 3-byte BIT STRING header
    // = byte 26 is the 0x04 uncompressed-point marker; x starts at byte 27, y at byte 59.
    const x = spki.subarray(27, 59);
    const y = spki.subarray(59, 91);
    const coseMap = new Map<number, unknown>([
      [1, 2], // kty: EC2
      [3, -7], // alg: ES256
      [-1, 1], // crv: P-256
      [-2, x], // x
      [-3, y], // y
    ]);
    return cbor.encode(coseMap);
  }

  function buildAuthData(rpId: string, includeAttestation: boolean, uvFlag = true): Buffer {
    const rpIdHash = createHash('sha256').update(rpId).digest();
    const flags = (uvFlag ? 0x04 : 0x00) | 0x01 | (includeAttestation ? 0x40 : 0x00); // UP=1, UV=1 (if set), AT=1 (if attested)

    const count = Buffer.alloc(4);
    count.writeUInt32BE(++signCount, 0);

    if (!includeAttestation) {
      return Buffer.concat([rpIdHash, Buffer.from([flags]), count]);
    }

    const aaguid = Buffer.alloc(16, 0);
    const credIdLen = Buffer.alloc(2);
    credIdLen.writeUInt16BE(credentialId.length, 0);
    const coseKey = buildCoseKey();

    return Buffer.concat([
      rpIdHash,
      Buffer.from([flags]),
      count,
      aaguid,
      credIdLen,
      credentialId,
      coseKey,
    ]);
  }

  async function register(options: {
    challenge: string;
    rpId: string;
    origin: string;
    userId: string;
  }): Promise<SoftRegistrationResponse> {
    const clientData = {
      type: 'webauthn.create',
      challenge: options.challenge,
      origin: options.origin,
      crossOrigin: false,
    };
    const clientDataJSON = Buffer.from(JSON.stringify(clientData)).toString('base64url');
    const authData = buildAuthData(options.rpId, true);
    const attObj = cbor.encode({ fmt: 'none', attStmt: {}, authData });

    return {
      id: credentialId.toString('base64url'),
      rawId: credentialId.toString('base64url'),
      type: 'public-key',
      response: {
        clientDataJSON,
        attestationObject: attObj.toString('base64url'),
        transports: ['internal'],
      },
    };
  }

  async function authenticate(options: {
    challenge: string;
    rpId: string;
    origin: string;
  }): Promise<SoftAuthenticationResponse> {
    const clientData = {
      type: 'webauthn.get',
      challenge: options.challenge,
      origin: options.origin,
      crossOrigin: false,
    };
    const clientDataJSON = Buffer.from(JSON.stringify(clientData)).toString('base64url');
    const clientDataHash = createHash('sha256').update(JSON.stringify(clientData)).digest();

    const authData = buildAuthData(options.rpId, false);
    const sigInput = Buffer.concat([authData, clientDataHash]);

    const sign = createSign('SHA256');
    sign.update(sigInput);
    const signature = sign.sign(privateKey);

    return {
      id: credentialId.toString('base64url'),
      rawId: credentialId.toString('base64url'),
      type: 'public-key',
      response: {
        clientDataJSON,
        authenticatorData: authData.toString('base64url'),
        signature: signature.toString('base64url'),
        userHandle: null,
      },
    };
  }

  return { credentialId, register, authenticate };
}
