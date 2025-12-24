import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import belegdeBroodjes from '@/assets/belegde-broodjes.jpg';

const categories = [
  {
    id: 'assorti',
    title: 'Assorti Broodjes',
    description: 'Laat u verrassen met onze heerlijke selectie van belegde broodjes. Kies uit assorti, assorti met rauwkost, dubbel belegd of extra luxe.',
    highlights: ['Assorti broodjes', 'Met rauwkost', 'Dubbel belegd', 'Extra luxe'],
    image: 'https://res.cloudinary.com/appsmen-benelux-b-v/image/upload/w_800,h_600,c_fill,f_jpg/order-website/franchise/slider/518/947b5af1.jpg',
    priceFrom: '€3,50',
  },
  {
    id: 'broodjes',
    title: 'Belegde Broodjes',
    description: 'Ruim 20 soorten broodjes om te kiezen, van petit pain tot ciabatta, van tijgerbol tot waldkornbol. Kies uw broodje en daarna de belegsoort.',
    highlights: ['Petit pain', 'Tijgerbol', 'Ciabatta', 'Croissant', 'Glutenvrij'],
    image: 'https://res.cloudinary.com/appsmen-benelux-b-v/w_800,h_600,b_rgb:FFC62Fff,c_fill,f_jpg/cms/menu_item/603/c4b445bb?broodjes',
    priceFrom: '€2,95',
  },
  {
    id: 'onbelegd',
    title: 'Broodjes Onbelegd',
    description: 'Verse afbakbroodjes om zelf af te bakken. Van ciabatta tot stokbrood, van zachte bol tot speltbroodje.',
    highlights: ['Ciabatta', 'Duitse bol', 'Stokbrood', 'Zachte bol', 'Glutenvrij'],
    image: 'https://res.cloudinary.com/appsmen-benelux-b-v/w_800,h_600,b_rgb:FFC62Fff,c_fill,f_jpg/cms/menu_item/603/23a5e98e?onbelegd',
    priceFrom: '€0,49',
  },
  {
    id: 'warm',
    title: 'Warme Broodjes',
    description: 'Heerlijke warme broodjes zoals croissants met kaas of ham, pizzabroodjes, saucijzenbroodjes en meer.',
    highlights: ['Croissant kaas', 'Pizzabroodje', 'Saucijzenbroodje', 'Frikandel broodje'],
    image: 'https://res.cloudinary.com/appsmen-benelux-b-v/image/upload/w_800,h_600,c_fill,f_jpg/order-website/franchise/slider/518/5344c4e3.jpg',
    priceFrom: '€2,19',
  },
  {
    id: 'luxe',
    title: 'Luxe Hapjes & Salades',
    description: 'Voor een speciale gelegenheid: luxe hapjes op schalen, opgemaakte salades en kaas- en vleeswarenplatters.',
    highlights: ['Luxe hapjes', 'Zalmsalade', 'Rundvleessalade', 'Kaasplatter'],
    image: 'https://res.cloudinary.com/appsmen-benelux-b-v/w_800,h_600,b_rgb:FFC62Fff,c_fill,f_jpg/cms/menu_item/603/d3e4f567?luxe',
    priceFrom: '€3,95',
  },
  {
    id: 'soepen',
    title: 'Warme Soepen',
    description: 'Huisgemaakte soepen geleverd in warmhoudpannen. Kippensoep, groentesoep, erwtensoep en meer.',
    highlights: ['Kippensoep', 'Groentesoep', 'Erwtensoep', 'Tomatensoep'],
    image: 'https://res.cloudinary.com/appsmen-benelux-b-v/w_800,h_600,b_rgb:FFC62Fff,c_fill,f_jpg/cms/menu_item/603/c8d9e012?soepen',
    priceFrom: '€3,00',
  },
  {
    id: 'zoet',
    title: 'Zoet & Lekkers',
    description: 'Verwennerijen zoals krentenbollen, spekkoek, dadelbrood, bonbons en Siciliaanse cannoli.',
    highlights: ['Krentenbol', 'Spekkoek', 'Bonbons', 'Cannoli'],
    image: 'https://res.cloudinary.com/appsmen-benelux-b-v/w_800,h_600,b_rgb:FFC62Fff,c_fill,f_jpg/cms/menu_item/603/b9c0d123?zoet',
    priceFrom: '€0,99',
  },
  {
    id: 'dranken',
    title: 'Dranken & Fruit',
    description: 'Gekoelde dranken, vruchtensappen, melkproducten en vers fruit.',
    highlights: ['Frisdrank', 'Vruchtensappen', 'Melk & Chocomel', 'Vers fruit'],
    image: 'https://res.cloudinary.com/appsmen-benelux-b-v/w_800,h_600,b_rgb:FFC62Fff,c_fill,f_jpg/cms/menu_item/603/d1e2f345?dranken',
    priceFrom: '€1,10',
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

      {/* Categories Grid */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group relative rounded-2xl overflow-hidden shadow-card hover:shadow-glow transition-shadow"
              >
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={category.image} 
                    alt={category.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-display font-bold text-card mb-2">
                        {category.title}
                      </h2>
                      <p className="text-card/80 text-sm md:text-base mb-4 line-clamp-2">
                        {category.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {category.highlights.map((item) => (
                          <span 
                            key={item}
                            className="px-3 py-1 bg-card/20 backdrop-blur-sm rounded-full text-card text-xs font-medium"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                      <p className="text-primary font-display font-bold text-lg">
                        Vanaf {category.priceFrom}
                      </p>
                    </div>
                  </div>
                  
                  <Button variant="hero" className="mt-4 w-full md:w-auto" asChild>
                    <a 
                      href="https://bestellen.frisversbroodjes.nl/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Bekijk & Bestel
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
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
              Bekijk ons volledige assortiment en bestel eenvoudig online!
            </p>
            <Button variant="default" size="lg" asChild>
              <a 
                href="https://bestellen.frisversbroodjes.nl/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Direct bestellen
                <ExternalLink className="w-5 h-5 ml-2" />
              </a>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Assortiment;
