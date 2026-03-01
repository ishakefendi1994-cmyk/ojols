'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Key, ShieldCheck, ShieldAlert, Plus, Power, Trash2, Lock } from 'lucide-react';

export default function LicensingPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const [licenses, setLicenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [showAddForm, setShowAddForm] = useState(false);
    const [newLicense, setNewLicense] = useState({
        license_key: '',
        client_name: '',
        domain_url: '',
        bundle_id: ''
    });

    // Password pengaman kedua (Idealnya simpan di .env)
    const MASTER_PASSWORD = 'adminojekku123';

    const [tokens, setTokens] = useState<any[]>([]);
    const [tokenLoading, setTokenLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            fetchLicenses();
            fetchTokens();
        }
    }, [isAuthenticated]);

    async function fetchLicenses() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/licensing/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'fetch_licenses' })
            });
            const { data } = await res.json();
            setLicenses(data || []);
        } catch (e) {
            console.error('Fetch error:', e);
        }
        setLoading(false);
    }

    async function fetchTokens() {
        setTokenLoading(true);
        try {
            const res = await fetch('/api/admin/licensing/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'fetch_tokens' })
            });
            const { data } = await res.json();
            setTokens(data || []);
        } catch (e) {
            console.error('Fetch error:', e);
        }
        setTokenLoading(false);
    }

    const generateInviteToken = async () => {
        try {
            const res = await fetch('/api/admin/licensing/create-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!res.ok) {
                const data = await res.json();
                alert(`Gagal buat token: ${data.error}`);
                return;
            }

            fetchTokens();
        } catch (err: any) {
            console.error("Critical Error:", err);
            alert("Terjadi kesalahan sistem: " + err.message);
        }
    };

    const deleteToken = async (id: string) => {
        await fetch('/api/admin/licensing/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_token', data: { id } })
        });
        fetchTokens();
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === MASTER_PASSWORD) {
            setIsAuthenticated(true);
            setError('');
        } else {
            setError('Password Master Salah!');
        }
    };

    const handleAddLicense = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/admin/licensing/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add_license', data: { license: newLicense } })
        });

        if (res.ok) {
            setNewLicense({ license_key: '', client_name: '', domain_url: '', bundle_id: '' });
            setShowAddForm(false);
            fetchLicenses();
        } else {
            const err = await res.json();
            alert('Gagal menambah lisensi: ' + err.error);
        }
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        await fetch('/api/admin/licensing/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle_license', data: { id, currentStatus } })
        });
        fetchLicenses();
    };

    const deleteLicense = async (id: string) => {
        if (confirm('Yakin ingin menghapus lisensi ini?')) {
            await fetch('/api/admin/licensing/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_license', data: { id } })
            });
            fetchLicenses();
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-gray-100">
                    <div className="flex flex-col items-center mb-6">
                        <div className="bg-red-100 p-4 rounded-full mb-4">
                            <Lock className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">Area Sangat Rahasia</h1>
                        <p className="text-gray-500 text-sm mt-2 text-center">
                            Masukkan Password Master untuk mengelola lisensi script OjekKu.
                        </p>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                            placeholder="Password Master"
                            autoFocus
                        />
                        {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
                        <button
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center"
                        >
                            <ShieldCheck className="w-5 h-5 mr-2" />
                            Buka Gembok
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                        <Key className="w-8 h-8 mr-3 text-blue-600" />
                        License & SaaS Master
                    </h1>
                    <p className="text-gray-500">Kendalikan akses script yang sudah kamu jual ke pembeli.</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={generateInviteToken}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Buat Activation Token
                    </button>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Manual License
                    </button>
                </div>
            </div>

            {/* Token Section */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-4 bg-purple-50 border-b flex justify-between items-center">
                    <h3 className="font-bold text-purple-800 flex items-center">
                        <ShieldCheck className="w-5 h-5 mr-2" />
                        Activation Tokens (Single-Use)
                    </h3>
                    <span className="text-xs text-purple-600 font-medium italic">Kasih kode ini ke pembeli supaya mereka bisa daftar sendiri.</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-6 py-3">Token</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Dibuat</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {tokens.map((t) => (
                                <tr key={t.id} className="text-sm">
                                    <td className="px-6 py-3 font-mono font-bold text-purple-600">{t.token}</td>
                                    <td className="px-6 py-3">
                                        {t.is_used ? (
                                            <span className="text-gray-400 line-through">Sudah Digunakan</span>
                                        ) : (
                                            <span className="text-green-600 font-bold">Ready to Use</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-gray-400">{new Date(t.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-3 text-right">
                                        <button onClick={() => deleteToken(t.id)} className="text-red-400 hover:text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {tokenLoading && <p className="p-4 text-center text-gray-400">Loading tokens...</p>}
                </div>
            </div>

            {showAddForm && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
                    <h2 className="font-bold mb-4">Generate Key Baru</h2>
                    <form onSubmit={handleAddLicense} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            placeholder="License Key (Contoh: OJK-USER-001)"
                            className="px-4 py-2 border rounded-lg"
                            value={newLicense.license_key}
                            onChange={(e) => setNewLicense({ ...newLicense, license_key: e.target.value })}
                            required
                        />
                        <input
                            placeholder="Nama Pembeli"
                            className="px-4 py-2 border rounded-lg"
                            value={newLicense.client_name}
                            onChange={(e) => setNewLicense({ ...newLicense, client_name: e.target.value })}
                            required
                        />
                        <input
                            placeholder="Domain (Contoh: pembeli.vercel.app)"
                            className="px-4 py-2 border rounded-lg"
                            value={newLicense.domain_url}
                            onChange={(e) => setNewLicense({ ...newLicense, domain_url: e.target.value })}
                        />
                        <input
                            placeholder="Bundle ID App (Contoh: com.ojekku.pembeli)"
                            className="px-4 py-2 border rounded-lg"
                            value={newLicense.bundle_id}
                            onChange={(e) => setNewLicense({ ...newLicense, bundle_id: e.target.value })}
                        />
                        <button type="submit" className="md:col-span-2 bg-blue-600 text-white py-2 rounded-lg font-bold">
                            Simpan ke Database Pusat
                        </button>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-bold text-sm text-gray-700">License Key</th>
                            <th className="px-6 py-4 font-bold text-sm text-gray-700">Pembeli</th>
                            <th className="px-6 py-4 font-bold text-sm text-gray-700">Domain / App ID</th>
                            <th className="px-6 py-4 font-bold text-sm text-gray-700">Status</th>
                            <th className="px-6 py-4 font-bold text-sm text-gray-700 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {licenses.map((lic) => (
                            <tr key={lic.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-mono text-sm">{lic.license_key}</td>
                                <td className="px-6 py-4 text-sm font-medium">{lic.client_name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <div className="truncate max-w-xs">{lic.domain_url || '-'}</div>
                                    <div className="text-xs text-blue-500">{lic.bundle_id}</div>
                                </td>
                                <td className="px-6 py-4">
                                    {lic.status === 'ACTIVE' ? (
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center w-max">
                                            <ShieldCheck className="w-3 h-3 mr-1" /> AKTIF
                                        </span>
                                    ) : (
                                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center w-max">
                                            <ShieldAlert className="w-3 h-3 mr-1" /> SUSPENDED
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                        onClick={() => toggleStatus(lic.id, lic.status)}
                                        title={lic.status === 'ACTIVE' ? 'Matikan Lisensi' : 'Hidupkan Lisensi'}
                                        className={`p-2 rounded-lg transition-colors ${lic.status === 'ACTIVE' ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                                    >
                                        <Power className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => deleteLicense(lic.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {loading && <div className="p-8 text-center text-gray-500">Memuat data lisensi...</div>}
                {!loading && licenses.length === 0 && (
                    <div className="p-12 text-center text-gray-400">Belum ada lisensi yang dibuat.</div>
                )}
            </div>
        </div>
    );
}
