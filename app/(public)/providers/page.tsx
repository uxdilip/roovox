"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, TrendingUp, CheckCircle, Shield, Users, DollarSign, Award } from "lucide-react";

export default function ProvidersLandingPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 overflow-x-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-30 z-0">
        <svg width="100%" height="100%" className="h-full w-full">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#c7d2fe" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      <div className="relative z-10 container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 text-lg px-4 py-2">🚀 Become a Provider</Badge>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
            Grow Your Repair Business with Sniket
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join our marketplace to connect with customers, manage bookings, and access powerful business tools.
          </p>
          <Button size="lg" className="text-xl px-10 py-6 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-200" asChild>
            <Link href="/provider/login">Start Onboarding</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Card className="shadow-md border-0 bg-white/80 hover:scale-105 transition-transform">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wrench className="h-5 w-5 text-primary" />
                <span>Comprehensive Specialization</span>
              </CardTitle>
              <CardDescription>
                Register your expertise by brand/model for accurate customer matching.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="shadow-md border-0 bg-white/80 hover:scale-105 transition-transform">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span>Dynamic Pricing & Availability</span>
              </CardTitle>
              <CardDescription>
                Set custom pricing, manage working hours, and service radius.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="shadow-md border-0 bg-white/80 hover:scale-105 transition-transform">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span>Real-Time Booking Management</span>
              </CardTitle>
              <CardDescription>
                Receive instant requests, view details, and manage appointments.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="shadow-md border-0 bg-white/80 hover:scale-105 transition-transform">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <span>Provider Verification</span>
              </CardTitle>
              <CardDescription>
                Undergo onboarding with identity and business checks for trust.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="shadow-md border-0 bg-white/80 hover:scale-105 transition-transform">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
                <span>Dashboard & Analytics</span>
              </CardTitle>
              <CardDescription>
                Track earnings, jobs, ratings, and performance metrics.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="shadow-md border-0 bg-white/80 hover:scale-105 transition-transform">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-pink-600" />
                <span>Business Intelligence</span>
              </CardTitle>
              <CardDescription>
                Leverage analytics on demand, trends, and optimize your offerings.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="shadow-md border-0 bg-white/80 hover:scale-105 transition-transform md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-orange-600" />
                <span>Quality Assurance</span>
              </CardTitle>
              <CardDescription>
                Mark services complete, upload photos, and prompt for feedback.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Trust/testimonial section */}
        <div className="bg-white/90 rounded-xl shadow-lg p-8 text-center max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold mb-2 text-blue-700">Trusted by Top Providers</h3>
          <p className="text-lg text-gray-700 mb-4">"Sniket has helped me grow my business and reach more customers than ever before. The dashboard and booking tools are a game changer!"</p>
          <div className="flex items-center justify-center space-x-3">
            <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Provider" className="w-12 h-12 rounded-full border-2 border-blue-500" />
            <div className="text-left">
              <div className="font-semibold text-blue-900">Alex T.</div>
              <div className="text-sm text-gray-500">Certified Repair Specialist</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 