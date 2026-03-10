'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Save, Power, PowerOff, RefreshCw, Trash2 } from 'lucide-react';

type Product = {
    id: string;
    product_code: string;
    product_name: string;
    category: string;
    brand: string;
    provider_price: number;
    markup: number;
    price: number;
    is_active: boolean;
};

export default function PPOBProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [syncing, setSyncing] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [editingMarkup, setEditingMarkup] = useState<string | null>(null);
    const [markupValue, setMarkupValue] = useState<string>('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('ppob_products')
                .select('*')
                .order('category', { ascending: true })
                .order('brand', { ascending: true })
                .order('provider_price', { ascending: true });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
            alert('Gagal mengambil data produk PPOB');
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        if (!confirm('Apakah Anda yakin ingin menyinkronkan data dengan Digiflazz? Proses ini mungkin memerlukan waktu.')) return;

        try {
            setSyncing(true);
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) throw new Error('Not authenticated');

            const res = await fetch('/api/ppob/sync', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                }
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to sync');
            }

            alert('Sinkronisasi berhasil!');
            fetchProducts();
        } catch (error: any) {
            console.error('Sync error:', error);
            alert('Gagal sinkronisasi: ' + error.message);
        } finally {
            setSyncing(false);
        }
    };

    const handleReset = async () => {
        if (!confirm('PERINGATAN! Apakah Anda yakin ingin MENGHAPUS SEMUA DATA PRODUK PPOB? Data yang dihapus tidak bisa dikembalikan.')) return;

        try {
            setResetting(true);
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) throw new Error('Not authenticated');

            const res = await fetch('/api/ppob/reset', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                }
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to reset');
            }

            alert('Semua data produk PPOB berhasil dihapus!');
            fetchProducts();
        } catch (error: any) {
            console.error('Reset error:', error);
            alert('Gagal menghapus data: ' + error.message);
        } finally {
            setResetting(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('ppob_products')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            setProducts(products.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Gagal mengubah status produk');
        }
    };

    const saveMarkup = async (id: string, newMarkupStr: string) => {
        const newMarkup = Number(newMarkupStr);
        if (isNaN(newMarkup) || newMarkup < 0) {
            alert('Markup harus berupa angka positif');
            return;
        }

        try {
            const { error } = await supabase
                .from('ppob_products')
                .update({ markup: newMarkup })
                .eq('id', id);

            if (error) throw error;

            // To ensure UI reflects generated 'price', we fetch everything again or calculate locally
            setProducts(products.map(p => p.id === id ? { ...p, markup: newMarkup, price: p.provider_price + newMarkup } : p));
            setEditingMarkup(null);
        } catch (error) {
            console.error('Error updating markup:', error);
            alert('Gagal mengubah markup produk');
        }
    };

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const filteredProducts = products.filter(p =>
        (p.product_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.product_code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.brand?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800">Manajemen Produk PPOB</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleReset}
                        disabled={resetting || syncing}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                        <Trash2 className={`w-5 h-5 mr-2 ${resetting ? 'animate-pulse' : ''}`} />
                        {resetting ? 'Menghapus...' : 'Reset Data'}
                    </button>
                    <button
                        onClick={handleSync}
                        disabled={syncing || resetting}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Menyinkronkan...' : 'Sinkron Digiflazz'}
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Cari nama produk, provider, kode..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 border-b">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Produk</th>
                                <th className="px-6 py-4 font-semibold">Kode & Brand</th>
                                <th className="px-6 py-4 font-semibold text-right">Harga Asli</th>
                                <th className="px-6 py-4 font-semibold text-right">Markup</th>
                                <th className="px-6 py-4 font-semibold text-right">Harga Jual</th>
                                <th className="px-6 py-4 font-semibold text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        Memuat data...
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        Tidak ada produk ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{p.product_name}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-900">{p.product_code}</div>
                                            <div className="text-xs text-slate-500 uppercase">{p.category} - {p.brand}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">{formatRupiah(p.provider_price)}</td>
                                        <td className="px-6 py-4 text-right">
                                            {editingMarkup === p.id ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <input
                                                        type="number"
                                                        className="w-24 px-2 py-1 border rounded"
                                                        value={markupValue}
                                                        onChange={(e) => setMarkupValue(e.target.value)}
                                                    />
                                                    <button
                                                        onClick={() => saveMarkup(p.id, markupValue)}
                                                        className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setEditingMarkup(p.id);
                                                        setMarkupValue(p.markup.toString());
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 underline decoration-dashed underline-offset-4"
                                                >
                                                    {formatRupiah(p.markup)}
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-green-600">{formatRupiah(p.price)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {p.is_active ? 'Aktif' : 'Non-aktif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => toggleStatus(p.id, p.is_active)}
                                                className={`p-2 rounded-lg transition-colors ${p.is_active
                                                    ? 'text-red-600 hover:bg-red-50'
                                                    : 'text-green-600 hover:bg-green-50'
                                                    }`}
                                                title={p.is_active ? "Non-aktifkan" : "Aktifkan"}
                                            >
                                                {p.is_active ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
