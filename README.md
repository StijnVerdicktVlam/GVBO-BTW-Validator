cat > README.md << 'EOF'
# GVBO BTW Validator

BTW nummer validatie tool voor de verkooppunten van Groen van bij ons.

## Functionaliteiten

- Validatie van BTW-nummers via VIES en KBO
- Controle op stopgezette ondernemingen
- Zoeken naar bedrijven op hetzelfde adres met een nieuw BTW-nummer
- Exporteren van inactieve bedrijven naar Excel

## Installatie

```bash
# Kloon de repository
git clone https://github.com/StijnVerdictVlam/GVBO-BTW-Validator.git
cd GVBO-BTW-Validator

# Installeer dependencies
npm install

# Start de ontwikkelserver
npm start