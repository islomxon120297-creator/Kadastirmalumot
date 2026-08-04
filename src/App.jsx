import React, { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, onValue, push, set, update, remove } from 'firebase/database';
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
  X,
  Image as ImageIcon,
  FileText,
  Building2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Eye,
  Maximize2
} from 'lucide-react';

const REGIONS = [
  { 
    id: 'qashqadaryo', 
    name: 'Qashqadaryo viloyati', 
    districts: [
      'Qarshi sh.', 'Shahrisabz sh.', 'Dehqonobod t.', 'G‘uzor t.', 
      'Ko‘kdala t.', 'Kamashi t.', 'Karshi t.', 'Koson t.', 
      'Kasbi t.', 'Kitob t.', 'Mirishkor t.', 'Muborak t.', 
      'Nishon t.', 'Shahrisabz t.', 'Chiroqchi t.', 'Yakkabog‘ t.'
    ] 
  }
];

export default function App() {
  const [role, setRole] = useState('user'); 
  const [activeTab, setActiveTab] = useState('reports');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const [reports, setReports] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [formData, setFormData] = useState({
    institutionName: '',
    treesCount: '',
    cleaningArea: '',
    flowersCount: '',
    reporterName: '',
    photos: [], 
    cadastrePdf: null, 
    govServicePdf: null 
  });

  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGalleryDistrict, setSelectedGalleryDistrict] = useState('all');

  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const [editingReportId, setEditingReportId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    district: '',
    institutionName: '',
    trees: '',
    cleaning: '',
    flowers: '',
    reporter: '',
    photos: [],
    cadastrePdf: null,
    govServicePdf: null
  });

  // FIREBASE'DAN REAL VAQTDA BARCHA QURILMALAR UCHUN MA'LUMOT O'QISH
  useEffect(() => {
    const reportsRef = ref(database, 'reports');
    const unsubscribe = onValue(reportsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedReports = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setReports(loadedReports.reverse());
      } else {
        setReports([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleMultipleImages = (e, isEdit = false) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newPhotos = [];
    let processed = 0;

    files.forEach(file => {
      if (file.size > 1 * 1024 * 1024) {
        alert(`${file.name} hajmi juda katta (1MB dan kichik rasm yuklang)!`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        newPhotos.push(reader.result);
        processed++;
        if (processed === files.length) {
          if (isEdit) {
            setEditFormData(prev => ({ ...prev, photos: [...prev.photos, ...newPhotos] }));
          } else {
            setFormData(prev => ({ ...prev, photos: [...prev.photos, ...newPhotos] }));
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePdfUpload = (e, fieldName, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const pdfData = {
        name: file.name,
        url: URL.createObjectURL(file) 
      };
      if (isEdit) {
        setEditFormData(prev => ({ ...prev, [fieldName]: pdfData }));
      } else {
        setFormData(prev => ({ ...prev, [fieldName]: pdfData }));
      }
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (passwordInput === 'admin2026') {
      setRole('admin');
      setIsAuthModalOpen(false);
      setPasswordInput('');
      setAuthError('');
    } else {
      setAuthError('Parol noto\'g\'ri!');
    }
  };

  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (!selectedDistrict) {
      alert('Iltimos, tumanni tanlang!');
      return;
    }

    const newReportRef = push(ref(database, 'reports'));
    const newReport = {
      region: 'Qashqadaryo viloyati',
      district: selectedDistrict,
      institution: formData.institutionName || 'Ko\'rsatilmadi',
      trees: Number(formData.treesCount) || 0,
      cleaning: Number(formData.cleaningArea) || 0,
      flowers: Number(formData.flowersCount) || 0,
      reporter: formData.reporterName,
      photos: formData.photos.length > 0 ? formData.photos : ['https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400'],
      cadastrePdf: formData.cadastrePdf || null,
      govServicePdf: formData.govServicePdf || null,
      date: new Date().toLocaleDateString('uz-UZ'),
      status: 'pending',
      rejectReason: ''
    };

    set(newReportRef, newReport);
    setSubmitSuccess(true);
    setFormData({
      institutionName: '',
      treesCount: '',
      cleaningArea: '',
      flowersCount: '',
      reporterName: '',
      photos: [],
      cadastrePdf: null,
      govServicePdf: null
    });
    setSelectedDistrict('');
    
    setTimeout(() => setSubmitSuccess(false), 4000);
  };

  const handleApprove = (id) => {
    update(ref(database, `reports/${id}`), { status: 'approved', rejectReason: '' });
  };

  const handleOpenRejectModal = (id) => {
    setRejectingId(id);
    setRejectReason('');
  };

  const handleConfirmReject = (e) => {
    e.preventDefault();
    update(ref(database, `reports/${rejectingId}`), { 
      status: 'rejected', 
      rejectReason: rejectReason || 'Ma\'lumotlar xato kiritilgan.' 
    });
    setRejectingId(null);
  };

  const handleDeleteReport = (id) => {
    if (window.confirm('Rostdan ham ushbu hisobotni o\'chirmoqchimisiz?')) {
      remove(ref(database, `reports/${id}`));
    }
  };

  const handleOpenEditModal = (report) => {
    setEditingReportId(report.id);
    setEditFormData({
      district: report.district,
      institutionName: report.institution,
      trees: report.trees,
      cleaning: report.cleaning,
      flowers: report.flowers,
      reporter: report.reporter,
      photos: report.photos || [],
      cadastrePdf: report.cadastrePdf || null,
      govServicePdf: report.govServicePdf || null
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    update(ref(database, `reports/${editingReportId}`), {
      district: editFormData.district,
      institution: editFormData.institutionName,
      trees: Number(editFormData.trees) || 0,
      cleaning: Number(editFormData.cleaning) || 0,
      flowers: Number(editFormData.flowers) || 0,
      reporter: editFormData.reporter,
      photos: editFormData.photos,
      cadastrePdf: editFormData.cadastrePdf,
      govServicePdf: editFormData.govServicePdf,
      status: 'pending',
      rejectReason: ''
    });
    setIsEditModalOpen(false);
    setEditingReportId(null);
  };

  const filteredReports = reports.filter(r => 
    (r.district && r.district.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.institution && r.institution.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.reporter && r.reporter.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const galleryReports = reports.filter(r => {
    if (selectedGalleryDistrict === 'all') return true;
    return r.district === selectedGalleryDistrict;
  });

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
              <p className="text-xs text-emerald-200">Obodonlashtirish va Kadastr platformasi</p>
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

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {role === 'user' && (
          <div className="max-w-3xl mx-auto space-y-8">
            
            {/* HISOBOT YUBORISH FORMASI */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <PlusCircle className="w-6 h-6 text-emerald-600" />
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Yangi Hisobot va Kadastr Ma'lumotlarini Yuborish</h2>
                  <p className="text-xs text-slate-500">Qashqadaryo viloyati hududiy va muassasalar bo'yicha</p>
                </div>
              </div>

              {submitSuccess && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-medium">Hisobot muvaffaqiyatli saqlandi va Viloyat Adminiga ko'rib chiqish uchun yuborildi!</span>
                </div>
              )}

              <form onSubmit={handleSubmitReport} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Viloyat</label>
                    <input
                      type="text"
                      value="Qashqadaryo viloyati"
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-600 font-medium cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tuman / Shahar</label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="">-- Tanlang --</option>
                      {REGIONS[0].districts.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-sky-600" /> Muassasa nomi
                    </label>
                    <input
                      type="text"
                      placeholder="Masalan: 4-oilaviy poliklinika"
                      value={formData.institutionName}
                      onChange={(e) => setFormData({...formData, institutionName: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Foto hisobotlar (Ko'p ta rasm)</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleMultipleImages(e, false)}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 cursor-pointer"
                    />
                  </div>
                </div>

                {/* PDF HUJJATLAR YUKLASH BO'LIMI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-rose-600" /> Kadastr hujjati (PDF)
                    </label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => handlePdfUpload(e, 'cadastrePdf', false)}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-rose-100 file:text-rose-700 hover:file:bg-rose-200 cursor-pointer"
                    />
                    {formData.cadastrePdf && <p className="text-[10px] text-emerald-600 mt-1">✓ {formData.cadastrePdf.name}</p>}
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-sky-600" /> Davlat xizmatlari javobi (PDF)
                    </label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => handlePdfUpload(e, 'govServicePdf', false)}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200 cursor-pointer"
                    />
                    {formData.govServicePdf && <p className="text-[10px] text-emerald-600 mt-1">✓ {formData.govServicePdf.name}</p>}
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

            {/* YUBORILGAN HISOBOTLAR STATUSI */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" /> Yuborilgan hisobotlar monitoringi
              </h3>

              <div className="space-y-4">
                {reports.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Hozircha hech qanday hisobot yuborilmagan.</p>
                ) : (
                  reports.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-800 text-sm">{item.district}</span>
                          <span className="text-xs text-slate-500 ml-2">({item.institution})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.status === 'pending' && <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Kutilmoqda</span>}
                          {item.status === 'approved' && <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Tasdiqlandi</span>}
                          {item.status === 'rejected' && <span className="bg-rose-100 text-rose-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Rad etildi</span>}
                          
                          <button onClick={() => handleOpenEditModal(item)} className="p-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {item.status === 'rejected' && item.rejectReason && (
                        <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-1">
                          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                          <div><strong>Rad etilish sababi:</strong> {item.rejectReason}</div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* ADMIN PANEL */}
        {role === 'admin' && (
          <div className="space-y-6">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
              <div>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-md uppercase">
                  Viloyat Darajasi (Online)
                </span>
                <h2 className="text-2xl font-bold text-slate-800 mt-1">Obodonlashtirish & Kadastr Boshqaruv Paneli</h2>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                  <button
                    onClick={() => setActiveTab('reports')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === 'reports' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                  >
                    Jadval
                  </button>
                  <button
                    onClick={() => setActiveTab('gallery')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === 'gallery' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                  >
                    Fotogalereya
                  </button>
                </div>

                <button
                  onClick={() => setRole('user')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200"
                >
                  <LogOut className="w-4 h-4" /> Chiqish
                </button>
              </div>
            </div>

            {/* TAB 1: JADVAL */}
            {activeTab === 'reports' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-600" /> Barcha Qurilmalardan Kelgan Hisobotlar
                  </h3>

                  <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Qidiruv..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-100">
                      <tr>
                        <th className="p-4">Tuman / Muassasa</th>
                        <th className="p-4">Daraxt/Tozalash/Gul</th>
                        <th className="p-4">Hujjatlar (PDF)</th>
                        <th className="p-4">Mas'ul / Sana</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredReports.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-slate-400">
                            Hozircha hech qanday hisobot tushmagan.
                          </td>
                        </tr>
                      ) : (
                        filteredReports.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition">
                            <td className="p-4 font-semibold text-slate-800">
                              <div>{item.district}</div>
                              <div className="text-[11px] font-normal text-sky-700">{item.institution}</div>
                            </td>
                            <td className="p-4">
                              <div>{item.trees} dona daraxt</div>
                              <div>{item.cleaning} m² tozalash</div>
                              <div>{item.flowers} dona gul</div>
                            </td>
                            <td className="p-4 space-y-1">
                              {item.cadastrePdf ? (
                                <a href={item.cadastrePdf.url} target="_blank" rel="noreferrer" className="text-rose-600 hover:underline flex items-center gap-1 text-[11px]">
                                  <FileText className="w-3 h-3" /> Kadastr
                                </a>
                              ) : <span className="text-slate-300">-</span>}
                              {item.govServicePdf && (
                                <a href={item.govServicePdf.url} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline flex items-center gap-1 text-[11px]">
                                  <FileText className="w-3 h-3" /> Davlat Xizmati
                                </a>
                              )}
                            </td>
                            <td className="p-4">
                              <div>{item.reporter}</div>
                              <div className="text-[10px] text-slate-400">{item.date}</div>
                            </td>
                            <td className="p-4">
                              {item.status === 'pending' && <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded">Kutilmoqda</span>}
                              {item.status === 'approved' && <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded">Tasdiqlandi</span>}
                              {item.status === 'rejected' && <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-1 rounded">Rad etildi</span>}
                            </td>
                            <td className="p-4 text-right space-x-1">
                              {item.status === 'pending' && (
                                <>
                                  <button onClick={() => handleApprove(item.id)} className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-semibold">Qabul</button>
                                  <button onClick={() => handleOpenRejectModal(item.id)} className="px-2 py-1 bg-rose-600 text-white rounded text-xs font-semibold">Rad</button>
                                </>
                              )}
                              <button onClick={() => handleDeleteReport(item.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded hover:bg-rose-100">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: GALEREYA */}
            {activeTab === 'gallery' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-emerald-600" /> Barcha Rasmlar Galereyasi
                  </h3>
                  <select
                    value={selectedGalleryDistrict}
                    onChange={(e) => setSelectedGalleryDistrict(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                  >
                    <option value="all">Barcha Tumanlar</option>
                    {REGIONS[0].districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {galleryReports.flatMap(r => (r.photos || []).map((photo, idx) => (
                    <div key={`${r.id}-${idx}`} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video">
                      <img src={photo} alt="Report" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-3 text-white">
                        <span className="text-[10px] font-semibold">{r.district}</span>
                        <button onClick={() => setPreviewImage(photo)} className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md self-end">
                          <Maximize2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  )))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* TAHRIRLASH MODALI */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Hisobotni Tahrirlash</h3>
              <button onClick={() => setIsEditModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Tuman</label>
                <select
                  value={editFormData.district}
                  onChange={(e) => setEditFormData({...editFormData, district: e.target.value})}
                  className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs"
                >
                  {REGIONS[0].districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Muassasa nomi</label>
                <input
                  type="text"
                  value={editFormData.institutionName}
                  onChange={(e) => setEditFormData({...editFormData, institutionName: e.target.value})}
                  className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <input type="number" placeholder="Daraxt" value={editFormData.trees} onChange={(e) => setEditFormData({...editFormData, trees: e.target.value})} className="bg-slate-50 border rounded-xl p-2 text-xs" />
                <input type="number" placeholder="Tozalash" value={editFormData.cleaning} onChange={(e) => setEditFormData({...editFormData, cleaning: e.target.value})} className="bg-slate-50 border rounded-xl p-2 text-xs" />
                <input type="number" placeholder="Gul" value={editFormData.flowers} onChange={(e) => setEditFormData({...editFormData, flowers: e.target.value})} className="bg-slate-50 border rounded-xl p-2 text-xs" />
              </div>

              <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl mt-4">Saqlash</button>
            </form>
          </div>
        </div>
      )}

      {/* PAROL MODALI */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-bold text-slate-800 text-lg text-center mb-4">Admin Panelga Kirish</h3>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input
                type="password"
                placeholder="Parolni kiriting..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none text-center font-semibold"
                autoFocus
              />
              {authError && <p className="text-xs text-rose-500 text-center">{authError}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsAuthModalOpen(false)} className="w-1/2 py-2.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl">Bekor qilish</button>
                <button type="submit" className="w-1/2 py-2.5 bg-amber-500 text-slate-900 text-xs font-bold rounded-xl">Kirish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RAD ETISH MODALI */}
      {rejectingId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Rad etish sababi</h3>
            <textarea
              placeholder="Sababni yozing..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setRejectingId(null)} className="w-1/2 py-2 bg-slate-100 text-slate-600 text-xs rounded-xl">Bekor qilish</button>
              <button onClick={handleConfirmReject} className="w-1/2 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl">Tasdiqlash</button>
            </div>
          </div>
        </div>
      )}

      {/* RASMNI KATTALASHTIRIB KO'RISH MODALI */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-3xl w-full">
            <img src={previewImage} alt="Preview" className="w-full max-h-[80vh] object-contain rounded-2xl" />
            <button onClick={() => setPreviewImage(null)} className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}