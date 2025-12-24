import { useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WHATSAPP_NUMBER = '31642908804';
import heroOriginal from '@/assets/hero-original.jpg';

const contactInfo = [
  {
    icon: MapPin,
    title: 'Adres',
    details: ['Willem en Marialaan 46', '2803 PH Gouda'],
  },
  {
    icon: Phone,
    title: 'Telefoon',
    details: ['0182 - 524 926'],
    link: 'tel:0182524926',
  },
  {
    icon: Mail,
    title: 'E-mail',
    details: ['info@frisversshop.nl'],
    link: 'mailto:info@frisversshop.nl',
  },
  {
    icon: Clock,
    title: 'Openingstijden',
    details: ['Ma - Vr: 08:00 - 18:00', 'Za: 07:30 - 16:00', 'Zo: Gesloten'],
  },
];

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = formData.name.trim().slice(0, 100);
    const trimmedEmail = formData.email.trim().slice(0, 255);
    const trimmedPhone = formData.phone.trim().slice(0, 20);
    const trimmedSubject = formData.subject.trim().slice(0, 100);
    const trimmedMessage = formData.message.trim().slice(0, 1000);
    
    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) return;
    
    const fullMessage = `*Nieuw bericht via contactformulier*

*Naam:* ${trimmedName}
*E-mail:* ${trimmedEmail}
${trimmedPhone ? `*Telefoon:* ${trimmedPhone}\n` : ''}*Onderwerp:* ${trimmedSubject}

*Bericht:*
${trimmedMessage}`;
    
    const encodedMessage = encodeURIComponent(fullMessage);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    
    toast({
      title: 'WhatsApp geopend!',
      description: 'Verstuur het bericht in WhatsApp om uw aanvraag te verzenden.',
    });
    
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
              <span className="text-primary">Contact</span>
            </h1>
            <p className="text-lg text-card/90 leading-relaxed">
              Heeft u een vraag, wilt u bestellen of langskomen? Neem gerust contact met ons op. 
              Wij helpen u graag verder!
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info + Form */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-display font-bold text-foreground mb-8">
                Contactgegevens
              </h2>

              <div className="space-y-6 mb-10">
                {contactInfo.map((info) => (
                  <div key={info.title} className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <info.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{info.title}</h3>
                      {info.details.map((detail, index) => (
                        info.link ? (
                          <a 
                            key={index}
                            href={info.link} 
                            className="block text-muted-foreground hover:text-primary transition-colors"
                          >
                            {detail}
                          </a>
                        ) : (
                          <p key={index} className="text-muted-foreground">{detail}</p>
                        )
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* WhatsApp */}
              <div className="bg-secondary rounded-2xl p-6">
                <h3 className="font-display font-semibold text-secondary-foreground mb-2">
                  WhatsApp
                </h3>
                <p className="text-secondary-foreground/80 mb-4">
                  Stuur ons een bericht via WhatsApp voor snelle vragen of bestellingen.
                </p>
                <Button variant="accent" asChild>
                  <a 
                    href="https://wa.me/31642908804?text=Hallo!" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Chat via WhatsApp
                  </a>
                </Button>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-card rounded-2xl p-8 shadow-card">
                <h2 className="text-2xl font-display font-bold text-foreground mb-6">
                  Stuur een Bericht
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="name">Naam *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Uw naam"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="uw@email.nl"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefoon</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="06 - 1234 5678"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Onderwerp *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        placeholder="Bijv. Bestelling"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Bericht *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      placeholder="Uw bericht..."
                      rows={5}
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Verstuur via WhatsApp
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="h-96">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2453.5840927815097!2d4.705977776892915!3d52.01547097172162!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c5d4a7c5e5f9d7%3A0x8e9e9e9e9e9e9e9e!2sWillem%20en%20Marialaan%2046%2C%202803%20PH%20Gouda!5e0!3m2!1snl!2snl!4v1234567890"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="FrisVersshop locatie"
        />
      </section>
    </Layout>
  );
};

export default Contact;
