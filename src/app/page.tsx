'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Menu, X, ChevronRight, 
  Bike, Car as CarIcon, Utensils, Package,
  ShieldCheck, Clock, CreditCard, MapPin,
  Smartphone, AppWindow, Star, Users
} from 'lucide-react';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Monitor scroll for navbar effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const services = [
    { 
      id: 1, 
      title: 'OjekRide', 
      desc: 'Solusi transportasi roda dua tercepat menembus kemacetan kota.', 
      icon: <Bike className="w-8 h-8 text-purple-600" />,
      color: 'bg-purple-100'
    },
    { 
      id: 2, 
      title: 'OjekCar', 
      desc: 'Kenyamanan perjalanan dengan armada mobil yang aman dan bersih.', 
      icon: <CarIcon className="w-8 h-8 text-blue-600" />,
      color: 'bg-blue-100'
    },
    { 
      id: 3, 
      title: 'OjekFood', 
      desc: 'Pesan makanan favorit dari ribuan restoran pilihan, langsung diantar ke pintu.', 
      icon: <Utensils className="w-8 h-8 text-orange-600" />,
      color: 'bg-orange-100'
    },
    { 
      id: 4, 
      title: 'OjekSend', 
      desc: 'Kirim paket atau dokumen secara instan dan aman.', 
      icon: <Package className="w-8 h-8 text-green-600" />,
      color: 'bg-green-100'
    },
  ];

  const benefits = [
    { icon: <ShieldCheck className="w-6 h-6" />, title: 'Aman & Terpercaya', desc: 'Driver kami melalui proses seleksi dan verifikasi yang ketat.' },
    { icon: <Clock className="w-6 h-6" />, title: 'Cepat & Tepat Waktu', desc: 'Sistem algoritma cerdas yang mencarikan driver terdekat dari lokasi Anda.' },
    { icon: <CreditCard className="w-6 h-6" />, title: 'Harga Transparan', desc: 'Tarif sudah pasti sebelum Anda memesan, tanpa biaya tersembunyi.' },
    { icon: <MapPin className="w-6 h-6" />, title: 'Jangkauan Luas', desc: 'Hadir di berbagai kota untuk melayani seluruh lapisan masyarakat.' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-purple-200">
      
      {/* 1. NAVBAR */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-indigo-950/95 backdrop-blur-md shadow-xl py-4 border-b border-indigo-900' : 'bg-indigo-950 py-6 border-b border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:shadow-purple-500/30 transition-shadow">
                OK
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Ojek<span className="text-purple-400">Ku</span>
              </span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#layanan" className="font-medium hover:text-purple-400 transition-colors text-white/90">Layanan</a>
            <a href="#kemitraan" className="font-medium hover:text-purple-400 transition-colors text-white/90">Kemitraan</a>
            <a href="#tentang" className="font-medium hover:text-purple-400 transition-colors text-white/90">Tentang Kami</a>
            
            <Link href="/login">
              <button className="bg-purple-600 text-white hover:bg-purple-500 px-6 py-2.5 rounded-full font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 border border-purple-500">
                Login Admin
              </button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-2xl" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="text-white" />
            ) : (
              <Menu className="text-white" />
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`absolute top-full left-0 w-full bg-white shadow-xl flex flex-col overflow-hidden transition-all duration-300 origin-top ${mobileMenuOpen ? 'max-h-96 py-4' : 'max-h-0 py-0'}`}>
          <a href="#layanan" className="px-6 py-3 text-slate-700 font-medium hover:bg-slate-50" onClick={() => setMobileMenuOpen(false)}>Layanan</a>
          <a href="#kemitraan" className="px-6 py-3 text-slate-700 font-medium hover:bg-slate-50" onClick={() => setMobileMenuOpen(false)}>Kemitraan</a>
          <a href="#tentang" className="px-6 py-3 text-slate-700 font-medium hover:bg-slate-50" onClick={() => setMobileMenuOpen(false)}>Tentang Kami</a>
          <div className="px-6 pt-4 pb-2 border-t mt-2">
            <Link href="/login">
              <button className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold">
                Masuk ke Dashboard
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION - SPLIT SCREEN THEME WITH PURPLE GRADIENT */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
        
        {/* Right Side 50% Background Image for Desktop to prevent stretching/pixelation */}
        <div className="hidden lg:block absolute inset-y-0 right-0 w-1/2 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(/hero-bg.png)' }}
          ></div>
          {/* Subtle overlay so the mockup frame pops out nicely against the busy city background */}
          <div className="absolute inset-0 bg-indigo-950/20"></div>
          {/* Edge gradient to blend seamlessly with the purple left side */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-indigo-950 to-transparent"></div>
        </div>
        
        {/* Mobile Background Image (Visible only on small screens) */}
        <div className="lg:hidden absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-screen"
            style={{ backgroundImage: 'url(/hero-bg.png)' }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/80 via-purple-900/90 to-indigo-950"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center w-full">
          
          <div className="pt-10 lg:pt-0 pr-0 lg:pr-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-purple-100 text-sm font-medium mb-6">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span>Aplikasi No.1 Pilihan Keluarga</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] mb-6 tracking-tight drop-shadow-md">
              Satu Aplikasi,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">
                Berbagai Solusi
              </span>
            </h1>
            
            <p className="text-lg lg:text-xl text-purple-100 mb-10 max-w-lg leading-relaxed drop-shadow-sm">
              Mulai dari antar jemput, pesan makanan, hingga kirim barang instan. Semuanya jadi lebih mudah dan cepat bersama OjekKu.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="flex items-center justify-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-100 hover:scale-[1.02] hover:shadow-xl transition-all">
                <Smartphone className="w-6 h-6" />
                Download App User
              </button>
              <button className="flex items-center justify-center gap-3 bg-purple-600/30 text-white border-2 border-purple-500/40 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-purple-600/50 backdrop-blur-sm transition-all group shadow-md">
                Gabung Mitra 
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-4">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-slate-800 bg-slate-300 overflow-hidden shadow-lg">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                  </div>
                ))}
              </div>
              <div className="text-purple-200 text-sm drop-shadow-sm">
                Bergabunglah dengan <strong className="text-white">100K+</strong><br/>Pengguna aktif lainnya
              </div>
            </div>
          </div>
          
          <div className="hidden lg:flex justify-center relative">
            {/* Mockup Frame Concept */}
            <div className="relative w-[320px] h-[650px] bg-slate-800 rounded-[50px] border-[12px] border-slate-900 shadow-2xl overflow-hidden shadow-purple-900/50 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500 z-10 bg-white">
              {/* Actual App Screenshot provided by user */}
              <img 
                src="/app-mockup.jpg" 
                alt="OjekKu App Interface" 
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  // Fallback in case they haven't put the image yet
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1616421590466-99b0c61839e9?q=80&w=600&auto=format&fit=crop';
                }}
              />
            </div>
            
            {/* Decorators */}
            <div className="absolute top-20 right-10 bg-white p-4 rounded-2xl shadow-xl shadow-blue-900/20 transform rotate-12 z-20 animate-bounce" style={{animationDuration: '3s'}}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">Aman & Nyaman</div>
                  <div className="text-xs text-slate-500">Driver terverifikasi</div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Wave svg bottom */}
        <div className="absolute bottom-0 w-full z-10 w-[200%] md:w-full overflow-hidden leading-[0]">
           <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[150%] md:w-full h-auto text-slate-50 relative right-0" preserveAspectRatio="none">
              <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="currentColor"/>
           </svg>
        </div>
      </section>

      {/* 3. LAYANAN KAMI */}
      <section id="layanan" className="py-24 relative z-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-purple-600 font-bold tracking-wider uppercase text-sm mb-3">Layanan Kami</h2>
            <h3 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">Kami siap memenuhi<br/>kebutuhan harian Anda</h3>
            <p className="text-slate-600">Terjebak macet? Lapar? Butuh kirim barang mendadak? Serahkan semuanya pada aplikasi OjekKu.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group cursor-pointer">
                <div className={`w-16 h-16 ${service.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {service.icon}
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-3">{service.title}</h4>
                <p className="text-slate-600 text-sm leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. MENGAPA KAMI */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-100 to-blue-50 rounded-3xl transform -rotate-3 blur-[2px]"></div>
            <img src="https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=2070&auto=format&fit=crop" alt="Motorcycle Rider" className="rounded-3xl relative z-10 shadow-2xl object-cover h-[500px] w-full" />
            
            {/* Overlay badge */}
            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl z-20 border border-slate-50 flex items-center gap-4 animate-pulse" style={{animationDuration: '4s'}}>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-3xl font-black text-slate-800">5M+</div>
                <div className="text-sm text-slate-500 font-medium">Perjalanan Selesai</div>
              </div>
            </div>
          </div>
          
          <div className="order-1 lg:order-2">
            <h2 className="text-purple-600 font-bold tracking-wider uppercase text-sm mb-3">Keunggulan</h2>
            <h3 className="text-3xl md:text-4xl font-black text-slate-800 mb-6 leading-tight">Berkomitmen penuh untuk kenyamanan Anda</h3>
            <p className="text-slate-600 mb-10 text-lg">Inovasi dan teknologi kami ciptakan untuk memberikan pengalaman super mulus setiap kali Anda membuka aplikasi.</p>
            
            <div className="space-y-6">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                    {benefit.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 mb-1">{benefit.title}</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. GABUNG MITRA */}
      <section id="kemitraan" className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-5xl font-black text-white mb-6">Berkembang Bersama Kami</h3>
            <p className="text-slate-300 max-w-2xl mx-auto text-lg">Tambah pundi-pundi penghasilan Anda dengan waktu yang fleksibel, atau kembangkan bisnis kuliner Anda bersama ratusan ribu pelanggan aktif.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Card Driver */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 lg:p-10 border border-white/20 hover:bg-white/15 transition-colors">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-8">
                <Bike className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-4">Gabung Jadi Driver</h4>
              <p className="text-slate-300 mb-8 leading-relaxed">
                Jadilah Bos untuk diri sendiri. Atur waktu kerja Anda secara bebas dan dapatkan bonus menarik setiap harinya. Pendaftaran gratis dan proses cepat!
              </p>
              <button className="flex items-center gap-2 text-white bg-blue-600 px-6 py-3 justify-center rounded-xl font-bold hover:bg-blue-700 w-full md:w-auto transition-colors">
                Daftar Driver App <ChevronRight className="w-5 h-5"/>
              </button>
            </div>

            {/* Card Merchant */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 lg:p-10 border border-white/20 hover:bg-white/15 transition-colors group">
              <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-8">
                <Utensils className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-4">Gabung Jadi Merchant</h4>
              <p className="text-slate-300 mb-8 leading-relaxed">
                Jangkau lebih banyak pelanggan untuk restoran atau toko Anda. Kami sediakan aplikasi Merchant khusus untuk mengatur pesanan dan menu dengan super gampang.
              </p>
              <button className="flex items-center gap-2 text-white bg-orange-600 px-6 py-3 justify-center rounded-xl font-bold hover:bg-orange-700 w-full md:w-auto transition-colors">
                Daftar Merchant App <ChevronRight className="w-5 h-5"/>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DOWNLOAD CTA */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 py-20 relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-64 h-full bg-white opacity-10 transform skew-x-[-20deg] translate-x-20"></div>
        <div className="absolute top-0 right-32 w-16 h-full bg-white opacity-5 transform skew-x-[-20deg]"></div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-8 leading-tight">
            Tunggu apa lagi? Download aplikasi OjekKu sekarang!
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="flex items-center gap-3 bg-black hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold transition-all w-full sm:w-auto">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M17.523 15.3414C17.523 17.5314 16.3268 19.3414 14.5454 20.3114C13.2515 21.0114 11.2386 21.7314 9.17646 21.7314C7.03031 21.7314 4.88416 20.9414 3.73723 20.1414C2.58331 19.3414 2 18.0614 2 16.6314C2 15.2014 2.80177 13.9114 3.96108 13.1114C5.12115 12.3114 7.27954 11.5314 9.42108 11.5314C11.5626 11.5314 13.5709 12.2814 14.8694 12.9814C16.4811 13.8814 17.523 15.1114 17.523 15.3414ZM11.1274 7.37138V9.75138H7.21854C6.54546 9.75138 6 9.20138 6 8.53138V6.16138H3.34446C2.60208 6.16138 2 5.54138 2 4.79138V2V1C2 0.45 2.45 0 3 0H6C6.55 0 7 0.45 7 1V3.29138H11.1274C11.6774 3.29138 12.1274 3.74138 12.1274 4.29138V6.52138C12.1274 7.04138 11.642 7.37138 11.1274 7.37138ZM11.4589 12.9614C10.7441 12.7214 9.87062 12.5614 8.94938 12.5614C7.94062 12.5614 6.94523 12.7014 6.13677 12.9714V16.8914C6.88369 16.6814 7.854 16.5114 8.874 16.5114C9.91908 16.5114 10.9229 16.6814 11.4589 16.8914V12.9614ZM21.9965 21H18V13.5C18 12.33 17.595 11.19 16.885 10.3C16.175 9.4 15.195 8.84 14.115 8.7C13.435 8.7 12.745 8.97 12.205 9.48C11.535 10.05 11.165 10.89 11.235 11.75V21H7.835C7.835 18.23 7.835 12.87 7.835 12.87C7.835 12.87 8.195 12.35 8.765 12C9.555 11.4 10.615 11.25 11.625 11.41C13.405 11.68 15 12.95 15 14.86V21H11.595V21.14M22 21.05H21.9965V21H22M21.9965 21L21.9965 21.08H21.9965M17.915 5.5C17.915 7.15685 16.5719 8.5 14.915 8.5C13.2581 8.5 11.915 7.15685 11.915 5.5C11.915 3.84315 13.2581 2.5 14.915 2.5C16.5719 2.5 17.915 3.84315 17.915 5.5" /></svg>
              <div className="text-left leading-tight">
                <div className="text-xs text-slate-300 font-medium tracking-wider">GET IT ON</div>
                <div className="text-xl">Google Play</div>
              </div>
            </button>
            <button className="flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-xl font-bold hover:bg-slate-100 transition-all w-full sm:w-auto">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12.87 9.87c.18-2.61 2.37-4.04 2.49-4.13-1.2-1.74-3.07-1.99-3.75-2.02-1.59-.16-3.1.94-3.92.94-.82 0-2.05-.91-3.34-.89-1.71.02-3.29.98-4.17 2.53-1.79 3.09-.46 7.64 1.28 10.16.85 1.23 1.86 2.61 3.19 2.56 1.28-.05 1.77-.82 3.32-.82 1.54 0 2.07.82 3.37.8 1.35-.02 2.22-1.25 3.05-2.47 1.05-1.53 1.48-3.02 1.5-3.1-.03-.02-2.91-1.11-3.02-3.56zm-1.88-5.76C11.69 3.23 12.39 2.1 12.27.9c-1.03.04-2.28.69-3.01 1.53-.65.73-1.24 1.89-1.08 3.07 1.15.09 2.27-.61 2.81-1.39z"/></svg>
              <div className="text-left leading-tight">
                <div className="text-xs text-slate-500 font-medium tracking-wider">Download on the</div>
                <div className="text-xl">App Store</div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2 text-center md:text-left">
            <div className="flex items-center gap-2 mb-6 justify-center md:justify-start">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-black text-sm">
                OK
              </div>
              <span className="text-2xl font-black text-white tracking-tight">OjekKu</span>
            </div>
            <p className="max-w-sm mx-auto md:mx-0 leading-relaxed text-sm mb-6">
              Membangun infrastruktur transportasi modern untuk kesejahteraan seluruh lapisan masyarakat Indonesia.
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors cursor-pointer text-slate-300">fb</div>
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors cursor-pointer text-slate-300">ig</div>
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors cursor-pointer text-slate-300">tw</div>
            </div>
          </div>
          
          <div className="text-center md:text-left">
            <h4 className="text-white font-bold mb-6">Perusahaan</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-purple-400 transition-colors">Tentang Kami</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Karir</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Pusat Bantuan</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Syarat & Ketentuan</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Kebijakan Privasi</a></li>
            </ul>
          </div>
          
          <div className="text-center md:text-left">
            <h4 className="text-white font-bold mb-6">Gabung Bersama Kami</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-purple-400 transition-colors">Mitra Driver</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Mitra Toko Food</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Mitra Transport</a></li>
              <li className="pt-4 mt-4 border-t border-slate-800">
                <Link href="/login" className="text-purple-500 hover:text-purple-400 font-medium flex items-center justify-center md:justify-start gap-1">
                  Login Admin Portal <ChevronRight className="w-4 h-4"/>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-slate-900 text-center text-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} OjekKu (PT. Ojek Terus Maju). All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-500">Made with <HeartIcon /> in Indonesia</div>
        </div>
      </footer>

    </div>
  );
}

function HeartIcon() {
  return <svg className="w-4 h-4 text-red-500 mx-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>;
}
