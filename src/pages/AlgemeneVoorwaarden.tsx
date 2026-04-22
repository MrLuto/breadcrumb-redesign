import Layout from "@/components/layout/Layout";

const AlgemeneVoorwaarden = () => {
  return (
    <Layout>
      <div className="container max-w-4xl py-12 px-4 sm:px-6">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
          Algemene Voorwaarden Fris Versshop VOF
        </h1>
        <p className="text-muted-foreground mb-10">
          Versie 1.0 – 22-04-2026 · KvK 81443625
        </p>

        <article className="prose prose-neutral max-w-none space-y-10">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Artikel 1 – Definities</h2>
            <p>In deze algemene voorwaarden wordt verstaan onder:</p>
            <ol className="list-decimal pl-6 space-y-2 mt-2">
              <li>
                <strong>Fris Versshop VOF</strong>: de vennootschap onder firma gevestigd
                te Gouda, ingeschreven bij de Kamer van Koophandel onder nummer 81443625,
                hierna te noemen: “Verkoper”.
              </li>
              <li>
                <strong>Klant</strong>: iedere natuurlijke persoon of rechtspersoon die
                producten afneemt van Verkoper.
              </li>
              <li>
                <strong>Overeenkomst</strong>: iedere overeenkomst tussen Verkoper en
                Klant met betrekking tot levering van producten.
              </li>
              <li>
                <strong>Producten</strong>: alle door Verkoper aangeboden en geleverde
                goederen.
              </li>
              <li>
                <strong>Verzamelfactuur</strong>: maandelijkse factuur waarop alle op
                rekening verrichte leveringen in de betreffende maand zijn opgenomen.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Artikel 2 – Toepasselijkheid</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                Deze algemene voorwaarden zijn van toepassing op alle aanbiedingen,
                offertes, bestellingen, overeenkomsten en leveringen van Verkoper.
              </li>
              <li>
                Afwijkingen van deze voorwaarden zijn alleen geldig indien schriftelijk
                overeengekomen.
              </li>
              <li>
                Eventuele algemene voorwaarden van Klant worden uitdrukkelijk van de hand
                gewezen, tenzij schriftelijk anders overeengekomen.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              Artikel 3 – Aanbiedingen en Overeenkomsten
            </h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                Alle aanbiedingen en prijsopgaven van Verkoper zijn vrijblijvend, tenzij
                uitdrukkelijk anders vermeld.
              </li>
              <li>
                Een overeenkomst komt tot stand na aanvaarding van een bestelling door
                Verkoper.
              </li>
              <li>
                Kennelijke fouten of vergissingen in aanbiedingen, prijzen of communicatie
                binden Verkoper niet.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Artikel 4 – Prijzen</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Alle prijzen zijn in euro’s en inclusief btw, tenzij anders vermeld.</li>
              <li>
                Verkoper behoudt zich het recht voor prijzen te wijzigen als gevolg van
                kostprijsverhogingen, overheidsmaatregelen of marktomstandigheden.
              </li>
              <li>
                Voor lopende overeenkomsten geldt de overeengekomen prijs, tenzij
                prijsaanpassingen wettelijk zijn toegestaan.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Artikel 5 – Betaling</h2>

            <h3 className="text-xl font-semibold mt-6 mb-2">5.1 Directe betaling</h3>
            <p>Klanten kunnen betalen via:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Contante betaling;</li>
              <li>Pinbetaling;</li>
              <li>iDEAL.</li>
            </ul>
            <p className="mt-3">
              Bij directe betaling dient betaling plaats te vinden op het moment van
              levering of afname, tenzij anders overeengekomen.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-2">5.2 Betaling op rekening</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                Betaling op rekening is uitsluitend mogelijk voor bedrijven en na
                goedkeuring door Verkoper.
              </li>
              <li>
                Bij levering op rekening worden bestellingen verzameld en maandelijks
                gefactureerd via een verzamelfactuur.
              </li>
              <li>
                De betaaltermijn van de verzamelfactuur bedraagt 30 dagen na
                factuurdatum.
              </li>
              <li>
                Verkoper kan kredietlimieten instellen en levering op rekening weigeren
                of intrekken.
              </li>
            </ol>

            <h3 className="text-xl font-semibold mt-6 mb-2">5.3 Te late betaling</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Bij overschrijding van de betaaltermijn is Klant van rechtswege in verzuim.</li>
              <li>
                Vanaf dat moment is wettelijke handelsrente (bij zakelijke klanten) of
                wettelijke rente (bij consumenten) verschuldigd.
              </li>
              <li>
                Alle redelijke gerechtelijke en buitengerechtelijke incassokosten komen
                voor rekening van Klant.
              </li>
              <li>
                Verkoper heeft het recht verdere leveringen op te schorten totdat
                volledige betaling heeft plaatsgevonden.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Artikel 6 – Levering</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Voor bezorgbestellingen geldt een minimum orderbedrag van €25,00.</li>
              <li>Verkoper zal leveringen zoveel mogelijk uitvoeren conform de wensen van Klant.</li>
              <li>
                Opgegeven levertijden zijn indicatief en geen fatale termijnen, tenzij
                uitdrukkelijk schriftelijk anders overeengekomen.
              </li>
              <li>
                Door onvoorziene omstandigheden, waaronder maar niet beperkt tot:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>verkeerssituaties;</li>
                  <li>storingen;</li>
                  <li>personeelsuitval;</li>
                  <li>leveranciersproblemen;</li>
                  <li>overmachtssituaties;</li>
                </ul>
                kan levering vertraagd plaatsvinden.
              </li>
              <li>
                Afwijkende levertijden geven Klant in beginsel geen recht op
                schadevergoeding of ontbinding.
              </li>
              <li>
                Levering vindt plaats op het overeengekomen adres of op andere
                overeengekomen wijze.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Artikel 7 – Risico</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Het risico van producten gaat over op Klant bij levering.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              Artikel 8 – Controle, Reclamaties en Klachten
            </h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Klant dient producten direct bij ontvangst te controleren.</li>
              <li>Zichtbare gebreken of tekorten dienen direct bij levering gemeld te worden.</li>
              <li>Andere klachten dienen binnen redelijke termijn schriftelijk te worden gemeld.</li>
              <li>Klachten schorten betalingsverplichtingen niet op.</li>
              <li>
                Indien een klacht gegrond is, zal Verkoper naar eigen keuze vervangen,
                naleveren of crediteren.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Artikel 9 – Aansprakelijkheid</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                Verkoper is uitsluitend aansprakelijk voor directe schade veroorzaakt
                door opzet of grove nalatigheid.
              </li>
              <li>
                Aansprakelijkheid is beperkt tot maximaal het factuurbedrag van de
                betreffende levering.
              </li>
              <li>
                Verkoper is niet aansprakelijk voor:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>indirecte schade;</li>
                  <li>gevolgschade;</li>
                  <li>winstderving;</li>
                  <li>bedrijfsstagnatie;</li>
                  <li>schade ontstaan door vertraagde levering als bedoeld in artikel 6.</li>
                </ul>
              </li>
              <li>
                Beperkingen gelden niet voor aansprakelijkheid die wettelijk niet
                uitgesloten mag worden.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Artikel 11 – Annulering en Retouren</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Bestellingen kunnen tot 24 uur voor levering kosteloos worden geannuleerd.</li>
              <li>
                Bij annulering binnen 24 uur voor levering is afname van de bestelling
                verplicht en blijft volledige betaling verschuldigd.
              </li>
              <li>
                Vanwege de aard van de producten kunnen geleverde producten in beginsel
                niet worden geretourneerd, tenzij sprake is van een foutieve levering of
                gegronde klacht.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Artikel 12 – Opschorting en Beëindiging</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                Verkoper mag leveringen opschorten of overeenkomsten beëindigen indien:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Klant betalingsverplichtingen niet nakomt;</li>
                  <li>Klant in surseance of faillissement verkeert;</li>
                  <li>
                    sprake is van omstandigheden die uitvoering redelijkerwijs onmogelijk
                    maken.
                  </li>
                </ul>
              </li>
              <li>Dit laat het recht op schadevergoeding onverlet.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              Artikel 13 – Toepasselijk recht en Geschillen
            </h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Op alle overeenkomsten is uitsluitend Nederlands recht van toepassing.</li>
              <li>
                Geschillen worden voorgelegd aan de bevoegde rechter in het arrondissement
                waar Verkoper is gevestigd, tenzij dwingend recht anders bepaalt.
              </li>
            </ol>
          </section>
        </article>
      </div>
    </Layout>
  );
};

export default AlgemeneVoorwaarden;
