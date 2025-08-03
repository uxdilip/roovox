import { redirect } from 'next/navigation';
 
export default function BecomeProviderRedirect() {
  redirect('/providers');
  return null;
} 