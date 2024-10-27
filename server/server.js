const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(cors()); 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

let sessionData = {}; // Temporary in-memory storage for testing

// 1. Well-Known Endpoint for OpenID Credential Issuer
app.get('/.well-known/openid-credential-issuer', (req, res) => {
  res.json({
    issuer: process.env.REACT_APP_API_URL || 'http://localhost:3000',
    credential_formats: ['jwt_vc_json'],
    grant_types_supported: ['urn:ietf:params:oauth:grant-type:pre-authorized_code'],
    token_endpoint: `${process.env.REACT_APP_API_URL}/token`,
    authorization_server: process.env.REACT_APP_API_URL || 'http://localhost:3000',
    credential_endpoint: `${process.env.REACT_APP_API_URL}/credential`,
  });
});

app.get('/.well-known/openid-configuration', (req, res) => {
  res.json({
    issuer: process.env.REACT_APP_API_URL || 'http://localhost:3000',
    token_endpoint: `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/token`,
  });
});

app.post('/credential-offer', async (req, res) => {
  const preAuthorizedCode = Math.random().toString(36).substr(2, 9);

  // Store session data
  sessionData[preAuthorizedCode] = { issued: false };
  console.log("Stored preAuthorizedCode in sessionData:", preAuthorizedCode);

  // Construct the credential offer JSON
  const credentialOfferData = {
    credential_issuer: process.env.REACT_APP_API_URL || 'http://localhost:3000',
    credentials: [
      {
        format: "jwt_vc_json",
        types: ["VerifiableCredential", "TicketCredential"]
      }
    ],
    grants: {
      "urn:ietf:params:oauth:grant-type:pre-authorized_code": {
        "pre-authorized_code": preAuthorizedCode,
        "user_pin_required": false
      }
    }
  };

  // Save the credential offer data to an endpoint
  sessionData[preAuthorizedCode].credentialOfferData = credentialOfferData;

  // Create a URL that points to the credential offer data
  const credentialOfferURI = `openid-credential-offer://?credential_offer_uri=${encodeURIComponent(`${process.env.REACT_APP_API_URL}/credential-offer-data/${preAuthorizedCode}`)}`;

  console.log("Generated Credential Offer URI:", credentialOfferURI);

  // Return the credential offer URI
  res.json(credentialOfferURI);
});

// New endpoint to serve the credential offer data directly
app.get('/credential-offer-data/:code', (req, res) => {
  const { code } = req.params;
  const offerData = sessionData[code]?.credentialOfferData;

  if (offerData) {
    res.json(offerData);
  } else {
    res.status(404).send('Credential offer not found');
  }
});

// 3. Token Endpoint
app.post('/token', (req, res) => {
  const preAuthorizedCode = req.body['pre-authorized_code'];
  console.log("Received preAuthorizedCode:", preAuthorizedCode);
  console.log("Session Data:", sessionData);

  if (sessionData[preAuthorizedCode]) {
    const accessToken = `access-token-${preAuthorizedCode}`;
    //sessionData[preAuthorizedCode].issued = true;
    sessionData[preAuthorizedCode].accessToken = accessToken;
    console.log("Issued access token:", accessToken);
    return res.json({ access_token: accessToken });
  } else {
    console.log("Unauthorized request or token already issued for code:", preAuthorizedCode);
    return res.status(401).send('Unauthorized or token already issued');
  }
});

// 4. Credential Issuance Endpoint
// 4. Credential Issuance Endpoint
app.post('/credential', (req, res) => {
  // Log the incoming request headers
  console.log("Incoming request headers:", req.headers);

  const { authorization } = req.headers;

  if (!authorization) {
    console.log("No authorization header provided.");
    return res.status(401).send('Authorization header missing');
  }

  const accessToken = authorization.split(' ')[1]; // Extract token from header

  // Log the extracted access token
  console.log("Extracted access token:", accessToken);

  // Find the session based on the access token
  const session = Object.values(sessionData).find(
    (session) => session.accessToken === accessToken
  );

  if (session) {
    // Log the session data found
    console.log("Session found for access token:", session);

    const credential = {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      "id": `urn:uuid:${Math.random().toString(36).substr(2, 9)}`,
      "type": ["VerifiableCredential", "TicketCredential"],
      "issuer": "did:example:issuer-did",
      "credentialSubject": {
        "id": "did:example:subject-did",
        "eventName": "Test Event",
        "ticketNumber": "12345",
        "seat": "A1"
      },
      "issuanceDate": new Date().toISOString(),
      "proof": {
        "type": "EcdsaSecp256k1Signature2019",
        "created": new Date().toISOString(),
        "proofPurpose": "assertionMethod",
        "verificationMethod": "did:example:issuer-did#key-1",
        "jws": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0..."
      }
    };

    // Log the credential response being sent
    console.log("Issuing credential:", credential);
    return res.json(credential);
  } else {
    // Log the case when no matching session is found
    console.log("No session found for access token:", accessToken);
    return res.status(401).send('Invalid token or unauthorized');
  }
});

app.get('/', (req, res) => {
    res.send("Hello World");
})

app.listen(3000, () => {
  console.log('OID4VC test server running on', process.env.REACT_APP_API_URL);
});
