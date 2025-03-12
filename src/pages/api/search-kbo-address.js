cat > src/pages/api/search-kbo-address.js << 'EOF'
// api/search-kbo-address.js
import axios from 'axios';
import { load } from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { street, postalCode, houseNumber, city } = req.body;

  try {
    // Bouw de parameters voor de KBO zoekopdracht
    const params = new URLSearchParams();
    
    if (postalCode) {
      params.append('postcod1', postalCode);
      // Voeg ook de gemeente toe als die bekend is
      if (city) {
        params.append('postgemeente1', `${postalCode} - ${city}`);
      }
    }
    
    if (street) {
      params.append('straatgemeente1', street);
    }
    
    if (houseNumber) {
      params.append('huisnummer', houseNumber);
    }
    
    // Zoek alleen actieve ondernemingen
    params.append('filterEnkelActieve', 'true');
    params.append('_filterEnkelActieve', 'on');
    params.append('actionLU', 'Zoek');
    
    // Doe de zoekopdracht
    const response = await axios.get(`https://kbopub.economie.fgov.be/kbopub/zoekadresform.html?${params.toString()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // Parse de HTML-respons
    const $ = load(response.data);
    
    // Verzamel de resultaten
    const results = [];
    
    $('.grid tr').each((i, elem) => {
      // Sla de header over
      if (i === 0) return;
      
      const columns = $(elem).find('td');
      
      if (columns.length >= 5) {
        const enterpriseNumber = $(columns[0]).text().trim();
        const status = $(columns[1]).text().trim();
        const name = $(columns[2]).text().trim();
        const address = $(columns[3]).text().trim();
        const type = $(columns[4]).text().trim();
        
        // Converteer ondernemingsnummer naar BTW-formaat
        const formattedNumber = enterpriseNumber.replace(/\./g, '');
        const vatNumber = formattedNumber ? `BE${formattedNumber}` : '';
        
        results.push({
          vatNumber,
          enterpriseNumber,
          status,
          name,
          address,
          type
        });
      }
    });
    
    return res.status(200).json({ results });
  } catch (error) {
    console.error('Error searching KBO by address:', error);
    return res.status(500).json({ 
      error: 'Zoeken op adres mislukt: ' + (error.message || 'Onbekende fout') 
    });
  }
}
EOF