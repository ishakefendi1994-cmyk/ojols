'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit, Trash2, CheckCircle, XCircle, Loader2, Shield, User as UserIcon, Car, Store, MapPin } from 'lucide-react';
import MapPicker from '@/components/MapPicker';

interface UserProfile {
    id: string;
    full_name: string;
    phone_number: string | null;
    role: 'CUSTOMER' | 'DRIVER' | 'MERCHANT' | 'ADMIN';
    vehicle_plate_number: string | null;
    vehicle_type: string | null;
    is_online: boolean;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    merchant_category: string | null;
    merchant_type: string | null;
    is_open_24h: boolean;
    created_at: string;
}

interface CategoryType {
    id: string;
    name: string;
    service_type: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [categories, setCategories] = useState<CategoryType[]>([]);
    const [vehicleTypes, setVehicleTypes] = useState<{type_code: string, display_name: string}[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterRole, setFilterRole] = useState<string>('ALL');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        phone_number: '',
        role: 'CUSTOMER',
        vehicle_plate_number: '',
        vehicle_type: '',
        is_online: false,
        address: '',
        latitude: '',
        longitude: '',
        merchant_category: '',
        merchant_type: '',
        is_open_24h: false
    });

    useEffect(() => {
        fetchUsers();
    }, [filterRole]);

    useEffect(() => {
        fetchCategories();
        fetchVehicleTypes();
    }, []);

    const fetchVehicleTypes = async () => {
        try {
            const { data, error } = await supabase.from('vehicle_types').select('type_code, display_name');
            if (error) throw error;
            setVehicleTypes(data || []);
        } catch (error) {
            console.error('Error fetching vehicle types:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const result = await res.json();
            if (res.ok) {
                setCategories(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const url = filterRole === 'ALL' ? '/api/users' : `/api/users?role=${filterRole}`;
            const res = await fetch(url);
            const result = await res.json();

            if (!res.ok) throw new Error(result.error);
            setUsers(result.data || []);
        } catch (error: any) {
            console.error('Error fetching users:', error);
            alert(`Gagal mengambil data pengguna: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user: UserProfile) => {
        setEditingId(user.id);
        setFormData({
            email: '', // Can't edit email easily via profile
            password: '', // Can't edit password here
            full_name: user.full_name || '',
            phone_number: user.phone_number || '',
            role: user.role || 'CUSTOMER',
            vehicle_plate_number: user.vehicle_plate_number || '',
            vehicle_type: user.vehicle_type || '',
            is_online: user.is_online || false,
            address: user.address || '',
            latitude: user.latitude?.toString() || '',
            longitude: user.longitude?.toString() || '',
            merchant_category: user.merchant_category || '',
            merchant_type: user.merchant_type || '',
            is_open_24h: user.is_open_24h || false
        });
        setIsModalOpen(true);
    };

    const handleOpenCreateModal = () => {
        setEditingId(null);
        setFormData({
            email: '',
            password: '',
            full_name: '',
            phone_number: '',
            role: 'CUSTOMER',
            vehicle_plate_number: '',
            vehicle_type: '',
            is_online: false,
            address: '',
            latitude: '',
            longitude: '',
            merchant_category: '',
            merchant_type: '',
            is_open_24h: false
        });
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
            // Bersihkan data null jika string kosong
            const submitData = {
                ...formData,
                phone_number: formData.phone_number.trim() === '' ? null : formData.phone_number,
                vehicle_plate_number: formData.vehicle_plate_number.trim() === '' ? null : formData.vehicle_plate_number,
                vehicle_type: formData.vehicle_type.trim() === '' ? null : formData.vehicle_type,
                address: formData.address.trim() === '' ? null : formData.address,
                latitude: formData.latitude === '' ? null : parseFloat(formData.latitude),
                longitude: formData.longitude === '' ? null : parseFloat(formData.longitude),
                merchant_category: formData.merchant_category.trim() === '' ? null : formData.merchant_category,
                merchant_type: formData.merchant_type.trim() === '' ? null : formData.merchant_type,
            };

            const action = editingId ? 'UPDATE' : 'CREATE';

            // Only send auth fields if creating.
            let payloadData: any = { ...submitData };
            if (action === 'UPDATE') {
                delete payloadData.email;
                delete payloadData.password;
            }

            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    id: editingId,
                    userData: payloadData
                })
            });

            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || 'Gagal update.');

            handleCloseModal();
            fetchUsers();
        } catch (error: any) {
            console.error('Error saving user:', error);
            alert(`Gagal menyimpan data: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`TINDAKAN BERBAHAYA!\nApakah Anda yakin ingin MENGHAPUS secara PERMANEN akun pengguna "${name}"?\nData dompet & transaksi mereka juga akan hilang!`)) return;

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE', id })
            });

            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || 'Gagal hapus.');

            fetchUsers();
        } catch (error: any) {
            console.error('Error deleting user:', error);
            alert(`Gagal menghapus pengguna: ${error.message}`);
        }
    };

    const renderRoleBadge = (role: string) => {
        switch (role) {
            case 'ADMIN': return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800"><Shield className="w-3 h-3 mr-1" /> ADMIN</span>;
            case 'DRIVER': return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800"><Car className="w-3 h-3 mr-1" /> DRIVER</span>;
            case 'MERCHANT': return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800"><Store className="w-3 h-3 mr-1" /> MERCHANT</span>;
            default: return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800"><UserIcon className="w-3 h-3 mr-1" /> CUSTOMER</span>;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <UserIcon className="w-6 h-6 text-blue-600" />
                        Manajemen Pengguna
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Kelola data Pelanggan, Driver, dan Merchant</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Filters */}
                    <div className="hidden md:flex bg-slate-100 p-1 rounded-lg">
                        {['ALL', 'CUSTOMER', 'DRIVER', 'MERCHANT', 'ADMIN'].map((role) => (
                            <button
                                key={role}
                                onClick={() => setFilterRole(role)}
                                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${filterRole === role
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                {role === 'ALL' ? 'Semua' : role}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleOpenCreateModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors text-sm font-medium whitespace-nowrap"
                    >
                        <UserIcon className="w-4 h-4 mr-2" />
                        Tambah User
                    </button>
                </div>
            </div>

            {/* Mobile Filters */}
            <div className="flex md:hidden bg-slate-100 p-2 overflow-x-auto">
                {['ALL', 'CUSTOMER', 'DRIVER', 'MERCHANT', 'ADMIN'].map((role) => (
                    <button
                        key={role}
                        onClick={() => setFilterRole(role)}
                        className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${filterRole === role
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        {role === 'ALL' ? 'Semua' : role}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                            <th className="px-6 py-4 font-semibold text-slate-600">Nama Pengguna</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Role</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Detail Info</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-center">Status Driver</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                                    <p className="text-sm text-slate-500 mt-2">Memuat data pengguna...</p>
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                    Tidak ada data pengguna yang ditemukan.
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-800">{user.full_name}</div>
                                        <div className="text-xs text-slate-400 mt-0.5" title={user.id}>ID: {user.id.substring(0, 8)}...</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {renderRoleBadge(user.role)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-600">
                                            {user.phone_number ? `📞 ${user.phone_number}` : <span className="text-slate-400 italic">No HP Kosong</span>}
                                        </div>
                                        {user.role === 'DRIVER' && (
                                            <div className="text-xs text-blue-600 mt-1 font-medium bg-blue-50 inline-block px-2 py-0.5 rounded border border-blue-100">
                                                Mobil/Motor: {user.vehicle_type || 'Biasa'} | Plat: {user.vehicle_plate_number || 'Belum diatur'}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {user.role === 'DRIVER' ? (
                                            user.is_online ? (
                                                <span className="inline-flex items-center text-xs font-medium text-green-600">
                                                    <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span> Aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center text-xs font-medium text-slate-400">
                                                    <span className="w-2 h-2 rounded-full bg-slate-300 mr-1.5"></span> Offline
                                                </span>
                                            )
                                        ) : (
                                            <span className="text-slate-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleOpenModal(user)}
                                            className="text-slate-400 hover:text-blue-600 p-2 transition-colors inline-block"
                                            title="Edit Profil"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id, user.full_name)}
                                            className="text-slate-400 hover:text-red-600 p-2 transition-colors inline-block ml-1"
                                            title="Hapus Permanen"
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

            {/* Modal Form Edit */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-lg text-slate-800">
                                    {editingId ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                                </h3>
                                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">

                                {!editingId && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-50 p-4 rounded-lg border border-orange-100 mb-2">
                                        <div className="col-span-full">
                                            <p className="text-xs font-semibold text-orange-800 mb-2">CREDENTIAL LOGIN (Hanya saat pembuatan awal)</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                            <input
                                                type="email"
                                                required={!editingId}
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                            <input
                                                type="text"
                                                required={!editingId}
                                                minLength={6}
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Handphone</label>
                                    <input
                                        type="text"
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="Contoh: 08123456789"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Role Utama</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                    >
                                        <option value="CUSTOMER">PELANGGAN (Customer)</option>
                                        <option value="DRIVER">MITRA DRIVER</option>
                                        <option value="MERCHANT">MITRA MERCHANT (Toko Food)</option>
                                        <option value="ADMIN">ADMINISTRATOR</option>
                                    </select>
                                </div>

                                {/* Driver Specific Fields */}
                                {formData.role === 'DRIVER' && (
                                    <div className="bg-blue-50 p-4 rounded-lg space-y-3 border border-blue-100 mt-2">
                                        <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Atribut Mitra Driver</p>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Kendaraan</label>
                                            <select
                                                required={formData.role === 'DRIVER'}
                                                value={formData.vehicle_type}
                                                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                            >
                                                <option value="" disabled>Pilih Tipe Kendaraan</option>
                                                <option value="MOTOR">MOTOR (Default)</option>
                                                <option value="MOBIL">MOBIL (Default)</option>
                                                {vehicleTypes.map(vt => (
                                                    <option key={vt.type_code} value={vt.type_code}>
                                                        {vt.display_name} ({vt.type_code})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Plat Kendaraan</label>
                                            <input
                                                type="text"
                                                value={formData.vehicle_plate_number}
                                                onChange={(e) => setFormData({ ...formData, vehicle_plate_number: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                placeholder="B 1234 ABC"
                                            />
                                        </div>

                                        <div className="flex items-center pt-1">
                                            <input
                                                type="checkbox"
                                                id="isOnline"
                                                checked={formData.is_online}
                                                onChange={(e) => setFormData({ ...formData, is_online: e.target.checked })}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                            />
                                            <label htmlFor="isOnline" className="ml-2 text-sm font-medium text-slate-700 cursor-pointer">
                                                Status Aktif (Tapping Orderan)
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {formData.role === 'MERCHANT' && (
                                    <div className="bg-purple-50 p-4 rounded-lg space-y-3 border border-purple-100 mt-2">
                                        <p className="text-xs font-semibold text-purple-800 uppercase tracking-wider">Atribut Mitra Merchant</p>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Kategori Toko & Layanan</label>
                                            <select
                                                required
                                                value={formData.merchant_category}
                                                onChange={(e) => {
                                                    const selectedName = e.target.value;
                                                    const selectedCat = categories.find(c => c.name === selectedName);
                                                    setFormData({
                                                        ...formData,
                                                        merchant_category: selectedName,
                                                        merchant_type: selectedCat ? selectedCat.service_type : ''
                                                    });
                                                }}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                            >
                                                <option value="" disabled>Pilih Kategori Toko...</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.name}>
                                                        {cat.name} ({cat.service_type.toUpperCase()})
                                                    </option>
                                                ))}
                                            </select>
                                            <span className="text-xs text-slate-500 mt-1 block">Tentukan masuk kategori apa, dan apakah di menu Food atau Shop.</span>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Lengkap (Maps)</label>
                                            <textarea
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                rows={2}
                                                placeholder="Jl. Merdeka No. 10..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-purple-600" />
                                                Pilih Lokasi di Peta
                                            </label>
                                            <MapPicker
                                                lat={formData.latitude ? parseFloat(formData.latitude) : null}
                                                lng={formData.longitude ? parseFloat(formData.longitude) : null}
                                                onLocationSelect={(lat, lng) => setFormData({
                                                    ...formData,
                                                    latitude: lat.toString(),
                                                    longitude: lng.toString()
                                                })}
                                            />
                                            <p className="text-[10px] text-slate-500 mt-1 italic">*Klik pada peta untuk menentukan titik koordinat toko</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={formData.latitude}
                                                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                    placeholder="-6.123"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={formData.longitude}
                                                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                    placeholder="106.123"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center pt-1">
                                            <input
                                                type="checkbox"
                                                id="isOpen24h"
                                                checked={formData.is_open_24h}
                                                onChange={(e) => setFormData({ ...formData, is_open_24h: e.target.checked })}
                                                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
                                            />
                                            <label htmlFor="isOpen24h" className="ml-2 text-sm font-medium text-slate-700 cursor-pointer">
                                                Buka 24 Jam
                                            </label>
                                        </div>
                                    </div>
                                )}

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
                                            'Simpan Perubahan'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
