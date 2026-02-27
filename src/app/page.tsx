import { redirect } from 'next/navigation';

export default function Home() {
  // Sementara langsung arahkan semuanya ke /login karena belum ada Auth Guard global
  redirect('/login');
}
