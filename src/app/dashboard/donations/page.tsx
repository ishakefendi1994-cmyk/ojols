'use client';

import { useState, useEffect } from 'react';
import { Heart, Plus, Pencil, Trash2, X, Image as ImageIcon, Users, ListFilter } from 'lucide-react';
import { CldUploadWidget } from 'next-cloudinary';

export default function DonationsPage() {
    const [activeTab, setActiveTab] = useState<'campaigns' | 'donors'>('campaigns');
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [donations, setDonations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
    const [campaignForm, setCampaignForm] = useState({
        title: '',
        description: '',
        image_url: '',
        target_amount: 0,
        is_active: true
    });

    useEffect(() => {
        if (activeTab === 'campaigns') {
            fetchCampaigns();
        } else {
            fetchDonations();
        }
    }, [activeTab]);

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/donations/campaigns');
            if (res.ok) setCampaigns(await res.json());
        } catch (err) {
            console.error('Fetch campaigns error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDonations = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/donations/list');
            if (res.ok) setDonations(await res.json());
        } catch (err) {
            console.error('Fetch donations error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCampaignModal = (item?: any) => {
        if (item) {
            setEditingCampaignId(item.id);
            setCampaignForm({
                title: item.title,
                description: item.description || '',
                image_url: item.image_url || '',
                target_amount: item.target_amount || 0,
                is_active: item.is_active
            });
        } else {
            setEditingCampaignId(null);
            setCampaignForm({ title: '', description: '', image_url: '', target_amount: 0, is_active: true });
        }
        setIsCampaignModalOpen(true);
    };

    const handleSaveCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = editingCampaignId ? 'PUT' : 'POST';
            const body = editingCampaignId ? { ...campaignForm, id: editingCampaignId } : campaignForm;
            const res = await fetch('/api/donations/campaigns', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                setIsCampaignModalOpen(false);
                fetchCampaigns();
            }
        } catch (err) {
            alert('Gagal menyimpan kampanye');
        }
    };

    const handleDeleteCampaign = async (id: string) => {
        if (!confirm('Hapus kampanye ini? Semua riwayat donasi terkait akan tetap ada di database (sesuai config cascade).')) return;
        try {
            const res = await fetch(`/api/donations/campaigns?id=${id}`, { method: 'DELETE' });
            if (res.ok) fetchCampaigns();
        } catch (err) {
            alert('Gagal menghapus');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
                    <Heart className="w-8 h-8 text-red-500" />
                    Manajemen Donasi
                </h1>
                <p className="text-gray-600">Kelola program bantuan kemanusiaan dan pantau dana terkumpul.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b">
                <button
                    onClick={() => setActiveTab('campaigns')}
                    className={`pb-3 px-2 font-medium transition-colors relative ${activeTab === 'campaigns' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Kampanye Aktif
                    {activeTab === 'campaigns' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
                </button>
                <button
                    onClick={() => setActiveTab('donors')}
                    className={`pb-3 px-2 font-medium transition-colors relative ${activeTab === 'donors' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Riwayat Donatur
                    {activeTab === 'donors' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
                </button>
            </div>

            {activeTab === 'campaigns' ? (
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => handleOpenCampaignModal()}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Buat Kampanye Baru
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {campaigns.map((item) => {
                                const progress = item.target_amount > 0 ? (item.collected_amount / item.target_amount) : 0;
                                return (
                                    <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                                        <div className="h-40 bg-gray-100 relative">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt="campaign" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-10 h-10 text-gray-300" /></div>
                                            )}
                                            <div className="absolute top-2 right-2">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.is_active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                                                    {item.is_active ? 'Aktif' : 'Draft'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-4 flex-1">
                                            <h3 className="font-bold text-lg mb-2 line-clamp-1">{item.title}</h3>
                                            <div className="mb-4">
                                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                    <span>{formatCurrency(item.collected_amount)}</span>
                                                    <span>Target: {formatCurrency(item.target_amount)}</span>
                                                </div>
                                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-red-500" style={{ width: `${Math.min(progress * 100, 100)}%` }} />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-auto">
                                                <button onClick={() => handleOpenCampaignModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-5 h-5" /></button>
                                                <button onClick={() => handleDeleteCampaign(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Tanggal</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Donatur</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Kampanye</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Jumlah</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Pesan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {donations.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.created_at).toLocaleString('id-ID')}</td>
                                            <td className="px-6 py-4 font-medium">{item.donor_name}</td>
                                            <td className="px-6 py-4 text-sm text-blue-600 font-medium">{item.campaign?.title}</td>
                                            <td className="px-6 py-4 text-right font-bold text-green-600">{formatCurrency(item.amount)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 italic">"{item.message || '-'}"</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Campaign Modal */}
            {isCampaignModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold">{editingCampaignId ? 'Edit Kampanye' : 'Buat Kampanye Baru'}</h2>
                            <button onClick={() => setIsCampaignModalOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSaveCampaign} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Judul Kampanye</label>
                                <input type="text" required value={campaignForm.title} onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Bantuan Gempa..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Upload Gambar</label>
                                {campaignForm.image_url && <img src={campaignForm.image_url} className="w-full h-32 object-cover rounded-lg mb-2" />}
                                <CldUploadWidget uploadPreset="ojek_online" onSuccess={(res: any) => setCampaignForm({ ...campaignForm, image_url: res.info.secure_url })}>
                                    {({ open }) => (
                                        <button type="button" onClick={() => open()} className="w-full px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium flex items-center justify-center gap-2 border border-gray-200">
                                            <ImageIcon className="w-4 h-4" /> {campaignForm.image_url ? 'Ganti Gambar' : 'Pilih Gambar...'}
                                        </button>
                                    )}
                                </CldUploadWidget>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Target Dana (Rp)</label>
                                <input type="number" required value={campaignForm.target_amount} onChange={(e) => setCampaignForm({ ...campaignForm, target_amount: Number(e.target.value) })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Deskripsi/Tentang</label>
                                <textarea rows={4} value={campaignForm.description} onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Tulis rincian bantuan..." />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={campaignForm.is_active} onChange={(e) => setCampaignForm({ ...campaignForm, is_active: e.target.checked })} className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium">Tampilkan Kampanye</span>
                            </label>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsCampaignModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg font-medium">Batal</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
