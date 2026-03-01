'use client';

import { useState } from 'react';
import { Key, ShieldCheck, Globe, Package, CheckCircle, Clipboard } from 'lucide-react';

export default function MemberRegisterPage() {
    const [step, setStep] = useState(1); // 1: Token, 2: Info, 3: Success
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        client_name: '',
        domain_url: '',
        bundle_id: '',
        package_name: 'Standard'
    });

    const [generatedKey, setGeneratedKey] = useState('');

    const verifyToken = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/licensing/verify-token', {
                method: 'POST',
                body: JSON.stringify({ token }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                setStep(2);
            } else {
                const data = await res.json();
                setError(data.error || 'Token tidak valid atau sudah digunakan.');
            }
        } catch (err) {
            setError('Gagal menghubungi server.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/licensing/generate', {
                method: 'POST',
                body: JSON.stringify({ ...formData, token }),
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();
            if (res.ok) {
                setGeneratedKey(data.license_key);
                setStep(3);
            } else {
                setError(data.error || 'Gagal generate lisensi.');
            }
        } catch (err) {
            setError('Terjadi kesalahan sistem.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-6 text-white font-sans">
            <div className="w-full max-w-xl bg-neutral-800 rounded-3xl border border-neutral-700 shadow-2xl p-8 md:p-12 overflow-hidden relative">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl -mr-16 -mt-16 rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 blur-3xl -ml-16 -mb-16 rounded-full"></div>

                {step === 1 && (
                    <div className="space-y-6 relative">
                        <div className="bg-neutral-700 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-neutral-600">
                            <Key className="w-8 h-8 text-green-400" />
                        </div>
                        <h1 className="text-3xl font-bold font-display tracking-tight">OjekKu Activation</h1>
                        <p className="text-neutral-400">Masukkan <b>Activation Token</b> yang kamu dapatkan dari admin untuk memulai.</p>

                        <form onSubmit={verifyToken} className="space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Enter Activation Token"
                                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-6 py-4 outline-none focus:ring-2 focus:ring-green-500 transition-all text-center tracking-[4px] uppercase font-bold"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                                    required
                                />
                            </div>
                            {error && <p className="text-red-400 text-sm font-medium">{error}</p>}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-green-500/20"
                            >
                                {loading ? 'Memverifikasi...' : 'Lanjutkan Verifikasi'}
                            </button>
                        </form>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 relative">
                        <div className="flex items-center space-x-4 mb-4">
                            <ShieldCheck className="w-6 h-6 text-green-400" />
                            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Identity Verified</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Setup License</h1>
                        <p className="text-neutral-400 italic">"Gunakan data asli untuk kemudahan support nantinya."</p>

                        <form onSubmit={handleGenerate} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-neutral-400">Nama Lengkap / Instansi</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Contoh: PT Ojek Mandiri"
                                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 outline-none focus:border-green-500"
                                        value={formData.client_name}
                                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-neutral-400 flex items-center"><Globe className="w-3 h-3 mr-1" /> Domain URL</label>
                                    <input
                                        placeholder="ojek.com"
                                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 outline-none"
                                        value={formData.domain_url}
                                        onChange={(e) => setFormData({ ...formData, domain_url: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-neutral-400 flex items-center"><Package className="w-3 h-3 mr-1" /> Bundle ID</label>
                                    <input
                                        placeholder="com.ojekku.client"
                                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 outline-none"
                                        value={formData.bundle_id}
                                        onChange={(e) => setFormData({ ...formData, bundle_id: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-neutral-400">Pilih Paket</label>
                                <select
                                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 outline-none"
                                    value={formData.package_name}
                                    onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                                >
                                    <option value="Standard">Standard (Basic Features)</option>
                                    <option value="Professional">Professional (Full Features)</option>
                                    <option value="Enterprise">Enterprise (Custom)</option>
                                </select>
                            </div>

                            {error && <p className="text-red-400 text-sm font-medium">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 text-white font-bold py-4 rounded-xl shadow-lg mt-4"
                            >
                                {loading ? 'Generating...' : 'Generate License Key'}
                            </button>
                        </form>
                    </div>
                )}

                {step === 3 && (
                    <div className="text-center space-y-8 py-4 relative">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight">Activation Successful!</h1>
                            <p className="text-neutral-400">Lisensi kamu sudah terdaftar secara resmi di server kami.</p>
                        </div>

                        <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-700 relative group">
                            <label className="absolute -top-3 left-6 px-3 bg-neutral-800 text-[10px] font-bold text-green-500 uppercase tracking-widest border border-neutral-700 rounded-full">Your License Key</label>
                            <div className="text-2xl font-mono font-bold tracking-[4px] py-4 text-green-400 break-all select-all">
                                {generatedKey}
                            </div>
                            <button
                                onClick={() => navigator.clipboard.writeText(generatedKey)}
                                className="mt-2 flex items-center justify-center mx-auto text-xs text-neutral-500 hover:text-white transition-colors"
                            >
                                <Clipboard className="w-3 h-3 mr-1" /> Copy Key
                            </button>
                        </div>

                        <div className="text-sm text-neutral-500 leading-relaxed max-w-sm mx-auto">
                            "Simpan kode ini baik-baik. Gunakan pada file .env aplikasi kamu."
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
