
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, SymptomRecord, WeatherData, DiagnosisResult, TTMSeason, Language } from './types';
import { getBirthElement, getCurrentTTMSeason } from './utils/ttmCalculators';
import { analyzeSymptoms } from './services/geminiService';
import { translations } from './translations';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const COMMON_SYMPTOMS = [
  { th: "ปวดศีรษะ", en: "Headache" },
  { th: "เวียนศีรษะ", en: "Dizziness" },
  { th: "ตัวร้อน/ไข้", en: "Fever" },
  { th: "ท้องอืด", en: "Bloating" },
  { th: "อ่อนเพลีย", en: "Fatigue" },
  { th: "ปวดเมื่อยกล้ามเนื้อ", en: "Muscle Pain" },
  { th: "นอนไม่หลับ", en: "Insomnia" },
  { th: "ไอ", en: "Cough" },
  { th: "ผื่นคัน", en: "Skin Rash" }
];

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('th');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    birthDate: '1990-01-01',
    gender: 'Male',
    elementChaoRuean: getBirthElement('1990-01-01')
  });

  const [record, setRecord] = useState<SymptomRecord>({
    symptoms: [],
    onset: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    customNotes: ''
  });

  const [weather, setWeather] = useState<WeatherData>({
    temp: 32,
    condition: 'Sunny',
    season: getCurrentTTMSeason()
  });

  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const t = translations[lang];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setWeather(prev => ({ ...prev, temp: Math.floor(Math.random() * (38 - 25) + 25) }));
        },
        () => console.log("Location access denied. Using defaults.")
      );
    }
  }, []);

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setProfile(prev => ({
      ...prev,
      birthDate: date,
      elementChaoRuean: getBirthElement(date)
    }));
  };

  const toggleSymptom = (sym: string) => {
    setRecord(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(sym)
        ? prev.symptoms.filter(s => s !== sym)
        : [...prev.symptoms, sym]
    }));
  };

  const handleRunDiagnosis = async () => {
    setLoading(true);
    try {
      const result = await analyzeSymptoms(profile, record, weather, lang);
      setDiagnosis(result);
      setStep(4);
    } catch (err) {
      alert(lang === 'th' ? "การวิเคราะห์ล้มเหลว กรุณาลองใหม่" : "Analysis failed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setLoading(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`ThaiMed_Report_${profile.name || 'Anonymous'}.pdf`);
    } catch (error) {
      console.error('PDF Generation failed', error);
      alert(lang === 'th' ? "การสร้าง PDF ล้มเหลว" : "PDF generation failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleLang = () => setLang(prev => prev === 'th' ? 'en' : 'th');

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="ttm-gradient text-white p-6 shadow-lg sticky top-0 z-50 no-print">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <i className="fas fa-leaf text-2xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold">{t.appTitle}</h1>
              <p className="text-xs opacity-80">{t.appSubtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleLang}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-2 border border-white/30"
            >
              <i className="fas fa-globe"></i>
              {lang === 'th' ? 'English' : 'ภาษาไทย'}
            </button>
            <div className="hidden md:block border-l border-white/20 pl-4 text-right">
                <p className="text-[10px] uppercase opacity-70 tracking-tighter">{t.currentSeason}</p>
                <p className="text-sm font-semibold">{weather.season}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 mt-6">
        {/* Progress Stepper */}
        <div className="mb-8 flex justify-between px-2 no-print">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                step >= s ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 text-gray-400 bg-white'
              }`}>
                {s < step ? <i className="fas fa-check"></i> : s}
              </div>
              <span className={`text-[10px] mt-2 font-medium ${step >= s ? 'text-green-700' : 'text-gray-400'}`}>
                {s === 1 ? t.stepProfile : s === 2 ? t.stepSymptoms : s === 3 ? t.stepContext : t.stepResults}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Profile */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{t.patientProfile}</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.fullName}</label>
                <input 
                  type="text" 
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={lang === 'th' ? "เช่น สมชาย ไทย" : "e.g. Somchai Thai"}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.birthDate}</label>
                  <input 
                    type="date" 
                    value={profile.birthDate}
                    onChange={handleBirthDateChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.gender}</label>
                  <select 
                    value={profile.gender}
                    onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="Male">{t.male}</option>
                    <option value="Female">{t.female}</option>
                    <option value="Other">{t.other}</option>
                  </select>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-start gap-3 mt-4">
                <i className="fas fa-info-circle text-green-600 mt-1"></i>
                <div>
                  <p className="text-sm font-bold text-green-800">{t.birthElementTitle}</p>
                  <p className="text-sm text-green-700">{t.birthElementDesc} <span className="font-bold underline">{profile.elementChaoRuean}</span>. {t.birthElementSuffix}</p>
                </div>
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={!profile.name}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 transition-all shadow-md"
              >
                {t.continue}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Symptoms */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t.currentSymptoms}</h2>
            <p className="text-gray-500 mb-6">{t.symptomsSubtitle}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
              {COMMON_SYMPTOMS.map(sym => (
                <button
                  key={sym.en}
                  onClick={() => toggleSymptom(sym[lang])}
                  className={`p-4 rounded-xl text-left border-2 transition-all ${
                    record.symptoms.includes(sym[lang]) 
                    ? 'border-green-600 bg-green-50 text-green-700 font-bold' 
                    : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-sm">{sym[lang]}</span>
                </button>
              ))}
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.additionalNotes}</label>
              <textarea 
                value={record.customNotes}
                onChange={(e) => setRecord(prev => ({ ...prev, customNotes: e.target.value }))}
                placeholder={t.notesPlaceholder}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 h-32 focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-200 py-4 rounded-xl font-bold text-gray-600 hover:bg-gray-50"
              >
                {t.back}
              </button>
              <button 
                onClick={() => setStep(3)}
                disabled={record.symptoms.length === 0}
                className="flex-[2] bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 shadow-md"
              >
                {t.nextContext}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Context */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{t.envSamutthan}</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <i className="fas fa-clock text-green-600"></i> {t.kalaSamutthan}
                </h3>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.kalaDesc}</label>
                <input 
                  type="time" 
                  value={record.onset}
                  onChange={(e) => setRecord(prev => ({ ...prev, onset: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xl font-mono"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <i className="fas fa-cloud-sun text-green-600"></i> {t.utuSamutthan}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center text-xl">
                      <i className="fas fa-thermometer-half"></i>
                    </div>
                    <div className="text-gray-900">
                      <p className="text-xs text-orange-600 font-bold">{t.temperature}</p>
                      <div className="flex items-center">
                        <input 
                          type="number" 
                          value={weather.temp}
                          onChange={(e) => setWeather(prev => ({ ...prev, temp: parseInt(e.target.value) }))}
                          className="bg-transparent text-xl font-bold w-16 outline-none text-gray-900"
                        /> <span className="text-xl font-bold text-gray-900">°C</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl">
                      <i className="fas fa-wind"></i>
                    </div>
                    <div className="text-gray-900">
                      <p className="text-xs text-blue-600 font-bold">{t.currentSeason}</p>
                      <p className="text-xl font-bold text-gray-900">{weather.season}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setStep(2)}
                  className="flex-1 border border-gray-200 py-4 rounded-xl font-bold text-gray-600"
                >
                  {t.back}
                </button>
                <button 
                  onClick={handleRunDiagnosis}
                  disabled={loading}
                  className="flex-[2] bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> {t.analyzing}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-magic"></i> {t.generateReport}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 4 && diagnosis && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-700">
            <div ref={reportRef} className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 relative overflow-hidden report-pdf-container">
               <div className="absolute top-0 right-0 w-32 h-32 ttm-gradient opacity-5 rounded-bl-full no-print"></div>
              
              {/* Patient Info Header - For Report */}
              <div className="border-b border-gray-200 pb-6 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-600 text-white p-2 rounded-lg">
                    <i className="fas fa-file-medical"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">{lang === 'th' ? 'รายงานข้อมูลผู้ป่วย' : 'Patient Medical Report'}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.fullName}</p>
                      <p className="font-semibold text-gray-800">{profile.name}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.gender}</p>
                      <p className="font-semibold text-gray-800">{profile.gender === 'Male' ? t.male : profile.gender === 'Female' ? t.female : t.other}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.birthDate}</p>
                      <p className="font-semibold text-gray-800">{profile.birthDate}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang === 'th' ? 'เวลาบันทึก' : 'Report Time'}</p>
                      <p className="font-semibold text-gray-800">{new Date().toLocaleString(lang === 'th' ? 'th-TH' : 'en-US')}</p>
                   </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 leading-tight">{t.diagnosisSummary}</h2>
                  <p className="text-green-600 font-bold text-lg mt-1">{diagnosis.summary}</p>
                </div>
                <div className={`px-6 py-2 rounded-full text-white font-bold text-sm shadow-sm whitespace-nowrap ${
                  diagnosis.imbalance === 'Pitta' ? 'bg-red-500' :
                  diagnosis.imbalance === 'Wata' ? 'bg-orange-500' :
                  diagnosis.imbalance === 'Semha' ? 'bg-blue-500' : 'bg-purple-500'
                }`}>
                  {diagnosis.imbalance} {t.imbalanceSuffix}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t.elementLabel}</p>
                  <p className="font-bold text-gray-800">{profile.elementChaoRuean}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t.seasonFactor}</p>
                  <p className="font-bold text-gray-800">{weather.season}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t.ageFactor}</p>
                  <p className="font-bold text-gray-800">{lang === 'th' ? 'มัชฌิมวัย' : 'Matchima Wai'}</p>
                </div>
              </div>

              <div className="mb-10">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <i className="fas fa-microchip text-green-600"></i> {t.aiLogic}
                </h3>
                <div className="bg-green-50/50 p-6 rounded-2xl text-gray-700 leading-relaxed border border-green-100 italic">
                  "{diagnosis.logic}"
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                    <i className="fas fa-utensils"></i>
                  </div>
                  <h4 className="font-bold text-gray-800 mb-3">{t.dietaryCare}</h4>
                  <ul className="space-y-2">
                    {diagnosis.recommendations.food.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-orange-500">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                    <i className="fas fa-walking"></i>
                  </div>
                  <h4 className="font-bold text-gray-800 mb-3">{t.lifestyle}</h4>
                  <ul className="space-y-2">
                    {diagnosis.recommendations.lifestyle.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-blue-500">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4">
                    <i className="fas fa-mortar-pestle"></i>
                  </div>
                  <h4 className="font-bold text-gray-800 mb-3">{t.herbs}</h4>
                  <ul className="space-y-2">
                    {diagnosis.recommendations.herbs.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-green-500">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-4 no-print">
              <button 
                onClick={handleDownloadPDF}
                disabled={loading}
                className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-pdf"></i>}
                {t.printReport} (PDF)
              </button>
              <button 
                onClick={() => setStep(1)}
                className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 shadow-lg"
              >
                {t.startNew}
              </button>
            </div>

            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-start gap-4 no-print">
              <i className="fas fa-exclamation-triangle text-red-600 text-xl mt-1"></i>
              <p className="text-sm text-red-800 leading-relaxed">
                <strong className="block mb-1">{t.notice}</strong>
                {t.noticeText}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action for Doctor View */}
      <div className="fixed bottom-6 right-6 no-print">
        <button 
          title={t.physicianPortal}
          className="bg-gray-900 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform ring-4 ring-white"
        >
          <i className="fas fa-user-md text-xl"></i>
        </button>
      </div>
    </div>
  );
};

export default App;
