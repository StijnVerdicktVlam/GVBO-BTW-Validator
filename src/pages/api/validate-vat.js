cat > src/pages/api/validate-vat.js << 'EOF'
// api/validate-vat.js
import axios from 'axios';
import { load } from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { vatNumber } = req.body;

  if (!vatNumber) {
    return res.status(400).json({ message: 'VAT number is required' });
  }

  try {
    // Stap 1: Valideer via VIES
    const viesResult = await validateViaVIES(vatNumber);
    
    if (viesResult.isValid) {
      return res.status(200).json({
        isValid: true,
        details: viesResult.details,
        source: 'VIES'
      });
    }
    
    // Stap 2: Als VIES niet geldig is, probeer KBO
    const kboResult = await validateViaKBO(vatNumber);
    
    if (kboResult.isValid) {
      return res.status(200).json({
        isValid: true,
        details: kboResult.details,
        source: 'KBO'
      });
    }
    
    // Stap 3: Als beide niet geldig zijn, geef ongeldig resultaat terug
    return res.status(200).json({
      isValid: false,
      error: 'BTW nummer niet actief in VIES of KBO'
    });
  } catch (error) {
    console.error('Error validating VAT number:', error);
    return res.status(500).json({ 
      isValid: false,
      error: 'Validatie mislukt: ' + (error.message || 'Onbekende fout')
    });
  }
}

// Functie om BTW-nummer te valideren via VIES (EU BTW-systeem)
async function validateViaVIES(vatNumber) {
  try {
    // Extracteer landcode en nummer
    const countryCode = vatNumber.slice(0, 2);
    const number = vatNumber.slice(2);
    
    // Maak verzoek naar VIES API
    const response = await axios.post('https://ec.europa.eu/taxation_customs/vies/services/checkVatService', {
      countryCode,
      vatNumber: number
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Controleer het resultaat
    if (response.data && response.data.valid) {
      return {
        isValid: true,
        details: {
          name: response.data.name || 'Naam niet beschikbaar',
          address: response.data.address || 'Adres niet beschikbaar'
        }
      };
    }
    
    return { isValid: false };
  } catch (error) {
    console.error('VIES validation error:', error);
    return { isValid: false, error: 'VIES validatie mislukt' };
  }
}

// Functie om BTW-nummer te valideren via KBO (Belgische Kruispuntbank Ondernemingen)
async function validateViaKBO(vatNumber) {
  try {
    // Formatteer het nummer voor KBO (0xxx.xxx.xxx)
    const kboNumber = vatNumber.replace('BE', '').replace(/(\d{4})(\d{3})(\d{3})/, '$1.$2.$3');
    
    // Maak verzoek naar KBO Public Search
    const response = await axios.get(`https://kbopub.economie.fgov.be/kbopub/zoeknummerform.html?nummer=${kboNumber}&actionLu=Zoek`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // Parse de HTML-respons met Cheerio
    const $ = load(response.data);
    
    // Controleer of er resultaten zijn
    const hasResults = $('.grid tr').length > 1;
    
    if (hasResults) {
      // Haal bedrijfsnaam en adres op
      const companyName = $('.grid tr:nth-child(2) td:nth-child(2)').text().trim();
      let status = $('.grid tr:nth-child(3) td:nth-child(2)').text().trim();
      
      // Controleer of de status actief is
      const isActive = status.toLowerCase().includes('actief') || 
                      !status.toLowerCase().includes('stopgezet');
      
      if (isActive) {
        return {
          isValid: true,
          details: {
            name: companyName || 'Naam niet beschikbaar',
            address: 'Adres via KBO niet beschikbaar',
            status: status
          }
        };
      }
    }
    
    return { isValid: false };
  } catch (error) {
    console.error('KBO validation error:', error);
    return { isValid: false, error: 'KBO validatie mislukt' };
  }
}

EOF