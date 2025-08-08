import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Logo size="lg" showText={true} variant="footer" />
            <p className="text-gray-400">
              Professional device repair services at your doorstep. Fast, reliable, and affordable.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li><Link href="/services/phone-repair" className="text-gray-400 hover:text-white transition-colors">Phone Repair</Link></li>
              <li><Link href="/services/laptop-repair" className="text-gray-400 hover:text-white transition-colors">Laptop Repair</Link></li>
              <li><Link href="/services/screen-replacement" className="text-gray-400 hover:text-white transition-colors">Screen Replacement</Link></li>
              <li><Link href="/services/battery-replacement" className="text-gray-400 hover:text-white transition-colors">Battery Replacement</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/become-provider" className="text-gray-400 hover:text-white transition-colors">Become a Provider</Link></li>
              <li><Link href="/careers" className="text-gray-400 hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-400" />
                <span className="text-gray-400">support@sniket.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-400" />
                <span className="text-gray-400">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span className="text-gray-400">San Francisco, CA</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2025 Sniket. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}