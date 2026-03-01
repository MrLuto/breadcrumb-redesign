

## Plan: 3 bugfixes voor launch-readiness

### 1. Dubbel "lokaal genieten" op homepage verwijderen
In `src/pages/Index.tsx` regel 82-85 staat:
```
vers. ambachtelijk.
lokaal genieten.
lokaal genieten. (geel)
```
De witte regel "lokaal genieten." wordt verwijderd zodat alleen de gele variant overblijft.

### 2. Producttekst volledig tonen bij Assorti
In `src/components/ProductCard.tsx` staat `line-clamp-4` op de beschrijving. De assorti-producten hebben langere teksten die hierdoor worden afgeknipt. De line-clamp wordt verwijderd of verhoogd zodat de volledige beschrijving zichtbaar is.

### 3. Vandaag bestellen mogelijk maken
In `src/pages/Checkout.tsx` wordt de minimale besteldatum nu op **morgen** gezet (regel 147: `addDays(..., 1)`). Dit wordt aangepast naar **vandaag**, mits de dag niet gesloten is. De kalender wordt ook aangepast zodat vandaag selecteerbaar is (regel 295). De bestaande tijdvalidatie (minimaal 60 min voorbereidingstijd) blijft intact en beschermt tegen te late bestellingen.

---

### Acties bij jou

Op basis van wat ik zie zijn er geen blokkerende technische acties meer bij jou. Wat je zelf nog kunt doen voor live gaan:
- **Foto's toevoegen** aan producten (heb je al benoemd, geen haast)
- **Testbestelling plaatsen** om de volledige flow te doorlopen (incl. betaling/bevestigingsmail)
- **Openingstijden en gesloten dagen** controleren in het admin panel
- **Bezorgzones en -kosten** verifiëren in admin
- **Pay.nl instellingen** testen met een echte iDEAL betaling

