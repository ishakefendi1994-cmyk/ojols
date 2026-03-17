'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    LayoutDashboard,
    Users,
    Map,
    Settings,
    LogOut,
    Wallet,
    Menu,
    X,
    UserCheck,
    Store,
    ClipboardCheck,
    Tags,
    Package,
    Image as ImageIcon,
    Newspaper,
    Heart,
    Car,
    Key,
    Banknote,
    ChevronDown,
    ChevronRight,
    Smartphone,
    MapPin,
    Bus
} from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [openMenus, setOpenMenus] = useState<string[]>(['Utama', 'Transaksi', 'Master Data']);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        checkUser();
    }, []);

    async function checkUser() {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session) {
                console.error("Session Error/Missing:", sessionError);
                await supabase.auth.signOut();
                router.push('/login');
                return;
            }

            // Pastikan yang login adalah ADMIN via API bypass RLS
            const res = await fetch(`/api/check-role?id=${session.user.id}`);
            const roleData = await res.json();

            if (!res.ok || roleData.role !== 'ADMIN') {
                console.error("Layout Guard:", roleData.error || "Bukan Admin");
                await supabase.auth.signOut();
                router.push('/login');
                return;
            }

            setLoading(false);
        } catch (error) {
            console.error('Error checking auth:', error);
            await supabase.auth.signOut();
            router.push('/login');
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const menuGroups = [
        {
            title: 'Utama',
            items: [
                { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            ]
        },
        {
            title: 'Pengguna',
            items: [
                { name: 'Pelanggan & Mitra', href: '/dashboard/users', icon: Users },
                { name: 'Verifikasi Driver', href: '/dashboard/drivers', icon: Car },
            ]
        },
        {
            title: 'Transaksi',
            items: [
                { name: 'Pantau Order', href: '/dashboard/orders', icon: Map },
                { name: 'Dompet & Transaksi', href: '/dashboard/wallets', icon: Wallet },
                { name: 'Persetujuan Top-up', href: '/dashboard/topups', icon: ClipboardCheck },
                { name: 'Pengajuan Withdraw', href: '/dashboard/withdrawals', icon: Banknote },
                { name: 'Langganan Driver', href: '/dashboard/subscriptions', icon: ClipboardCheck },
                { name: 'Manajemen Donasi', href: '/dashboard/donations', icon: Heart },
            ]
        },
        {
            title: 'PPOB & Layanan Digital',
            items: [
                { name: 'Transaksi PPOB', href: '/dashboard/ppob/transactions', icon: Smartphone },
                { name: 'Produk PPOB', href: '/dashboard/ppob/products', icon: Tags },
            ]
        },
        {
            title: 'Travel',
            items: [
                { name: 'Armada Kendaraan', href: '/dashboard/travel/vehicles', icon: Car },
                { name: 'Jadwal Keberangkatan', href: '/dashboard/travel/schedules', icon: Bus },
                { name: 'Pemesanan & Tiket', href: '/dashboard/travel/bookings', icon: ClipboardCheck },
            ]
        },
        {
            title: 'Sewa Driver',
            items: [
                { name: 'Manajemen Rute Utama', href: '/dashboard/rental/routes', icon: MapPin },
                { name: 'Daftar Pesanan Sewa', href: '/dashboard/rental/bookings', icon: UserCheck },
            ]
        },
        {
            title: 'Master Data',
            items: [
                { name: 'Master Layanan', href: '/dashboard/services', icon: Settings },
                { name: 'Kategori Toko', href: '/dashboard/categories', icon: Tags },
                { name: 'Master Menu Makanan', href: '/dashboard/products', icon: Store },
                { name: 'Varian Barang (Kirim)', href: '/dashboard/package-types', icon: Package },
                { name: 'Manajemen Alamat', href: '/dashboard/addresses', icon: MapPin },
            ]
        },
        {
            title: 'Promo & Pengaturan',
            items: [
                { name: 'Promo Banners', href: '/dashboard/banners', icon: ImageIcon },
                { name: 'Promo & Berita', href: '/dashboard/news', icon: Newspaper },
                { name: 'Manajemen Lisensi', href: '/dashboard/licensing', icon: Key },
            ]
        }
    ];

    const toggleMenu = (title: string) => {
        setOpenMenus(prev => prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside
                className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col`}
            >
                <div className="flex-none h-16 flex items-center justify-between px-6 bg-slate-950">
                    <span className="text-xl font-bold flex items-center">
                        <UserCheck className="w-6 h-6 mr-2 text-blue-400" />
                        SuperAdmin
                    </span>
                    <button
                        className="lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-4 mt-2 pb-20">
                    {menuGroups.map((group) => {
                        const isOpen = openMenus.includes(group.title as string);
                        const hasActiveChild = group.items.some(item => pathname === item.href);

                        return (
                            <div key={group.title as string} className="space-y-1">
                                <button
                                    onClick={() => toggleMenu(group.title as string)}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${hasActiveChild && !isOpen ? 'text-blue-400' : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    <span>{group.title}</span>
                                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>

                                {isOpen && (
                                    <div className="space-y-1 pl-2">
                                        {group.items.map((item) => {
                                            const isActive = pathname === item.href;
                                            const Icon = item.icon;

                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={`flex items-center px-4 py-2.5 rounded-lg transition-colors ${isActive
                                                        ? 'bg-blue-600 text-white shadow-sm'
                                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                                        }`}
                                                >
                                                    <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                                                    <span className="font-medium text-sm">{item.name}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="flex-none p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        <span className="font-medium text-sm">Keluar System</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white shadow-sm flex items-center px-6 lg:hidden">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="ml-4 font-semibold text-slate-800">Admin Panel</span>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
