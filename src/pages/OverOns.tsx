import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Users, Award } from 'lucide-react';
import heroOriginal from '@/assets/hero-original.jpg';

const values = [
  {
    icon: Heart,
    title: 'Passie',
    description: 'Alles wat we doen komt voort uit liefde voor ambachtelijke producten en goede smaak.',
  },
  {
    icon: Users,
    title: 'Persoonlijk',
    description: 'Elke klant is bij ons welkom en krijgt de persoonlijke aandacht die hij of zij verdient.',
  },
  {
    icon: Award,
    title: 'Kwaliteit',
    description: 'Wij werken alleen met de beste ingrediënten en leveranciers voor optimale kwaliteit.',
  },
];

const timeline = [
  {
    year: '1986',
    title: 'De Start',
    description: 'FrisVersshop opent de deuren aan de Willem en Marialaan in Gouda.',
  },
  {
    year: '1995',
    title: 'Uitbreiding',
    description: 'Door groeiende vraag breiden we ons assortiment uit met meer kaassoorten en delicatessen.',
  },
  {
    year: '2010',
    title: 'Bezorgservice',
    description: 'We starten met onze bezorgservice om nog meer klanten te kunnen bedienen.',
  },
  {
    year: '2025',
    title: 'Nieuwe Winkel',
    description: 'Frisversshop opent de deuren in een nieuwe winkel, in dezelfde straat.',
  },
  {
    year: 'Nu',
    title: '40 Jaar Ervaring',
    description: 'Nog steeds dezelfde passie voor kwaliteit en service als op dag één.',
  },
];

const OverOns = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-24 md:py-32">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroOriginal})` }}
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
              Over <span className="text-primary">FrisVersshop</span>
            </h1>
            <p className="text-lg text-card/90 leading-relaxed">
              Al meer dan 40 jaar de vertrouwde naam voor kaas, delicatessen en belegde broodjes in Gouda.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                Ons Verhaal
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Bij Frisversshop staat de persoonlijke aandacht voor onze klanten voorop. 
                  Wij hechten veel waarde aan de wensen van onze klanten. Sinds 1986 hebben wij 
                  een sterke band met onze klanten gecreëerd en hun vertrouwen gewonnen.
                </p>
                <p>
                  Wat begon als een kleine delicatessenwinkel is uitgegroeid tot dé plek in 
                  Gouda voor verse broodjes, ambachtelijke kazen en heerlijke vleeswaren. 
                  Onze passie voor kwaliteit en vakmanschap is door de jaren heen alleen maar gegroeid.
                </p>
                <p>
                  Doordat wij veel soorten brood zelf kunnen bakken en wij u een breed assortiment 
                  kaas, vleeswaren en salades kunnen aanbieden, kunt u bij ons kiezen tussen 
                  bijna 1000 verschillende soorten belegde broodjes! Onze overheerlijke broodjes 
                  worden altijd vers voor u gebakken in onze eigen oven.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="overflow-hidden rounded-2xl shadow-card">
                <img 
                  src={heroOriginal} 
                  alt="FrisVersshop winkel"
                  className="w-full h-96 object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground rounded-2xl p-6 shadow-glow">
                <div className="text-4xl font-display font-bold">40</div>
                <div className="text-sm">Jaar Ervaring</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 bg-muted">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Onze Waarden
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Dit is waar wij voor staan en wat ons drijft elke dag.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 text-center shadow-warm"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Onze Geschiedenis
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            {timeline.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex gap-6 mb-8 last:mb-0"
              >
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-sm">
                    {item.year}
                  </div>
                  {index < timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-border mt-4" />
                  )}
                </div>
                <div className="pb-8">
                  <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {item.description}
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
              Kom Langs!
            </h2>
            <p className="text-secondary-foreground/80 text-lg mb-8">
              Wij verwelkomen u graag in onze winkel aan de Willem en Marialaan 46 in Gouda.
            </p>
            <Button variant="hero" size="xl" asChild>
              <Link to="/contact">
                Contact & Route
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default OverOns;
