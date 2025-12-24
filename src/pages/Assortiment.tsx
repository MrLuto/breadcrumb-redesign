import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import belegdeBroodjes from '@/assets/belegde-broodjes.jpg';
import kaasWinkel from '@/assets/kaas-winkel.jpg';
import luxeBroodjes from '@/assets/luxe-broodjes.jpg';
import olijvenTapas from '@/assets/olijven-tapas.jpg';
import dranken from '@/assets/dranken.jpg';
import noten from '@/assets/noten.jpg';

const categories = [
  {
    title: 'Belegde Broodjes',
    description: 'Onze broodjes worden altijd vers voor u gebakken in onze eigen oven. Kies uit bijna 1000 verschillende soorten belegde broodjes met een breed assortiment aan kaas, vleeswaren en salades.',
    image: belegdeBroodjes,
    items: ['Broodjes gezond', 'Broodjes kaas', 'Broodjes vlees', 'Luxe broodjes', 'Vegetarische broodjes', 'Warme broodjes'],
  },
  {
    title: 'Kaas & Zuivel',
    description: 'Bij Fris Versshop bent u aan het juiste adres voor de heerlijkste kaassoorten. Ons assortiment kaas is groot en van hoog niveau.',
    image: kaasWinkel,
    items: ['Goudse kaas', 'Boerenkaas', 'Oude kaas', 'Geitenkaas', 'Buitenlandse kazen', 'Verse zuivel'],
  },
  {
    title: 'Luxe Hapjes',
    description: 'Voor feesten, vergaderingen of gewoon om te genieten. Onze luxe broodjes en hapjes zijn altijd een succes.',
    image: luxeBroodjes,
    items: ['Luxe broodjes', 'Borrelhapjes', 'Feestschotels', 'Catering', 'Vergaderbroodjes', 'Partyschotels'],
  },
  {
    title: 'Olijven & Tapas',
    description: 'Heerlijke olijven, tapas en antipasti voor de echte fijnproevers.',
    image: olijvenTapas,
    items: ['Olijven', 'Tapas', 'Antipasti', 'Zongedroogde tomaten', 'Gevulde paprika', 'Fetakaas'],
  },
  {
    title: 'Noten & Snacks',
    description: 'Verse noten, gedroogd fruit en heerlijke snacks voor onderweg of thuis.',
    image: noten,
    items: ['Gemengde noten', 'Cashewnoten', 'Amandelen', 'Gedroogd fruit', 'Studentenhaver', 'Zoute snacks'],
  },
  {
    title: 'Dranken',
    description: 'Een uitgebreid assortiment aan dranken om bij uw lunch te serveren.',
    image: dranken,
    items: ['Frisdranken', 'Sappen', 'Water', 'Koffie & thee', 'Wijn', 'Bier'],
  },
];

const Assortiment = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-muted py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
              Ons <span className="text-primary">Assortiment</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Doordat wij veel soorten brood zelf kunnen bakken en wij u een breed assortiment 
              kaas, vleeswaren en salades kunnen aanbieden, kunt u bij ons kiezen tussen 
              bijna 1000 verschillende soorten belegde broodjes!
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="space-y-24">
            {categories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={`grid lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="overflow-hidden rounded-2xl shadow-card">
                    <img 
                      src={category.image} 
                      alt={category.title}
                      className="w-full h-80 lg:h-96 object-cover"
                    />
                  </div>
                </div>
                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                    {category.title}
                  </h2>
                  <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                    {category.description}
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    {category.items.map((item) => (
                      <div 
                        key={item}
                        className="flex items-center gap-2 text-foreground"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-6">
              Interesse in onze producten?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Kom langs in onze winkel of neem contact met ons op voor meer informatie en bestellingen.
            </p>
            <Button variant="secondary" size="xl" asChild>
              <Link to="/contact">
                Neem Contact Op
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Assortiment;
