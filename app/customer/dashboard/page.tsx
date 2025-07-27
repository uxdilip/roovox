"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Laptop, Calendar, Star, Wrench, PlusCircle, ArrowRight, CheckCircle, MessageCircle } from "lucide-react";

export default function CustomerDashboard() {
  // TODO: Fetch real user, bookings, and device data from Appwrite
  const user = { name: "Welcome!" };
  const recentBookings = [];
  const devices = [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-2">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
            Hi {user.name.split(" ")[0]}, your device repair hub
          </h1>
          <p className="text-lg text-muted-foreground mb-4">Track your repairs, manage devices, and book new services in one place.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <Button size="lg" asChild className="text-lg px-8 shadow-md">
              <Link href="/book">
                <PlusCircle className="mr-2 h-5 w-5" /> Book New Repair
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link href="/bookings">
                <Calendar className="mr-2 h-5 w-5" /> My Bookings
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          <Card className="shadow-md border-0 bg-white/80 hover:scale-105 transition-transform">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <span>My Devices</span>
                </CardTitle>
                <CardDescription>Manage your registered devices</CardDescription>
              </div>
              <Badge variant="secondary">{devices.length}</Badge>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" className="w-full mt-2">
                <Link href="/devices">View Devices</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="shadow-md border-0 bg-white/80 hover:scale-105 transition-transform">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span>Upcoming Bookings</span>
                </CardTitle>
                <CardDescription>See your scheduled repairs</CardDescription>
              </div>
              <Badge variant="secondary">{recentBookings.length}</Badge>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" className="w-full mt-2">
                <Link href="/bookings">View Bookings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Recent Bookings</h2>
          {recentBookings.length === 0 ? (
            <div className="bg-white/80 rounded-lg p-6 text-center text-muted-foreground shadow">
              <p>No recent bookings. <Link href="/book" className="text-blue-600 hover:underline">Book a repair</Link> to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {/* TODO: Map real bookings here */}
            </div>
          )}
        </div>

        {/* Tips/CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Need help or have questions?</h3>
          <p className="text-lg mb-4">Our support team is here for you. Chat with us or check our FAQs for quick answers.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/support">
                <MessageCircle className="mr-2 h-5 w-5" /> Chat with Support
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary" asChild>
              <Link href="/faq">FAQs</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 