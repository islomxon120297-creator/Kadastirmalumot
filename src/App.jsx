import React, { useState } from 'react';
import { TreeDeciduous, Sparkles, Flower2, ShieldCheck, User } from 'lucide-react';

// Viloyatlar va Tumanlar ro'yxati
const REGIONS_DATA = {
  "Qashqadaryo": [
    "Qarshi sh.", "Kitob", "Shahrisabz", "Yakkabog'", "G'uzor", 
    "Dehqonobod", "Kamashi", "Koson", "Kasbi", "Nishon", "Muborak", "Chiraqchi"
  ],
  "Toshkent viloyati": ["Chirchiq", "Olmaliq", "Angren", "Yangiyo'l", "Bo'stonliq"],
  "Samarqand": ["Samarqand sh.", "Kattaqo'rg'on", "Urgut", "Jomboy", "Bulung'ur"]
};

export default function App() {
  const [role, setRole] = useState('user'); // 'user' yoki 'admin'
  const [region, setRegion] = useState('Qashqadaryo');
  const [district, setDistrict] = useState(REGIONS_DATA['Qashqadaryo'][0]);
  
  // Forma ma'lumotlari
  const [trees, setTrees] = useState('');
  const [area, setArea] = useState('');
  const [flowers, setFlowers] = useState('');

  // Vaqtinchalik ma'lumotlar ro'yxati
  const [reports, setReports] = useState([]);

  // Tumanlarni yangilash
  const handleRegionChange = (e) => {
    const selectedRegion = e.target.value;
    setRegion(selectedRegion);
    setDistrict(REGIONS_DATA[selectedRegion]?.[0] || '');
  };

  // Ma'lumotlarni saqlash
  const handleSubmit = (e) => {
    e.preventDefault();
    const newReport = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      region,
      district,
      trees_whitewashed: parseInt(trees) || 0,
      cleaned_area: parseInt(area) || 0,
      flowers_planted: parseInt(flowers) || 0,
    };

    setReports([newReport, ...reports]);
    alert("Ma'lumotlar muvaffaqiyatli saqlandi!");
    setTrees('');
    setArea('');
    setFlowers('');
  };

  // Statistik yig'indilar
  const totalTrees = reports.reduce((acc, r) => acc + r.trees_whitewashed, 0);
  const totalArea = reports.reduce((acc, r) => acc + r.cleaned_area, 0);
  const totalFlowers = reports.reduce((acc, r) => acc + r.flowers_planted, 0);

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {/* Yuqori Header */}
      <header className="bg-emerald-700 text-white p-4 shadow-md flex justify-between items-center px-8">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <TreeDeciduous /> Kadastir va Obodonlashtirish Portali
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm bg-emerald-800 px-3 py-1 rounded-full">
            Bugungi sana: {new Date().toISOString().split('T')[0]}
          </span>
          <button 
            onClick={() => setRole(role === 'user' ? 'admin' : 'user')}
            className="bg-white text-emerald-800 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition"
          >
            {role === 'user' ? 'Admin Panelga o\'tish' : 'Foydalanuvchi rejimiga o\'tish'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">

        {/* --- USER REJIMI: FORMA --- */}
        {role === 'user' && (
          <div className="bg-white rounded-xl shadow-md p-8 max-w-2xl mx-auto border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6 pb-2 border-b flex items-center gap-2">
              <User className="text-emerald-600" /> Kunlik hisobot kiritish
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Viloyat</label>
                  <select 
                    value={region} 
                    onChange={handleRegionChange}
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {Object.keys(REGIONS_DATA).map(reg => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tuman / Shahar</label>
                  <select 
                    value={district} 
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {REGIONS_DATA[region]?.map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Oqlangan daraxtlar (dona)</label>
                <input 
                  type="number" 
                  placeholder="Masalan: 10"
                  value={trees} 
                  onChange={(e) => setTrees(e.target.value)}
                  className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" 
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tozalangan hudud (m²)</label>
                <input 
                  type="number" 
                  placeholder="Masalan: 100"
                  value={area} 
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ekilgan gullar (dona)</label>
                <input 
                  type="number" 
                  placeholder="Masalan: 50"
                  value={flowers} 
                  onChange={(e) => setFlowers(e.target.value)}
                  className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required 
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition duration-200 mt-4"
              >
                Hisobotni Saqlash
              </button>
            </form>
          </div>
        )}

        {/* --- ADMIN REJIMI: DASHBOARD VA MONITORING --- */}
        {role === 'admin' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="text-emerald-600" /> Admin Monitoring Paneli
            </h2>

            {/* Statistika Kartalari */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="bg-emerald-100 p-4 rounded-lg text-emerald-600"><TreeDeciduous size={32} /></div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Oqlangan daraxtlar</p>
                  <h3 className="text-3xl font-extrabold text-slate-800">{totalTrees} dona</h3>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="bg-blue-100 p-4 rounded-lg text-blue-600"><Sparkles size={32} /></div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Tozalangan maydon</p>
                  <h3 className="text-3xl font-extrabold text-slate-800">{totalArea} m²</h3>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="bg-pink-100 p-4 rounded-lg text-pink-600"><Flower2 size={32} /></div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Ekilgan gullar</p>
                  <h3 className="text-3xl font-extrabold text-slate-800">{totalFlowers} dona</h3>
                </div>
              </div>
            </div>

            {/* Kelgan hisobotlar jadvali */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b font-bold text-slate-700">
                Kelib tushgan so'nggi hisobotlar
              </div>
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b">
                  <tr>
                    <th className="p-4">Sana</th>
                    <th className="p-4">Viloyat</th>
                    <th className="p-4">Tuman</th>
                    <th className="p-4">Oqlangan daraxtlar</th>
                    <th className="p-4">Tozalangan joy (m²)</th>
                    <th className="p-4">Ekilgan gullar</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50">
                      <td className="p-4">{rep.date}</td>
                      <td className="p-4">{rep.region}</td>
                      <td className="p-4 font-medium text-slate-800">{rep.district}</td>
                      <td className="p-4 text-emerald-600 font-semibold">{rep.trees_whitewashed} dona</td>
                      <td className="p-4 text-blue-600 font-semibold">{rep.cleaned_area} m²</td>
                      <td className="p-4 text-pink-600 font-semibold">{rep.flowers_planted} dona</td>
                    </tr>
                  ))}
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-4 text-center text-slate-400">Hozircha hisobotlar kiritilmadi.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}