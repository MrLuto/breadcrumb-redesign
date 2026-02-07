import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Award, ChefHat, ArrowRight, TrendingUp } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { DeliveryStatusBanner } from '@/components/PostcodeChecker';
import OrderButton from '@/components/OrderButton';
import { useCategories } from '@/hooks/useCategories';
import { usePopularCategories, useHasOrders } from '@/hooks/usePopularCategories';
import heroOriginal from '@/assets/hero-original.jpg';
import belegdeBroodjes from '@/assets/belegde-broodjes.jpg';
import kaasOriginal from '@/assets/kaas-original.jpg';
import olijvenTapas from '@/assets/olijven-tapas.jpg';

const features = [
  {
    icon: Users,
    title: 'Persoonlijke Aandacht',
    description: 'Bij Frisversshop staat de persoonlijke aandacht voor onze klanten voorop. Wij hechten veel waarde aan de wensen van onze klanten.',
  },
  {
    icon: Award,
    title: 'Sinds 1986',
    description: 'Al meer dan 40 jaar ervaring in Gouda. Wij hebben een sterke band met onze klanten gecreëerd en hun vertrouwen gewonnen.',
  },
  {
    icon: ChefHat,
    title: 'Vers Gebakken',
    description: 'Onze overheerlijke broodjes worden altijd vers voor u gebakken in onze eigen oven. Op deze manier bent u altijd verzekerd van een knapperig broodje.',
  },
];

// Fallback images for categories that don't have their own image
const categoryImages: Record<string, string> = {
  'assorti': belegdeBroodjes,
  'broodjes': belegdeBroodjes,
  'broodjes-onbelegd': kaasOriginal,
  'warme-broodjes': olijvenTapas,
  'luxe-hapjes': olijvenTapas,
  'soepen': kaasOriginal,
  'overig': olijvenTapas,
  'dranken': kaasOriginal,
};

// Default fallback image
const defaultCategoryImage = belegdeBroodjes;

const Index = () => {
  const { data: dbCategories } = useCategories();
  const { data: popularCategories } = usePopularCategories(3);
  const { data: hasOrders } = useHasOrders();
  
  // Use popular categories if there are orders, otherwise use first 3 by display order
  const categoriesToShow = hasOrders && popularCategories?.length ? popularCategories : dbCategories;
  
  // Get display categories (first 3)
  const displayCategories = (categoriesToShow || [])
    .filter(cat => cat.is_active)
    .slice(0, 3)
    .map(cat => ({
      id: cat.id,
      title: cat.name,
      description: cat.description || `Ontdek onze ${cat.name.toLowerCase()}`,
      image: cat.image_url || categoryImages[cat.slug] || defaultCategoryImage,
      link: `/assortiment#${cat.slug}`,
      isPopular: hasOrders && 'order_count' in cat && (cat as any).order_count > 0,
    }));

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
              Bij Frisversshop combineren we onze liefde voor kaas, delicatessen en belegde 
              broodjes met meer dan 40 jaar ervaring in Gouda. Bestel online, kom langs in onze 
              winkel of laat je lunch bezorgen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <OrderButton variant="hero" size="xl" />
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
              Ontdek wat ons al meer dan 40 jaar de favoriete delicatessenwinkel van Gouda maakt.
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
              {hasOrders ? 'Populaire Categorieën' : 'Onze Broodjes'}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {hasOrders 
                ? 'Ontdek de meest bestelde categorieën bij onze klanten.'
                : 'Van versgebakken broodjes tot ambachtelijke kazen - ontdek onze selectie.'
              }
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {displayCategories.map((category, index) => (
              <motion.div
                key={category.id}
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
                      {category.isPopular && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/20 px-2 py-1 rounded-full mb-2">
                          <TrendingUp className="h-3 w-3" />
                          Populair
                        </span>
                      )}
                      <h3 className="text-2xl font-display font-bold text-card mb-2">
                        {category.title}
                      </h3>
                      <p className="text-card/80 line-clamp-2">
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

      {/* Delivery Check + CTA Section */}
      <section className="py-20 bg-secondary rounded-3xl mx-4 md:mx-8 mb-8">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary-foreground mb-6">
              Klaar om te Bestellen?
            </h2>
            <p className="text-secondary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
              Bestel je broodjes online en laat ze bezorgen of haal ze op in onze winkel aan de Willem en Marialaan in Gouda.
            </p>
            
            <div className="max-w-2xl mx-auto mb-8">
              <DeliveryStatusBanner />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <OrderButton variant="hero" size="xl" />
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
