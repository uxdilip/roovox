import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions | Sniket',
  description: 'Terms and Conditions for Sniket device repair services. Learn about our service terms, warranties, and policies.',
};

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms and Conditions</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8">
            <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By using Sniket's services, you agree to these Terms and Conditions. If you do not agree, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Sniket provides device repair services including but not limited to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Mobile phone repairs (screen, battery, software, etc.)</li>
              <li>Laptop repairs (hardware, software, performance optimization)</li>
              <li>Tablet and other electronic device repairs</li>
              <li>Doorstep pickup and delivery services</li>
              <li>In-store repair services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Service Process</h2>
            
            <h3 className="text-xl font-medium text-gray-800 mb-3">3.1 Booking and Diagnosis</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>You provide accurate device information and issue description</li>
              <li>We provide estimated costs and timeline</li>
              <li>Final diagnosis may reveal additional issues requiring separate consent</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">3.2 Repair Authorization</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>We obtain your consent before proceeding with repairs</li>
              <li>Additional charges require separate authorization</li>
              <li>You may decline repairs and pay diagnostic fees if applicable</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Pricing and Payment</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Prices are estimates and may vary based on actual diagnosis</li>
              <li>Payment is due upon completion of repair</li>
              <li>We accept various payment methods as displayed on our platform</li>
              <li>Diagnostic fees may apply for certain services</li>
              <li>Prices include applicable taxes unless stated otherwise</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Warranty</h2>
            
            <h3 className="text-xl font-medium text-gray-800 mb-3">5.1 Repair Warranty</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>We provide a 30-day warranty on parts and labor for most repairs</li>
              <li>Warranty covers defects in our workmanship and replacement parts</li>
              <li>Warranty does not cover new damage or issues unrelated to our repair</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">5.2 Warranty Exclusions</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Physical damage after repair completion</li>
              <li>Water damage or exposure to extreme conditions</li>
              <li>Damage from unauthorized repairs or modifications</li>
              <li>Normal wear and tear</li>
              <li>Issues existing before our repair</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Customer Responsibilities</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Data Backup:</strong> Back up all important data before service</li>
              <li><strong>Device Security:</strong> Remove or disable security locks when requested</li>
              <li><strong>Accurate Information:</strong> Provide truthful device and contact information</li>
              <li><strong>Payment:</strong> Pay for services as agreed</li>
              <li><strong>Device Collection:</strong> Collect repaired devices within 30 days</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our liability is limited to the cost of the repair service. We are not liable for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Data loss or corruption</li>
              <li>Consequential or indirect damages</li>
              <li>Loss of business or profits</li>
              <li>Pre-existing device conditions</li>
              <li>Damage beyond the scope of repair</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Protection</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>We respect your privacy and protect your personal data</li>
              <li>We do not intentionally access personal files during repairs</li>
              <li>Data security cannot be guaranteed; backup is your responsibility</li>
              <li>We may need to factory reset devices for certain repairs</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Cancellation and Refunds</h2>
            
            <h3 className="text-xl font-medium text-gray-800 mb-3">9.1 Cancellation Policy</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>You may cancel before repair begins without penalty</li>
              <li>Cancellation after repair initiation may incur diagnostic fees</li>
              <li>We reserve the right to cancel if repair is not feasible</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">9.2 Refund Policy</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Refunds are provided for warranty-covered defects</li>
              <li>No refunds for completed repairs that meet specifications</li>
              <li>Partial refunds may apply in certain circumstances</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Unclaimed Devices</h2>
            <p className="text-gray-700 leading-relaxed">
              Devices not collected within 30 days of repair completion may be disposed of at our discretion. Storage fees may apply after 30 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              All content on our website and platform is protected by intellectual property rights. You may not copy, reproduce, or distribute our content without permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Force Majeure</h2>
            <p className="text-gray-700 leading-relaxed">
              We are not liable for delays or failures due to circumstances beyond our control, including natural disasters, strikes, or government actions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Dispute Resolution</h2>
            <p className="text-gray-700 leading-relaxed">
              Disputes will be resolved through good faith negotiation. If unresolved, disputes will be subject to the jurisdiction of courts in Punjab, India.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these terms periodically. Continued use of our services constitutes acceptance of updated terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These terms are governed by the laws of India and the state of Punjab.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For questions about these Terms and Conditions, contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700"><strong>Email:</strong> sniketofficial@gmail.com</p>
              <p className="text-gray-700"><strong>Phone:</strong> +91 9380720916</p>
              <p className="text-gray-700"><strong>Address:</strong> Kharar, Punjab, India</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. Acceptance</h2>
            <p className="text-gray-700 leading-relaxed">
              By using our services, you acknowledge that you have read, understood, and agree to these Terms and Conditions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
