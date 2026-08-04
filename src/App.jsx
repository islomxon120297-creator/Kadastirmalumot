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
  X,
  Image as ImageIcon,
  Upload,
  FileText,
  Building2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Eye,
  Maximize2,
  Loader2
} from 'lucide-react';

import { db, storage } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const REGIONS = [
  {
    id: 'qashqadaryo',
    name: 'Qashqadaryo viloyati',
    districts: [
      'Qarshi sh.',
      'Shahrisabz sh.',
      'Dehqonobod t.',
      'G‘uzor t.',
      'Ko‘kdala t.',
      'Kamashi t.',
      'Karshi t.',
      'Koson t.',
      'Kasbi t.',
      'Kitob t.',
      'Mirishkor t.',
      'Muborak t.',
      'Nishon t.',
      'Shahrisabz t.',
      'Chiroqchi t.',
      'Yakkabog‘ t.'
    ]
  }
];

const REPORTS_COLLECTION = 'reports';

export default function App() {
  const [role, setRole] = useState('user');
  const [activeTab, setActiveTab] = useState('reports');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [previewImage, setPreviewImage] = useState(null);

  // Firestore'dan real-vaqtda keladigan hisobotlar
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [formData, setFormData] = useState({
    institutionName: '',
    treesCount: '',
    cleaningArea: '',
    flowersCount: '',
    reporterName: '',
    photos: [], // {url, path}
    cadastrePdf: null, // {name, url, path}
    govServicePdf: null
  });

  const [uploadingKey, setUploadingKey] = useState(null); // qaysi input hozir yuklanmoqda
  const [submitting, setSubmitting] = useState(false);
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

  // ---- Firestore'ni tinglash (barcha qurilmalarda bir xil ma'lumot) ----
  useEffect(() => {
    const q = query(collection(db, REPORTS_COLLECTION), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setReports(data);
        setLoadingReports(false);
      },
      (error) => {
        console.error('Firestore o\'qishda xatolik:', error);
        setLoadingReports(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // ---- Storage'ga fayl yuklash yordamchisi ----
  const uploadFile = async (file, folder) => {
    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const path = `${folder}/${safeName}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return { url, path };
  };

  const deleteFileByPath = async (path) => {
    if (!path) return;
    try {
      await deleteObject(ref(storage, path));
    } catch (e) {
      console.warn('Faylni o\'chirishda xatolik (e\'tiborsiz qoldirildi):', e);
    }
  };

  // ---- Bir nechta rasmlarni yuklash (Storage'ga) ----
  const handleMultipleImages = async (e, isEdit = false) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const tooLarge = files.filter((f) => f.size > 5 * 1024 * 1024);
    if (tooLarge.length) {
      alert(`Quyidagi fayllar 5MB dan katta: ${tooLarge.map((f) => f.name).join(', ')}`);
    }
    const validFiles = files.filter((f) => f.size <= 5 * 1024 * 1024);
    if (!validFiles.length) return;

    setUploadingKey(isEdit ? 'edit-photos' : 'photos');
    try {
      const uploaded = await Promise.all(validFiles.map((f) => uploadFile(f, 'photos')));
      if (isEdit) {
        setEditFormData((prev) => ({ ...prev, photos: [...prev.photos, ...uploaded] }));
      } else {
        setFormData((prev) => ({ ...prev, photos: [...prev.photos, ...uploaded] }));
      }
    } catch (err) {
      console.error('Rasm yuklashda xatolik:', err);
      alert('Rasm yuklashda xatolik yuz berdi. Qayta urinib ko\'ring.');
    } finally {
      setUploadingKey(null);
      e.target.value = '';
    }
  };

  // ---- PDF faylni Storage'ga yuklash ----
  const handlePdfUpload = async (e, fieldName, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('PDF hajmi 10MB dan kichik bo\'lishi kerak.');
      return;
    }

    setUploadingKey(isEdit ? `edit-${fieldName}` : fieldName);
    try {
      const { url, path } = await uploadFile(file, 'documents');
      const pdfData = { name: file.name, url, path };
      if (isEdit) {
        setEditFormData((prev) => ({ ...prev, [fieldName]: pdfData }));
      } else {
        setFormData((prev) => ({ ...prev, [fieldName]: pdfData }));
      }
    } catch (err) {
      console.error('PDF yuklashda xatolik:', err);
      alert('PDF yuklashda xatolik yuz berdi. Qayta urinib ko\'ring.');
    } finally {
      setUploadingKey(null);
      e.target.value = '';
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

  // ---- Yangi hisobotni Firestore'ga yozish ----
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!selectedDistrict) {
      alert('Iltimos, tumanni tanlang!');
      return;
    }
    if (!formData.cadastrePdf || !formData.govServicePdf) {
      alert('Iltimos, ikkala PDF hujjatni ham yuklang!');
      return;
    }

    setSubmitting(true);
    try {
      const newReport = {
        region: 'Qashqadaryo viloyati',
        district: selectedDistrict,
        institution: formData.institutionName || 'Ko\'rsatilmadi',
        trees: Number(formData.treesCount) || 0,
        cleaning: Number(formData.cleaningArea) || 0,
        flowers: Number(formData.flowersCount) || 0,
        reporter: formData.reporterName,
        photos: formData.photos.length > 0
          ? formData.photos
          : [{ url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400', path: null }],
        cadastrePdf: formData.cadastrePdf,
        govServicePdf: formData.govServicePdf,
        date: new Date().toLocaleDateString('uz-UZ'),
        status: 'pending',
        rejectReason: '',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, REPORTS_COLLECTION), newReport);

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
    } catch (err) {
      console.error('Hisobotni saqlashda xatolik:', err);
      alert('Hisobotni saqlashda xatolik yuz berdi. Internet aloqasini tekshirib qayta urinib ko\'ring.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await updateDoc(doc(db, REPORTS_COLLECTION, id), { status: 'approved', rejectReason: '' });
    } catch (err) {
      console.error(err);
      alert('Amalni bajarishda xatolik yuz berdi.');
    }
  };

  const handleOpenRejectModal = (id) => {
    setRejectingId(id);
    setRejectReason('');
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, REPORTS_COLLECTION, rejectingId), {
        status: 'rejected',
        rejectReason: rejectReason || 'Ma\'lumotlar xato kiritilgan.'
      });
      setRejectingId(null);
    } catch (err) {
      console.error(err);
      alert('Amalni bajarishda xatolik yuz berdi.');
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Rostdan ham ushbu hisobotni o\'chirmoqchimisiz?')) return;
    try {
      const target = reports.find((r) => r.id === id);
      await deleteDoc(doc(db, REPORTS_COLLECTION, id));
      // Storage'dagi fayllarni ham tozalash (ixtiyoriy, xato bo'lsa e'tiborsiz qoldiriladi)
      if (target) {
        (target.photos || []).forEach((p) => deleteFileByPath(p.path));
        deleteFileByPath(target.cadastrePdf?.path);
        deleteFileByPath(target.govServicePdf?.path);
      }
    } catch (err) {
      console.error(err);
      alert('O\'chirishda xatolik yuz berdi.');
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

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, REPORTS_COLLECTION, editingReportId), {
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
    } catch (err) {
      console.error(err);
      alert('Saqlashda xatolik yuz berdi.');
    }
  };

  const filteredReports = reports.filter(
    (r) =>
      r.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.reporter || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const galleryReports = reports.filter((r) => {
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
                      {REGIONS[0].districts.map((d) => (
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
                      placeholder="Masalan: 12-maktab, Tumangaz"
                      value={formData.institutionName}
                      onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, treesCount: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, cleaningArea: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, flowersCount: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Foto hisobotlar (Ko'p rasm tanlash mumkin)</label>
                    <div className="relative border border-slate-200 rounded-xl bg-slate-50 p-2 flex items-center gap-2">
                      {uploadingKey === 'photos' ? (
                        <Loader2 className="w-4 h-4 text-emerald-500 ml-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 text-slate-400 ml-2" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={uploadingKey === 'photos'}
                        onChange={(e) => handleMultipleImages(e, false)}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 cursor-pointer"
                      />
                    </div>
                    {formData.photos.length > 0 && (
                      <p className="text-[11px] text-emerald-600 mt-1 font-medium">✓ {formData.photos.length} ta rasm yuklandi</p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 pt-3">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" /> Rasmiy PDF Hujjatlarni Yuklash
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">1. Kadastr ma'lumotlari (PDF)</label>
                      <div className="flex items-center gap-2">
                        {uploadingKey === 'cadastrePdf' && <Loader2 className="w-3.5 h-3.5 text-sky-500 animate-spin" />}
                        <input
                          type="file"
                          accept=".pdf"
                          disabled={uploadingKey === 'cadastrePdf'}
                          onChange={(e) => handlePdfUpload(e, 'cadastrePdf', false)}
                          className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200 cursor-pointer"
                        />
                      </div>
                      {formData.cadastrePdf && (
                        <p className="text-[10px] text-sky-600 mt-1 truncate">Yuklandi: {formData.cadastrePdf.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">2. Davlat xizmati hujjati (PDF)</label>
                      <div className="flex items-center gap-2">
                        {uploadingKey === 'govServicePdf' && <Loader2 className="w-3.5 h-3.5 text-sky-500 animate-spin" />}
                        <input
                          type="file"
                          accept=".pdf"
                          disabled={uploadingKey === 'govServicePdf'}
                          onChange={(e) => handlePdfUpload(e, 'govServicePdf', false)}
                          className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200 cursor-pointer"
                        />
                      </div>
                      {formData.govServicePdf && (
                        <p className="text-[10px] text-sky-600 mt-1 truncate">Yuklandi: {formData.govServicePdf.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || uploadingKey !== null}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl shadow-md transition duration-200 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Yuborilmoqda...' : 'Hisobotni Yuborish'}
                </button>
              </form>
            </div>

            {/* YUBORILGAN HISOBOTLAR STATUSI */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" /> Yuborilgan hisobotlar holati
              </h3>

              <div className="space-y-4">
                {loadingReports ? (
                  <p className="text-xs text-slate-400 text-center py-4 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Yuklanmoqda...
                  </p>
                ) : reports.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Hozircha hech qanday hisobot yuborilmagan.</p>
                ) : (
                  reports.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between gap-3">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">{item.district}</span>
                            <span className="text-xs text-slate-500">({item.institution})</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">Sana: {item.date} | Mas'ul: {item.reporter}</p>
                        </div>

                        <div>
                          {item.status === 'pending' && (
                            <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Tekshirilmoqda
                            </span>
                          )}
                          {item.status === 'approved' && (
                            <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Tasdiqlandi
                            </span>
                          )}
                          {item.status === 'rejected' && (
                            <span className="bg-rose-100 text-rose-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" /> Qaytarib yuborildi
                            </span>
                          )}
                        </div>
                      </div>

                      {Array.isArray(item.photos) && item.photos.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {item.photos.map((photo, pIdx) => (
                            <div
                              key={pIdx}
                              onClick={() => setPreviewImage(photo.url)}
                              className="relative group cursor-pointer overflow-hidden rounded-lg border border-slate-200"
                            >
                              <img
                                src={photo.url}
                                alt="preview"
                                className="w-14 h-14 object-cover transition transform group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <Maximize2 className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {item.status === 'rejected' && (
                        <div className="mt-1 p-3 bg-rose-50 border border-rose-200 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                          <div className="flex items-start gap-2 text-xs text-rose-800">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
                            <div>
                              <span className="font-bold">Xatolik sababi:</span> {item.rejectReason}
                            </div>
                          </div>

                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 flex-shrink-0 shadow"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Qayta tahrirlash va yuborish
                          </button>
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
                  Qashqadaryo Viloyati Darajasi
                </span>
                <h2 className="text-2xl font-bold text-slate-800 mt-1">Umumiy Obodonlashtirish & Kadastr Nazorati</h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                  <button
                    onClick={() => setActiveTab('reports')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      activeTab === 'reports' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Jadval va Tekshirish
                  </button>
                  <button
                    onClick={() => setActiveTab('gallery')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                      activeTab === 'gallery' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" /> Foto Galereya
                  </button>
                </div>

                <button
                  onClick={() => setRole('user')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" /> Chiqish
                </button>
              </div>
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

            {activeTab === 'reports' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-600" /> Tuman va Muassasalar Hisobotlari
                  </h3>

                  <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Qidirish (Tuman, muassasa)..."
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
                        <th className="p-4">Tuman va Muassasa</th>
                        <th className="p-4">Daraxt/Tozalash/Gul</th>
                        <th className="p-4">PDF Hujjatlar (Ochish / Yuklash)</th>
                        <th className="p-4">Mas'ul / Sana</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Tasdiqlash / Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingReports ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-slate-400">Yuklanmoqda...</td>
                        </tr>
                      ) : filteredReports.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-slate-400">
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
                              <div className="text-[11px] font-normal text-sky-700 flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3 h-3" /> {item.institution}
                              </div>
                            </td>
                            <td className="p-4 space-y-0.5">
                              <div className="text-emerald-700 font-medium">{item.trees} dona daraxt</div>
                              <div className="text-amber-700 font-medium">{item.cleaning} m² tozalash</div>
                              <div className="text-rose-700 font-medium">{item.flowers} dona gul</div>
                            </td>

                            <td className="p-4 space-y-1.5">
                              {item.cadastrePdf ? (
                                <a
                                  href={item.cadastrePdf.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-[11px] text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-md border border-sky-200 transition font-medium"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span className="truncate max-w-[120px]">Kadastr: {item.cadastrePdf.name}</span>
                                  <Eye className="w-3 h-3 ml-auto text-sky-600" />
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-400 block">Kadastr: Yuklanmagan</span>
                              )}

                              {item.govServicePdf ? (
                                <a
                                  href={item.govServicePdf.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-[11px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md border border-indigo-200 transition font-medium"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span className="truncate max-w-[120px]">Davlat xizmati: {item.govServicePdf.name}</span>
                                  <Eye className="w-3 h-3 ml-auto text-indigo-600" />
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-400 block">Davlat xizmati: Yuklanmagan</span>
                              )}
                            </td>

                            <td className="p-4">
                              <div className="font-medium text-slate-700">{item.reporter}</div>
                              <div className="text-[10px] text-slate-400">{item.date}</div>
                            </td>
                            <td className="p-4">
                              {item.status === 'pending' && (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-md">Kutilmoqda</span>
                              )}
                              {item.status === 'approved' && (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-md">Tasdiqlandi</span>
                              )}
                              {item.status === 'rejected' && (
                                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-1 rounded-md">Rad etildi</span>
                              )}
                            </td>
                            <td className="p-4 text-right space-x-1">
                              {item.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(item.id)}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Qabul
                                  </button>
                                  <button
                                    onClick={() => handleOpenRejectModal(item.id)}
                                    className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> Rad
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-lg transition inline-flex items-center ml-1"
                                title="Tahrirlash"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteReport(item.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition inline-flex items-center"
                                title="O'chirish"
                              >
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

            {activeTab === 'gallery' && (
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-700">Tuman bo'yicha saralash:</span>
                  </div>

                  <select
                    value={selectedGalleryDistrict}
                    onChange={(e) => setSelectedGalleryDistrict(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">Barcha Tuman va Shaharlar</option>
                    {REGIONS[0].districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {galleryReports.length === 0 ? (
                  <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-sm">
                    Ushbu tuman bo'yicha hech qanday foto hisobot yuklanmagan.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {galleryReports.map((item) => (
                      <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition">

                        <div className="p-2 bg-slate-100 grid grid-cols-2 gap-1.5 h-48 overflow-y-auto">
                          {Array.isArray(item.photos) && item.photos.length > 0 ? (
                            item.photos.map((photo, imgIndex) => (
                              <div
                                key={imgIndex}
                                onClick={() => setPreviewImage(photo.url)}
                                className="relative group cursor-pointer overflow-hidden rounded-lg border border-slate-200 h-20"
                              >
                                <img
                                  src={photo.url}
                                  alt={`${item.district}-${imgIndex}`}
                                  className="w-full h-full object-cover transition transform group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                  <Maximize2 className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-2 relative group cursor-pointer overflow-hidden rounded-lg h-full">
                              <img src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400" alt="foto" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>

                        <div className="p-4 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-800">{item.district}</span>
                            <span className="font-semibold text-sky-700">{item.institution}</span>
                          </div>

                          <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 text-[11px] text-center">
                            <div className="bg-emerald-50 p-1.5 rounded-lg">
                              <span className="block text-emerald-700 font-bold">{item.trees}</span>
                              <span className="text-[9px] text-emerald-600">Daraxt</span>
                            </div>
                            <div className="bg-amber-50 p-1.5 rounded-lg">
                              <span className="block text-amber-700 font-bold">{item.cleaning}</span>
                              <span className="text-[9px] text-amber-600">Tozalash</span>
                            </div>
                            <div className="bg-rose-50 p-1.5 rounded-lg">
                              <span className="block text-rose-700 font-bold">{item.flowers}</span>
                              <span className="text-[9px] text-rose-600">Gul</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </main>

      {/* RASMNI KATTA QILIB KO'RSATISH MODALI */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 transition bg-white/10 p-2 rounded-full backdrop-blur-md"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImage}
              alt="Kattalashtirilgan rasm"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* RAD ETISH MODALI */}
      {rejectingId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <XCircle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Hisobotni Rad Etish</h3>
              <p className="text-xs text-slate-500 mt-1">Tumanga yuboriladigan xatolik sababini kiriting:</p>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <textarea
                placeholder="Masalan: Kadastr PDF hujjati noto'g'ri yuklangan..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-rose-500 outline-none h-24"
                required
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingId(null)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow"
                >
                  Rad etish va Yuborish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAROL MODALI */}
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

      {/* TAHRIRLASH MODALI */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-sky-600" /> Hisobotni Tahrirlash va Qayta Yuborish
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tuman / Shahar</label>
                  <select
                    value={editFormData.district}
                    onChange={(e) => setEditFormData({ ...editFormData, district: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                    required
                  >
                    {REGIONS[0].districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Muassasa nomi</label>
                  <input
                    type="text"
                    value={editFormData.institutionName}
                    onChange={(e) => setEditFormData({ ...editFormData, institutionName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Daraxt</label>
                  <input
                    type="number"
                    value={editFormData.trees}
                    onChange={(e) => setEditFormData({ ...editFormData, trees: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tozalash (m²)</label>
                  <input
                    type="number"
                    value={editFormData.cleaning}
                    onChange={(e) => setEditFormData({ ...editFormData, cleaning: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Gul</label>
                  <input
                    type="number"
                    value={editFormData.flowers}
                    onChange={(e) => setEditFormData({ ...editFormData, flowers: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mas'ul xodim</label>
                <input
                  type="text"
                  value={editFormData.reporter}
                  onChange={(e) => setEditFormData({ ...editFormData, reporter: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Yangi foto hisobotlar yuklash (ixtiyoriy)</label>
                <div className="flex items-center gap-2">
                  {uploadingKey === 'edit-photos' && <Loader2 className="w-3.5 h-3.5 text-sky-500 animate-spin" />}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingKey === 'edit-photos'}
                    onChange={(e) => handleMultipleImages(e, true)}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Hozirgi rasmlar soni: {editFormData.photos.length} ta</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">PDF Hujjatlarni yangilash:</span>

                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">1. Kadastr PDF</label>
                  <input
                    type="file"
                    accept=".pdf"
                    disabled={uploadingKey === 'edit-cadastrePdf'}
                    onChange={(e) => handlePdfUpload(e, 'cadastrePdf', true)}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:bg-slate-200 cursor-pointer"
                  />
                  {editFormData.cadastrePdf && (
                    <span className="text-[10px] text-emerald-600 block mt-0.5">Mavjud: {editFormData.cadastrePdf.name}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">2. Davlat xizmati PDF</label>
                  <input
                    type="file"
                    accept=".pdf"
                    disabled={uploadingKey === 'edit-govServicePdf'}
                    onChange={(e) => handlePdfUpload(e, 'govServicePdf', true)}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:bg-slate-200 cursor-pointer"
                  />
                  {editFormData.govServicePdf && (
                    <span className="text-[10px] text-emerald-600 block mt-0.5">Mavjud: {editFormData.govServicePdf.name}</span>
                  )}
                </div>
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
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Saqlash va Yuborish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}