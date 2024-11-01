import { useState } from 'react';
import QRCode from "react-qr-code";

function App() {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  const handlePurchase = async () => {
    try {
      const response = await fetch(
        'http://localhost:3000/credential-offer',
        //'https://oidctest.onrender.com/credential-offer',
        //'https://oid4vctest.onrender.com/credential-offer',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userData: { name: 'John Doe', email: 'john@example.com' }
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch credential offer');
      }

      const credentialOfferRequest = await response.json();
      setQrCodeUrl(credentialOfferRequest.credentialOfferURI);
      console.log(credentialOfferRequest.credentialOfferURI);
      // setQrCodeUrl(credentialOfferRequest); // Set the QR code URL to display it
      // console.log(credentialOfferRequest);
    } catch (error) {
      console.error('Error generating credential offer:', error);
    }
  };

  return (
    <div className="App">
      <h1>OID4VC Test</h1>
      <button onClick={handlePurchase}>Get Ticket (Generate QR Code)</button>
      {qrCodeUrl && (
        <div>
          <h3>Scan this QR code with your wallet</h3>
          <QRCode className="padding" value={qrCodeUrl} /> {/* QR value as URL string */}
          <p> { qrCodeUrl }</p>
        </div>
      )}
    </div>
  );
}

export default App;
