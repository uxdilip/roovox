"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { HoverEffect } from "@/components/ui/card-hover-effect";
import { Timeline } from "@/components/ui/timeline";
import { FAQAccordion } from "@/components/ui/faq-accordion";
import { 
  Users, 
  DollarSign, 
  Clock, 
  CreditCard, 
  Star, 
  UserPlus, 
  CheckCircle, 
  Briefcase, 
  TrendingUp,
  ArrowRight,
  Smartphone
} from "lucide-react";

export default function ProvidersLandingPage() {
  // Benefits data for Card Hover Effect
  const benefits = [
    {
      title: "More Customers, Less Effort",
      description: "We connect you directly with people in your area who need your service — no need to run around finding work.",
      link: "#",
    },
    {
      title: "Zero Joining Fee",
      description: "Register for free. You only pay a small fee per completed booking — and only when you earn.",
      link: "#",
    },
    {
      title: "Work on Your Own Terms",
      description: "You choose your services, working hours, and service area.",
      link: "#",
    },
    {
      title: "Quick & Secure Payments",
      description: "Receive your earnings directly to your bank account every week.",
      link: "#",
    },
    {
      title: "Build Your Local Reputation",
      description: "Get reviews, ratings, and repeat customers — all through Sniket.",
      link: "#",
    },
  ];

  // Timeline data for How It Works
  const timelineData = [
    {
      title: "Step 1 — Sign Up",
      content: (
        <div>
          <p className="text-slate-600 text-base mb-4">
            Fill in your details, choose your services, and upload your documents.
          </p>
          <div className="text-sm text-slate-500">
            Quick and easy registration process
          </div>
        </div>
      ),
    },
    {
      title: "Step 2 — Get Verified",
      content: (
        <div>
          <p className="text-slate-600 text-base mb-4">
            Our team verifies your profile within 24–48 hours.
          </p>
          <div className="text-sm text-slate-500">
            Fast verification for trusted providers
          </div>
      </div>
      ),
    },
    {
      title: "Step 3 — Start Getting Bookings",
      content: (
        <div>
          <p className="text-slate-600 text-base mb-4">
            Customers in your area can see and book your services instantly.
          </p>
          <div className="text-sm text-slate-500">
            Immediate access to local customers
          </div>
        </div>
      ),
    },
    {
      title: "Step 4 — Deliver & Earn",
      content: (
        <div>
          <p className="text-slate-600 text-base mb-4">
            Complete the job, get rated, and receive payments straight to your bank.
          </p>
          <div className="text-sm text-slate-500">
            Simple payment process
          </div>
        </div>
      ),
    },
  ];

  // FAQ data
  const faqItems = [
    {
      question: "How do I register as a provider?",
      answer: "Click \"Sign Up,\" fill in your details, and upload the required documents."
    },
    {
      question: "What documents do I need?",
      answer: "A valid government ID, address proof, and relevant service certifications (if applicable)."
    },
    {
      question: "Is there a joining fee?",
      answer: "No. Registration is 100% free."
    },
    {
      question: "How will I get paid?",
      answer: "Payments are transferred directly to your bank account weekly."
    },
    {
      question: "Can I choose my working hours?",
      answer: "Yes, you have full control over your schedule."
    },
  ];

  return (
    <div className="min-h-screen">
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
              🚀 Become a Provider
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
              Join Sniket — Grow Your Local Service Business, Your Way
            </h1>
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
            Get discovered by more customers in your area, earn more, and work on your own terms — no middlemen, no heavy commissions.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 1.4,
              duration: 0.8,
              ease: "easeOut",
            }}
            className="mt-8"
          >
            <Button 
              size="lg" 
              asChild 
              className="group relative text-lg px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0"
            >
              <Link href="/provider/login">
                <span className="flex items-center">
                  <Smartphone className="mr-2 h-5 w-5" />
                  Sign Up as a Provider
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </AuroraBackground>

      {/* Why Choose SnikeT Section with Card Hover Effect */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
            }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">Why Choose Sniket</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Everything you need to grow your service business and reach more customers.
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            <HoverEffect items={benefits} />
          </div>
            </div>
      </section>

      {/* How It Works Section with Timeline */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
            }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">How It Works</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Simple steps to start earning with Sniket.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <Timeline data={timelineData} />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
            }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">Frequently Asked Questions</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Everything you need to know about joining Sniket as a provider.
            </p>
          </motion.div>

          <FAQAccordion items={faqItems} />
      </div>
      </section>


    </div>
  );
} 