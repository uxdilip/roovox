"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { HoverEffect } from '@/components/ui/card-hover-effect';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { FeatureCard } from '@/components/ui/feature-card';
import {
  Smartphone,
  Laptop,
  Clock,
  Shield,
  Star,
  MapPin,
  CheckCircle,
  Wrench,
  ArrowRight,
  Users,
  Award,
  Zap
} from 'lucide-react';
import { account, databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { createUserDocument } from '@/lib/appwrite-services';

// Sleep function removed for production

export default function HomePage() {
  useEffect(() => {
    async function ensureUserInCollection(retries = 3) {
      try {
        let session;
        for (let i = 0; i < retries; i++) {
          try {
            session = await account.get();
            if (session) break;
          } catch (e) {
            // Removed artificial delay
          }
        }
        if (!session) {
          console.error('No Appwrite session found after retries');
          return;
        }
        const userId = session.$id;
        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.USERS,
          [Query.equal('user_id', userId)]
        );
        if (res.documents.length === 0) {
          console.log('Creating user document for:', userId, session);
          await createUserDocument({
            userId: userId,
            name: session.name,
            email: session.email,
            phone: session.phone || '',
            roles: ['customer'],
            activeRole: 'customer',
            isVerified: false,
            isActive: true,
          });
          console.log('User document created!');
        } else {
          console.log('User document already exists:', res.documents[0]);
        }
      } catch (e) {
        console.error('Error in ensureUserInCollection:', e);
      }
    }
    ensureUserInCollection();
  }, []);

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://sniket.com/#organization",
        "name": "Sniket",
        "url": "https://sniket.com",
        "logo": "https://sniket.com/apple-touch-icon.png",
        "description": "Professional device repair services for phones, laptops, and tablets. Same-day service, doorstep pickup, and genuine parts with warranty."
      },
      {
        "@type": "WebSite",
        "@id": "https://sniket.com/#website",
        "url": "https://sniket.com",
        "name": "Sniket",
        "description": "Expert device repair services for phones, laptops, and tablets. Same-day service, doorstep pickup, and genuine parts with warranty.",
        "publisher": {
          "@id": "https://sniket.com/#organization"
        },
        "potentialAction": [
          {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://sniket.com/book?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        ]
      },
      {
        "@type": "WebPage",
        "@id": "https://sniket.com/#webpage",
        "url": "https://sniket.com",
        "name": "Sniket - Professional Device Repair Services",
        "isPartOf": {
          "@id": "https://sniket.com/#website"
        },
        "about": {
          "@id": "https://sniket.com/#organization"
        },
        "description": "Expert device repair services for phones, laptops, and tablets. Same-day service, doorstep pickup, and genuine parts with warranty."
      }
    ]
  };

  const services = [
    {
      title: 'Phone Repair',
      description: 'Screen replacement, battery fixes, water damage repair, and more professional services for all major phone brands.',
      link: '/book',
      image: '/assets/phone.png'
    },
    {
      title: 'Laptop Repair',
      description: 'Hardware fixes, software issues, performance optimization, and comprehensive laptop maintenance services.',
      link: '/book',
      image: '/assets/laptop.png'
    }
  ];

  const features = [
    {
      icon: Clock,
      title: 'Same Day Service',
      description: 'Most repairs completed within 24 hours'
    },
    {
      icon: Shield,
      title: 'Warranty', // <-- Changed here
      description: 'All repairs backed by comprehensive warranty'
    },
    {
      icon: MapPin,
      title: 'Doorstep Service',
      description: 'Convenient pickup and delivery to your location'
    },
    {
      icon: Star,
      title: 'Expert Technicians',
      description: 'Certified professionals with years of experience'
    }
  ];

  const stats = [
    { icon: Users, value: '50K+', label: 'Happy Customers' },
    { icon: CheckCircle, value: '100K+', label: 'Devices Repaired' },
    { icon: Award, value: '4.9/5', label: 'Customer Rating' },
    { icon: Zap, value: '24hr', label: 'Average Repair Time' }
  ];

  return (
    <div className="min-h-screen">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      {/* Hero Section with Aurora Background */}
      <AuroraBackground>
        <motion.div
          initial={{ opacity: 0.0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="relative flex flex-col gap-6 items-center justify-center px-4 text-center max-w-6xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.5,
              duration: 0.6,
              ease: "easeOut",
            }}
          >
            <Badge variant="secondary" className="mb-4 text-sm font-medium px-6 py-2 bg-white/90 backdrop-blur-sm border-0 shadow-lg text-gray-700 hover:shadow-xl transition-shadow duration-300">
              📱 Professional Device Repair Services
            </Badge>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.8,
              duration: 0.8,
              ease: "easeOut",
            }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-slate-900 leading-tight tracking-tight">
              From Leaks to Lights
            </h1>
            <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold text-slate-700 leading-tight">
              Just Tap, We'll Be Right
            </h2>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 1.1,
              duration: 0.8,
              ease: "easeOut",
            }}
            className="text-lg md:text-xl lg:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed font-light px-4"
          >
            From quick fixes to big repairs, Sniket connects you with trusted local experts - so you spend less time searching and more time living.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 1.4,
              duration: 0.8,
              ease: "easeOut",
            }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8"
          >
            <Button 
              size="lg" 
              asChild 
              className="group relative text-lg px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0"
            >
              <Link href="/book">
                <span className="flex items-center">
                  Book Repair Now 
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Link>
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="group text-lg px-8 py-4 border-2 border-slate-300 hover:border-slate-400 bg-white/80 backdrop-blur-sm hover:bg-white text-slate-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <a href="#how-it-works" className="scroll-smooth flex items-center">
                How It Works
                <div className="ml-2 w-2 h-2 bg-slate-600 rounded-full animate-pulse"></div>
              </a>
            </Button>
          </motion.div>

          {/* Scroll Indicator */}
        
        </motion.div>
      </AuroraBackground>

      {/* Services Section */}
      <section className="py-12 md:py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 text-slate-900">Our Services</h2>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed px-4">
              Professional repair services for all major device brands with genuine parts and expert care.
            </p>
          </div>

          {/* Mobile: Row Layout (like Urban Company) */}
          <div className="space-y-4 md:hidden max-w-xl mx-auto">
            {/* Phone Repair Card - Mobile Row */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-slate-300">
              <div className="flex flex-row">
                {/* Image */}
                <div className="w-24 h-24 bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <img
                    src="/assets/phone.png"
                    alt="Phone Repair"
                    className="object-contain h-16 w-auto"
                  />
                </div>
                
                {/* Content */}
                <div className="flex-1 p-4 flex flex-col justify-center">
                  <h3 className="text-base font-semibold text-slate-900 mb-1">Phone Repair</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    Screen replacement, battery fixes, water damage repair
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Starting from ₹499</span>
                    <Button 
                      size="sm"
                      className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1 text-xs" 
                      asChild
                    >
                      <Link href="/book">Book Now</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Laptop Repair Card - Mobile Row */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-slate-300">
              <div className="flex flex-row">
                {/* Image */}
                <div className="w-24 h-24 bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <img
                    src="/assets/laptop.png"
                    alt="Laptop Repair"
                    className="object-contain h-16 w-auto"
                  />
                </div>
                
                {/* Content */}
                <div className="flex-1 p-4 flex flex-col justify-center">
                  <h3 className="text-base font-semibold text-slate-900 mb-1">Laptop Repair</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    Hardware fixes, software issues, performance optimization
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Starting from ₹799</span>
                    <Button 
                      size="sm"
                      className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1 text-xs" 
                      asChild
                    >
                      <Link href="/book">Book Now</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Column Layout */}
          <div className="hidden md:grid grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Phone Repair Card - Desktop Column */}
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-center h-48 w-full bg-slate-50 rounded-lg mb-6">
                <img
                  src="/assets/phone.png"
                  alt="Phone Repair"
                  className="object-contain h-32 w-auto"
                />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Phone Repair</h3>
              <p className="text-base text-slate-600 leading-relaxed mb-6">
                Screen replacement, battery fixes, water damage repair, and more professional services for all major phone brands.
              </p>
              <Button 
                variant="outline" 
                className="w-full border-slate-300 hover:border-slate-400 hover:bg-slate-50" 
                asChild
              >
                <Link href="/book">Book Phone Repair</Link>
              </Button>
            </div>

            {/* Laptop Repair Card - Desktop Column */}
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-center h-48 w-full bg-slate-50 rounded-lg mb-6">
                <img
                  src="/assets/laptop.png"
                  alt="Laptop Repair"
                  className="object-contain h-32 w-auto"
                />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Laptop Repair</h3>
              <p className="text-base text-slate-600 leading-relaxed mb-6">
                Hardware fixes, software issues, performance optimization, and comprehensive laptop maintenance services.
              </p>
              <Button 
                variant="outline" 
                className="w-full border-slate-300 hover:border-slate-400 hover:bg-slate-50" 
                asChild
              >
                <Link href="/book">Book Laptop Repair</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

     
      {/* <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16 max-w-6xl mx-auto">
            
            <div className="lg:w-1/2 w-full text-center lg:text-left">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 text-slate-900 leading-tight">
                Your Home,<br />Our Priority
              </h2>
              <p className="text-base md:text-lg text-slate-600 mb-6 md:mb-8 leading-relaxed">
                Need help around the house? We connect you with trusted local experts for everything from repairs to cleaning—quick, reliable, and right from your neighborhood.
              </p>
              <p className="text-base md:text-lg font-medium text-slate-700 mb-6 md:mb-8">
                Fast Fixes for Busy Lives.
              </p>
              <Button 
                size="default"
                asChild 
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 md:px-8 py-3 md:py-4 text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link href="/book">
                  Book Now
                  <ArrowRight className="ml-2 h-4 md:h-5 w-4 md:w-5" />
                </Link>
              </Button>
            </div>
            
           
            <div className="lg:w-1/2 w-full flex justify-center">
              <div className="w-full max-w-sm lg:max-w-lg h-64 md:h-80 bg-slate-100 rounded-xl md:rounded-2xl shadow-lg flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <div className="text-3xl md:text-4xl mb-2">🏠</div>
                  <p className="text-xs md:text-sm">Image will be added here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>  */}

      {/* Features Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 text-slate-900">Why Choose Sniket?</h2>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed px-4">
              We're committed to providing the best device repair experience with quality, convenience, and trust.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4 md:mb-6">
                  <div className="p-3 md:p-4 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white transition-colors duration-300">
                    <feature.icon className="h-6 w-6 md:h-8 md:w-8" />
                  </div>
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Services Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-slate-900">Upcoming Services</h2>
            <Link href="/services" className="text-slate-600 text-sm md:text-base font-medium hover:text-slate-900 transition-colors">
              see all →
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
            {[
              { title: "Plumbing Assistance", icon: "🔧", image: "/assets/Gemini_Generated_Image_d6m6bkd6m6bkd6m6.png" },
              { title: "Appliance Repair", icon: "⚡", image: "/assets/appliance repair.png" },
              { title: "Home Cleaning", icon: "🧽", image: "/assets/Gemini_Generated_Image_fkvqz2fkvqz2fkvq.png" },
              { title: "Installation", icon: "🛠️", image: "/assets/installation.png" },
            ].map((service, idx) => (
              <div
                key={idx}
                className="bg-slate-50 rounded-lg md:rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-4 md:p-6 text-center border-0"
              >
                <div className="w-full h-16 md:h-24 mb-3 md:mb-4 rounded-lg bg-slate-100 flex items-center justify-center">
                  {service.image ? (
                    <img
                      src={service.image}
                      alt={service.title}
                      className="object-contain h-full w-full rounded-lg"
                    />
                  ) : (
                    <span className="text-2xl md:text-3xl">{service.icon}</span>
                  )}
                </div>
                <h3 className="text-sm md:text-lg font-semibold text-slate-900 mb-2">{service.title}</h3>
                <Badge variant="secondary" className="text-xs bg-slate-200 text-slate-600 border-0">
                  Coming Soon
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-12 md:py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 text-slate-900">How It Works</h2>
            <p className="text-base md:text-lg text-slate-600 px-4">Simple steps to get your device fixed</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-5xl mx-auto">
            {[
              {
                step: 1,
                title: "Book Online",
                description: "Select your device, describe the issue, and choose your preferred time slot."
              },
              {
                step: 2,
                title: "Expert Repair", 
                description: "Our certified technician will fix your device using genuine parts."
              },
              {
                step: 3,
                title: "Device Delivered",
                description: "Get your repaired device back with warranty and quality guarantee."
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-900 rounded-full flex items-center justify-center text-white text-xl md:text-2xl font-bold mx-auto mb-4 md:mb-6 shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-slate-900">{item.title}</h3>
                <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12 md:mt-16">
            <Button 
              size="default"
              asChild
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 md:px-8 py-3 text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link href="/book">
                Start Your Repair Journey
                <ArrowRight className="ml-2 h-4 md:h-5 w-4 md:w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}