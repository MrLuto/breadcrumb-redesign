

# Plan: Alle Klantfeedback Verbeterpunten Implementeren

## Overzicht

Dit plan behandelt alle overgebleven verbeterpunten van de klant. Zondag gesloten is al gedaan (database update). De overige punten zijn hieronder gegroepeerd.

---

## Fase 1: Tekstaanpassingen (Eenvoudig)

### 1.1 Homepage (`src/pages/Index.tsx`)

| Wijziging | Huidige tekst | Nieuwe tekst |
|-----------|---------------|--------------|
| Regel 19 | "Bij Fris Versshop" | "Bij Frisversshop" |
| Regel 24 | "35 jaar ervaring" | "40 jaar ervaring" |
| Regel 92-94 | "Fris Versshop...35 jaar...duurzaam bezorgen" | "Frisversshop...40 jaar" + verwijder "duurzaam" |
| Regel 117 | "35 jaar" | "40 jaar" |
| Regel 157 | "Ons Assortiment" | "Onze Broodjes" |

### 1.2 Over Ons (`src/pages/OverOns.tsx`)

| Wijziging | Huidige | Nieuw |
|-----------|---------|-------|
| Regel 76 | "35 jaar" | "40 jaar" |
| Regel 97 | "Fris Versshop" | "Frisversshop" |
| Regel 129 | "35+" | "40" |
| Regel 49 | "35+ Jaar" | "40 Jaar Ervaring" |
| Regel 26-28 | Duurzaam waarde | Verwijderen uit values array |
| Nieuw timeline item | - | Oktober 2025: "Frisversshop opent de deuren in een nieuwe winkel, in dezelfde straat." |

### 1.3 Footer (`src/components/layout/Footer.tsx`)

| Wijziging | Huidige | Nieuw |
|-----------|---------|-------|
| Regel 82 | "35 jaar" | "40 jaar" |
| Regel 121 | "2803 PH Gouda" | "2805 AR Gouda" |

### 1.4 Contact (`src/pages/Contact.tsx`)

| Wijziging | Huidige | Nieuw |
|-----------|---------|-------|
| Regel 20 | "2803 PH Gouda" | "2805 AR Gouda" |

---

## Fase 2: Zondag uit openingstijden display halen

Nu zondag in de database als `is_closed: true` staat, wordt zondag automatisch als "Gesloten" getoond. De klant wil dat zondag helemaal niet meer getoond wordt.

### Contact pagina (`src/pages/Contact.tsx`)
- Regel 89: `orderedDays` van `[1, 2, 3, 4, 5, 6, 0]` naar `[1, 2, 3, 4, 5, 6]` (zonder zondag)

### Footer (`src/components/layout/Footer.tsx`)
- Regel 12: `orderedDays` van `[1, 2, 3, 4, 5, 6, 0]` naar `[1, 2, 3, 4, 5, 6]` (zonder zondag)

---

## Fase 3: Checkout Formulier Aanpassingen

### 3.1 KvK-nummer veld verwijderen (`src/pages/Checkout.tsx`)
- Verwijder regels 639-651 (het kvk_number FormField)
- Schema blijft intact (veld is al optioneel in database)

### 3.2 Bezorgadres verbergen bij afhalen
- Wrap de bezorgadres sectie (regels 709-755) met een conditie: alleen tonen als `watchedOrderType === 'delivery'`

### 3.3 Betaalmethoden aanpassen (regels 115-120)

| Huidige | Nieuwe |
|---------|--------|
| `monthly_invoice` optie | Verwijderen (staat in schema maar niet in PAYMENT_METHODS) |
| "PIN (bij bezorgen/afhalen)" | "PIN" |
| "Op factuur" | Alleen voor zakelijke klanten tonen |

De filtering wordt dynamisch gemaakt op basis van `watchedCustomerType`.

---

## Fase 4: Contact Formulier - WhatsApp/Email Keuze

### 4.1 Radio buttons toevoegen (`src/pages/Contact.tsx`)

Voeg een nieuw veld toe aan formData:
```typescript
contactMethod: 'whatsapp' | 'email'
```

