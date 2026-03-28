'use client';

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, MessageSquare, ShieldCheck, ShieldAlert, LogOut, Loader2, Send, Users as UsersIcon, Settings2, Info } from 'lucide-react';

type Tab = 'status' | 'blast';

export default function WhatsAppDashboardPage() {
    const [activeTab, setActiveTab] = useState<Tab>('status');
    const [qr, setQr] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('Initializing');
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [loading, setLoading] = useState(true);

    // Blast States
    const [users, setUsers] = useState<any[]>([]);
    const [targetRole, setTargetRole] = useState<string>('ALL');
    const [blastMessage, setBlastMessage] = useState<string>('');
    const [isBlasting, setIsBlasting] = useState(false);
    const [blastProgress, setBlastProgress] = useState({ current: 0, total: 0, success: 0, fail: 0 });
    const [delay, setDelay] = useState(2000); // 2 seconds delay

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/whatsapp/status');
            const data = await res.json();
            
            if (!res.ok || data.error) {
                setStatus('Service Down');
                setQr(null);
            } else {
                setQr(data.qr);
                setStatus(data.message || (data.qr ? 'Pending Scan' : (data.id ? 'Connected' : 'Disconnected')));
            }
            setLastUpdated(new Date());
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch WA status:", err);
            setStatus('Service Down');
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users');
            const result = await res.json();
            if (result.success) setUsers(result.data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        }
    };

    const handleLogout = async () => {
        if (!confirm('Apakah Anda yakin ingin memutuskan koneksi WhatsApp?')) return;
        try {
            await fetch('/api/whatsapp/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            fetchStatus();
        } catch (err) {
            alert('Gagal disconnect');
        }
    };

    const startBlast = async () => {
        const recipients = targetRole === 'ALL' ? users : users.filter(u => u.role === targetRole);
        const filteredRecipients = recipients.filter(u => u.phone_number);

        if (filteredRecipients.length === 0) return alert('Tidak ada target dengan nomor HP valid');
        if (!blastMessage) return alert('Pesan tidak boleh kosong');
        if (!confirm(`Kirim pesan ke ${filteredRecipients.length} user?`)) return;

        setIsBlasting(true);
        setBlastProgress({ current: 0, total: filteredRecipients.length, success: 0, fail: 0 });

        for (let i = 0; i < filteredRecipients.length; i++) {
            const user = filteredRecipients[i];
            
            // Re-check status before each send
            const res = await fetch('/api/whatsapp/status');
            const data = await res.json();
            if (!data.qr && data.message !== 'Connected' && !data.id) {
               // If not connected, stop
               // (Baileys might have disconnected)
            }

            try {
                const sendRes = await fetch('/api/whatsapp/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: user.phone_number,
                        message: blastMessage.replace('{name}', user.full_name)
                    })
                });

                if (sendRes.ok) {
                    setBlastProgress(prev => ({ ...prev, current: i + 1, success: prev.success + 1 }));
                } else {
                    setBlastProgress(prev => ({ ...prev, current: i + 1, fail: prev.fail + 1 }));
                }
            } catch (err) {
                setBlastProgress(prev => ({ ...prev, current: i + 1, fail: prev.fail + 1 }));
            }

            // Wait for delay
            if (i < filteredRecipients.length - 1) {
                await new Promise(r => setTimeout(r, delay));
            }
        }

        setIsBlasting(false);
        alert(`Blast Selesai! Berhasil: ${blastProgress.success}, Gagal: ${blastProgress.fail}`);
    };

    useEffect(() => {
        fetchStatus();
        fetchUsers();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="text-purple-600" />
                        WhatsApp Server
                    </h1>
                    <p className="text-gray-500">Kelola koneksi dan kirim pesan massal</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-8 w-fit">
                <button 
                    onClick={() => setActiveTab('status')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'status' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Status & Koneksi
                </button>
                <button 
                    onClick={() => setActiveTab('blast')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'blast' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    WA Blast (Massal)
                </button>
            </div>

            {activeTab === 'status' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status Card */}
                    <div className="relative bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[350px]">
                        <button 
                            onClick={fetchStatus}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        
                        <div className="mb-6">
                            {status === 'Connected' ? (
                                <div className="bg-green-100 p-6 rounded-full ring-8 ring-green-50">
                                    <ShieldCheck className="w-16 h-16 text-green-600" />
                                </div>
                            ) : (
                                <div className="bg-amber-100 p-6 rounded-full ring-8 ring-amber-50">
                                    <ShieldAlert className="w-16 h-16 text-amber-600" />
                                </div>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold mb-1">{status}</h2>
                        <p className="text-sm text-gray-400 mb-8 font-mono">
                            Update: {lastUpdated.toLocaleTimeString()}
                        </p>
                        
                        {status === 'Connected' && (
                            <button 
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm font-semibold"
                            >
                                <LogOut size={18} />
                                Putuskan Koneksi HP
                            </button>
                        )}
                    </div>

                    {/* QR Card */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[350px]">
                        <h3 className="font-bold text-center mb-6 flex items-center justify-center gap-2">
                            <Settings2 className="w-4 h-4" />
                            Pairing Device
                        </h3>
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl p-6 h-full min-h-[250px]">
                            {loading ? (
                                <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
                            ) : qr ? (
                                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                                    <QRCodeSVG value={qr} size={200} />
                                    <p className="text-xs text-center mt-6 text-gray-500 bg-gray-50 py-2 rounded-lg">Scan QR Code ini lewat WhatsApp</p>
                                </div>
                            ) : status === 'Connected' ? (
                                <div className="text-center">
                                    <p className="text-green-500 font-bold text-xl mb-2">🎉 Terhubung!</p>
                                    <p className="text-sm text-gray-400">Server WhatsApp aktif dan siap digunakan.</p>
                                </div>
                            ) : (
                                <div className="text-center px-6">
                                    <Loader2 className="w-8 h-8 animate-spin text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-400 text-sm italic">Menunggu respon server...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Blast Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Send className="w-5 h-5 text-purple-600" />
                                Buat Pesan Massal
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pilih Penerima</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {['ALL', 'USER', 'DRIVER', 'MERCHANT'].map(role => (
                                            <button
                                                key={role}
                                                onClick={() => setTargetRole(role)}
                                                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${targetRole === role ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-100 text-gray-600 hover:border-purple-200'}`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Isi Pesan</label>
                                    <textarea 
                                        value={blastMessage}
                                        onChange={(e) => setBlastMessage(e.target.value)}
                                        rows={6}
                                        placeholder="Halo {name}, ini info terbaru dari OjekKu..."
                                        className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none resize-none"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                                        <Info size={12} /> Gunakan <b>{'{name}'}</b> untuk memanggil nama user secara otomatis.
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 py-4 border-t border-gray-50">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-400 mb-1 caps">Jeda (Milidetik)</label>
                                        <input 
                                            type="number" 
                                            value={delay} 
                                            onChange={(e) => setDelay(parseInt(e.target.value))}
                                            className="w-full p-2 rounded-lg border border-gray-200 text-sm font-inter"
                                        />
                                    </div>
                                    <button 
                                        disabled={isBlasting || status !== 'Connected'}
                                        onClick={startBlast}
                                        className={`flex-1 h-12 flex items-center justify-center gap-2 rounded-xl text-white font-bold shadow-lg transition-all ${isBlasting || status !== 'Connected' ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-[1.02]'}`}
                                    >
                                        {isBlasting ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Send size={18} />
                                        )}
                                        {isBlasting ? 'Sedang Mengirim...' : 'Mulai Blast'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {isBlasting && (
                            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-purple-100 animate-pulse">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm font-bold text-purple-600">Progres Pengiriman:</span>
                                    <span className="text-sm font-mono">{blastProgress.current} / {blastProgress.total}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                    <div 
                                        className="bg-purple-600 h-full transition-all duration-500"
                                        style={{ width: `${(blastProgress.current / blastProgress.total) * 100}%` }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                                        <p className="text-[10px] text-green-600 font-bold">BERHASIL</p>
                                        <p className="text-xl font-bold text-green-700">{blastProgress.success}</p>
                                    </div>
                                    <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                                        <p className="text-[10px] text-red-600 font-bold">GAGAL / TIDAK ADA WA</p>
                                        <p className="text-xl font-bold text-red-700">{blastProgress.fail}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h4 className="font-bold flex items-center gap-2 mb-4">
                                <UsersIcon className="w-4 h-4 text-gray-400" />
                                Target Populasi
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Total Penguna:</span>
                                    <span className="font-bold">{users.length}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Target ({targetRole}):</span>
                                    <span className="font-bold text-purple-600">
                                        {targetRole === 'ALL' ? users.length : users.filter(u => u.role === targetRole).length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                            <div className="flex gap-3">
                                <Info className="text-amber-600 shrink-0" size={20} />
                                <div>
                                    <h4 className="font-bold text-amber-900 text-sm">Peringatan Keamanan</h4>
                                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                                        Gunakan jeda minimal 2000ms untuk menghindari blokir dari WhatsApp. Jangan mengirim spam dalam jumlah besar sekaligus.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
