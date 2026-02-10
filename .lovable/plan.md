

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
van een API en uitprint op een lokale printer via HTML rendering.
De client haalt zijn instellingen op van de server bij elke startup en periodiek.

## Configuratie (config.yaml)

api_url: "https://erqvlccnuqjyszayxfuc.supabase.co/functions/v1"
api_key: "jouw-print-api-key"

## Werking

1. Genereer een uniek machine_id op basis van hardware (bijv. MAC-adres + hostname hash)
2. Bij startup: GET {api_url}/print-client-settings?machine_id={id}&desktop_name={hostname}
   met header X-Print-Key: {api_key}
   Response bevat alle instellingen:
   {
     "id": "uuid",
     "machine_id": "...",
     "desktop_name": "...",
     "is_active": true,
     "printer_name": "",
     "paper_width_mm": 80,
     "margin_mm": 5,
     "auto_print": true,
     "poll_interval_seconds": 10,
     "copies": 1
   }
   Als is_active=false, log een melding en stop de polling.
3. Poll elke `poll_interval_seconds` (uit server settings) naar GET {api_url}/get-print-queue
   met header X-Print-Key: {api_key}
4. Elke 60 seconden: herlaad settings via print-client-settings endpoint (heartbeat)
5. Voor elke order in de response:
   a. Haal de HTML-bon op via GET {api_url}/generate-print-html?order_id={id}
      met header X-Print-Key: {api_key}
   b. Sla de HTML op als tijdelijk bestand
   c. Print `copies` exemplaren via het OS print commando:
      - Windows: Start-Process met -Verb Print parameter, gebruik printer_name als die gezet is
      - Linux: wkhtmltopdf + lp -d {printer_name}
      - Mac: wkhtmltopdf + lp -d {printer_name}
   d. Bij succes: POST {api_url}/mark-printed met body {"order_id": "..."}
      en header X-Print-Key: {api_key}
   e. Verwijder het tijdelijke bestand
   f. Log resultaat naar stdout

## Technische eisen

- Go 1.22+
- Gebruik gopkg.in/yaml.v3 voor config parsing
- Graceful shutdown via SIGINT/SIGTERM
- Retry logica: bij API fout max 3 retries met exponential backoff
- Log naar stdout met timestamp
- Machine ID: gebruik een combinatie van MAC-adres en hostname, gehashed
- Cross-platform printer support

## Structuur

fvs-printer/
  main.go          - entry point, config loading, polling loop, settings refresh
  printer.go       - OS printer abstraction (HTML printing)
  api.go           - HTTP client voor alle endpoints
  config.yaml      - voorbeeld config (alleen api_url + api_key)
  go.mod
  README.md

## API Endpoints

### GET /print-client-settings?machine_id={id}&desktop_name={name}
Header: X-Print-Key: {api_key}
Response: { "id": "uuid", "is_active": true, "printer_name": "", "paper_width_mm": 80, ... }
Registreert de client automatisch bij eerste call (upsert), update last_seen_at

### GET /get-print-queue
Header: X-Print-Key: {api_key}
Response: { "orders": [{ "id": "uuid", "order_number": "...", ... }] }

### GET /generate-print-html?order_id={uuid}
Header: X-Print-Key: {api_key}
Response: Complete HTML document (text/html) met inline CSS, klaar om te printen

### POST /mark-printed
Header: X-Print-Key: {api_key}
Body: { "order_id": "uuid" }
Response: { "success": true }
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

