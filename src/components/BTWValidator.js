cat > src/components/BTWValidator.js << 'EOF'
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import AddressSearchDialog from './AddressSearchDialog';
// Importeer de mockservices voor het testen zonder echte API's
import { mockViesService, mockKboService } from './MockServices';

function App() {
const [fileData, setFileData] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [manualOverrides, setManualOverrides] = useState({});
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('');

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      setError('Geen bestand geselecteerd');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const text = await file.text();
      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        delimiter: ';',
        delimitersToGuess: [';', ',', '\t'],
      });
      
      // Compatibiliteit met Groen van bij ons CSV
      const processedData = result.data
        .filter(row => {
          // Zoek het BTW-nummer veld
          // Mogelijke kolomnamen
          const possibleVatColumns = ['BTW nummer', 'BTW nummer\t', 'BTW Nummer', 'BTW-nummer'];
          const vatColumn = possibleVatColumns.find(col => row[col]);
          
          return vatColumn && row[vatColumn];
        })
        .map(row => {
          // Vind de juiste kolom met BTW-nummer
          const possibleVatColumns = ['BTW nummer', 'BTW nummer\t', 'BTW Nummer', 'BTW-nummer'];
          const vatColumn = possibleVatColumns.find(col => row[col]);
          
          const rawVatNumber = row[vatColumn].trim();
          
          // Formatteren van het BTW-nummer
          let formattedVAT = formatVATNumber(rawVatNumber);
          
          return {
            originalNumber: rawVatNumber,
            formattedNumber: formattedVAT,
            companyName: row['Bedrijfsnaam'] || 'Onbekend',
            email: row['E-mail'] || row['e-mailadres'] || '',
            address: formatAddress(row),
            type: row['Type verkooppunt'] || ''
          };
        });
      
      setFileData(processedData);
      setTotalCount(processedData.length);
      setLoading(false);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Fout bij het inlezen van het bestand. Controleer of het een geldig CSV bestand is.');
      setLoading(false);
    }
  };

  // Functie om BTW-nummer te formatteren
  const formatVATNumber = (vatNumber) => {
    // Verwijder alle niet-alfanumerieke tekens
    let cleaned = vatNumber.replace(/[^a-zA-Z0-9]/g, '');
    
    // Als het nummer alleen uit cijfers bestaat en 9 cijfers heeft, voeg een 0 toe aan het begin
    if (/^\d+$/.test(cleaned) && cleaned.length === 9) {
      cleaned = '0' + cleaned;
    }
    
    // Als het nummer alleen uit cijfers bestaat en 10 cijfers heeft, voeg 'BE' toe aan het begin
    if (/^\d+$/.test(cleaned) && cleaned.length === 10) {
      cleaned = 'BE' + cleaned;
    }
    
    // Als het al met BE begint, zorg ervoor dat het de juiste lengte heeft
    if (cleaned.startsWith('BE') && cleaned.length === 12) {
      return cleaned;
    }
    
    return vatNumber; // Geef het originele nummer terug als we het niet konden formatteren
  };

  // Functie om adres te formatteren
  const formatAddress = (row) => {
    const street = row['Straat + huisnummer'] || '';
    const postalCode = row['Postcode'] || '';
    const city = row['Gemeente'] || '';
    
    if (street && postalCode && city) {
      return `${street}, ${postalCode} ${city}`;
    }
    
    return '';
  };

  const validateVATNumber = async (vatNumber) => {
    try {
      // In een echte implementatie zou je hier een API-call doen
      // Nu simuleren we voor demonstratiedoeleinden
      
      // Simuleer een vertraging zoals bij een echte API-call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Voor demonstratiedoeleinden: beschouw nummers die met 'BE0' beginnen als geldig
      const isValid = vatNumber.startsWith('BE0');
      
      return { 
        isValid, 
        details: isValid ? {
          name: "Gevalideerd via simulatie",
          address: "Simulatie adres"
        } : null,
        error: isValid ? null : 'BTW nummer is niet actief'
      };
      
      // In een echte implementatie zou je de VIES en KBO API's aanroepen:
      /*
      const response = await fetch('/api/validate-vat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vatNumber })
      });
      
      if (!response.ok) {
        throw new Error('Validatie request mislukt');
      }
      
      return await response.json();
      */
    } catch (err) {
      console.error('Validation error:', err);
      return { isValid: false, error: 'Validatie mislukt: ' + err.message };
    }
  };

  const validateVATNumbers = async () => {
    if (!fileData || fileData.length === 0) {
      setError('Geen data beschikbaar om te valideren');
      return;
    }
    
    setLoading(true);
    setError(null);
    setProcessedCount(0);
    
    const validationResults = [];
    
    for (const item of fileData) {
      try {
        const result = await validateVATNumber(item.formattedNumber);
        
        validationResults.push({
          originalNumber: item.originalNumber,
          formattedNumber: item.formattedNumber,
          companyName: item.companyName,
          email: item.email,
          address: item.address,
          type: item.type,
          isValid: result.isValid,
          details: result.details,
          error: result.isValid ? null : result.error
        });
        
        setProcessedCount(prev => prev + 1);
        
        // Korte pauze om de browser te laten ademen
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        validationResults.push({
          originalNumber: item.originalNumber,
          formattedNumber: item.formattedNumber,
          companyName: item.companyName,
          email: item.email,
          address: item.address,
          type: item.type,
          isValid: false,
          error: 'Validatie mislukt: ' + err.message
        });
        
        setProcessedCount(prev => prev + 1);
      }
    }
    
    setResults(validationResults);
    setLoading(false);
  };

  const getKBOLink = (vatNumber) => {
    // Verwijder 'BE' en formatteer het nummer voor KBO
    const formatted = vatNumber.replace('BE', '').replace(/(\d{4})(\d{3})(\d{3})/, '$1.$2.$3');
    return `https://kbopub.economie.fgov.be/kbopub/zoeknummerform.html?nummer=${formatted}&actionLu=Zoek`;
  };

  const getKBOAddressLink = (address) => {
    try {
      // Probeer een postcode te extraheren (4 cijfers)
      const postcodeMatch = address.match(/(\d{4})/);
      
      // Probeer straatnaam te extraheren (alles voor het huisnummer)
      const streetMatch = address.match(/^(.*?),\s+\d{4}/);
      
      if (postcodeMatch && streetMatch) {
        const postcode = postcodeMatch[1];
        const street = streetMatch[1].trim();
        
        // Probeer de gemeente te extraheren (alles na postcode)
        const cityMatch = address.match(/\d{4}\s+(.*?)$/);
        const city = cityMatch ? cityMatch[1].trim() : '';
        
        const params = new URLSearchParams({
          postcod1: postcode,
          straatgemeente1: street,
          filterEnkelActieve: 'true',
          _filterEnkelActieve: 'on',
          actionLU: 'Zoek'
        });
        
        return `https://kbopub.economie.fgov.be/kbopub/zoekadresform.html?${params.toString()}`;
      }
    } catch (err) {
      console.error('Error creating address link:', err);
    }
    
    return 'https://kbopub.economie.fgov.be/kbopub/zoekadresform.html';
  };

  const handleNewVatNumberChange = (vatNumber, newValue) => {
    setManualOverrides(prev => ({
      ...prev,
      [vatNumber]: {
        ...prev[vatNumber],
        newVATNumber: true,
        newVatNumberValue: newValue
      }
    }));
  };

  const handleOverrideChange = (vatNumber, type) => {
    setManualOverrides(prev => ({
      ...prev,
      [vatNumber]: {
        ...prev[vatNumber],
        [type]: !prev[vatNumber]?.[type],
        ...(type === 'newVATNumber' && !prev[vatNumber]?.newVATNumber ? {} : {})
      }
    }));
  };

  const displayFormattedVATNumber = (number) => {
    const cleanNumber = number.replace(/[^0-9]/g, '');
    if (cleanNumber.length === 10 && number.includes('BE')) {
      return `BE ${cleanNumber.slice(0,4)} ${cleanNumber.slice(4,7)} ${cleanNumber.slice(7)}`;
    }
    return number;
  };

  const exportInactiveCompanies = () => {
    if (!results.length) {
      setError('Geen resultaten beschikbaar om te exporteren');
      return;
    }
    
    try {
      // Filter op gestopte bedrijven (niet geldig en geen overrides)
      const stoppedCompanies = results
        .filter(r => !r.isValid && 
          !manualOverrides[r.formattedNumber]?.activeInKBO && 
          !manualOverrides[r.formattedNumber]?.newVATNumber)
        .map(r => ({
          'Bedrijfsnaam': r.companyName || '',
          'BTW Nummer': r.originalNumber || '',
          'E-mail': r.email || '',
          'Adres': r.address || '',
          'Type verkooppunt': r.type || '',
          'Status': 'Volledig gestopt'
        }));
      
      // Filter op bedrijven met nieuw BTW-nummer
      const continuedCompanies = results
        .filter(r => !r.isValid && manualOverrides[r.formattedNumber]?.newVATNumber)
        .map(r => ({
          'Bedrijfsnaam': r.companyName || '',
          'Oud BTW Nummer': r.originalNumber || '',
          'Nieuw BTW Nummer': manualOverrides[r.formattedNumber]?.newVatNumberValue || '',
          'E-mail': r.email || '',
          'Adres': r.address || '',
          'Type verkooppunt': r.type || '',
          'Status': 'Actief onder nieuw BTW nummer'
        }));
      
      // Maak een Excel workbook
      const workbook = XLSX.utils.book_new();
      
      // Voeg sheets toe
      if (stoppedCompanies.length > 0) {
        const ws1 = XLSX.utils.json_to_sheet(stoppedCompanies);
        XLSX.utils.book_append_sheet(workbook, ws1, 'Gestopte Bedrijven');
      }
      
      if (continuedCompanies.length > 0) {
        const ws2 = XLSX.utils.json_to_sheet(continuedCompanies);
        XLSX.utils.book_append_sheet(workbook, ws2, 'Nieuwe BTW Nummers');
      }
      
      // Exporteer als Excel bestand
      XLSX.writeFile(workbook, 'btw_status_groen_van_bij_ons.xlsx');
    } catch (err) {
      console.error('Export error:', err);
      setError('Fout bij het exporteren: ' + err.message);
    }
  };

  // UI rendering
  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>BTW Nummer Validator - Groen van bij ons</h1>
      
      <div>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          style={{ marginBottom: '10px' }}
        />
        
        {error && (
          <div style={{ color: 'red', padding: '10px', marginBottom: '10px', backgroundColor: '#fee' }}>
            {error}
          </div>
        )}
        
        {fileData && (
          <div>
            <h3>Gevonden BTW nummers: ({fileData.length})</h3>
            <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
              {fileData.map((item, index) => (
                <div key={index}>
                  {displayFormattedVATNumber(item.formattedNumber)} - {item.companyName} ({item.type})
                </div>
              ))}
            </div>
            <button 
              onClick={validateVATNumbers}
              disabled={loading}
              style={{ padding: '8px 16px', marginRight: '10px' }}
            >
              {loading ? `Valideren... (${processedCount}/${totalCount})` : 'Valideer BTW Nummers'}
            </button>
          </div>
        )}
        
        {results.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3>Resultaten:</h3>
              <button
                onClick={exportInactiveCompanies}
                style={{ padding: '8px 16px' }}
              >
                Export Inactieve Bedrijven
              </button>
            </div>
            <div>
              {results.map((result, index) => (
                <div 
                  key={index}
                  style={{
                    padding: '15px',
                    marginBottom: '10px',
                    backgroundColor: 
                      result.isValid || 
                      manualOverrides[result.formattedNumber]?.activeInKBO || 
                      manualOverrides[result.formattedNumber]?.newVATNumber 
                      ? '#e8f5e9' 
                      : '#ffebee',
                    borderRadius: '4px'
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>
                    {displayFormattedVATNumber(result.formattedNumber)} - {result.companyName}
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#777', marginTop: '5px' }}>
                    {result.type} | {result.address}
                  </div>
                  
                  {result.isValid ? (
                    <div style={{ color: '#666', marginTop: '5px' }}>
                      <div>{result.details.name}</div>
                      <div>{result.details.address}</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ color: '#d32f2f', marginTop: '5px' }}>
                        {result.error}
                      </div>
                      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <a 
                          href={getKBOLink(result.formattedNumber)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#1976d2', textDecoration: 'none' }}
                        >
                          Controleer in KBO ↗
                        </a>
                        <button 
                          onClick={() => {
                            setCurrentAddress(result.address);
                            setShowAddressDialog(true);
                          }}
                          style={{ 
                            color: '#1976d2', 
                            textDecoration: 'none',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: 'inherit'
                          }}
                        >
                          Zoek op adres ↗
                        </button>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="checkbox"
                              checked={manualOverrides[result.formattedNumber]?.activeInKBO || false}
                              onChange={() => handleOverrideChange(result.formattedNumber, 'activeInKBO')}
                            />
                            <span style={{ color: '#666' }}>
                              Actief volgens KBO
                            </span>
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="checkbox"
                                checked={manualOverrides[result.formattedNumber]?.newVATNumber || false}
                                onChange={() => handleOverrideChange(result.formattedNumber, 'newVATNumber')}
                              />
                              <span style={{ color: '#666' }}>
                                Nog actief onder ander BTW nummer
                              </span>
                            </label>
                            {manualOverrides[result.formattedNumber]?.newVATNumber && (
                              <input
                                type="text"
                                placeholder="BE xxxx xxx xxx"
                                value={manualOverrides[result.formattedNumber]?.newVatNumberValue || ''}
                                onChange={(e) => handleNewVatNumberChange(result.formattedNumber, e.target.value)}
                                style={{ 
                                  marginLeft: '8px',
                                  padding: '4px',
                                  width: '150px',
                                  border: '1px solid #ccc',
                                  borderRadius: '4px'
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {showAddressDialog && (
          <AddressSearchDialog 
            address={currentAddress} 
            onClose={() => setShowAddressDialog(false)}
            onSelectVatNumber={(newVatNumber) => {
              // Zoek het resultaat dat bij het huidige adres hoort
              const resultForAddress = results.find(r => r.address === currentAddress);
              
              if (resultForAddress) {
                // Update de manualOverrides state
                handleOverrideChange(resultForAddress.formattedNumber, 'newVATNumber');
                handleNewVatNumberChange(resultForAddress.formattedNumber, newVatNumber);
              }
              
              // Sluit de dialoog
              setShowAddressDialog(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
EOF