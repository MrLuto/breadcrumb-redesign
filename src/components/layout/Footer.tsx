import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Facebook } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-display font-bold mb-4">
              Fris<span className="text-primary">Vers</span>shop
            </h3>
            <p className="text-secondary-foreground/80 mb-4 leading-relaxed">
              Al meer dan 35 jaar combineren wij onze liefde voor kaas, delicatessen 
              en belegde broodjes in Gouda.
            </p>
            <a 
              href="https://www.facebook.com/Frisversshop/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-primary transition-colors"
            >
              <Facebook className="w-5 h-5" />
              Volg ons op Facebook
            </a>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Navigatie</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/assortiment" className="hover:text-primary transition-colors">Assortiment</Link>
              </li>
              <li>
                <Link to="/over-ons" className="hover:text-primary transition-colors">Over Ons</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Willem en Marialaan 46<br />2803 PH Gouda</span>
              </li>
              <li>
                <a href="tel:0182524926" className="flex items-center gap-3 hover:text-primary transition-colors">
                  <Phone className="w-5 h-5" />
                  0182 - 524 926
                </a>
              </li>
              <li>
                <a href="mailto:info@frisversshop.nl" className="flex items-center gap-3 hover:text-primary transition-colors">
                  <Mail className="w-5 h-5" />
                  info@frisversshop.nl
                </a>
              </li>
            </ul>
          </div>

          {/* Opening hours */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Openingstijden</h4>
            <ul className="space-y-2 text-secondary-foreground/90">
              <li className="flex justify-between">
                <span>Maandag</span>
                <span>08:00 - 18:00</span>
              </li>
              <li className="flex justify-between">
                <span>Dinsdag</span>
                <span>08:00 - 18:00</span>
              </li>
              <li className="flex justify-between">
                <span>Woensdag</span>
                <span>08:00 - 18:00</span>
              </li>
              <li className="flex justify-between">
                <span>Donderdag</span>
                <span>08:00 - 18:00</span>
              </li>
              <li className="flex justify-between">
                <span>Vrijdag</span>
                <span>08:00 - 18:00</span>
              </li>
              <li className="flex justify-between">
                <span>Zaterdag</span>
                <span>07:30 - 16:00</span>
              </li>
              <li className="flex justify-between">
                <span>Zondag</span>
                <span>Gesloten</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Bottom bar */}
      <div className="border-t border-secondary-foreground/20">
        <div className="container py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-secondary-foreground/70">
          <p>© {new Date().getFullYear()} FrisVersshop Gouda. Alle rechten voorbehouden.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
