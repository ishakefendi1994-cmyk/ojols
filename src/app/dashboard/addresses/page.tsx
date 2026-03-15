'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Trash2, Loader2, Download, Filter, Map as MapIcon, RefreshCw, Plus, X } from 'lucide-react';

interface POIType {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    category: string;
    created_at: string;
}

export default function AddressesPage() {
    const [pois, setPois] = useState<POIType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Manual Add State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [manualPoi, setManualPoi] = useState({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        category: 'umum'
    });
    const [isSubmittingManual, setIsSubmittingManual] = useState(false);
    
    // Import State
    const [isImporting, setIsImporting] = useState(false);
    
    // Scraper State
    const [scrapeConfig, setScrapeConfig] = useState({
        lat: '-1.488', // Default Bangko/Merangin area maybe?
        lng: '102.433',
        radius: 5,
        keyword: 'kantor, sekolah, pasar, masjid, rumah sakit, cafe, resto'
    });
    const [isScraping, setIsScraping] = useState(false);

    useEffect(() => {
        fetchPois();
    }, []);

    const fetchPois = async () => {
        setLoading(true);
        try {
            const url = searchTerm 
                ? `/api/addresses?search=${encodeURIComponent(searchTerm)}`
                : '/api/addresses';
            const res = await fetch(url);
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            setPois(result.data || []);
        } catch (error) {
            console.error('Error fetching POIs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScrape = async () => {
        if (!scrapeConfig.lat || !scrapeConfig.lng || !scrapeConfig.radius) {
            alert('Lengkapi koordinat pusat dan radius!');
            return;
        }

        setIsScraping(true);
        try {
            // Split keywords and scrape one by one for better coverage
            const keywords = scrapeConfig.keyword.split(',').map(k => k.trim()).filter(k => k !== '');
            
            let totalScraped = 0;
            
            for (const kw of keywords) {
                const res = await fetch('/api/scrape-pois', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        lat: parseFloat(scrapeConfig.lat),
                        lng: parseFloat(scrapeConfig.lng),
                        radius: parseFloat(scrapeConfig.radius.toString()),
                        keyword: kw
                    })
                });
                const result = await res.json();
                if (res.ok) {
                    totalScraped += result.count || 0;
                }
            }
            
            alert(`Selesai! Berhasil mengumpulkan ${totalScraped} lokasi baru.`);
            fetchPois();
        } catch (error: any) {
            console.error('Error scraping:', error);
            alert(`Gagal scraping: ${error.message}`);
        } finally {
            setIsScraping(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Hapus lokasi "${name}"?`)) return;

        try {
            const res = await fetch('/api/addresses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE', id })
            });
            if (res.ok) fetchPois();
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm('Hapus SEMUA data alamat? Tindakan ini tidak bisa dibatalkan.')) return;

        try {
            const res = await fetch('/api/addresses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE_ALL' })
            });
            if (res.ok) fetchPois();
        } catch (error) {
            console.error('Error deleting all:', error);
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingManual(true);
        try {
            const res = await fetch('/api/addresses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'CREATE',
                    poiData: {
                        ...manualPoi,
                        latitude: parseFloat(manualPoi.latitude),
                        longitude: parseFloat(manualPoi.longitude),
                        place_id: `manual_${Date.now()}`
                    }
                })
            });
            if (res.ok) {
                setIsAddModalOpen(false);
                setManualPoi({ name: '', address: '', latitude: '', longitude: '', category: 'umum' });
                fetchPois();
            }
        } catch (error) {
            console.error('Error adding manual:', error);
        } finally {
            setIsSubmittingManual(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const items = JSON.parse(event.target?.result as string);
                    if (!Array.isArray(items)) throw new Error('Format JSON tidak valid (harus Array)');

                    let successCount = 0;
                    for (const item of items) {
                        const res = await fetch('/api/addresses', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'CREATE',
                                poiData: {
                                    name: item.name,
                                    address: item.address,
                                    latitude: item.latitude,
                                    longitude: item.longitude,
                                    category: item.category || 'umum',
                                    place_id: item.place_id || `import_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`
                                }
                            })
                        });
                        if (res.ok) successCount++;
                    }
                    alert(`Berhasil mengimpor ${successCount} lokasi!`);
                    fetchPois();
                } catch (err: any) {
                    alert(`Gagal baca file: ${err.message}`);
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('Error importing:', error);
        } finally {
            setIsImporting(false);
            e.target.value = ''; // Reset input
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with Manual Add & Import Button */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Manajemen Alamat Lokal</h1>
                    <p className="text-slate-500">Bangun database alamat mandiri Anda.</p>
                </div>
                <div className="flex gap-2">
                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg flex items-center transition-all cursor-pointer border border-slate-300">
                        <Download className="w-4 h-4 mr-2" /> {isImporting ? 'Mengimpor...' : 'Impor JSON'}
                        <input type="file" accept=".json" className="hidden" onChange={handleImport} disabled={isImporting} />
                    </label>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-all"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Tambah Manual
                    </button>
                </div>
            </div>

            {/* Scraper Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Scraper Data Alamat (Google Maps)</h2>
                        <p className="text-sm text-slate-500 mt-1">Gunakan ini untuk membangun database alamat lokal dan menghemat API Maps.</p>
                    </div>
                    <MapIcon className="w-8 h-8 text-blue-500 opacity-50" />
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Latitude Pusat</label>
                        <input 
                            type="text" 
                            value={scrapeConfig.lat} 
                            onChange={e => setScrapeConfig({...scrapeConfig, lat: e.target.value})}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="-1.488"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Longitude Pusat</label>
                        <input 
                            type="text" 
                            value={scrapeConfig.lng} 
                            onChange={e => setScrapeConfig({...scrapeConfig, lng: e.target.value})}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="102.433"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Radius (KM)</label>
                        <input 
                            type="number" 
                            value={scrapeConfig.radius} 
                            onChange={e => setScrapeConfig({...scrapeConfig, radius: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="5"
                        />
                    </div>
                    <button 
                        onClick={handleScrape}
                        disabled={isScraping}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-all disabled:opacity-50"
                    >
                        {isScraping ? (
                            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Scraping...</>
                        ) : (
                            <><Download className="w-4 h-4 mr-2" /> Mulai Scrape</>
                        )}
                    </button>
                    <div className="md:col-span-4">
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Kata Kunci (Pisahkan dengan koma)</label>
                        <input 
                            type="text" 
                            value={scrapeConfig.keyword} 
                            onChange={e => setScrapeConfig({...scrapeConfig, keyword: e.target.value})}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="hotel, spbu, sekolah..."
                        />
                    </div>
                </div>
            </div>

            {/* List Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Database POI Lokal</h2>
                        <p className="text-sm text-slate-500 mt-1">Total {pois.length} lokasi saat ini.</p>
                    </div>
                    <div className="flex w-full md:w-auto gap-2">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Cari nama atau alamat..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && fetchPois()}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button 
                            onClick={handleDeleteAll}
                            className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-bold flex items-center border border-red-100"
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Kosongkan
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Nama Lokasi</th>
                                <th className="px-6 py-4">Alamat</th>
                                <th className="px-6 py-4">Kategori</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && pois.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                                        <p className="text-slate-500 mt-2">Memuat data...</p>
                                    </td>
                                </tr>
                            ) : pois.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                        Data belum tersedia. Silakan scrape koordinat terlebih dahulu.
                                    </td>
                                </tr>
                            ) : (
                                pois.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                                            <div className="flex items-center text-[10px] text-slate-400 mt-1">
                                                <MapPin className="w-3 h-3 mr-1" /> {item.latitude}, {item.longitude}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                                            {item.address}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleDelete(item.id, item.name)}
                                                className="text-slate-300 hover:text-red-500 p-2 transition-colors"
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
            </div>

            {/* Manual Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">Tambah Alamat Manual</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lokasi</label>
                                <input
                                    type="text"
                                    required
                                    value={manualPoi.name}
                                    onChange={(e) => setManualPoi({ ...manualPoi, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="Contoh: Masjid Agung Bangko"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Lengkap</label>
                                <textarea
                                    required
                                    value={manualPoi.address}
                                    onChange={(e) => setManualPoi({ ...manualPoi, address: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    rows={3}
                                    placeholder="Jl. Merdeka No. 123..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                                    <input
                                        type="text"
                                        required
                                        value={manualPoi.latitude}
                                        onChange={(e) => setManualPoi({ ...manualPoi, latitude: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        placeholder="-1.488"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                                    <input
                                        type="text"
                                        required
                                        value={manualPoi.longitude}
                                        onChange={(e) => setManualPoi({ ...manualPoi, longitude: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        placeholder="102.433"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                                <input
                                    type="text"
                                    value={manualPoi.category}
                                    onChange={(e) => setManualPoi({ ...manualPoi, category: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="umum, sekolah, kantor..."
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingManual}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-70"
                                >
                                    {isSubmittingManual ? (
                                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Menyimpan</>
                                    ) : (
                                        'Simpan Lokasi'
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
