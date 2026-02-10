
## Bestelnummers repareren: TEMP- probleem oplossen

### Probleem
De bestelnummers blijven op `TEMP-...` staan omdat er een conflict is tussen twee onderdelen:

- De **Edge Function** (`create-order`) vult een tijdelijk nummer in: `TEMP-1234567-abc`
- De **database trigger** zou dit moeten overschrijven, maar die springt alleen in als het bestelnummer **leeg of NULL** is -- en dat is het niet (het is `TEMP-...`)

### Oplossing (2 wijzigingen)

**1. Database migratie**
- De trigger-conditie aanpassen zodat deze ook afgaat bij bestelnummers die beginnen met `TEMP-`
- Tegelijk het prefix wijzigen van `FVS-` naar `FRIS-` (zoals eerder besproken)

```sql
-- De trigger gaat nu ook af bij TEMP- nummers
WHEN (NEW.order_number IS NULL 
  OR NEW.order_number = '' 
  OR NEW.order_number LIKE 'TEMP-%')
```

**2. Edge Function (`create-order`)**
- Alternatief: het tijdelijke bestelnummer helemaal verwijderen en in plaats daarvan een lege string meegeven, zodat de trigger altijd correct afvuurt
- Dit is de schoonste oplossing

### Resultaat
- Nieuwe bestellingen krijgen automatisch het format `FRIS-2026-0001`, `FRIS-2026-0002`, etc.
- Het `TEMP-` probleem is definitief opgelost

### Technische details

**Stap 1: Database migratie**
- Functie `generate_order_number()` herschrijven met prefix `FRIS-`
- Trigger `set_order_number` opnieuw aanmaken met aangepaste conditie (inclusief `TEMP-%`)

**Stap 2: Edge Function aanpassen**  
- In `supabase/functions/create-order/index.ts` regel 516 wijzigen: de `TEMP-` waarde vervangen door een lege string zodat de trigger altijd het correcte nummer genereert
- Edge Function opnieuw deployen

**Stap 3: Edge Function print preview**
- In `supabase/functions/generate-print-html/index.ts` het test bestelnummer wijzigen van `FVS-TEST-0001` naar `FRIS-TEST-0001`
