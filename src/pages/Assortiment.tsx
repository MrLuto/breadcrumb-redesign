import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/ProductCard';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import belegdeBroodjes from '@/assets/belegde-broodjes.jpg';

const Assortiment = () => {
  const location = useLocation();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: products, isLoading: productsLoading } = useProducts();

  const isLoading = categoriesLoading || productsLoading;

  // Group products by category
  const productsByCategory = categories
    ?.filter((cat) => cat.is_active)
    ?.sort((a, b) => a.display_order - b.display_order)
    ?.map((category) => ({
      category,
      products: products
        ?.filter((p) => p.category_id === category.id && p.is_available)
        ?.sort((a, b) => a.display_order - b.display_order) || [],
    }))
    ?.filter((group) => group.products.length > 0);

  // Scroll to section when hash changes
  useEffect(() => {
    if (location.hash && !isLoading) {
      const id = decodeURIComponent(location.hash.slice(1));
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location.hash, isLoading]);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-20 md:py-28">
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
              Kies uit ons uitgebreide assortiment verse broodjes, luxe hapjes en meer.
              Voeg producten toe aan je winkelwagen en bestel eenvoudig online!
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products by Category */}
      <section className="py-12 md:py-16">
        <div className="container">
          {isLoading ? (
            <div className="space-y-12">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="h-8 w-48 mb-6" />
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="space-y-3">
                        <Skeleton className="aspect-square rounded-xl" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : productsByCategory?.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                Er zijn momenteel geen producten beschikbaar.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Neem contact met ons op voor meer informatie over ons assortiment.
              </p>
            </div>
          ) : (
            <div className="space-y-16">
              {productsByCategory?.map((group, index) => (
                <motion.div
                  key={group.category.id}
                  id={group.category.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="scroll-mt-24"
                >
                  {/* Category Header */}
                  <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
                      {group.category.name}
                    </h2>
                    {group.category.description && (
                      <p className="text-muted-foreground max-w-2xl">
                        {group.category.description}
                      </p>
                    )}
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {group.products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Assortiment;
