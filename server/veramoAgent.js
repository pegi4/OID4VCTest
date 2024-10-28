// veramoAgent.js
const { createAgent } = require('@veramo/core');
const { DIDManager } = require('@veramo/did-manager');
const { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } = require('@veramo/key-manager');
const { KeyManagementSystem } = require('@veramo/kms-local');
const { CredentialPlugin } = require('@veramo/credential-w3c');
const { DIDResolverPlugin } = require('@veramo/did-resolver');
const { OIDCRPPlugin } = require('@blockchain-lab-um/oidc-rp-plugin');
const { Resolver } = require('did-resolver');
require('dotenv').config();

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

// Create and export the Veramo agent
const veramoAgent = createVeramoAgent(process.env.REACT_APP_API_URL || 'http://localhost:3000');
module.exports = veramoAgent;
