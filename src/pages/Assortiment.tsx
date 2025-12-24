import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ArrowRight, ExternalLink } from 'lucide-react';
import belegdeBroodjes from '@/assets/belegde-broodjes.jpg';

const categories = [
  {
    id: 'verrassen',
    title: 'Laat u verrassen!',
    description: 'Heeft u geen tijd of geen zin om allemaal verschillende broodjes uit te kiezen? Of wilt u zich gewoon laten verrassen? Kies dan voor een assorti. Wij maken voor u een heerlijke selectie van verschillende broodjes met vers beleg.',
    products: [
      { name: 'Assorti broodjes', description: 'Een selectie uit onze verse harde broodjes belegd met allerlei lekkers uit ons assortiment: kaas, vleeswaren, salades en andere specialiteiten.', price: '€3,50' },
      { name: 'Assorti met rauwkost', description: 'Een selectie van onze heerlijke harde broodjes met een willekeurige belegsoort, gegarneerd met rauwkost en/of gekookt ei.', price: '€3,95' },
      { name: 'Assorti dubbel belegd', description: 'Een selectie van onze heerlijke harde broodjes met dubbel beleg.', price: '€4,50' },
      { name: 'Assorti extra luxe', description: 'Een selectie van onze heerlijke harde broodjes, dubbel belegd en met rauwkost.', price: '€5,00' },
    ],
  },
  {
    id: 'broodjes',
    title: 'Broodjes',
    description: 'Kies eerst uw broodje, daarna de belegsoort.',
    products: [
      { name: 'Petit pain wit', description: 'Belegd per broodje vanaf:', price: 'Vanaf €3,60' },
      { name: 'Petit pain lichtbruin', description: 'Belegd per broodje vanaf:', price: 'Vanaf €3,60' },
      { name: 'Zacht broodje bruin', description: 'Belegd per broodje vanaf:', price: 'Vanaf €3,25' },
      { name: 'Zacht broodje wit', description: 'Belegd per broodje vanaf:', price: 'Vanaf €3,25' },
      { name: 'Tijgerbol wit', description: 'Belegd per broodje vanaf:', price: 'Vanaf €3,60' },
      { name: 'Duitse bol wit', description: 'Belegd per broodje vanaf:', price: 'Vanaf €3,60' },
      { name: 'Triangel meergranen', description: 'Belegd per broodje vanaf:', price: 'Vanaf €3,60' },
      { name: 'Ciabatta waldkorn', description: 'Belegd per broodje vanaf:', price: 'Vanaf €3,75' },
      { name: 'Ciabatta wit', description: 'Belegd per broodje vanaf:', price: 'Vanaf €3,65' },
      { name: 'Payesita wit', description: 'Belegd per broodje vanaf:', price: 'Vanaf €3,95' },
      { name: 'Payesita bruin (licht)', description: 'Belegd per broodje vanaf:', price: 'Vanaf €3,95' },
      { name: 'Italiaanse bol wit', description: 'Belegd per broodje vanaf:', price: 'Vanaf €3,95' },
      { name: 'Waldkornbol', description: 'Belegd per broodje vanaf:', price: 'Vanaf €3,95' },
      { name: 'Speltbroodje rustique', description: 'Belegd per broodje vanaf:', price: 'Vanaf €3,50' },
      { name: 'Maisbroodje', description: 'Belegd per broodje vanaf:', price: 'Vanaf €3,60' },
      { name: 'Roombotercroissant', description: 'Belegd per broodje vanaf:', price: 'Vanaf €2,95' },
      { name: 'Milanobroodje', description: 'Wit broodje met vleugje zongedroogde tomaat en kruiden. Belegd per broodje vanaf:', price: 'Vanaf €3,60' },
      { name: 'Pompoenpit broodje', description: 'Lichtbruin broodje met heerlijke pitten. Belegd per broodje vanaf:', price: 'Vanaf €3,85' },
      { name: 'Glutenvrij broodje', description: 'Belegd per broodje vanaf:', price: 'Vanaf €5,25' },
      { name: 'Fitness piccolo', description: 'Belegd per broodje vanaf:', price: 'Vanaf €3,75' },
    ],
  },
  {
    id: 'onbelegd',
    title: 'Broodjes onbelegd',
    description: 'Maak uw keuze: afgebakken of om zelf af te bakken. (afbaktijd: 8-10 minuten 200°C voorverwarmde oven)',
    products: [
      { name: 'Ciabatta wit', description: 'Zelf afbakken? 8-10 min. in voorverwarmde oven 200 graden', price: '€1,39' },
      { name: 'Duitse bol', description: 'Zelf afbakken? 8-10 min. Allergenen: Tarwe, rogge', price: '€0,85' },
      { name: 'Fitness Picolo', description: 'Zelf afbakken? 8-10 min. Allergenen: Tarwe, rogge, haver, sesam, soja, gerst', price: '€1,29' },
      { name: 'Maisbroodje', description: 'Zelf afbakken? 8-10 min. in voorverwarmde oven 200 graden', price: '€0,99' },
      { name: 'Payesita lichtbruin', description: 'Zelf afbakken? 8-10 min. in voorverwarmde oven 200 graden', price: '€1,09' },
      { name: 'Payesita wit', description: 'Zelf afbakken? 8-10 min. in voorverwarmde oven 200 graden', price: '€1,09' },
      { name: 'Petit Pain lichtbruin', description: 'Zelf afbakken? 8-10 min. Allergenen: Tarwe, soja, haver', price: '€0,99' },
      { name: 'Pompoenbroodje', description: 'Zelf afbakken? 8-10 min. in voorverwarmde oven 200 graden', price: '€1,59' },
      { name: 'Waldkornbol', description: 'Zelf afbakken? 8-10 min. in voorverwarmde oven 200 graden', price: '€1,59' },
      { name: 'Petit Pain wit', description: 'Zelf afbakken? 8-10 min. in voorverwarmde oven 200 graden', price: '€0,89' },
      { name: 'Tijgerbol wit', description: 'Zelf afbakken? 8-10 min. in voorverwarmde oven 200 graden', price: '€0,99' },
      { name: 'Milanobroodje', description: 'Zelf afbakken? 8-10 min. in voorverwarmde oven 200 graden', price: '€0,99' },
      { name: 'Ciabatta waldkorn', description: 'Zelf afbakken? 8-10 min. in voorverwarmde oven 200 graden', price: '€1,49' },
      { name: 'Italiaanse bol', description: 'Zelf afbakken? 8-10 min. Allergenen: Tarwe', price: '€1,09' },
      { name: 'Triangel meergranen', description: 'Zelf afbakken? 8-10 min. in voorverwarmde oven 200 graden', price: '€0,89' },
      { name: 'Zachte bol wit', description: 'Kant en klaar en reeds opengesneden. Allergenen: Tarwe, melk, soja, lactose', price: '€0,49' },
      { name: 'Zachte bol bruin', description: 'Kant en klaar en reeds opengesneden. Allergenen: Tarwe, melk, gerst, lactose', price: '€0,49' },
      { name: 'Speltbroodje', description: 'Zelf afbakken? 8-10 min. in voorverwarmde oven 200 graden', price: '€1,49' },
      { name: 'Stokbrood 400 gram wit', description: 'Zelf afbakken? 8-10 min. Allergenen: Tarwe', price: '€3,59' },
      { name: 'Glutenvrij broodje', description: 'Heerlijk glutenvrij afbakbroodje zaden of wit', price: '€1,50' },
    ],
  },
  {
    id: 'warm',
    title: 'Warme broodjes',
    description: 'Deze soorten broodjes dienen warm gegeten te worden. Uiteraard kunt u dat zelf ook doen in uw eigen oven (ca 5-6 min. 200°C).',
    products: [
      { name: 'Croissant kaas', description: 'Roomboter croissant met rijke (echte) kaasvulling en kaasgarnering. Allergenen: Melk, tarwe, lactose', price: '€2,19' },
      { name: 'Croissant ham-kaas', description: 'Roombotercroissant met kaas en ham gevuld. Allergenen: Melk, tarwe, lactose, soja', price: '€2,49' },
      { name: 'Croissant ham-kaas-ananas', description: 'Roombotercroissant met kaas, ham en ananas. Allergenen: Melk, tarwe, lactose, soja', price: '€2,49' },
      { name: 'Pizzabroodje', description: 'Heerlijk stokbroodje met pizzasaus, salami, tomaat en boerenkruidenkaas', price: '€3,49' },
      { name: 'Kaas-uien broodje', description: 'Stokbroodje met bieslookroomkaas, ui, kaas en oregano. Vegetarisch! Allergenen: Melk, tarwe, lactose, vis(visolie)', price: '€3,49' },
      { name: 'Hawai broodje', description: 'Stokbroodje met kerriesaus, kipfilet, ananas en kaas. Allergenen: Melk, tarwe, lactose, soja, ei, mosterd', price: '€3,49' },
      { name: 'Saucijzenbroodje', description: 'Allergenen: Tarwe, ei', price: '€2,49' },
      { name: 'Kaasbroodje', description: 'Allergenen: Melk, tarwe, lactose, ei', price: '€2,19' },
      { name: 'Frikandel broodje', description: 'Roomboterbladerdeeg met hele frikandel en curry-ketchup. Allergenen: Tarwe, ei', price: '€2,19' },
      { name: 'Broodje kroket', description: 'Zacht wit/bruin broodje met rundvleeskroket. Mosterd los erbij.', price: '€3,10' },
    ],
  },
  {
    id: 'luxe',
    title: 'Luxe Hapjes & Maaltijdsalades',
    description: 'Voor een speciale gelegenheid of een gezonde lunch.',
    products: [
      { name: '25 Luxe hapjes assorti op schalen', description: 'Assorti van 7 à 8 soorten hapjes. Bij normaal gebruik op 3 hapjes per persoon rekenen. Prijs per 25 hapjes (8-9 pers., minimale afname)', price: '€31,25' },
      { name: 'Rundvlees salade opgemaakt', description: 'Prijs per persoon (ruime portie). Let op: minimale afname vanaf 4 personen', price: '€3,95' },
      { name: 'Zalmsalade opgemaakt', description: 'Prijs per persoon (ruime portie). Minimale afname vanaf 4 personen', price: '€4,50' },
      { name: 'Scharrel-ei salade (zonder vlees)', description: 'Prijs per persoon (ruime portie). Let op: minimale afname vanaf 4 personen', price: '€3,95' },
      { name: 'Schaal kaassoorten in blokje/puntjes', description: 'Schaal +/- 50 stukjes kaas assorti', price: '€19,95' },
      { name: 'Schaal worst/vleeswaren assorti', description: 'Schaal +/- 50 diverse worst en vleeswaren stukjes', price: '€19,95' },
      { name: 'Schaal kaas EN worst assorti', description: 'Schaal +/- 50 stukjes kaas EN worst/vleeswaren stukjes', price: '€19,95' },
    ],
  },
  {
    id: 'soepen',
    title: 'Warme soepen',
    description: 'Wij leveren ook warme soepen. Per soort soep voor minimaal 4 personen. Geleverd in warmhoudpannen.',
    products: [
      { name: 'Kippensoep', description: 'Bestellen vanaf 4 personen. Geleverd in warmhoudpannen. Prijs per persoon.', price: '€3,00' },
      { name: 'Groentesoep', description: 'Bestellen vanaf 4 personen. Geleverd in warmhoudpannen. Prijs per persoon.', price: '€3,00' },
      { name: 'Erwtensoep', description: 'Bestellen vanaf 4 personen. Geleverd in warmhoudpannen. Prijs per persoon.', price: '€3,50' },
      { name: 'Chinese tomatensoep', description: 'Bestellen vanaf 4 personen. Geleverd in warmhoudpannen. Prijs per persoon.', price: '€3,50' },
      { name: 'Soepkom in bruikleen', description: 'Soepkom en bestek (lepel)', price: '€0,50' },
      { name: 'Tomatensoep met ballen', description: 'Bestellen vanaf 4 personen. Geleverd in warmhoudpannen. Prijs per persoon.', price: '€3,50' },
    ],
  },
  {
    id: 'overig',
    title: 'Overig',
    description: 'O.a. slaatjes, zoete producten en andere heerlijkheden.',
    products: [
      { name: 'Rundvlees slaatje eigen keuken', description: 'Allergenen: Tarwe, ei, mosterd, soja', price: '€1,99' },
      { name: 'Roomboter croissant onbelegd', description: 'Allergenen: Melk, tarwe', price: '€0,99' },
      { name: 'Krentenbol', description: 'Super krentenbol', price: '€0,99' },
      { name: 'Spekkoek per 1/4', description: 'Allergenen: Melk, tarwe, ei', price: '€3,95' },
      { name: 'Dadelbrood met walnoten', description: 'Prijs per 150 gram. Allergenen: Noten', price: '€2,99' },
      { name: 'Albert bonbons', description: 'Prachtige selectie van de allerlekkerste bonbons van chocolaterie Albert. Prijs per 100 gram (ca 5 bonbons)', price: '€4,49' },
      { name: 'Cannoli croccante', description: 'Origineel Siciliaanse Cannoli\'s. Smaken: chocolade, pistache, aardbei, hazelnoot, koffie, citroen, sinaasappel, caramel-zeezout, tiramisu, custard. Per stuk:', price: '€1,75' },
    ],
  },
  {
    id: 'dranken',
    title: 'Gekoelde dranken',
    description: 'Blikjes fris, flesjes sap, water, melk, karnemelk, chocomel enz.',
    products: [
      { name: 'Melk, karnemelk, chocomel', description: '', price: 'Vanaf €1,99' },
      { name: 'Blikjes/flesjes frisdrank', description: '', price: 'Vanaf €1,45' },
      { name: 'Diverse vruchtensappen', description: '', price: 'Vanaf €3,39' },
    ],
  },
  {
    id: 'fruit',
    title: 'Vers fruit',
    description: 'Prijs per stuk (indien enig fruit niet voorradig is, krijgt u een alternatief).',
    products: [
      { name: 'Maak uw keuze uit deze fruitsoorten', description: '', price: 'Vanaf €1,10' },
    ],
  },
];

