cat > src/services/MockServices.js << 'EOF'
// Mock services voor het testen van de BTW-validator

// Mock database met BTW-nummers (voor demonstratiedoeleinden)
const mockVatDatabase = {
  // Enkele geldige nummers (voorbeeld)
  'BE0123456789': {
    name: 'Bloemenwinkel Voorbeeld 1',
    address: 'Teststraat 123, 1000 Brussel',
    status: 'Actief'
  },
  'BE0987654321': {
    name: 'Tuincentrum Voorbeeld 2',
    address: 'Demoweg 45, 2000 Antwerpen',
    status: 'Actief'
  },
  // Voeg hier meer mockgegevens toe indien nodig
};

// Mock voor de VIES-service
export const mockViesService = async (vatNumber) => {
  // Simuleer een vertraging zoals bij een echte API
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Voor demonstratiedoeleinden, beschouw nummers die voorkomen in onze mockdatabase als geldig
  if (mockVatDatabase[vatNumber]) {
    return {
      isValid: true,
      details: {
        name: mockVatDatabase[vatNumber].name,
        address: mockVatDatabase[vatNumber].address
      }
    };
  }
  
  // Voor demonstratiedoeleinden, beschouw bepaalde patronen als geldig
  if (vatNumber.startsWith('BE0') && vatNumber.length === 12) {
    // Simuleer dat 30% van de BE-nummers geldig is in VIES
    const lastDigit = parseInt(vatNumber.charAt(vatNumber.length - 1));
    if (lastDigit < 3) {  // 0, 1, 2 zijn geldig (30% kans)
      return {
        isValid: true,
        details: {
          name: `Automatisch gegenereerde naam voor ${vatNumber}`,
          address: 'Adres automatisch gegenereerd voor demo'
        }
      };
    }
  }
  
  return { isValid: false };
};

// Mock voor de KBO-service
export const mockKboService = async (vatNumber) => {
  // Simuleer een vertraging zoals bij een echte API
  await new Promise(resolve => setTimeout(resolve, 700));
  
  // Voor demonstratiedoeleinden, beschouw nummers die voorkomen in onze mockdatabase als geldig
  if (mockVatDatabase[vatNumber]) {
    return {
      isValid: true,
      details: {
        name: mockVatDatabase[vatNumber].name,
        address: mockVatDatabase[vatNumber].address,
        status: mockVatDatabase[vatNumber].status
      }
    };
  }
  
  // Voor demonstratiedoeleinden, beschouw bepaalde patronen als geldig in KBO maar niet in VIES
  if (vatNumber.startsWith('BE0') && vatNumber.length === 12) {
    // Simuleer dat 20% van de nummers geldig is in KBO maar niet in VIES
    const lastDigit = parseInt(vatNumber.charAt(vatNumber.length - 1));
    if (lastDigit >= 3 && lastDigit < 5) {  // 3, 4 zijn geldig in KBO (20% kans)
      return {
        isValid: true,
        details: {
          name: `KBO Gegenereerde naam voor ${vatNumber}`,
          address: 'Adres niet beschikbaar via KBO',
          status: 'Actief'
        }
      };
    }
  }
  
  return { isValid: false };
};

// Mock voor de adres zoekservice
export const mockAddressSearch = async (addressData) => {
  // Simuleer een vertraging zoals bij een echte API
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const { street, postalCode, city } = addressData;
  
  // Creëer willekeurige resultaten voor het adres
  const resultCount = Math.floor(Math.random() * 3) + 1; // 1-3 resultaten
  const results = [];
  
  for (let i = 0; i < resultCount; i++) {
    // Genereer willekeurig BTW-nummer
    const vatNumber = `BE0${Math.floor(Math.random() * 900000000 + 100000000)}`;
    const enterpriseNumber = vatNumber.replace('BE', '').replace(/(\d{4})(\d{3})(\d{3})/, '$1.$2.$3');
    
    results.push({
      vatNumber,
      enterpriseNumber,
      status: 'Actief',
      name: `Bedrijf op ${street} #${i+1}`,
      address: `${street} ${Math.floor(Math.random() * 50) + 1}, ${postalCode} ${city}`,
      type: Math.random() > 0.5 ? 'Rechtspersoon' : 'Natuurlijk persoon'
    });
  }
  
  return { results };
};

// Integreer deze mockservices in de validator door de API-functies te vervangen
// Bijvoorbeeld:

/*
// In de validateVATNumber functie:
const validateVATNumber = async (vatNumber) => {
  try {
    // Eerst proberen via VIES
    const viesResult = await mockViesService(vatNumber);
    
    if (viesResult.isValid) {
      return { 
        isValid: true, 
        details: viesResult.details,
        source: 'VIES (mock)'
      };
    }
    
    // Als VIES niet geldig is, probeer KBO
    const kboResult = await mockKboService(vatNumber);
    
    if (kboResult.isValid) {
      return { 
        isValid: true, 
        details: kboResult.details,
        source: 'KBO (mock)'
      };
    }
    
    // Als beide niet geldig zijn, geef ongeldig resultaat terug
    return {
      isValid: false,
      error: 'BTW nummer niet actief in VIES of KBO'
    };
  } catch (err) {
    console.error('Validation error:', err);
    return { isValid: false, error: 'Validatie mislukt: ' + err.message };
  }
};
*/

export default {
  mockViesService,
  mockKboService,
  mockAddressSearch
};
EOF