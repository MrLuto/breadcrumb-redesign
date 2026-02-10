
# Printclient Systeem - Plan

## Overzicht

We bouwen twee onderdelen:
1. **Edge functions** (in Lovable) - API endpoints waarmee de Go-client communiceert
2. **Go printer-client** (apart project, Codex prompt) - Draait lokaal op een PC, pollt voor nieuwe bestellingen en print ze automatisch

## Hoe het werkt

```text
+------------------+       HTTPS/polling        +-------------------+
|  Go Print Client |  <--------------------->   |  Edge Functions   |
|  (lokale PC)     |                            |  (Lovable Cloud)  |
|                  |  GET /print-client-settings |                   |
|  -> Detecteert   |  GET /get-print-queue      |  -> print_clients |
|     printers     |  GET /generate-print-html  |     tabel         |
|  -> Haalt HTML   |  POST /mark-printed        |  -> orders tabel  |
|     bon op       |                            |     (print_count, |
|  -> Print via OS |                            |      printed_at)  |
+------------------+                            +-------------------+
```

## Deel 1: Edge Functions (gebouwd in Lovable) ✅

### 1a. `get-print-queue` ✅
- **Auth**: `X-Print-Key` header vs `PRINT_API_KEY` secret
- **Logica**: Orders waar `order_status = 'new'` en `printed_at IS NULL`
- **Response**: JSON met volledige orderdata incl. items en opties

### 1b. `mark-printed` ✅
- **Auth**: Zelfde API-key
- **Input**: `{ "order_id": "uuid" }`
- **Logica**: `printed_at = now()`, `print_count++`, `order_status = 'confirmed'`

### 1c. `generate-print-html` ✅
- **Auth**: Zelfde API-key
- **Input**: `?order_id={uuid}`
- **Response**: Complete HTML document met inline CSS

### 1d. `print-client-settings` ✅
- **Auth**: Zelfde API-key
- **Input**: `?machine_id={id}&desktop_name={naam}&printers={komma-gescheiden}`
- **Logica**: Upsert in `print_clients` tabel, update `last_seen_at` en `available_printers`
- **Response**: Alle instellingen voor deze client

### 1e. Admin pagina `/admin/printers` ✅
- Toont alle geregistreerde print clients met online/offline status
- Edit dialog met dropdown van beschikbare printers (gepusht door Go client)
- Instellingen: printer, papierbreedte, marge, kopieën, poll interval, actief/inactief

## Deel 2: Go Printer Client (Codex Prompt)

De Go-client wordt **niet** in Lovable gebouwd maar als apart project. Hieronder de volledige Codex prompt.

---

### Codex Prompt

```text
Bouw een Go CLI applicatie "fvs-printer" die automatisch bestellingen ophaalt
van een API en uitprint op een lokale printer via HTML rendering.
De client haalt zijn instellingen op van de server bij elke startup en periodiek.

## Configuratie

Hardcoded als constanten in main.go:

const (
    apiURL = "https://erqvlccnuqjyszayxfuc.supabase.co/functions/v1"
    apiKey = "688a88ab-543c-4c34-b35b-b34070ab3afd"
)

Geen config file nodig. Alle overige instellingen (printer, papier, interval, etc.)
worden opgehaald van de server via het print-client-settings endpoint.

## Werking

1. Genereer een uniek machine_id op basis van hardware (bijv. MAC-adres + hostname hash)
2. Detecteer alle beschikbare printers op het systeem:
   - Windows: PowerShell `Get-Printer | Select-Object Name` (parse output)
   - Linux: `lpstat -a` (parse printernamen)
   - Mac: `lpstat -a` (parse printernamen)
3. Bij startup: registreer bij de server:
   GET {apiURL}/print-client-settings?machine_id={id}&desktop_name={hostname}&printers={komma-gescheiden-lijst}
   Header: X-Print-Key: {apiKey}
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
   Als auto_print=false, sla printen over maar blijf pollen.
4. Poll elke `poll_interval_seconds` (uit server settings) naar:
   GET {apiURL}/get-print-queue
   Header: X-Print-Key: {apiKey}
5. Elke 60 seconden: herlaad settings via print-client-settings endpoint (heartbeat + printerlijst refresh).
   Pas poll interval en andere settings direct toe als ze gewijzigd zijn.
6. Voor elke order in de print queue response:
   a. Haal de HTML-bon op:
      GET {apiURL}/generate-print-html?order_id={id}
      Header: X-Print-Key: {apiKey}
   b. Sla de HTML op als tijdelijk bestand
   c. Print `copies` exemplaren via het OS print commando:
      - Windows: Start-Process met -Verb Print parameter, gebruik printer_name als die gezet is
      - Linux: wkhtmltopdf naar PDF, dan `lp -d {printer_name}`
      - Mac: wkhtmltopdf naar PDF, dan `lp -d {printer_name}`
      Als printer_name leeg is, gebruik de standaard systeemprinter.
   d. Bij succes: POST {apiURL}/mark-printed
      Header: X-Print-Key: {apiKey}
      Body: {"order_id": "..."}
   e. Verwijder het tijdelijke bestand
   f. Log resultaat naar stdout met timestamp

## Technische eisen

- Go 1.22+
- Geen externe config file nodig (api_url en api_key hardcoded)
- Graceful shutdown via SIGINT/SIGTERM
- Retry logica: bij API fout max 3 retries met exponential backoff
- Log naar stdout met timestamp
- Machine ID: gebruik een combinatie van MAC-adres en hostname, gehashed (SHA256, eerste 16 chars)
- Cross-platform printer detectie en printing

## Structuur

fvs-printer/
  main.go          - entry point, hardcoded config, polling loop, settings refresh
  printer.go       - OS printer detectie + print abstractie (HTML printing)
  api.go           - HTTP client voor alle endpoints
  go.mod
  README.md

## API Endpoints

### GET /print-client-settings?machine_id={id}&desktop_name={name}&printers={komma-gescheiden}
Header: X-Print-Key: {apiKey}
Response: {
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
Registreert de client automatisch bij eerste call (upsert).
Update last_seen_at en available_printers bij elke call.

### GET /get-print-queue
Header: X-Print-Key: {apiKey}
Response: { "orders": [{ "id": "uuid", "order_number": "FVS-2026-0001", ... }] }

### GET /generate-print-html?order_id={uuid}
Header: X-Print-Key: {apiKey}
Response: Complete HTML document (text/html) met inline CSS, klaar om te printen

### POST /mark-printed
Header: X-Print-Key: {apiKey}
Body: { "order_id": "uuid" }
Response: { "success": true }
```
