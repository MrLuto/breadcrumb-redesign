import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Award, Truck, ChefHat, ArrowRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import heroOriginal from '@/assets/hero-original.jpg';
import sandwichImg from '@/assets/sandwich.jpg';
import kaasOriginal from '@/assets/kaas-original.jpg';
import deliImg from '@/assets/delicatessen.jpg';

const features = [
  {
    icon: Users,
    title: 'Persoonlijke Aandacht',
    description: 'Bij Fris Versshop staat de persoonlijke aandacht voor onze klanten voorop. Wij hechten veel waarde aan de wensen van onze klanten.',
  },
  {
    icon: Award,
    title: 'Sinds 1986',
    description: 'Al meer dan 35 jaar ervaring in Gouda. Wij hebben een sterke band met onze klanten gecreëerd en hun vertrouwen gewonnen.',
  },
  {
    icon: ChefHat,
    title: 'Vers Gebakken',
    description: 'Onze overheerlijke broodjes worden altijd vers voor u gebakken in onze eigen oven. Op deze manier bent u altijd verzekerd van een knapperig broodje.',
  },
];

const categories = [
  {
    title: 'Belegde Broodjes',
    description: 'Kies tussen bijna 1000 verschillende soorten belegde broodjes.',
    image: sandwichImg,
    link: '/assortiment',
  },
  {
    title: 'Kaas & Zuivel',
    description: 'Een breed assortiment aan heerlijke kazen uit de regio.',
    image: kaasOriginal,
    link: '/assortiment',
  },
  {
    title: 'Vleeswaren & Delicatessen',
    description: 'Premium vleeswaren en salades van de beste kwaliteit.',
    image: deliImg,
    link: '/assortiment',
  },
];

const Index = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroOriginal})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-transparent" />
        </div>
        
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-card leading-tight mb-6">
              Vers. Ambachtelijk.<br />
              <span className="text-primary">Lokaal Genieten.</span>
            </h1>
            <p className="text-lg md:text-xl text-card/90 mb-8 leading-relaxed">
              Bij Fris Versshop combineren we onze liefde voor kaas, delicatessen en belegde 
              broodjes met meer dan 35 jaar ervaring in Gouda. Bestel online, kom langs in onze 
              winkel of laat je lunch duurzaam bezorgen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/contact">
                  Bestel Nu
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="heroOutline" size="xl" asChild>
                <Link to="/assortiment">Bekijk Assortiment</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 gradient-warm">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Waarom FrisVersshop?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ontdek wat ons al meer dan 35 jaar de favoriete delicatessenwinkel van Gouda maakt.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card rounded-2xl p-8 shadow-card hover:shadow-glow transition-shadow duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Ons Assortiment
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Van versgebakken broodjes tot ambachtelijke kazen - ontdek onze selectie.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link 
                  to={category.link}
                  className="group block overflow-hidden rounded-2xl shadow-card hover:shadow-glow transition-all duration-300"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={category.image} 
                      alt={category.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-2xl font-display font-bold text-card mb-2">
                        {category.title}
                      </h3>
                      <p className="text-card/80">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-12"
          >
            <Button variant="default" size="lg" asChild>
              <Link to="/assortiment">
                Bekijk Alles
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary-foreground mb-6">
              Klaar om te Bestellen?
            </h2>
            <p className="text-secondary-foreground/80 text-lg mb-8">
              Bestel je broodjes online en laat ze bezorgen of haal ze op in onze winkel aan de Willem en Marialaan in Gouda.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="xl" asChild>
                <Link to="/contact">
                  Neem Contact Op
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" asChild>
                <a href="tel:0182524926">Bel: 0182 - 524 926</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
