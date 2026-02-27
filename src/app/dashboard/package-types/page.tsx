'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, Pencil, Trash2, X } from 'lucide-react';

export default function PackageTypesPage() {
    const [types, setTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        code: '',
        name: '',
        description: '',
        extra_fee: 0
    });

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/package-types');
            if (res.ok) {
                const data = await res.json();
                setTypes(data);
                if (data.length === 0) {
                    setError('Tabel package_types mungkin belum dibuat di database atau datanya kosong. (Lihat instruksi SQL)');
                } else {
                    setError('');
                }
            } else {
                setError('Gagal mengambil data. Pastikan tabel package_types sudah ada.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item?: any) => {
        if (item) {
            setEditingId(item.id);
            setForm({
                code: item.code,
                name: item.name,
                description: item.description || '',
                extra_fee: item.extra_fee
            });
        } else {
            setEditingId(null);
            setForm({ code: '', name: '', description: '', extra_fee: 0 });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = editingId ? 'PUT' : 'POST';
            const body = editingId ? { ...form, id: editingId } : form;

            const res = await fetch('/api/package-types', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchTypes();
            } else {
                const err = await res.json();
                alert('Gagal menyimpan: ' + (err.error || 'Unknown error'));
            }
        } catch (err) {
            alert('Terjadi kesalahan.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus jenis barang ini?')) return;
        try {
            const res = await fetch(`/api/package-types?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchTypes();
            }
        } catch (err) {
            alert('Gagal menghapus');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Package className="w-8 h-8 text-blue-600" />
                        Varian Berat/Ukuran Barang (Kirim)
                    </h1>
                    <p className="text-gray-600">Kelola daftar opsi ukuran barang yang tampil di aplikasi</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Tambah Varian
                </button>
            </div>

            {error && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
                    <p className="font-bold">Perhatian</p>
                    <p>{error}</p>
                    <p className="text-sm mt-2">Untuk menggunakan fitur ini, jalankan SQL berikut di Supabase Dashboard:</p>
                    <pre className="bg-white p-2 mt-2 border rounded text-xs overflow-x-auto">
                        {`CREATE TABLE public.package_types (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  extra_fee numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.package_types (code, name, description, extra_fee) VALUES
('small', 'Barang Kecil (< 5 kg)', 'Harga dasar (tidak ada tambahan harga)', 0),
('medium', 'Barang Sedang (5 - 10 kg)', 'Tambah + Rp 5.000 ke total ongkos', 5000),
('large', 'Barang Besar (> 10 kg)', 'Tambah + Rp 15.000 ke total ongkos', 15000);`}
                    </pre>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Kode</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Nama Tampilan</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Deskripsi Singkat</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Tambahan Ongkos (Rp)</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {types.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4">
                                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">{item.code}</span>
                                        </td>
                                        <td className="px-6 py-4 font-medium">{item.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{item.description}</td>
                                        <td className="px-6 py-4 text-blue-600 font-semibold">{item.extra_fee.toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(item)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Pencil className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold">{editingId ? 'Edit Varian' : 'Tambah Varian Baru'}</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kode Unik (huruf kecil, misal: xl)</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.code}
                                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="misal: small, medium, large"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Tampilan di Aplikasi</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="misal: Barang Sedang (5 - 10 kg)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan / Deskripsi</label>
                                    <input
                                        type="text"
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tambahan Ongkos (Rp)</label>
                                    <input
                                        type="number"
                                        required
                                        value={form.extra_fee}
                                        onChange={(e) => setForm({ ...form, extra_fee: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