UI wijzigingen:
- Voeg RadioGroup toe met twee opties: "WhatsApp" en "E-mail"
- Bij WhatsApp: bestaande logica (wa.me URL)
- Bij Email: mailto: link met pre-filled content

---

## Fase 5: Productbeschrijvingen Uitbreiden

### 5.1 ProductCard (`src/components/ProductCard.tsx`)
- Regel 65: `line-clamp-2` wijzigen naar `line-clamp-4` of verwijderen
- Optioneel: hover-effect om volledige beschrijving te tonen

---

## Fase 6: Zone-specifieke Bereidingstijd (Waddinxveen)

### 6.1 Database migratie
Voeg kolom toe aan `delivery_zones`:
```sql
ALTER TABLE delivery_zones 
ADD COLUMN min_preparation_time_minutes INTEGER DEFAULT NULL;
```

### 6.2 Waddinxveen zone toevoegen
```sql
INSERT INTO delivery_zones (postcode_prefix, zone_name, delivery_cost, min_order_amount, min_preparation_time_minutes)
VALUES ('2741', 'Waddinxveen', 12.50, 75.00, 120);
```
Exacte waarden kunnen later aangepast worden in admin.

### 6.3 Frontend aanpassing (`src/pages/Checkout.tsx`)
- Bij tijdvalidatie: gebruik `currentZone?.min_preparation_time_minutes` indien beschikbaar, anders standaard waarde

---

## Fase 7: Product Opties Systeem (Grotere Feature - Later)

Dit vereist:
- Nieuwe database tabellen (`product_options`, `product_option_groups`)
- Admin interface voor opties beheer
- Product detail pagina met opties selectie
- Cart aanpassing voor opties opslag

**Aanbeveling**: Dit als aparte implementatie plannen vanwege complexiteit.

---

## Fase 8: iDEAL Integratie (Pay.nl Pioneer - Later)

Dit vereist:
- Pay.nl account setup
- Edge function voor payment processing
- Webhook voor betalingsstatus
- Order flow aanpassing

**Aanbeveling**: Dit als aparte implementatie plannen.

---

## Samenvatting per Fase

| Fase | Omschrijving | Complexiteit | Prioriteit |
|------|--------------|--------------|------------|
| 1 | Tekstaanpassingen (35→40 jaar, Frisversshop, postcode) | Laag | Hoog |
| 2 | Zondag uit display halen | Laag | Hoog |
| 3 | Checkout: KvK weg, bezorgadres verbergen, betaalmethoden | Gemiddeld | Hoog |
| 4 | Contact: WhatsApp/Email keuze | Gemiddeld | Gemiddeld |
| 5 | Productbeschrijvingen uitbreiden | Laag | Gemiddeld |
| 6 | Zone-specifieke bereidingstijd | Gemiddeld | Gemiddeld |
| 7 | Product opties systeem | Hoog | Later |
| 8 | Pay.nl iDEAL integratie | Hoog | Later |

---

## Technische Details

### Bestanden die aangepast worden

```text
src/pages/Index.tsx          - Tekstaanpassingen
src/pages/OverOns.tsx        - Tekst + timeline + duurzaam weg
src/pages/Contact.tsx        - Postcode + zondag weg + WhatsApp/Email keuze
src/components/layout/Footer.tsx - Postcode + 40 jaar + zondag weg
src/pages/Checkout.tsx       - KvK weg, bezorgadres conditie, betaalmethoden
src/components/ProductCard.tsx - line-clamp aanpassen
```

### Database wijzigingen

```sql
-- Zone-specifieke bereidingstijd kolom
ALTER TABLE delivery_zones 
ADD COLUMN min_preparation_time_minutes INTEGER DEFAULT NULL;

-- Waddinxveen zone (optioneel, waarden af te stemmen)
INSERT INTO delivery_zones (postcode_prefix, zone_name, delivery_cost, min_order_amount, min_preparation_time_minutes, is_active)
VALUES ('2741', 'Waddinxveen', 12.50, 75.00, 120, true);
```