const Assortiment = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-24 md:py-32">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${belegdeBroodjes})` }}
        >
          <div className="absolute inset-0 bg-foreground/70" />
        </div>
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-card mb-6">
              Ons <span className="text-primary">Assortiment</span>
            </h1>
            <p className="text-lg text-card/90 leading-relaxed">
              Doordat wij veel soorten brood zelf kunnen bakken en wij u een breed assortiment 
              kaas, vleeswaren en salades kunnen aanbieden, kunt u bij ons kiezen tussen 
              bijna 1000 verschillende soorten belegde broodjes!
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick Nav */}
      <section className="py-8 bg-muted sticky top-0 z-20">
        <div className="container">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <a
                key={category.id}
                href={`#${category.id}`}
                className="px-4 py-2 rounded-full bg-card text-foreground text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm"
              >
                {category.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="space-y-20">
            {categories.map((category, catIndex) => (
              <motion.div
                key={category.id}
                id={category.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="scroll-mt-32"
              >
                <div className="mb-8">
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                    {category.title}
                  </h2>
                  <p className="text-muted-foreground text-lg max-w-3xl">
                    {category.description}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {category.products.map((product, index) => (
                    <motion.div
                      key={product.name}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="bg-card rounded-xl p-5 shadow-card hover:shadow-glow transition-shadow flex flex-col"
                    >
                      <h3 className="font-semibold text-foreground mb-2">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-muted-foreground text-sm mb-4 flex-grow">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                        <span className="font-display font-bold text-primary text-lg">
                          {product.price}
                        </span>
                        <Button variant="hero" size="sm" asChild>
                          <a 
                            href="https://bestellen.frisversbroodjes.nl/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            Bestellen
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-secondary rounded-3xl mx-4 md:mx-8 mb-8">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary-foreground mb-6">
              Klaar om te bestellen?
            </h2>
            <p className="text-secondary-foreground/80 text-lg mb-8">
              Bestel direct via onze website of neem contact met ons op voor vragen of grotere bestellingen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="xl" asChild>
                <a href="https://bestellen.frisversbroodjes.nl/" target="_blank" rel="noopener noreferrer">
                  Bestel Nu
                  <ArrowRight className="w-5 h-5" />
                </a>
              </Button>
              <Button variant="outline" size="xl" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" asChild>
                <Link to="/contact">
                  Neem Contact Op
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Assortiment;