import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook } from 'lucide-react';
import logo from '@/assets/logo.png';
import { useOpeningHours, getDayName } from '@/hooks/useOpeningHours';
import { useActiveClosedDays } from '@/hooks/useClosedDays';

const Footer = () => {
  const { data: openingHours, isLoading: loadingHours } = useOpeningHours();
  const { data: closedDays, isLoading: loadingClosed } = useActiveClosedDays();

  // Reorder days: Monday (1) to Sunday (0)
  const orderedDays = [1, 2, 3, 4, 5, 6, 0];

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  // Get the dates for this week (Monday to Sunday)
  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday
    const monday = new Date(today);
    // Adjust to get Monday of current week
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    monday.setDate(today.getDate() - daysFromMonday);
    
    const weekDates: { [key: number]: Date } = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      // Map: 0=Monday -> dayOfWeek 1, 1=Tuesday -> dayOfWeek 2, ..., 6=Sunday -> dayOfWeek 0
      const dayOfWeek = i === 6 ? 0 : i + 1;
      weekDates[dayOfWeek] = date;
    }
    return weekDates;
  };

  // Check if a specific date has a closed day exception
  const getClosedDayForDate = (date: Date) => {
    if (!closedDays) return null;
    
    const dateString = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();

    for (const closedDay of closedDays) {
      // Check specific date closures
      if (!closedDay.is_recurring && closedDay.date === dateString) {
        return closedDay;
      }
      // Check recurring day closures (but these are already in opening_hours as is_closed)
      if (closedDay.is_recurring && closedDay.day_of_week === dayOfWeek) {
        return closedDay;
      }
    }
    return null;
  };

  const weekDates = getWeekDates();
  const isLoading = loadingHours || loadingClosed;

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-block mb-4">
              <img 
                src={logo} 
                alt="FrisVersshop Gouda" 
                className="h-16 w-auto"
              />
            </Link>
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
              {isLoading ? (
                <li className="text-secondary-foreground/60">Laden...</li>
              ) : (
                orderedDays.map((dayIndex) => {
                  const dayHours = openingHours?.find((h) => h.day_of_week === dayIndex);
                  const weekDate = weekDates[dayIndex];
                  const closedDay = weekDate ? getClosedDayForDate(weekDate) : null;
                  
                  // Check if there's a special closed day this week
                  const isSpecialClosed = closedDay && !closedDay.is_recurring;
                  const isClosed = dayHours?.is_closed || isSpecialClosed;
                  
                  return (
                    <li key={dayIndex} className="flex justify-between">
                      <span>{getDayName(dayIndex)}</span>
                      <span className={isSpecialClosed ? 'text-destructive' : ''}>
                        {isClosed 
                          ? isSpecialClosed && closedDay?.reason 
                            ? `Gesloten (${closedDay.reason})`
                            : 'Gesloten'
                          : dayHours 
                            ? `${formatTime(dayHours.open_time)} - ${formatTime(dayHours.close_time)}`
                            : '-'
                        }
                      </span>
                    </li>
                  );
                })
              )}
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
