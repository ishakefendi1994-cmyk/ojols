'use client';

import { useState, useEffect } from 'react';
import { Newspaper, Plus, Pencil, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { CldUploadWidget } from 'next-cloudinary';

export default function NewsPage() {
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        title: '',
        image_url: '',
        content: '',
        is_active: true
    });

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/news');
            if (res.ok) {
                const data = await res.json();
                setNews(data);
                if (data.length === 0) {
                    setError('Data berita kosong atau tabel belum dibuat.');
                } else {
                    setError('');
                }
            } else {
                setError('Gagal mengambil data. Pastikan tabel news sudah ada.');
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
                title: item.title,
                image_url: item.image_url || '',
                content: item.content || '',
                is_active: item.is_active
            });
        } else {
            setEditingId(null);
            setForm({ title: '', image_url: '', content: '', is_active: true });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title) {
            alert('Judul wajib diisi!');
            return;
        }

        try {
            const method = editingId ? 'PUT' : 'POST';
            const body = editingId ? { ...form, id: editingId } : form;

            const res = await fetch('/api/news', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchNews();
            } else {
                const err = await res.json();
                alert('Gagal menyimpan: ' + (err.error || 'Unknown error'));
            }
        } catch (err) {
            alert('Terjadi kesalahan.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus berita ini?')) return;
        try {
            const res = await fetch(`/api/news?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchNews();
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
                        <Newspaper className="w-8 h-8 text-blue-600" />
                        Promo & Berita
                    </h1>
                    <p className="text-gray-600">Kelola artikel atau promo yang tampil di daftar berita aplikasi</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Tulis Berita
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
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Judul Berita</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Tanggal</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Status</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {news.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4">
                                            <div className="w-16 h-16 rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt="news" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="w-6 h-6 text-gray-400" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium">{item.title}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(item.created_at).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {item.is_active ? 'Publik' : 'Draft(Sembunyi)'}
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
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
                            <h2 className="text-xl font-bold">{editingId ? 'Edit Berita' : 'Tulis Berita Baru'}</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1">
                            <div className="space-y-4">

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Judul Berita/Promo</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Diskon 50% Selama Ramadhan!"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Cover Gambar</label>
                                    {form.image_url && (
                                        <div className="mb-2 relative w-full h-40 rounded-lg border overflow-hidden">
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
                                                    {form.image_url ? 'Ganti Cover' : 'Upload Cover...'}
                                                </button>
                                            )}
                                        </CldUploadWidget>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Isi Berita</label>
                                    <textarea
                                        rows={6}
                                        value={form.content}
                                        onChange={(e) => setForm({ ...form, content: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Tulis detail promonya disini..."
                                    ></textarea>
                                </div>

                                <div className="flex flex-col gap-2 mt-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.is_active}
                                            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="text-sm font-medium">Aktif Ditampilkan di Beranda</span>
                                    </label>
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
