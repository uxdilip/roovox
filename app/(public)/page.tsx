"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  const services = [
    {
      icon: Smartphone,
      title: 'Phone Repair',
      description: 'Screen replacement, battery fixes, water damage repair',
      price: 'From $49'
    },
    {
      icon: Laptop,
      title: 'Laptop Repair',
      description: 'Hardware fixes, software issues, performance optimization',
      price: 'From $79'
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
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              📱 Professional Device Repair Services
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              From Leaks to Lights - Just Tap, We’ll Be Right
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              From quick fixes to big repairs, Sniket connects you with trusted local experts - so you spend less time searching and more time living.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-lg px-8">
                <Link href="/book">
                  Book Repair Now <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8">
                <a href="#how-it-works" className="scroll-smooth">How It Works</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional repair services for all major device brands with genuine parts and expert care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {/* Phone Repair Card */}
            <Card className="relative overflow-hidden shadow-lg hover:shadow-2xl transition-shadow group rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-center h-48 w-full bg-gray-50">
                <img
                  src="/assets/phone.png"
                  alt="Phone Repair"
                  className="object-contain h-36 w-auto rounded-lg transition-transform duration-300 group-hover:scale-105"
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                />
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-semibold mt-4">Phone Repair</CardTitle>
                <CardDescription className="text-base mt-2 text-gray-600">
                  Screen replacement, battery fixes, water damage repair
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-6">
                <Button variant="outline" className="w-full font-medium" asChild>
                  <Link href="/book">Book Now</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Laptop Repair Card */}
            <Card className="relative overflow-hidden shadow-lg hover:shadow-2xl transition-shadow group rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-center h-48 w-full bg-gray-50">
                <img
                  src="/assets/laptop.png"
                  alt="Laptop Repair"
                  className="object-contain h-36 w-auto rounded-lg transition-transform duration-300 group-hover:scale-105"
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                />
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-semibold mt-4">Laptop Repair</CardTitle>
                <CardDescription className="text-base mt-2 text-gray-600">
                  Hardware fixes, software issues, performance optimization
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-6">
                <Button variant="outline" className="w-full font-medium" asChild>
                  <Link href="/book">Book Now</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Add more service cards here if needed */}
          </div>
        </div>
      </section>

      {/* Impact Metrics (Stats) Section - redesigned with padding */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
          {/* Left: Text Content */}
          <div className="md:w-1/2 w-full mb-10 md:mb-0 pr-0 md:pr-8">
            <h2 className="text-5xl font-bold mb-8 text-gray-900 leading-tight">
              Your Home,<br />Our Priority
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              Need help around the house? We connect you with trusted local experts for everything from repairs to cleaning—quick, reliable, and right from your neighborhood.<br />
              Fast Fixes for Busy Lives.
            </p>
            <Button size="lg" className="mt-2 px-8 py-3 text-lg font-medium bg-gray-900 text-white hover:bg-gray-800">
              Book Now
            </Button>
          </div>
          {/* Right: Image Placeholder */}
          <div className="md:w-1/2 w-full flex justify-center">
            <div className="w-full max-w-md h-72 bg-gray-100 rounded-xl shadow-lg flex items-center justify-center">
              {/* Image will be added here later */}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose Sniket?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're committed to providing the best device repair experience with quality, convenience, and trust.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explore More Services Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-bold">Upcoming Services</h2>
            <Link href="/services" className="text-primary text-base font-medium hover:underline">
              see all
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {/* Only show names for upcoming services */}
            {[
              { title: "Plumbing Assistance" },
              { title: "Appliance Repair" },
              { title: "Home Cleaning & Maintenance" },
              { title: "Appliance Installation" },
            ].map((service, idx) => (
              <div key={idx} className="bg-gray-100 rounded-xl shadow p-4 flex flex-col items-center">
                <div className="w-full h-36 mb-4 rounded-lg bg-gray-200 overflow-hidden flex items-center justify-center">
                  {/* Add your service image here if needed */}
                </div>
                <div className="w-full text-left">
                  <h3 className="text-lg font-semibold mb-1">{service.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">Simple steps to get your device fixed</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Book Online</h3>
              <p className="text-muted-foreground">
                Select your device, describe the issue, and choose your preferred time slot.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Repair</h3>
              <p className="text-muted-foreground">
                Our certified technician will fix your device using genuine parts.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Device Delivered</h3>
              <p className="text-muted-foreground">
                Get your repaired device back with warranty and quality guarantee.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link href="/book">Start Your Repair Journey</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}