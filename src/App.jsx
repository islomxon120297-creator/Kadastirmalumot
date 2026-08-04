import React, { useState, useEffect } from 'react';
import { 
  Trees, 
  Sparkles, 
  Flower2, 
  ShieldCheck, 
  Lock, 
  LogOut, 
  CheckCircle2, 
  BarChart3, 
  MapPin, 
  PlusCircle, 
  Search,
  Users,
  Trash2,
  Edit3,
  X
} from 'lucide-react';

const REGIONS = [
  { 
    id: 'qashqadaryo', 
    name: 'Qashqadaryo viloyati', 
    districts: [
      'Qarshi sh.', 
      'Shahrisabz sh.', 
      'Kitob t.', 
      'Shaxrisabz t.', 
      'Qarshi t.', 
      'Koson t.', 
      'Chiroqchi t.', 
      'G‘uzor t.', 
      'Dehqonobod t.', 
      'Mirishkor t.', 
      'Nishon t.', 
      'Kamashi t.', 
      'Yakkabog‘ t.'
    ] 
  }
];

export default function App() {
  const [role, setRole] = useState('user'); 
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [reports, setReports] = useState(() => {
    const saved = localStorage.getItem('eco_reports_qashqadaryo');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [formData, setFormData] = useState({
    treesCount: '',
    cleaningArea: '',
    flowersCount: '',
    reporterName: '',
    photoUrl: ''
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Tahrirlash uchun state
  const [editingReportId, setEditingReportId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    district: '',
    trees: '',
    cleaning: '',
    flowers: '',
    reporter: ''
  });

  useEffect(() => {
    localStorage.setItem('eco_reports_qashqadaryo', JSON.stringify(reports));
  }, [reports]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (passwordInput === 'admin2026') {
      setRole('admin');
      setIsAuthModalOpen(false);
      setPasswordInput('');
      setAuthError('');
    } else {
      setAuthError('Parol noto\'g\'ri! Qaytadan urinib ko\'ring.');
    }
  };

  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (!selectedDistrict) {
      alert('Iltimos, tumanni tanlang!');
      return;
    }

    const newReport = {
      id: Date.now(),
      region: 'Qashqadaryo viloyati',
      district: selectedDistrict,
      trees: Number(formData.treesCount) || 0,
      cleaning: Number(formData.cleaningArea) || 0,
      flowers: Number(formData.flowersCount) || 0,
      reporter: formData.reporterName,
      photo: formData.photoUrl || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400',
      date: new Date().toLocaleDateString('uz-UZ')
    };

    setReports([newReport, ...reports]);
    setSubmitSuccess(true);
    setFormData({ treesCount: '', cleaningArea: '', flowersCount: '', reporterName: '', photoUrl: '' });
    setSelectedDistrict('');
    
    setTimeout(() => setSubmitSuccess(false), 4000);
  };

  // O'chirish funksiyasi
  const handleDeleteReport = (id) => {
    if (window.confirm('Rostdan ham ushbu hisobotni o\'chirmoqchimisiz?')) {
      setReports(reports.filter(r => r.id !== id));
    }
  };

  // Tahrirlashni boshlash
  const handleOpenEditModal = (report) => {
    setEditingReportId(report.id);
    setEditFormData({
      district: report.district,
      trees: report.trees,
      cleaning: report.cleaning,
      flowers: report.flowers,
      reporter: report.reporter
    });
    setIsEditModalOpen(true);
  };

  // Tahrirlangan ma'lumotni saqlash
  const handleSaveEdit = (e) => {
    e.preventDefault();
    setReports(reports.map(r => {
      if (r.id === editingReportId) {
        return {
          ...r,
          district: editFormData.district,
          trees: Number(editFormData.trees) || 0,
          cleaning: Number(editFormData.cleaning) || 0,
          flowers: Number(editFormData.flowers) || 0,
          reporter: editFormData.reporter
        };
      }
      return r;
    }));
    setIsEditModalOpen(false);
    setEditingReportId(null);
  };

  const filteredReports = reports.filter(r => 
    r.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reporter.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* HEADER */}
      <header className="bg-emerald-700 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <Trees className="w-7 h-7 text-emerald-200" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Qashqadaryo Eco-Kadastr</h1>
              <p className="text-xs text-emerald-200">Obodonlashtirish ishlarini nazorat qilish</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-800/60 p-1 rounded-xl border border-emerald-600">
            <button
              onClick={() => setRole('user')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                role === 'user' ? 'bg-white text-emerald-800 shadow' : 'text-emerald-100 hover:bg-emerald-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Tuman darajasi
            </button>

            <button
              onClick={() => {
                if (role === 'admin') return;
                setIsAuthModalOpen(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                role === 'admin' ? 'bg-amber-400 text-slate-900 shadow font-bold' : 'text-emerald-100 hover:bg-emerald-700'
              }`}
            >
              {role === 'admin' ? <ShieldCheck className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              Viloyat darajasi (Admin)
            </button>
          </div>
        </div>
      </header>

      {/* ASOSIY TANA */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {role === 'user' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <PlusCircle className="w-6 h-6 text-emerald-600" />
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Yangi Hisobot Yuborish</h2>
                  <p className="text-xs text-slate-500">Qashqadaryo viloyati hududiy ishlar ma'lumotlari</p>
                </div>
              </div>

              {submitSuccess && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-medium">Hisobot muvaffaqiyatli saqlandi va Viloyat darajasiga yuborildi!</span>
                </div>
              )}

              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Viloyat</label>
                    <input
                      type="text"
                      value="Qashqadaryo viloyati"
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 font-medium cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tuman / Shahar</label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="">-- Tanlang --</option>
                      {REGIONS[0].districts.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                      <Trees className="w-3.5 h-3.5 text-emerald-600" /> Daraxt oqlash (dona)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.treesCount}
                      onChange={(e) => setFormData({...formData, treesCount: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Tozalash (m²)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.cleaningArea}
                      onChange={(e) => setFormData({...formData, cleaningArea: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                      <Flower2 className="w-3.5 h-3.5 text-rose-500" /> Gul ekish (dona)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.flowersCount}
                      onChange={(e) => setFormData({...formData, flowersCount: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Mas'ul xodim (F.I.SH)</label>
                    <input
                      type="text"
                      placeholder="Masalan: A. Karimov"
                      value={formData.reporterName}
                      onChange={(e) => setFormData({...formData, reporterName: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Foto havola (URL)</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={formData.photoUrl}
                      onChange={(e) => setFormData({...formData, photoUrl: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl shadow-md transition duration-200"
                >
                  Hisobotni Yuborish
                </button>
              </form>
            </div>
          </div>
        )}

        {role === 'admin' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
                  Qashqadaryo Viloyati Darajasi
                </span>
                <h2 className="text-2xl font-bold text-slate-800 mt-1">Umumiy Obodonlashtirish Statistikasi</h2>
              </div>
              <button
                onClick={() => setRole('user')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                <LogOut className="w-4 h-4" /> Admin rejimdan chiqish
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="bg-emerald-100 p-3 rounded-xl text-emerald-700">
                  <Trees className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Jami oqlangan daraxtlar</p>
                  <p className="text-2xl font-black text-slate-800">
                    {reports.reduce((acc, r) => acc + r.trees, 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">dona</span>
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="bg-amber-100 p-3 rounded-xl text-amber-700">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Jami tozalangan hudud</p>
                  <p className="text-2xl font-black text-slate-800">
                    {reports.reduce((acc, r) => acc + r.cleaning, 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">m²</span>
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="bg-rose-100 p-3 rounded-xl text-rose-700">
                  <Flower2 className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Jami ekilgan gullar</p>
                  <p className="text-2xl font-black text-slate-800">
                    {reports.reduce((acc, r) => acc + r.flowers, 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">dona</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" /> Tumanlar kesimidagi hisobotlar
                </h3>

                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Qidirish (Tuman, mas'ul)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="p-4">Tuman / Shahar</th>
                      <th className="p-4">Daraxtlar</th>
                      <th className="p-4">Tozalash (m²)</th>
                      <th className="p-4">Gullar</th>
                      <th className="p-4">Mas'ul</th>
                      <th className="p-4">Sana</th>
                      <th className="p-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-slate-400">
                          Hozircha hech qanday hisobot kelib tushmagan.
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-4 font-semibold text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {item.district}
                            </div>
                          </td>
                          <td className="p-4 font-medium text-emerald-700">{item.trees.toLocaleString()} dona</td>
                          <td className="p-4 font-medium text-amber-700">{item.cleaning.toLocaleString()} m²</td>
                          <td className="p-4 font-medium text-rose-700">{item.flowers.toLocaleString()} dona</td>
                          <td className="p-4 font-medium text-slate-700">{item.reporter}</td>
                          <td className="p-4 text-slate-400">{item.date}</td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-lg transition inline-flex items-center"
                              title="Tahrirlash"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteReport(item.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition inline-flex items-center"
                              title="O'chirish"
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

          </div>
        )}

      </main>

      {/* PAROL SO'RASH MODALI */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Viloyat Darajasi</h3>
              <p className="text-xs text-slate-500 mt-1">Admin panelga kirish uchun maxsus parolni kiriting</p>
            </div>

            {authError && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl text-center font-medium">
                {authError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input
                type="password"
                placeholder="Parolni kiriting..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none text-center font-semibold tracking-widest"
                autoFocus
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    setAuthError('');
                  }}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold rounded-xl transition shadow"
                >
                  Kirish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAHRIRLASH MODALI (EDIT MODAL) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-sky-600" /> Hisobotni Tahrirlash
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tuman / Shahar</label>
                <select
                  value={editFormData.district}
                  onChange={(e) => setEditFormData({...editFormData, district: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  required
                >
                  {REGIONS[0].districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Daraxt</label>
                  <input
                    type="number"
                    value={editFormData.trees}
                    onChange={(e) => setEditFormData({...editFormData, trees: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tozalash (m²)</label>
                  <input
                    type="number"
                    value={editFormData.cleaning}
                    onChange={(e) => setEditFormData({...editFormData, cleaning: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Gul</label>
                  <input
                    type="number"
                    value={editFormData.flowers}
                    onChange={(e) => setEditFormData({...editFormData, flowers: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mas'ul xodim</label>
                <input
                  type="text"
                  value={editFormData.reporter}
                  onChange={(e) => setEditFormData({...editFormData, reporter: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shadow"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}