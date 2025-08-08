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
      title: '90-Day Warranty',
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
              Fix Your Device in Minutes, Not Days
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Professional repair services for phones, laptops, and tablets. Expert technicians, 
              doorstep service, and genuine parts with warranty included.
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

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-3">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
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
            <Card className="relative overflow-hidden shadow-lg hover:shadow-2xl transition-shadow group">
              <div className="h-48 w-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80"
                  alt="Phone Repair"
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
              </div>
                <CardHeader className="text-center">
                <CardTitle className="text-2xl font-semibold mt-4">Phone Repair</CardTitle>
                <CardDescription className="text-base mt-2">Screen replacement, battery fixes, water damage repair</CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-6">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/book">Book Now</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Laptop Repair Card */}
            <Card className="relative overflow-hidden shadow-lg hover:shadow-2xl transition-shadow group">
              <div className="h-48 w-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80"
                  alt="Laptop Repair"
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
                    </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-semibold mt-4">Laptop Repair</CardTitle>
                <CardDescription className="text-base mt-2">Hardware fixes, software issues, performance optimization</CardDescription>
                </CardHeader>
              <CardContent className="text-center pb-6">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/book">Book Now</Link>
                  </Button>
                </CardContent>
              </Card>

            {/* Add more service cards here if needed */}
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