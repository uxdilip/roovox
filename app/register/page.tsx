import { redirect } from 'next/navigation';
export default function RegisterPage() {
  redirect('/login');
  return null;
}