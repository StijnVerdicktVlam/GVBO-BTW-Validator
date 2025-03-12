cat > src/components/AddressSearchDialog.js << 'EOF'
import React, { useState } from 'react';

const AddressSearchDialog = ({ address, onClose, onSelectVatNumber }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Extracteer delen van het adres
  const parseAddress = (addressString) => {
    const parts = {
      street: '',
      houseNumber: '',
      postalCode: '',
      city: ''
    };
    
    try {
      // Probeer straat en huisnummer te scheiden
      const streetMatch = addressString.match(/^(.*?),\s+/);
      if (streetMatch) {
        const streetPart = streetMatch[1];
        
        // Probeer huisnummer te vinden
        const numberMatch = streetPart.match(/(.*?)(\d+\w*)$/);
        if (numberMatch) {
          parts.street = numberMatch[1].trim();
          parts.houseNumber = numberMatch[2].trim();
        } else {
          parts.street = streetPart.trim();
        }
      }
      
      // Probeer postcode en gemeente te vinden
      const postalMatch = addressString.match(/,\s+(\d{4})\s+(.*?)$/);
      if (postalMatch) {
        parts.postalCode = postalMatch[1];
        parts.city = postalMatch[2].trim();
      }
    } catch (err) {
      console.error('Error parsing address:', err);
    }
    
    return parts;
  };
  
  const parsedAddress = parseAddress(address);
  
  const [formData, setFormData] = useState({
    street: parsedAddress.street,
    houseNumber: parsedAddress.houseNumber,
    postalCode: parsedAddress.postalCode,
    city: parsedAddress.city
  });
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const searchAddress = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In een echte implementatie zou je de API aanroepen
      // Hier simuleren we dit voor demonstratiedoeleinden
      
      // Simuleer een vertraging voor de demonstratie
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simuleer enkele resultaten voor het adres
      const simulatedResults = [
        {
          vatNumber: `BE0${Math.floor(Math.random() * 900000000 + 100000000)}`,
          enterpriseNumber: `0123.456.789`,
          status: 'Actief',
          name: 'Bloemenwinkel De Tulp',
          address: `${formData.street} ${formData.houseNumber}, ${formData.postalCode} ${formData.city}`,
          type: 'Rechtspersoon'
        },
        {
          vatNumber: `BE0${Math.floor(Math.random() * 900000000 + 100000000)}`,
          enterpriseNumber: `0987.654.321`,
          status: 'Actief',
          name: 'Plantencentrum Groen',
          address: `${formData.street} ${formData.houseNumber}, ${formData.postalCode} ${formData.city}`,
          type: 'Rechtspersoon'
        }
      ];
      
      setResults(simulatedResults);
      
      // In een echte implementatie zou je de echte API aanroepen:
      /*
      const response = await fetch('/api/search-kbo-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Zoeken mislukt');
      }
      
      const data = await response.json();
      setResults(data.results);
      */
    } catch (err) {
      console.error('Error searching address:', err);
      setError('Zoeken op adres mislukt: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    searchAddress();
  };
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        width: '80%',
        maxWidth: '700px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
          <h2 style={{ margin: 0 }}>Zoek ondernemingen op adres</h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '24px', 
              cursor: 'pointer',
              padding: 0
            }}
          >
            &times;
          </button>
        </div>
        
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: '3 1 200px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Straat</label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div style={{ flex: '1 1 100px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Huisnummer</label>
              <input
                type="text"
                name="houseNumber"
                value={formData.houseNumber}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div style={{ flex: '1 1 100px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Postcode</label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div style={{ flex: '2 1 150px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Gemeente</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#1976d2', 
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? 'Zoeken...' : 'Zoek op adres'}
          </button>
        </form>
        
        {error && (
          <div style={{ color: 'red', padding: '10px', marginTop: '10px', backgroundColor: '#fee' }}>
            {error}
          </div>
        )}
        
        {results.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3>Gevonden ondernemingen op dit adres:</h3>
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              {results.map((result, index) => (
                <div
                  key={index}
                  style={{
                    padding: '10px',
                    marginBottom: '10px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    borderLeft: '4px solid #1976d2'
                  }}
                  onClick={() => onSelectVatNumber(result.vatNumber)}
                >
                  <div style={{ fontWeight: 'bold' }}>{result.name}</div>
                  <div>{result.status} | {result.type}</div>
                  <div style={{ marginTop: '5px', color: '#1976d2' }}>
                    BTW: {result.vatNumber} | KBO: {result.enterpriseNumber}
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#666' }}>{result.address}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressSearchDialog;
EOF