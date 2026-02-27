'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Loader2, Store, Search, Image as ImageIcon } from 'lucide-react';
import { CldUploadWidget } from 'next-cloudinary';

interface Merchant {
    full_name: string;
    phone_number: string | null;
}

interface ProductType {
    id: string;
    merchant_id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    is_available: boolean;
    created_at: string;
    merchant?: Merchant;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState(true);
    const [merchants, setMerchants] = useState<{ id: string, full_name: string }[]>([]); // For dropdown

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        merchant_id: '',
        name: '',
        description: '',
        price: 0,
        image_url: '',
        is_available: true
    });

    useEffect(() => {
        fetchProducts();
        fetchMerchants();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/products');
            const result = await res.json();

            if (!res.ok) throw new Error(result.error);
            setProducts(result.data || []);
        } catch (error: any) {
            console.error('Error fetching products:', error);
            alert(`Gagal mengambil data produk: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchMerchants = async () => {
        try {
            // Fetch users with role MERCHANT to populate the dropdown
            const res = await fetch('/api/users?role=MERCHANT');
            const result = await res.json();
            if (res.ok && result.data) {
                setMerchants(result.data.map((m: any) => ({
                    id: m.id,
                    full_name: m.full_name
                })));
            }
        } catch (error) {
            console.error('Error fetching merchants:', error);
        }
    };

    const handleOpenModal = (product?: ProductType) => {
        if (product) {
            setEditingId(product.id);
            setFormData({
                merchant_id: product.merchant_id,
                name: product.name,
                description: product.description || '',
                price: product.price,
                image_url: product.image_url || '',
                is_available: product.is_available
            });
        } else {
            setEditingId(null);
            setFormData({
                merchant_id: merchants.length > 0 ? merchants[0].id : '',
                name: '',
                description: '',
                price: 0,
                image_url: '',
                is_available: true
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

        if (!formData.merchant_id) {
            alert("Silakan pilih Toko / Merchant terlebih dahulu.");
            return;
        }

        setIsSubmitting(true);
        try {
            const submitData = {
                ...formData,
                description: formData.description.trim() === '' ? null : formData.description,
                image_url: formData.image_url.trim() === '' ? null : formData.image_url,
            };

            const action = editingId ? 'UPDATE' : 'CREATE';
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    id: editingId,
                    productData: submitData
                })
            });

            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || 'Gagal menyimpan.');

            handleCloseModal();
            fetchProducts();
        } catch (error: any) {
            console.error('Error saving product:', error);
            alert(`Gagal menyimpan data: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus menu "${name}"?`)) return;

        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE', id })
            });

            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || 'Gagal hapus.');

            fetchProducts();
        } catch (error: any) {
            console.error('Error deleting product:', error);
            alert(`Gagal menghapus produk: ${error.message}`);
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
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Store className="w-6 h-6 text-purple-600" />
                        Master Menu Makanan
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Kelola daftar menu makanan (Food Delivery) dari setiap Resto/Mitra.</p>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors text-sm font-medium whitespace-nowrap"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Menu Baru
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                            <th className="px-6 py-4 font-semibold text-slate-600 w-16">Foto</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Info Produk</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Harga Jual</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Toko / Merchant</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-center">Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                    <Store className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                    Belum ada menu makanan yang terdaftar.
                                </td>
                            </tr>
                        ) : (
                            products.map((prod) => (
                                <tr key={prod.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        {prod.image_url ? (
                                            <img src={prod.image_url} alt={prod.name} className="w-12 h-12 object-cover rounded shadow-sm border border-slate-200" />
                                        ) : (
                                            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded flex items-center justify-center border border-slate-200">
                                                <ImageIcon className="w-5 h-5" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-800">{prod.name}</div>
                                        {prod.description && (
                                            <div className="text-xs text-slate-500 mt-1 line-clamp-1">{prod.description}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-purple-700">Rp {prod.price.toLocaleString('id-ID')}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-slate-700">
                                            {prod.merchant?.full_name || 'Toko Tidak Ditemukan'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {prod.is_available ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CheckCircle className="w-3 h-3 mr-1" /> Tersedia
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                <XCircle className="w-3 h-3 mr-1" /> Habis
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleOpenModal(prod)}
                                            className="text-slate-400 hover:text-purple-600 p-2 transition-colors inline-block"
                                            title="Edit Menu"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(prod.id, prod.name)}
                                            className="text-slate-400 hover:text-red-600 p-2 transition-colors inline-block ml-1"
                                            title="Hapus Menu"
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

            {/* Modal Form Edit/Create */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">
                                {editingId ? 'Edit Menu Makanan' : 'Tambah Menu Makanan'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

                            {/* Pemilihan Merchant Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Toko / Merchant Pemilik Menu</label>
                                {merchants.length === 0 ? (
                                    <div className="p-3 bg-orange-50 text-orange-800 border border-orange-200 rounded-lg text-sm">
                                        ⚠️ Anda belum memiliki pengguna dengan tipe "MERCHANT". Silakan tambahkan Merchant terlebih dahulu di menu Manajemen Pengguna.
                                    </div>
                                ) : (
                                    <select
                                        required
                                        value={formData.merchant_id}
                                        onChange={(e) => setFormData({ ...formData, merchant_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
                                    >
                                        <option value="" disabled>-- Pilih Merchant --</option>
                                        {merchants.map(m => (
                                            <option key={m.id} value={m.id}>{m.full_name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Menu</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                        placeholder="Contoh: Nasi Goreng Spesial"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Harga Jual (Rp)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                        placeholder="Contoh: 25000"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Singkat (Opsional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm min-h-[80px]"
                                    placeholder="Nasi goreng dengan telur, sosis, dan ayam..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Foto Makanan / Toko (Opsional)</label>
                                <div className="space-y-3">
                                    {formData.image_url && (
                                        <div className="relative inline-block">
                                            <img
                                                src={formData.image_url}
                                                alt="Preview"
                                                className="w-32 h-32 object-cover rounded-lg border border-slate-200 shadow-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, image_url: '' })}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                                                title="Hapus gambar"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                    <CldUploadWidget
                                        uploadPreset="ojek_online"
                                        onSuccess={(result: any) => {
                                            if (result.info && result.info.secure_url) {
                                                setFormData((prev) => ({ ...prev, image_url: result.info.secure_url }));
                                            }
                                        }}
                                    >
                                        {({ open }) => {
                                            return (
                                                <button
                                                    type="button"
                                                    onClick={() => open()}
                                                    className="w-full px-3 py-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-sm font-medium text-slate-600 flex flex-col items-center justify-center gap-2"
                                                >
                                                    <ImageIcon className="w-6 h-6 text-purple-500" />
                                                    {formData.image_url ? 'Ganti Foto' : 'Pilih Foto dari Komputer'}
                                                </button>
                                            );
                                        }}
                                    </CldUploadWidget>
                                </div>
                            </div>

                            <div className="flex items-center pt-2">
                                <input
                                    type="checkbox"
                                    id="isAvailable"
                                    checked={formData.is_available}
                                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
                                />
                                <label htmlFor="isAvailable" className="ml-2 text-sm font-medium text-slate-700 cursor-pointer">
                                    Menu Ini Tersedia / Stok Ada
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
                                    disabled={isSubmitting || merchants.length === 0}
                                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan</>
                                    ) : (
                                        'Simpan Menu'
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
