'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Loader2, Upload } from 'lucide-react';
import { CldUploadWidget } from 'next-cloudinary';

interface CategoryType {
    id: string;
    name: string;
    service_type: string;
    image_url: string | null;
    is_active: boolean;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<CategoryType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        service_type: 'food',
        image_url: '',
        is_active: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/categories');
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            setCategories(result.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            alert('Gagal mengambil data kategori.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category?: CategoryType) => {
        if (category) {
            setEditingId(category.id);
            setFormData({
                name: category.name,
                service_type: category.service_type,
                image_url: category.image_url || '',
                is_active: category.is_active
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                service_type: 'food',
                image_url: '',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const action = editingId ? 'UPDATE' : 'CREATE';
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    id: editingId,
                    categoryData: formData
                })
            });

            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || 'Terjadi kesalahan di server');

            handleCloseModal();
            fetchCategories();
        } catch (error: any) {
            console.error('Error saving category:', error);
            alert(`Gagal menyimpan data: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${name}"?`)) return;

        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE', id })
            });

            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || 'Terjadi kesalahan di server');

            fetchCategories();
        } catch (error: any) {
            console.error('Error deleting category:', error);
            alert(`Gagal menghapus data: ${error.message}`);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Manajemen Kategori Toko</h2>
                    <p className="text-sm text-slate-500 mt-1">Kelola kategori untuk Food dan Shop</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Kategori
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                            <th className="px-6 py-4 font-semibold text-slate-600">Nama Kategori</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Tipe Layanan</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-center">Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                                    Belum ada kategori yang dibuat.
                                </td>
                            </tr>
                        ) : (
                            categories.map((cat) => (
                                <tr key={cat.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-800">{cat.name}</td>
                                    <td className="px-6 py-4 text-slate-600 uppercase font-semibold text-xs">
                                        <span className={`px-2 py-1 rounded ${cat.service_type === 'food' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {cat.service_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {cat.is_active ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Aktif
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                <XCircle className="w-3.5 h-3.5 mr-1" /> Nonaktif
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleOpenModal(cat)}
                                            className="text-slate-400 hover:text-blue-600 p-2 transition-colors inline-block"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cat.id, cat.name)}
                                            className="text-slate-400 hover:text-red-600 p-2 transition-colors inline-block ml-1"
                                            title="Hapus"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">
                                {editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kategori</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Contoh: Aneka Nasi, Sembako, Sayuran"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Layanan</label>
                                <select
                                    required
                                    value={formData.service_type}
                                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                >
                                    <option value="food">Makanan / Minuman (Food)</option>
                                    <option value="shop">Toko / Belanja (Shop)</option>
                                </select>
                                <span className="text-xs text-slate-500 mt-1 block">Tentukan kategori ini akan muncul di menu aplikasi yang mana.</span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">URL Gambar (Opsional)</label>
                                <div className="mt-1 flex items-center gap-4">
                                    {formData.image_url ? (
                                        <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-slate-200 group">
                                            <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, image_url: '' })}
                                                className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="h-20 w-20 rounded-lg border border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
                                            <Upload className="w-6 h-6 text-slate-400" />
                                        </div>
                                    )}

                                    <CldUploadWidget
                                        uploadPreset="ojek_online" // Ganti 'ojek_online' dengan nama preset Cloudinary Anda jika berbeda, atau gunakan "ml_default"
                                        options={{ maxFiles: 1 }}
                                        onSuccess={(result: any) => {
                                            if (result.info && result.info.secure_url) {
                                                setFormData({ ...formData, image_url: result.info.secure_url });
                                            }
                                        }}
                                    >
                                        {({ open }) => (
                                            <button
                                                type="button"
                                                onClick={() => open?.()}
                                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                {formData.image_url ? 'Ganti Gambar' : 'Upload Gambar'}
                                            </button>
                                        )}
                                    </CldUploadWidget>
                                </div>
                                <span className="text-xs text-slate-500 mt-2 block">Foto untuk icon kategori di aplikasi pelanggan. Kosongkan jika ingin pakai icon bawaan.</span>
                            </div>

                            <div className="flex items-center pt-2 gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                                    Kategori Aktif
                                </label>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan</>
                                    ) : (
                                        'Simpan Data'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
