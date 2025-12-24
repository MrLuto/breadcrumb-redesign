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
    title: 'Laat u verrassen!',
    description: 'Onze speciale selectie van de dag. Verrassende combinaties die u niet wilt missen.',
    image: belegdeBroodjes,
  },
  {
    title: 'Broodjes',
    description: 'Kies uit ons uitgebreide assortiment van heerlijk belegde broodjes met verse ingrediënten.',
    image: belegdeBroodjes,
  },
  {
    title: 'Broodjes onbelegd',
    description: 'Versgebakken broodjes uit onze eigen oven, klaar om naar wens te beleggen.',
    image: luxeBroodjes,
  },
  {
    title: 'Warme broodjes',
    description: 'Heerlijke warme broodjes, vers uit de oven met smeltende kaas en meer.',
    image: luxeBroodjes,
  },
  {
    title: 'Luxe Hapjes & Maaltijdsalades',
    description: 'Voor een speciale gelegenheid of een gezonde lunch. Onze luxe hapjes en verse salades.',
    image: olijvenTapas,
  },
  {
    title: 'Warme soepen',
    description: 'Huisgemaakte soepen, perfect voor een warme lunch op koude dagen.',
    image: kaasWinkel,
  },
  {
    title: 'Overig',
    description: 'Diverse extra\'s om uw bestelling compleet te maken.',
    image: noten,
  },
  {
    title: 'Gekoelde dranken',
    description: 'Verfrissende drankjes om bij uw lunch te serveren.',
    image: dranken,
  },
  {
    title: 'Vers fruit',
    description: 'Vers en gezond fruit, de perfecte aanvulling op uw maaltijd.',
    image: noten,
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
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {category.description}
                  </p>
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
              Interesse in onze producten?
            </h2>
            <p className="text-secondary-foreground/80 text-lg mb-8">
              Kom langs in onze winkel of neem contact met ons op voor meer informatie en bestellingen.
            </p>
            <Button variant="hero" size="xl" asChild>
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
