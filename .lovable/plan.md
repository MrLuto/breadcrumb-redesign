

# Printclient Systeem - Plan

## Overzicht

We bouwen twee onderdelen:
1. **Edge functions** (in Lovable) - API endpoints waarmee de Go-client communiceert
2. **Go printer-client** (apart project, Codex prompt) - Draait lokaal op een PC, pollt voor nieuwe bestellingen en print ze automatisch

## Hoe het werkt

```text
+------------------+       HTTPS/polling        +-------------------+
|  Go Print Client |  <--------------------->   |  Edge Functions   |
|  (lokale PC)     |   GET /print-queue         |  (Lovable Cloud)  |
|                  |   POST /mark-printed       |                   |
|  -> ESC/POS of   |                            |  -> orders tabel  |
|     plain text   |                            |     (print_count, |
|     naar printer |                            |      printed_at)  |
+------------------+                            +-------------------+
```

## Deel 1: Edge Functions (bouw ik in Lovable)

### 1a. `get-print-queue` edge function

- **Authenticatie**: API-key in header (`X-Print-Key`) geverifieerd tegen een secret
- **Logica**: Haalt alle orders op waar `order_status = 'new'` en `printed_at IS NULL`
- **Response**: JSON array met volledige orderdata inclusief items en opties
- **Sortering**: Op `created_at` ascending (oudste eerst)

### 1b. `mark-printed` edge function

- **Authenticatie**: Zelfde API-key check
- **Input**: `{ "order_id": "uuid" }`
- **Logica**:
  - Update `printed_at` naar `now()`
  - Increment `print_count`
  - Zet `order_status` naar `'confirmed'` (= "Geprint")
- **Response**: `{ "success": true }`

### 1c. Secret toevoegen

- `PRINT_API_KEY` - een willekeurige API key die zowel in de edge functions als in de Go config gebruikt wordt

## Deel 2: Go Printer Client (Codex Prompt)

De Go-client wordt **niet** in Lovable gebouwd maar als apart project. Hieronder de volledige Codex prompt die je kunt gebruiken.

---

### Codex Prompt

```text
Bouw een Go CLI applicatie "fvs-printer" die automatisch bestellingen ophaalt 
van een API en uitprint op een lokale printer.

## Configuratie (config.yaml)

printer_name: "HP LaserJet"       # OS printer naam
api_url: "https://erqvlccnuqjyszayxfuc.supabase.co/functions/v1"
api_key: "jouw-print-api-key"
poll_interval_seconds: 15
print_format: "text"              # "text" of "escpos"

## Werking

1. Poll elke `poll_interval_seconds` naar GET {api_url}/get-print-queue
   met header X-Print-Key: {api_key}
2. Voor elke order in de response:
   a. Render de order als plain text bon (zie format hieronder)
   b. Stuur naar de OS printer via het "lp" commando (Linux/Mac) 
      of "print" via Win32 API (Windows)
   c. Bij succes: POST {api_url}/mark-printed met body {"order_id": "..."}
      en header X-Print-Key: {api_key}
   d. Log resultaat naar stdout

## Print Format (plain text bon)

================================================
               BESTELLING
================================================
Bestelnummer:  FVS-2026-0042
Besteldatum:   10 feb 2026 14:30

KLANT
-----
Type:          Zakelijk
Bedrijf:       Bakkerij Jansen
Contact:       Jan de Vries
Telefoon:      06-12345678
Email:         jan@bakkerij.nl

BEZORGING
---------
Type:          Bezorgen
Adres:         Kerkstraat 12
               2741 AB Waddinxveen
Datum:         maandag 10 februari 2026
Tijd:          12:00

PRODUCTEN
---------
2x  Luxe broodje zalm              EUR 4,50    EUR 9,00
    > Broodsoort: Tijgerbol
    > Opmerking: zonder ui
3x  Koffie                         EUR 2,00    EUR 6,00

                          Subtotaal: EUR 15,00
                      Bezorgkosten:  EUR 12,50
                      ========================
                           TOTAAL:  EUR 27,50

Betaalwijze: iDEAL
Betaalstatus: Betaald

OPMERKINGEN
-----------
Graag voor 11:30 bezorgen

================================================
Afgedrukt: 10 feb 2026 14:31
================================================

## Technische eisen

- Go 1.22+
- Gebruik gopkg.in/yaml.v3 voor config parsing
- Graceful shutdown via SIGINT/SIGTERM
- Retry logica: bij API fout max 3 retries met exponential backoff
- Log naar stdout met timestamp
- Cross-platform printer support:
  - Linux/Mac: exec "lp -d {printer_name}" met stdin
  - Windows: exec "powershell -c Get-Printer" check, 
    dan "Out-Printer -Name {printer_name}"

## Structuur

fvs-printer/
  main.go          - entry point, config loading, polling loop
  printer.go       - OS printer abstraction
  api.go           - HTTP client voor get-print-queue en mark-printed
  formatter.go     - Order naar plain text formatting
  config.yaml      - voorbeeld config
  go.mod
  README.md

## API Response format (get-print-queue)

{
  "orders": [
    {
      "id": "uuid",
      "order_number": "FVS-2026-0042",
      "created_at": "2026-02-10T14:30:00Z",
      "company_name": "Bakkerij Jansen",
      "contact_person": "Jan de Vries",
      "customer_type": "business",
      "phone": "06-12345678",
      "email": "jan@bakkerij.nl",
      "order_type": "delivery",
      "delivery_address": "Kerkstraat 12",
      "postcode": "2741AB",
      "city": "Waddinxveen",
      "delivery_date": "2026-02-10",
      "delivery_time": "12:00",
      "delivery_asap": false,
      "subtotal": 15.00,
      "delivery_cost": 12.50,
      "total": 27.50,
      "payment_method": "ideal",
      "payment_status": "paid",
      "notes": "Graag voor 11:30 bezorgen",
      "order_items": [
        {
          "product_name": "Luxe broodje zalm",
          "quantity": 2,
          "unit_price": 4.50,
          "total_price": 9.00,
          "notes": "zonder ui",
          "options": [
            {"group": "Broodsoort", "name": "Tijgerbol", "price": 0}
          ]
        }
      ]
    }
  ]
}
```

---

## Deel 3: Aanpassingen in het admin panel

Na het bouwen van de edge functions voegen we ook een simpele status-indicator toe in het admin panel:
- Een print-icoon bij elke order die aangeeft of deze al geprint is
- Het `printed_at` en `print_count` veld tonen in de OrderDetailDialog

## Technische Details

### Nieuwe bestanden

```text
supabase/functions/get-print-queue/index.ts    - Ophalen ongeprinte orders
supabase/functions/mark-printed/index.ts       - Order als geprint markeren
```

### Aan te passen bestanden

```text
supabase/config.toml                            - Nieuwe functions registreren
src/components/admin/OrderDetailDialog.tsx       - Print-info tonen
src/pages/admin/AdminOrders.tsx                  - Print-icoon tonen
```

### Secret

Een nieuw secret `PRINT_API_KEY` moet worden ingesteld. Dit is een zelfgekozen API key die je ook in de Go client config.yaml zet.

