'use client';

import { useState, useEffect } from 'react';
import { Image as ImageIcon, Plus, Pencil, Trash2, X } from 'lucide-react';
import { CldUploadWidget } from 'next-cloudinary';

export default function BannersPage() {
    const [banners, setBanners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        image_url: '',
        link_url: '',
        is_active: true,
        sort_order: 0
    });

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/banners');
            if (res.ok) {
                const data = await res.json();
                setBanners(data);
                if (data.length === 0) {
                    setError('Data banner kosong atau tabel belum dibuat.');
                } else {
                    setError('');
                }
            } else {
                setError('Gagal mengambil data. Pastikan tabel banners sudah ada.');
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
                image_url: item.image_url,
                link_url: item.link_url || '',
                is_active: item.is_active,
                sort_order: item.sort_order || 0
            });
        } else {
            setEditingId(null);
            setForm({ image_url: '', link_url: '', is_active: true, sort_order: 0 });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.image_url) {
            alert('Gambar wajib diisi!');
            return;
        }

        try {
            const method = editingId ? 'PUT' : 'POST';
            const body = editingId ? { ...form, id: editingId } : form;

            const res = await fetch('/api/banners', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchBanners();
            } else {
                const err = await res.json();
                alert('Gagal menyimpan: ' + (err.error || 'Unknown error'));
            }
        } catch (err) {
            alert('Terjadi kesalahan.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus banner ini?')) return;
        try {
            const res = await fetch(`/api/banners?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchBanners();
            }
        } catch (err) {
            alert('Gagal menghapus');
        }
    };

    const handleUploadSuccess = (result: any) => {
        if (result.info && result.info.secure_url) {
            setForm({ ...form, image_url: result.info.secure_url });
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ImageIcon className="w-8 h-8 text-blue-600" />
                        Promo Banners Slider
                    </h1>
                    <p className="text-gray-600">Kelola gambar banner geser yang tampil di halaman Home aplikasi</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Tambah Banner
                </button>
            </div>

            {error && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
                    <p className="font-bold">Info</p>
                    <p>{error}</p>
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
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Gambar</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Urutan (Sort)</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Link Tujuan</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Status</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {banners.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4">
                                            <div className="w-24 h-12 rounded-lg overflow-hidden border">
                                                <img src={item.image_url} alt="banner" className="w-full h-full object-cover" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium">{item.sort_order}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {item.link_url ? <a href={item.link_url} target="_blank" className="text-blue-500 underline" rel="noreferrer">Buka Link</a> : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {item.is_active ? 'Aktif' : 'Tidak Aktif'}
                                            </span>
                                        </td>
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
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold">{editingId ? 'Edit Banner' : 'Tambah Banner'}</h2>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Gambar Banner</label>
                                    {form.image_url && (
                                        <div className="mb-2 relative w-full h-32 rounded-lg border overflow-hidden">
                                            <img src={form.image_url} alt="preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="w-full">
                                        <CldUploadWidget
                                            uploadPreset="ojek_online"
                                            onSuccess={handleUploadSuccess}
                                            options={{ maxFiles: 1, multiple: false }}
                                        >
                                            {({ open }) => (
                                                <button
                                                    type="button"
                                                    onClick={() => open()}
                                                    className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
                                                >
                                                    <ImageIcon className="w-4 h-4" />
                                                    {form.image_url ? 'Ganti Gambar' : 'Pilih Gambar...'}
                                                </button>
                                            )}
                                        </CldUploadWidget>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Link Promo (Opsional)</label>
                                    <input
                                        type="url"
                                        value={form.link_url}
                                        onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="https://gofood.co.id/..."
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Urutan</label>
                                        <input
                                            type="number"
                                            value={form.sort_order}
                                            onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="flex-1 flex items-end mb-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={form.is_active}
                                                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            <span className="text-sm font-medium">Aktif Ditampilkan</span>
                                        </label>
                                    </div>
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
