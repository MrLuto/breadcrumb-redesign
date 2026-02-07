
# Plan: Zondag Gesloten Zetten in Database

## Wat er moet gebeuren

De winkel is op zondag gesloten, maar in de database staat zondag (day_of_week = 0) nog als open geregistreerd:

| Dag | day_of_week | Huidige status |
|-----|-------------|----------------|
| Zondag | 0 | `is_closed: false` ❌ |
| Maandag-Zaterdag | 1-6 | `is_closed: false` ✓ |

## Oplossing

Een eenvoudige database migratie die de `is_closed` waarde van zondag op `true` zet:

```sql
UPDATE opening_hours 
SET is_closed = true 
WHERE day_of_week = 0;
```

## Resultaat

Na deze wijziging:
- Zondag wordt automatisch als "Gesloten" getoond in de openingstijden
- Het is niet meer mogelijk om op zondag te bestellen
- De "Vandaag gesloten" banner verschijnt automatisch op zondag
- De Contact pagina en Footer tonen zondag als gesloten

## Technische Details

- **Tabel**: `opening_hours`
- **Record ID**: `9e976975-0a57-4580-9bf1-91eed39d7a97`
- **Wijziging**: `is_closed` van `false` naar `true`
- **Impact**: Frontend leest deze waarde en past weergave automatisch aan
