import { createAgent } from '@veramo/core';
import { DIDManager } from '@veramo/did-manager';
import { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager';
import { KeyManagementSystem } from '@veramo/kms-local';
import { CredentialPlugin } from '@veramo/credential-w3c';
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { OIDCRPPlugin } from '@blockchain-lab-um/oidc-rp-plugin';
import { Resolver } from 'did-resolver';
import dotenv from 'dotenv';

dotenv.config();

async function createVeramoAgent(issuerUrl) {
  return createAgent({
    plugins: [
      new DIDManager({
        store: new MemoryKeyStore(),
        defaultProvider: 'did:key',
        providers: {
          'did:key': new KeyManager({
            store: new MemoryKeyStore(),
            kms: { local: new KeyManagementSystem(new MemoryPrivateKeyStore()) },
          }),
        },
      }),
      new KeyManager({
        store: new MemoryKeyStore(),
        kms: {
          local: new KeyManagementSystem(new MemoryPrivateKeyStore()),
        },
      }),
      new CredentialPlugin(),
      new DIDResolverPlugin({
        resolver: new Resolver({
          // Add additional DID resolvers as necessary
        }),
      }),
      new OIDCRPPlugin({
        url: `${issuerUrl}/oidc`,
        supported_curves: ['secp256k1'],
        supported_did_methods: ['did:key', 'did:ebsi'],
        supported_digital_signatures: ['EcdsaSecp256k1Signature2019'],
        supported_credentials: [
          {
            format: 'jwt_vc_json',
            types: ['VerifiableCredential', 'TicketCredential'],
          },
        ],
      }),
    ],
  });
}

const veramoAgent = await createVeramoAgent(process.env.REACT_APP_API_URL || 'http://localhost:3000');
export default veramoAgent;
