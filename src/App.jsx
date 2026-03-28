import React, { useState, useEffect, Fragment, useMemo } from 'react';
import { ACCENT_THEMES, applyAccentTheme, readStoredAccentId } from './accentThemes.js';

// --- デザイン用定数（おしゃれ・シンプル・プロ仕様） ---
const brutalCard = "bg-white border-2 border-slate-300 shadow-md rounded-2xl p-6 md:p-8 transition-all w-full";
const brutalInput = "bg-white border-2 border-slate-300 shadow-sm rounded-xl p-4 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--acc-500)]/30 focus:border-[var(--acc-400)] transition-all w-full text-base";
const brutalBtnPrimary = "bg-[var(--acc-500)] text-white border-2 border-[var(--acc-600)]/30 shadow-md rounded-2xl font-bold transition-all hover:bg-[var(--acc-600)] hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-3 py-5 text-xl";
const brutalBtnSecondary = "bg-white text-slate-700 border-2 border-slate-300 shadow-sm rounded-2xl font-bold transition-all hover:bg-slate-50 hover:border-slate-400 active:scale-[0.98] flex items-center justify-center gap-2 py-3 text-lg";

// --- アイコン部品 ---
const Icon = ({ name }) => {
  const icons = {
    home: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    plus: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
    calendar: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    list: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>,
    loader: <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>,
    user: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    x: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    chevronLeft: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
    chevronDown: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
    link: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    send: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    check: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    logout: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
    alertTriangle: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>,
    history: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>,
    repeat: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>,
    plusCircle: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
    trash: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
    image: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    filePdf: <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15h6"/><path d="M9 11h6"/></svg>
  };
  return icons[name] || null;
};

// --- 入力規則データ（★ 役職を追加） ---
const ROLES = ['GMG', 'A-SMG', 'SMG', 'TMG', 'CMG', 'CL', 'CF', 'IR'];
const TEAMS = ['QSC＆監査', '原価低減 JOYFIT', '原価低減 FIT365', '販促', 'DX', 'PT', 'オプション', 'CS・ES', '競合対策', 'スタジオPG', 'リテンション', 'オープン・リニューアル', 'リスクアセスメント', 'ニュービジネス'];
const AREAS = ['第1エリア', '第2エリア', '第3エリア', '第4エリア', '第5エリア', '第6エリア', '第7エリア'];

/** 定期配信の実行時刻（GAS の processScheduledTasksBatch と一致させる） */
const SCHEDULE_DELIVERY_TIME = '10:00';

/** 「毎月 N日 10:00」形式から日だけ取り出す */
function parseCycleDayFromString(cycleStr) {
  const m = String(cycleStr || '').match(/毎月\s+(\d{1,2})日/);
  return m ? m[1] : '1';
}

/**
 * スプレッドシートに保存された targetTags 文字列から、配信先の店舗・役職を復元（再投稿用）
 */
function parseTargetTagsToSelection(tagStr, allStores, areasList, rolesList) {
  const allStoreNames = allStores.map((s) => s.storeName);
  if (!tagStr || String(tagStr).trim() === '' || tagStr === '指定なし') {
    return { stores: [...allStoreNames], roles: [...rolesList] };
  }
  const s = String(tagStr).trim();
  let roles = [...rolesList];
  let storePart = s;
  const roleBracket = s.match(/\s*\[([^\]]+)\]\s*$/);
  if (roleBracket) {
    const roleNames = roleBracket[1].split(/,\s*/).map((r) => r.trim()).filter(Boolean);
    const matched = rolesList.filter((r) => roleNames.includes(r));
    if (matched.length > 0) roles = matched;
    storePart = s.slice(0, s.lastIndexOf('[')).trim();
  }
  if (!storePart || storePart === '全店') {
    return { stores: [...allStoreNames], roles };
  }
  const parts = storePart.split(/,\s*/).map((x) => x.trim()).filter(Boolean);
  const selected = new Set();
  parts.forEach((p) => {
    if (areasList.includes(p)) {
      allStores.filter((st) => st.area === p).forEach((st) => selected.add(st.storeName));
    } else if (allStoreNames.includes(p)) {
      selected.add(p);
    }
  });
  const stores = Array.from(selected);
  if (stores.length === 0) {
    return { stores: [...allStoreNames], roles };
  }
  return { stores, roles };
}

/** 配信先メール一覧から店舗・役職を復元（定期編集用・targetTags より正確な場合がある） */
function deriveStoresAndRolesFromTargets(targetEmails, allEmployees, allStoreNamesList, rolesList) {
  const emails = new Set((targetEmails || []).map((e) => String(e).trim()).filter(Boolean));
  if (emails.size === 0) return null;
  const storeSet = new Set();
  const roleSet = new Set();
  allEmployees.forEach((emp) => {
    if (emails.has(emp.email)) {
      (emp.stores || []).forEach((s) => storeSet.add(s));
      if (emp.role) roleSet.add(emp.role);
    }
  });
  const stores = allStoreNamesList.filter((s) => storeSet.has(s));
  const roles = rolesList.filter((r) => roleSet.has(r));
  if (stores.length === 0 && roleSet.size === 0) return null;
  return {
    stores: stores.length ? stores : allStoreNamesList,
    roles: roles.length ? roles : rolesList
  };
}
const getTerritories = (area) => {
  if (['第2エリア', '第3エリア', '第4エリア', '第5エリア', '第6エリア', '第7エリア'].includes(area)) return ['テリトリー1', 'テリトリー2', 'テリトリー3'];
  if (['第1エリア'].includes(area)) return ['テリトリー1', 'テリトリー2'];
  return ['テリトリー1', 'テリトリー2']; 
};

// --- API層 ---
const isGAS = typeof google !== 'undefined' && google.script && google.script.run;
const api = {
  fetchEmployees: () => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res([]), 600);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).getEmployees();
  }),
  fetchStoreData: () => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res([]), 600);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).getStoreData();
  }),
  registerEmployee: (data) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res({status:'success'}), 1000);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).registerEmployee(data);
  }),
  fetchTasksForUser: (email) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res([]), 800);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).getTasksForUser(email);
  }),
  createTask: (data) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res({status:'success'}), 1000);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).createNewTask(data);
  }),
  completeTask: (id, email) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res({status:'success', rank: 1}), 1500); 
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).completeTask(id, email);
  }),
  uncompleteTask: (id, email) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res({ success: true }), 400);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).uncompleteTask(id, email);
  }),
  getSentTasks: (name) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res([]), 800);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).getSentTasks(name);
  }),
  getScheduledTasks: (name) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res([]), 800);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).getScheduledTasks(name);
  }),
  registerScheduledTask: (data) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res({status:'success'}), 1000);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).registerScheduledTask(data);
  }),
  deleteScheduledTask: (id) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res({status:'success'}), 1000);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).deleteScheduledTask(id);
  }),
  updateScheduledTask: (id, data) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res({ status: 'success' }), 1000);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).updateScheduledTask(id, data);
  })
};

const formatContent = (text) => {
  if (!text) return null;
  return text.split('。').map((sentence, index, array) => (
    <React.Fragment key={index}>
      {sentence}
      {index < array.length - 1 && '。'}
      {index < array.length - 1 && <br />}
    </React.Fragment>
  ));
};

/** 添付1件あたりの上限（Drive / ペイロード負荷回避） */
const MAX_PDF_BYTES = 12 * 1024 * 1024;
const ACCEPT_IMAGES_AND_PDF = 'image/*,.pdf,application/pdf';

function isPdfFile(file) {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

function AttachmentThumb({ img, onRemove, removeBtnClass, sizeClass = 'w-32 h-32' }) {
  const [imgError, setImgError] = useState(false);
  const showFileCard =
    img.isPdf ||
    (img.type && String(img.type).toLowerCase() === 'application/pdf') ||
    (img.reuseUrl && imgError);

  return (
    <div className={`relative ${sizeClass} rounded-xl overflow-hidden border-2 border-slate-300 shadow-sm bg-slate-50 flex flex-col`}>
      {showFileCard ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center min-h-0">
          <span className="inline-flex text-rose-600"><Icon name="filePdf" /></span>
          <span className="text-[10px] font-bold text-slate-600 truncate w-full mt-1 leading-tight" title={img.name}>
            {img.name || 'PDF'}
          </span>
          <span className="text-[9px] font-semibold text-slate-400 mt-0.5">PDF</span>
        </div>
      ) : (
        <img
          src={img.preview}
          alt=""
          className="w-full h-full object-cover min-h-0 flex-1"
          onError={() => setImgError(true)}
        />
      )}
      <button type="button" onClick={onRemove} className={removeBtnClass}>
        <Icon name="x" />
      </button>
    </div>
  );
}

export default function App() {
  const [authStep, setAuthStep] = useState('loading'); 
  const [inputEmail, setInputEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tempUser, setTempUser] = useState(null); 
  const [currentUser, setCurrentUser] = useState(null);
  
  const [allEmployees, setAllEmployees] = useState([]);
  const [allStores, setAllStores] = useState([]);
  const [regData, setRegData] = useState({ name: '', role: '', team: [], area: [], territory: {}, stores: [] });

  const [activeTab, setActiveTab] = useState('home');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [accentId, setAccentId] = useState('indigo');

  useEffect(() => {
    const id = readStoredAccentId();
    setAccentId(id);
    applyAccentTheme(id);
  }, []);

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskFilter, setTaskFilter] = useState('ALL');
  const [taskTab, setTaskTab] = useState('active');

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, task: null, step: 'confirm', rank: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [requestSelectedStores, setRequestSelectedStores] = useState([]);
  const [requestSelectedRoles, setRequestSelectedRoles] = useState(ROLES); 
  const [requestForm, setRequestForm] = useState({ content: '', deadline: '', urls: [''] });
  const [requestImages, setRequestImages] = useState([]); 

  const [sentTasks, setSentTasks] = useState([]);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  
  const [scheduleDate, setScheduleDate] = useState('1');
  const [scheduleForm, setScheduleForm] = useState({ deadlineOffset: '月末', content: '', urls: [''] });
  /** チェック時は初回の今月分タスクを作らず、翌月の定期配信からのみ開始 */
  const [scheduleSkipInitialMonth, setScheduleSkipInitialMonth] = useState(false);
  /** 編集中の定期配信ID（null なら新規登録） */
  const [scheduleEditingId, setScheduleEditingId] = useState(null);
  const [scheduleImages, setScheduleImages] = useState([]); 
  const [scheduleSelectedStores, setScheduleSelectedStores] = useState([]);
  const [scheduleSelectedRoles, setScheduleSelectedRoles] = useState(ROLES); 

  const activeTasksCount = tasks.filter(t => !t.completed).length;
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const requestedTasksProgress = tasks.length === 0 ? 0 : Math.round((completedTasksCount / tasks.length) * 100);

  const todayForMin = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['home', 'request', 'repost', 'scheduled', 'checklist'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  useEffect(() => {
    Promise.all([api.fetchEmployees(), api.fetchStoreData()]).then(([employees, stores]) => {
      const emps = Array.isArray(employees) ? employees : [];
      setAllEmployees(emps);
      const strData = Array.isArray(stores) ? stores : [];
      setAllStores(strData);
      
      const allStoreNames = strData.map(s => s.storeName);
      setRequestSelectedStores(allStoreNames);
      setScheduleSelectedStores(allStoreNames);

      const savedEmail = localStorage.getItem('taskmaster_user_email');
      const user = emps.find(e => e.email === savedEmail);
      if (user) { setCurrentUser(user); setAuthStep('ready'); } else { setAuthStep('login'); }
    }).catch(() => setAuthStep('login'));
  }, []);

  const refreshTasks = () => {
    if (!currentUser) return;
    setTasksLoading(true);
    api.fetchTasksForUser(currentUser.email).then(data => {
      setTasks(Array.isArray(data) ? data : []);
      setTasksLoading(false);
    }).catch(() => setTasksLoading(false));
    api.getSentTasks(currentUser.name).then(res => setSentTasks(Array.isArray(res) ? res : []));
    api.getScheduledTasks(currentUser.name).then(res => setScheduledTasks(Array.isArray(res) ? res : []));
  };

  useEffect(() => { if (authStep === 'ready') refreshTasks(); }, [authStep, currentUser, activeTab]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const storeMatch = taskFilter === 'ALL' || t.targetTags === '全店' || (t.targetTags && t.targetTags.includes(taskFilter));
      const statusMatch = taskTab === 'active' ? !t.completed : t.completed;
      return storeMatch && statusMatch;
    });
  }, [tasks, taskFilter, taskTab]);

  const handleLoginSearch = (e) => {
    e.preventDefault();
    setLoginError('');
    const user = allEmployees.find(emp => emp.email === inputEmail.trim());
    if (user) { setTempUser(user); setAuthStep('confirm'); } else { setTempUser({ email: inputEmail.trim() }); setAuthStep('register'); }
  };

  const handleConfirmLogin = () => {
    localStorage.setItem('taskmaster_user_email', tempUser.email);
    setCurrentUser(tempUser);
    setAuthStep('ready');
  };

  const toggleTeam = (teamName) => setRegData(p => ({ ...p, team: p.team.includes(teamName) ? p.team.filter(t => t !== teamName) : [...p.team, teamName] }));
  const toggleArea = (areaName) => setRegData(prev => {
    const isSelected = prev.area.includes(areaName);
    const newArea = isSelected ? prev.area.filter(a => a !== areaName) : [...prev.area, areaName];
    const newTerritory = { ...prev.territory };
    
    let newStores = [...prev.stores];
    if (isSelected) { 
      delete newTerritory[areaName]; 
      const areaStores = allStores.filter(s => s.area === areaName).map(s => s.storeName);
      newStores = newStores.filter(s => !areaStores.includes(s));
    } else { 
      newTerritory[areaName] = getTerritories(areaName); 
      const addedStores = allStores.filter(s => s.area === areaName && newTerritory[areaName].includes(s.territory)).map(s => s.storeName);
      newStores = [...new Set([...newStores, ...addedStores])];
    }
    return { ...prev, area: newArea, territory: newTerritory, stores: newStores };
  });

  const toggleTerritory = (areaName, terrName) => setRegData(prev => {
    const terrs = prev.territory[areaName] || [];
    const isSelected = terrs.includes(terrName);
    const newTerrs = isSelected ? terrs.filter(t => t !== terrName) : [...terrs, terrName].sort();
    
    let newStores = [...prev.stores];
    if (isSelected) {
      const removedStores = allStores.filter(s => s.area === areaName && s.territory === terrName).map(s => s.storeName);
      newStores = newStores.filter(s => !removedStores.includes(s));
    } else {
      const addedStores = allStores.filter(s => s.area === areaName && s.territory === terrName).map(s => s.storeName);
      newStores = [...new Set([...newStores, ...addedStores])];
    }

    return { ...prev, territory: { ...prev.territory, [areaName]: newTerrs }, stores: newStores };
  });

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regData.role) return alert('役職を選択してください。');
    if (regData.team.length === 0 || regData.area.length === 0) return alert('チーム名、エリアは選択必須です。');
    setIsSubmitting(true);
    const formattedTeam = regData.team.join(', ');
    const formattedArea = regData.area.join(', ');
    const formattedTerritory = Object.entries(regData.territory).filter(([_, ts]) => ts.length > 0).map(([a, ts]) => `${a}: ${ts.join(',')}`).join(' / ');
    const validStoreNames = allStores.filter(s => regData.area.includes(s.area) && (regData.territory[s.area] || []).includes(s.territory)).map(s => s.storeName);
    const finalStores = regData.stores.filter(s => validStoreNames.includes(s));
    
    const newEmail = tempUser?.email || inputEmail.trim();
    const newEmployee = { ...regData, team: formattedTeam, area: formattedArea, territory: formattedTerritory, email: newEmail, stores: finalStores, role: regData.role };

    try {
      await api.registerEmployee(newEmployee);
      alert('登録が完了しました！');
      setAllEmployees(prev => [...prev, newEmployee]);
      setCurrentUser(newEmployee);
      localStorage.setItem('taskmaster_user_email', newEmployee.email);
      setAuthStep('ready');
    } catch (err) { alert('登録失敗'); } finally { setIsSubmitting(false); }
  };

  const handleLogout = () => {
    if (window.confirm('ログアウトしますか？')) {
      localStorage.removeItem('taskmaster_user_email');
      setAuthStep('login');
      setInputEmail('');
    }
  };

  const handleRequestUrlChange = (index, value) => {
    const newUrls = [...requestForm.urls];
    newUrls[index] = value;
    setRequestForm({ ...requestForm, urls: newUrls });
  };
  const handleScheduleUrlChange = (index, value) => {
    const newUrls = [...scheduleForm.urls];
    newUrls[index] = value;
    setScheduleForm({ ...scheduleForm, urls: newUrls });
  };

  const handleImageChange = (e, formType) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';

    const append = (item) => {
      if (formType === 'request') {
        setRequestImages((prev) => (prev.length < 3 ? [...prev, item] : prev));
      } else {
        setScheduleImages((prev) => (prev.length < 3 ? [...prev, item] : prev));
      }
    };

    files.forEach((file) => {
      if (!file) return;

      if (isPdfFile(file)) {
        if (file.size > MAX_PDF_BYTES) {
          alert(`PDFは${MAX_PDF_BYTES / (1024 * 1024)}MB以下にしてください: ${file.name}`);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result;
          if (typeof dataUrl !== 'string') return;
          const parts = dataUrl.split(',');
          const base64 = parts[1];
          if (!base64) return;
          append({
            name: file.name,
            type: 'application/pdf',
            base64,
            preview: dataUrl,
            isPdf: true
          });
        };
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const el = new Image();
        el.onload = () => {
          let canvas = document.createElement('canvas');
          let width = el.width;
          let height = el.height;
          const MAX_SIZE = 1200;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(el, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          append({
            name: file.name,
            type: 'image/jpeg',
            base64: dataUrl.split(',')[1],
            preview: dataUrl
          });
        };
        el.onerror = () => alert(`画像として読み込めませんでした: ${file.name}`);
        el.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index, formType) => {
    if (formType === 'request') setRequestImages(prev => prev.filter((_, i) => i !== index));
    else setScheduleImages(prev => prev.filter((_, i) => i !== index));
  };

  const generateTargetTags = (selectedStoreNames, selectedRoles) => {
    let storeTag = '';
    if (selectedStoreNames.length === 0) storeTag = '';
    else if (selectedStoreNames.length === allStores.length && allStores.length > 0) storeTag = '全店';
    else {
      let tags = [];
      AREAS.forEach(area => {
        const storesInArea = allStores.filter(s => s.area === area).map(s => s.storeName);
        if (storesInArea.length === 0) return;
        const selectedInArea = storesInArea.filter(s => selectedStoreNames.includes(s));
        if (selectedInArea.length > 0) {
          if (selectedInArea.length === storesInArea.length) tags.push(area); 
          else tags.push(...selectedInArea);
        }
      });
      storeTag = tags.join(', ');
    }

    let roleTag = '';
    if (selectedRoles.length === ROLES.length) roleTag = ''; 
    else roleTag = selectedRoles.join(', ');

    if (!storeTag && !roleTag) return '指定なし';
    if (storeTag && !roleTag) return storeTag;
    if (!storeTag && roleTag) return `全店 [${roleTag}]`;
    return `${storeTag} [${roleTag}]`;
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!requestSelectedStores.length) return alert('配信先の店舗を少なくとも1つ選択してください。');
    if (!requestSelectedRoles.length) return alert('配信先の役職を少なくとも1つ選択してください。');
    
    setIsSubmitting(true);
    const targetEmails = new Set();
    
    allEmployees.forEach(emp => {
      const storeMatch = emp.stores && emp.stores.some(s => requestSelectedStores.includes(s));
      const roleMatch = (!emp.role && requestSelectedRoles.length === ROLES.length) || requestSelectedRoles.includes(emp.role);
      
      if (storeMatch && roleMatch) {
        targetEmails.add(emp.email); 
      }
    });

    const validUrls = requestForm.urls.filter(u => u.trim() !== '');
    const finalTagsStr = generateTargetTags(requestSelectedStores, requestSelectedRoles);

    try {
      await api.createTask({
        type: '新規投稿',
        content: requestForm.content,
        deadline: requestForm.deadline,
        urls: validUrls, 
        sender: currentUser ? currentUser.name : "管理者",
        targets: Array.from(targetEmails),
        targetTags: finalTagsStr,
        images: requestImages.map((img) =>
          img.reuseUrl
            ? { name: img.name, type: img.type || 'image/jpeg', reuseUrl: img.reuseUrl }
            : { name: img.name, type: img.type, base64: img.base64 }
        )
      });
      alert('タスクを配信しました！対象者に通知されます。');
      setRequestForm({ content: '', deadline: '', urls: [''] });
      setRequestImages([]);
      setRequestSelectedStores(allStores.map(s => s.storeName));
      setRequestSelectedRoles(ROLES);
      setActiveTab('home');
      refreshTasks();
    } catch (error) { alert('送信失敗'); } finally { setIsSubmitting(false); }
  };

  const handleRepostClick = (task) => {
    let storedUrls = [''];
    if (Array.isArray(task.urls) && task.urls.length > 0) {
      storedUrls = [...task.urls];
    } else if (typeof task.url === 'string' && task.url) {
      storedUrls = task.url.split('\n').filter(Boolean);
    }
    if (storedUrls.length === 0) storedUrls = [''];

    const repostImages = [];
    if (Array.isArray(task.images)) {
      task.images.forEach((url, idx) => {
        const u = String(url || '').trim();
        if (u) {
          repostImages.push({
            name: `参考画像${idx + 1}.jpg`,
            type: 'image/jpeg',
            preview: u,
            reuseUrl: u
          });
        }
      });
    }

    const derived =
      Array.isArray(task.targets) && task.targets.length > 0
        ? deriveStoresAndRolesFromTargets(task.targets, allEmployees, allStores.map((s) => s.storeName), ROLES)
        : null;
    const { stores, roles } = derived || parseTargetTagsToSelection(task.targetTags, allStores, AREAS, ROLES);

    const deadlineInput =
      task.deadline && /^\d{4}-\d{2}-\d{2}$/.test(String(task.deadline).trim())
        ? String(task.deadline).trim()
        : '';

    setRequestForm({ content: task.content, deadline: deadlineInput, urls: storedUrls });
    setRequestImages(repostImages);
    setRequestSelectedStores(stores);
    setRequestSelectedRoles(roles);
    setActiveTab('request');
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleSelectedStores.length) return alert('配信先の店舗を少なくとも1つ選択してください。');
    if (!scheduleSelectedRoles.length) return alert('配信先の役職を少なくとも1つ選択してください。');
    
    setIsSubmitting(true);
    const targetEmails = new Set();
    allEmployees.forEach(emp => {
      const storeMatch = emp.stores && emp.stores.some(s => scheduleSelectedStores.includes(s));
      const roleMatch = (!emp.role && scheduleSelectedRoles.length === ROLES.length) || scheduleSelectedRoles.includes(emp.role);
      
      if (storeMatch && roleMatch) {
        targetEmails.add(emp.email); 
      }
    });

    const validUrls = scheduleForm.urls.filter(u => u.trim() !== '');
    const finalTagsStr = generateTargetTags(scheduleSelectedStores, scheduleSelectedRoles);
    const cycleString = `毎月 ${scheduleDate}日 ${SCHEDULE_DELIVERY_TIME}`;
    const scheduleImagePayload = scheduleImages.map((img) =>
      img.reuseUrl
        ? { name: img.name, type: img.type || 'image/jpeg', reuseUrl: img.reuseUrl }
        : { name: img.name, type: img.type, base64: img.base64 }
    );

    try {
      if (scheduleEditingId) {
        await api.updateScheduledTask(scheduleEditingId, {
          sender: currentUser.name,
          cycle: cycleString,
          deadlineOffset: scheduleForm.deadlineOffset,
          content: scheduleForm.content,
          urls: validUrls,
          targetTags: finalTagsStr,
          targets: Array.from(targetEmails),
          images: scheduleImagePayload
        });
        alert('保存しました。次回の定期配信からこの内容で送信されます。');
      } else {
        await api.registerScheduledTask({
          sender: currentUser.name,
          cycle: cycleString,
          deadlineOffset: scheduleForm.deadlineOffset,
          content: scheduleForm.content,
          urls: validUrls,
          targetTags: finalTagsStr,
          targets: Array.from(targetEmails),
          images: scheduleImagePayload,
          skipInitialTask: scheduleSkipInitialMonth
        });
        alert('スケジュールを登録しました！');
      }
      setScheduleEditingId(null);
      setScheduleForm({ deadlineOffset: '月末', content: '', urls: [''] });
      setScheduleSkipInitialMonth(false);
      setScheduleDate('1');
      setScheduleImages([]);
      setScheduleSelectedStores(allStores.map(s => s.storeName));
      setScheduleSelectedRoles(ROLES);
      refreshTasks(); 
    } catch (error) { alert(scheduleEditingId ? '保存に失敗しました' : '登録失敗'); } finally { setIsSubmitting(false); }
  };

  const handleEditScheduleClick = (task) => {
    setScheduleEditingId(task.id);
    setScheduleDate(parseCycleDayFromString(task.cycle));
    const urls = task.urls && task.urls.length > 0 ? [...task.urls] : [''];
    setScheduleForm({
      deadlineOffset: task.deadlineOffset || '月末',
      content: task.content || '',
      urls
    });
    const imgs = [];
    if (Array.isArray(task.images)) {
      task.images.forEach((url, idx) => {
        const u = String(url || '').trim();
        if (u) {
          imgs.push({
            name: `参考画像${idx + 1}.jpg`,
            type: 'image/jpeg',
            preview: u,
            reuseUrl: u
          });
        }
      });
    }
    setScheduleImages(imgs);
    const derived =
      Array.isArray(task.targets) && task.targets.length > 0
        ? deriveStoresAndRolesFromTargets(task.targets, allEmployees, allStores.map((s) => s.storeName), ROLES)
        : null;
    const { stores, roles } = derived || parseTargetTagsToSelection(task.targetTags, allStores, AREAS, ROLES);
    setScheduleSelectedStores(stores);
    setScheduleSelectedRoles(roles);
    setScheduleSkipInitialMonth(false);
    setActiveTab('scheduled');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelScheduleEdit = () => {
    setScheduleEditingId(null);
    setScheduleForm({ deadlineOffset: '月末', content: '', urls: [''] });
    setScheduleSkipInitialMonth(false);
    setScheduleDate('1');
    setScheduleImages([]);
    setScheduleSelectedStores(allStores.map((s) => s.storeName));
    setScheduleSelectedRoles(ROLES);
  };

  const handleDeleteSchedule = async (id) => {
    if (window.confirm('この定期配信を削除（停止）しますか？')) {
      await api.deleteScheduledTask(id);
      refreshTasks();
    }
  };

  const openConfirmModal = (task) => { setConfirmModal({ isOpen: true, task: task, step: 'confirm', rank: null }); };

  const executeCompleteTask = async () => {
    setConfirmModal(prev => ({ ...prev, step: 'loading' }));
    try {
      const result = await api.completeTask(confirmModal.task.id, currentUser.email);
      setConfirmModal(prev => ({ ...prev, step: 'result', rank: result.rank || 1 }));
      setTimeout(() => {
        setTasks(prev => prev.map(t => t.id === confirmModal.task.id ? { ...t, completed: true } : t));
        setConfirmModal({ isOpen: false, task: null, step: 'confirm', rank: null });
        refreshTasks();
      }, 3500);
    } catch (e) { setConfirmModal({ isOpen: false, task: null, step: 'confirm', rank: null }); }
  };

  const handleUncompleteTask = async (task) => {
    if (!currentUser?.email) return;
    if (!window.confirm('このタスクを「未実施」に戻しますか？\n（あなたの完了記録だけが削除されます。他の方の記録は変わりません。）')) return;
    try {
      const res = await api.uncompleteTask(task.id, currentUser.email);
      if (res && res.success === false) {
        alert(res.message || '取り消しに失敗しました');
        return;
      }
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: false } : t)));
      refreshTasks();
    } catch (e) {
      alert('取り消しに失敗しました');
    }
  };

  const renderTargetSelector = (selectedStores, setSelectedStores, selectedRoles, setSelectedRoles, startNum = 1) => {
    const isAllStoresSelected = selectedStores.length === allStores.length && allStores.length > 0;
    const handleSelectAllStores = (e) => {
      if (e.target.checked) setSelectedStores(allStores.map(s => s.storeName));
      else setSelectedStores([]);
    };
    
    const isAllRolesSelected = selectedRoles.length === ROLES.length;
    const handleSelectAllRoles = (e) => {
      if (e.target.checked) setSelectedRoles(ROLES);
      else setSelectedRoles([]);
    };

    return (
      <div className="w-full flex flex-col gap-6">
        
        {/* ブロック1: 役職による絞り込み */}
        <div className="bg-white border-2 border-slate-300 rounded-xl p-5 shadow-sm">
          <h4 className="text-base font-bold text-[var(--acc-600)] mb-3 block tracking-wide border-b-2 border-slate-300 pb-2">{startNum}. 配信する役職</h4>
          <label className="flex items-center font-bold text-base cursor-pointer w-max hover:opacity-70 transition-opacity mb-3">
            <input 
              type="checkbox" 
              checked={isAllRolesSelected} 
              onChange={handleSelectAllRoles}
              className="mr-3 w-5 h-5 border-2 border-slate-300 rounded accent-[var(--acc-600)] cursor-pointer" 
            />
            全役職を選択
          </label>
          <div className="flex flex-wrap gap-3 pl-2">
            {ROLES.map(role => {
              const isChecked = selectedRoles.includes(role);
              return (
                <label key={role} className={`flex items-center font-bold text-base border-2 border-slate-300 px-5 py-3 rounded-xl cursor-pointer transition-all ${isChecked ? 'bg-[var(--acc-200)] shadow-none translate-x-1 translate-y-1' : 'bg-white shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-sm'}`}>
                  <input 
                    type="checkbox" 
                    checked={isChecked} 
                    onChange={(e) => {
                      if (e.target.checked) setSelectedRoles(prev => [...prev, role]);
                      else setSelectedRoles(prev => prev.filter(r => r !== role));
                    }} 
                    className="mr-3 w-5 h-5 border-2 border-slate-300 rounded accent-[var(--acc-600)] cursor-pointer" 
                  />
                  {role}
                </label>
              );
            })}
          </div>
        </div>

        {/* ブロック2: 店舗による絞り込み */}
        <div className="bg-white border-2 border-slate-300 rounded-xl p-5 shadow-sm">
          <h4 className="text-base font-bold text-[var(--acc-600)] mb-3 block tracking-wide border-b-2 border-slate-300 pb-2">{startNum + 1}. 配信するエリア・店舗</h4>
          <label className="flex items-center font-bold text-base cursor-pointer w-max hover:opacity-70 transition-opacity mb-4">
            <input 
              type="checkbox" 
              checked={isAllStoresSelected} 
              onChange={handleSelectAllStores}
              className="mr-3 w-5 h-5 border-2 border-slate-300 rounded accent-[var(--acc-600)] cursor-pointer" 
            />
            全店舗を選択
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-start pl-2">
            {AREAS.map(area => {
              const storesInArea = allStores.filter(s => s.area === area);
              if (storesInArea.length === 0) return null;
              const isAllAreaSelected = storesInArea.every(s => selectedStores.includes(s.storeName));
              return (
                <details key={area} className="group bg-white border-2 border-slate-300 rounded-xl shadow-sm overflow-hidden">
                  <summary className="flex items-center justify-between p-3 font-bold text-base cursor-pointer hover:bg-[var(--acc-50)] transition-colors list-none select-none">
                    <label className="flex items-center cursor-pointer hover:opacity-70 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={isAllAreaSelected} 
                        onChange={(e) => {
                          const areaStoreNames = storesInArea.map(s => s.storeName);
                          if (e.target.checked) setSelectedStores(prev => Array.from(new Set([...prev, ...areaStoreNames])));
                          else setSelectedStores(prev => prev.filter(s => !areaStoreNames.includes(s)));
                        }}
                        className="mr-3 w-5 h-5 border-2 border-slate-300 rounded accent-[var(--acc-600)] cursor-pointer" 
                      />
                      {area}
                    </label>
                    <div className="w-8 h-8 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center group-open:rotate-180 transition-transform shadow-sm">
                      <Icon name="chevronDown" />
                    </div>
                  </summary>
                  <div className="p-4 border-t-2 border-slate-300 bg-gray-50 flex flex-wrap gap-2">
                    {storesInArea.map(store => {
                      const isChecked = selectedStores.includes(store.storeName);
                      return (
                        <label key={store.storeName} className={`flex items-center font-bold text-sm border-2 border-slate-300 px-3 py-1.5 rounded-xl cursor-pointer transition-all ${isChecked ? 'bg-[var(--acc-100)] shadow-sm -translate-y-[1px]' : 'bg-white hover:bg-gray-100 text-gray-500'}`}>
                          <input 
                            type="checkbox" 
                            checked={isChecked} 
                            onChange={(e) => {
                              if (e.target.checked) setSelectedStores(prev => [...prev, store.storeName]);
                              else setSelectedStores(prev => prev.filter(s => s !== store.storeName));
                            }} 
                            className="mr-2 w-4 h-4 border-2 border-slate-300 rounded accent-[var(--acc-600)] cursor-pointer" 
                          />
                          {store.storeName}
                        </label>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </div>

      </div>
    );
  };


  if (authStep === 'loading') return (
    <div className="h-screen flex items-center justify-center bg-slate-50 flex-col gap-4 text-black">
      <div className="text-[var(--acc-600)] scale-150"><Icon name="loader" /></div>
      <p className="font-black tracking-widest text-sm uppercase animate-pulse mt-4">システムを起動しています...</p>
    </div>
  );

  return (
    <Fragment>
      {/* --- モーダル群 --- */}
      {confirmModal.isOpen && confirmModal.task && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => confirmModal.step === 'confirm' && setConfirmModal({ isOpen: false, task: null, step: 'confirm', rank: null })}></div>
          <div className="bg-white rounded-[2.5rem] border-2 border-slate-300 p-8 md:p-12 max-w-xl w-full relative z-10 shadow-xl animate-fade-in overflow-hidden">
            {confirmModal.step === 'confirm' && (
              <div className="text-center">
                <div className="w-24 h-24 bg-rose-50 border-2 border-slate-300 text-rose-500 rounded-full mx-auto flex items-center justify-center mb-8 shadow-sm"><Icon name="alertTriangle" /></div>
                <h3 className="text-3xl font-black text-black mb-2 tracking-tighter">タスクを完了しますか？</h3>
                <p className="text-lg font-bold text-gray-600 mb-8">内容を確認して、よろしければ実行してください。</p>
                <div className="bg-gray-50 p-6 rounded-2xl mb-8 text-center border-2 border-slate-300 shadow-sm">
                  <p className="text-sm font-black text-[var(--acc-600)] uppercase tracking-widest mb-3 border-b-2 border-slate-300 pb-3">対象タスク</p>
                  <p className="text-xl font-bold text-black leading-relaxed">{formatContent(confirmModal.task.content)}</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setConfirmModal({ isOpen: false, task: null, step: 'confirm', rank: null })} className={brutalBtnSecondary + " flex-1"}>キャンセル</button>
                  <button onClick={executeCompleteTask} className={brutalBtnPrimary + " flex-[2]"}>完了する</button>
                </div>
              </div>
            )}
            {confirmModal.step === 'loading' && (
              <div className="text-center py-12">
                <div className="text-[var(--acc-600)] mb-8 flex justify-center scale-150"><Icon name="loader" /></div>
                <h3 className="text-3xl font-black text-black tracking-tighter animate-pulse">記録中...</h3>
              </div>
            )}
            {confirmModal.step === 'result' && (
              <div className="text-center py-6 px-2 animate-fade-in max-w-md mx-auto">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200/90 text-emerald-600 mb-5 mx-auto shadow-sm">
                  <Icon name="check" />
                </div>
                <p className="text-[10px] font-bold tracking-[0.32em] text-slate-400 uppercase mb-5">Completed</p>
                <div className="flex items-baseline justify-center gap-1.5 mb-4">
                  <span className="text-6xl sm:text-7xl font-black tabular-nums text-slate-900 tracking-tight leading-none font-mono">
                    {confirmModal.rank}
                  </span>
                  <span className="text-2xl font-black text-slate-500 pb-1">位</span>
                </div>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-2 px-1">
                  <span className="tabular-nums">{confirmModal.rank}</span>
                  番目にタスクを実行しました。
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- ログイン・登録画面 --- */}
      {authStep === 'login' && (
        <div className="h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden w-full">
          <div className="bg-white border-2 border-slate-300 rounded-[2.5rem] p-12 max-w-lg w-full shadow-xl relative z-10">
            <div className="w-24 h-24 bg-[var(--acc-500)] border-2 border-[var(--acc-400)]/50 rounded-3xl mx-auto flex items-center justify-center text-white mb-6 shadow-md"><Icon name="list" /></div>
            <div className="text-center mb-8">
              <p className="text-[10px] font-bold tracking-[0.28em] text-slate-500 uppercase mb-2">Task Force Team</p>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-2 tracking-tighter italic">To-Do List</h2>
            </div>
            <p className="text-gray-600 text-base font-bold mb-10 text-center leading-relaxed">チームのタスクを一元管理。</p>
            <form onSubmit={handleLoginSearch} className="space-y-8">
              <input type="email" required value={inputEmail} onChange={(e) => setInputEmail(e.target.value)} className={brutalInput + " text-center"} placeholder="メールアドレスを入力" />
              {loginError && <p className="text-rose-500 text-sm font-black text-center animate-bounce">{loginError}</p>}
              <button type="submit" className={brutalBtnPrimary + " w-full py-5 text-xl"}>ログイン / 新規登録</button>
            </form>
          </div>
        </div>
      )}

      {authStep === 'register' && (
        <div className="h-screen bg-slate-50 flex flex-col p-6 relative overflow-y-auto w-full">
          <div className="bg-white border-2 border-slate-300 rounded-[2.5rem] p-8 md:p-16 max-w-3xl w-full shadow-xl relative z-10 mx-auto my-auto animate-fade-in">
            <h2 className="text-4xl font-black text-black mb-4 text-center tracking-tighter">アカウント作成</h2>
            <p className="text-gray-600 text-lg font-bold mb-10 text-center leading-relaxed">初めてのログインですね。<br/>プロフィールを登録して開始してください。</p>
            <form onSubmit={handleRegisterSubmit} className="space-y-10">
              <div>
                <label className="text-sm font-black text-black uppercase mb-3 block tracking-widest">メールアドレス (固定)</label>
                <input type="email" value={tempUser?.email || inputEmail || ''} disabled className="w-full px-6 py-5 bg-gray-100 border-2 border-slate-300 rounded-2xl text-gray-500 font-bold cursor-not-allowed text-lg shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.05)]" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-sm font-black text-black uppercase mb-3 block tracking-widest">お名前 <span className="text-rose-500">*</span></label>
                  <input type="text" required value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} className={brutalInput} placeholder="例: 岡本太郎" />
                </div>
                
                <div>
                  <label className="text-sm font-black text-black uppercase mb-3 block tracking-widest">あなたの役職 <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <select required value={regData.role} onChange={e => setRegData({...regData, role: e.target.value})} className={brutalInput + " appearance-none"}>
                      <option value="" disabled>選択してください</option>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black font-black">▼</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-black text-black uppercase mb-3 block tracking-widest">チーム名（複数選択可） <span className="text-rose-500">*</span></label>
                <div className="flex flex-wrap gap-3 p-6 bg-gray-50 border-2 border-slate-300 rounded-2xl shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.05)]">
                  {TEAMS.map(t => (
                    <button key={t} type="button" onClick={() => toggleTeam(t)} className={`px-5 py-3 rounded-xl font-black text-sm border-2 border-slate-300 transition-all flex items-center gap-2 ${regData.team.includes(t) ? 'bg-[var(--acc-600)] text-white shadow-sm -translate-y-0.5' : 'bg-white text-black hover:bg-gray-100'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-black text-black uppercase mb-3 block tracking-widest">エリア（複数選択可） <span className="text-rose-500">*</span></label>
                <div className="flex flex-wrap gap-3 p-6 bg-gray-50 border-2 border-slate-300 rounded-2xl shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.05)]">
                  {AREAS.map(a => (
                    <button key={a} type="button" onClick={() => toggleArea(a)} className={`px-5 py-3 rounded-xl font-black text-sm border-2 border-slate-300 transition-all flex items-center gap-2 ${regData.area.includes(a) ? 'bg-[var(--acc-600)] text-white shadow-sm -translate-y-0.5' : 'bg-white text-black hover:bg-gray-100'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              {regData.area.length > 0 && (
                <div>
                  <label className="text-sm font-black text-black uppercase mb-3 block tracking-widest">テリトリー（不要なものはタップして外す） <span className="text-rose-500">*</span></label>
                  <div className="p-8 bg-gray-50 border-2 border-slate-300 rounded-2xl shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.05)] space-y-8">
                    {regData.area.map(areaName => (
                      <div key={areaName} className="border-b-2 border-slate-300 pb-6 last:border-0 last:pb-0">
                        <p className="text-lg font-black text-black mb-4 flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-[var(--acc-500)] border-2 border-slate-300"></span>{areaName}</p>
                        <div className="flex flex-wrap gap-3 pl-6">
                          {getTerritories(areaName).map(terr => {
                             const isSelected = regData.territory[areaName]?.includes(terr);
                             return (
                              <button key={terr} type="button" onClick={() => toggleTerritory(areaName, terr)} className={`px-5 py-3 rounded-xl font-black text-sm border-2 border-slate-300 transition-all flex items-center gap-2 ${isSelected ? 'bg-[var(--acc-600)] text-white shadow-sm -translate-y-0.5' : 'bg-white text-black hover:bg-gray-100'}`}>
                                {terr}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {regData.area.length > 0 && (
                <div>
                  <label className="text-sm font-black text-black uppercase mb-3 block tracking-widest">管轄店舗 <span className="text-xs font-bold text-gray-500 ml-2">※管轄外の店舗のみチェックを外してください</span></label>
                  <div className="p-8 bg-gray-50 border-2 border-slate-300 rounded-2xl shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.05)] space-y-8">
                    {regData.area.map(areaName => {
                      const selectedTerrs = regData.territory[areaName] || [];
                      const storesInArea = allStores.filter(s => s.area === areaName && selectedTerrs.includes(s.territory));
                      if (storesInArea.length === 0) return null;
                      return (
                        <div key={areaName} className="border-b-2 border-slate-300 pb-6 last:border-0 last:pb-0">
                           <p className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4">{areaName} の店舗</p>
                           <div className="flex flex-wrap gap-3 pl-6">
                             {storesInArea.map(store => {
                                const isSelected = regData.stores.includes(store.storeName);
                                return (
                                  <button key={store.storeName} type="button" onClick={() => { setRegData(prev => ({ ...prev, stores: isSelected ? prev.stores.filter(s => s !== store.storeName) : [...prev.stores, store.storeName] })) }} className={`px-5 py-3 rounded-xl font-black text-sm border-2 border-slate-300 transition-all flex items-center gap-2 ${isSelected ? 'bg-[var(--acc-600)] text-white shadow-sm -translate-y-0.5' : 'bg-white text-black hover:bg-gray-100'}`}>
                                    {store.storeName}
                                  </button>
                                )
                             })}
                           </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              <div className="pt-8 flex gap-6">
                <button type="button" onClick={() => {setAuthStep('login'); setInputEmail('');}} className={brutalBtnSecondary + " w-1/3"}>戻る</button>
                <button type="submit" disabled={isSubmitting} className={brutalBtnPrimary + " w-2/3"}>{isSubmitting ? <span className="animate-spin"><Icon name="loader" /></span> : '登録して開始'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {authStep === 'confirm' && (
        <div className="h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden w-full">
          <div className="bg-white border-2 border-slate-300 rounded-[2.5rem] p-12 max-w-lg w-full text-center shadow-xl relative z-10">
            <div className="w-32 h-32 bg-gray-100 border-2 border-slate-300 rounded-full mx-auto flex items-center justify-center text-black mb-8 shadow-sm">
              <div className="scale-150"><Icon name="user" /></div>
            </div>
            <p className="text-[var(--acc-600)] font-black text-sm uppercase tracking-widest mb-3">{tempUser?.role || tempUser?.team}</p>
            <h2 className="text-5xl font-black text-black mb-8 tracking-tighter">{tempUser?.name}</h2>
            <div className="bg-gray-50 border-2 border-slate-300 rounded-2xl p-6 mb-10 shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.05)]">
              <p className="text-xs text-gray-500 font-black uppercase mb-4 tracking-widest">担当エリア</p>
              {tempUser?.territory ? (
                <div className="space-y-2">
                  {String(tempUser.territory).split(' / ').map((t, i) => (
                    <p key={i} className="text-lg font-bold text-black">{t}</p>
                  ))}
                </div>
              ) : (
                <p className="text-lg font-bold text-black">{tempUser?.area}</p>
              )}
            </div>
            <div className="space-y-6">
              <button onClick={handleConfirmLogin} className={brutalBtnPrimary + " w-full py-5"}>このアカウントで開始</button>
              <button onClick={() => setAuthStep('login')} className="w-full text-gray-500 font-black text-base uppercase tracking-widest pt-4 hover:text-black transition-colors">別のアカウントにする</button>
            </div>
          </div>
        </div>
      )}

      {/* --- メイン画面 --- */}
      {authStep === 'ready' && (
        <div className="flex flex-col h-screen bg-slate-50 font-sans text-black overflow-hidden w-full">
          
          <header className="h-20 bg-white border-b-2 border-slate-300 flex items-center justify-between px-6 md:px-10 flex-shrink-0 z-40 w-full relative">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-[var(--acc-500)] text-white flex items-center justify-center rounded-xl shadow-sm">
                    <Icon name="check" />
                 </div>
                 <div className="flex flex-col leading-tight gap-0.5">
                    <span className="text-[8px] sm:text-[9px] font-bold tracking-[0.22em] text-slate-500 uppercase">Task Force Team</span>
                    <h1 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900">To-Do List</h1>
                 </div>
               </div>
               
               {activeTab !== 'home' && (
                 <>
                   <div className="h-8 w-1 bg-gray-300 hidden md:block"></div>
                   <button onClick={() => setActiveTab('home')} className="flex items-center gap-2 text-base font-black text-black hover:opacity-70 transition-opacity">
                     <Icon name="chevronLeft" /> 戻る
                   </button>
                   <h2 className="font-black text-black tracking-tighter uppercase text-xl md:text-2xl ml-2">
                     {activeTab === 'request' ? 'タスク配信' : activeTab === 'repost' ? '再投稿' : activeTab === 'scheduled' ? '定期配信' : 'リストチェック'}
                   </h2>
                 </>
               )}
               {activeTab === 'home' && (
                 <>
                   <div className="h-8 w-1 bg-gray-300 hidden md:block"></div>
                   <h2 className="font-black text-slate-900 tracking-tight uppercase text-lg md:text-xl">Dashboard</h2>
                 </>
               )}
            </div>

            <div className="relative">
              <button onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)} className="flex items-center space-x-3 group bg-white border-2 border-slate-300 px-4 py-2 rounded-xl shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:translate-x-1 active:translate-y-1 relative z-50">
                  <div className="flex flex-col items-end text-right hidden sm:flex">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--acc-600)] leading-none mb-1">ACCOUNT</span>
                      <span className="text-sm font-black text-black leading-none max-w-[120px] truncate">{currentUser?.name}</span>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold border-2 border-slate-300 shadow-sm">
                     <Icon name="user" />
                  </div>
              </button>
              
              {isAccountMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsAccountMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-[min(14rem,88vw)] max-h-[min(88vh,34rem)] flex flex-col bg-white border-2 border-slate-300 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                    <div className="p-3.5 border-b-2 border-slate-200 bg-white shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 border-2 border-slate-300 flex items-center justify-center text-black mb-2.5 shadow-sm mx-auto">
                        <div className="scale-125"><Icon name="user" /></div>
                      </div>
                      <p className="text-center text-lg font-black text-slate-900 tracking-tight leading-tight">{currentUser?.name}</p>
                      <p className="text-center text-[10px] font-bold text-slate-500 mt-0.5 break-all px-1">{currentUser?.email}</p>
                    </div>
                    <div className="px-3.5 py-3 space-y-3 bg-white overflow-y-auto overscroll-contain min-h-0 max-h-[min(42vh,220px)] border-b border-slate-100">
                      {currentUser?.role && (
                        <div>
                          <p className="text-[9px] font-black text-[var(--acc-600)] uppercase tracking-widest mb-0.5">役職</p>
                          <p className="text-xs font-black text-black bg-[var(--acc-50)] border border-[var(--acc-200)] px-2 py-0.5 rounded-md w-max">{currentUser?.role}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-[9px] font-black text-[var(--acc-600)] uppercase tracking-widest mb-0.5">担当エリア</p>
                        <p className="text-xs font-bold text-slate-900">{currentUser?.area}</p>
                        {currentUser?.territory && <p className="text-[11px] font-semibold text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">{String(currentUser.territory).split(' / ').join('\n')}</p>}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-[var(--acc-600)] uppercase tracking-widest mb-0.5">管轄店舗</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {currentUser?.stores?.length > 0 ? currentUser.stores.map((s, i) => <span key={i} className="bg-gray-100 border border-slate-400 text-slate-900 text-[9px] px-1.5 py-0.5 rounded font-bold">{s}</span>) : <span className="text-[11px] text-slate-500">店舗なし</span>}
                        </div>
                      </div>
                    </div>
                    <div className="px-3 py-2.5 border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white shrink-0">
                      <p className="text-[9px] font-black text-[var(--acc-600)] uppercase tracking-widest mb-2">アクセントカラー</p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {ACCENT_THEMES.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            title={t.label}
                            onClick={() => {
                              applyAccentTheme(t.id);
                              setAccentId(t.id);
                            }}
                            className={`h-8 rounded-lg border-2 transition-all shadow-sm flex items-center justify-center ${
                              accentId === t.id
                                ? 'border-black ring-2 ring-black/25 ring-offset-1 scale-[1.02]'
                                : 'border-slate-200 hover:border-slate-400 hover:scale-105 active:scale-95'
                            }`}
                            style={{ background: t['500'] }}
                          >
                            {accentId === t.id && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm border border-white/80" />
                            )}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold text-center mt-2">
                        現在: <span className="text-[var(--acc-700)]">{ACCENT_THEMES.find((x) => x.id === accentId)?.label ?? '—'}</span>
                      </p>
                    </div>
                    <div className="p-2.5 border-t-2 border-slate-300 bg-slate-50 shrink-0">
                      <button onClick={() => { setIsAccountMenuOpen(false); handleLogout(); }} className="w-full bg-rose-50 text-rose-600 border-2 border-slate-300 font-black py-2 rounded-lg shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                        <Icon name="logout" /> ログアウト
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-slate-50 w-full">
            <div className="max-w-[1920px] mx-auto w-full px-2 md:px-4 pb-20">
              
              {/* === HOME === */}
              {activeTab === 'home' && (
                <div className="animate-fade-in space-y-5 mt-3 w-full">
                  {/* コンパクトな状況（主役は下の4メニュー） */}
                  <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2 px-1 border-b border-slate-200/90 pb-4">
                    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm text-slate-600">
                      <span>
                        未完了{' '}
                        <strong className="text-slate-900 font-black tabular-nums text-base">{activeTasksCount}</strong>
                        <span className="font-bold text-slate-500"> 件</span>
                      </span>
                      <span className="hidden sm:inline text-slate-300 select-none">/</span>
                      <span>
                        完了率{' '}
                        <strong className="text-slate-900 font-black tabular-nums text-base">{requestedTasksProgress}</strong>
                        <span className="font-bold text-slate-500"> %</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 md:gap-6 w-full">
                    {/* 新規投稿：アクセントテーマ統一（配信系3つ） */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('request')}
                      className="group text-left bg-white border-2 border-slate-300 rounded-2xl p-6 md:p-7 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 border-t-[3px] border-t-[var(--acc-600)] hover:border-t-[var(--acc-700)]"
                    >
                      <div className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center border-2 border-[var(--acc-200)] bg-gradient-to-br from-white via-[var(--acc-50)] to-[var(--acc-100)] text-[var(--acc-900)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_3px_12px_-2px_rgba(0,0,0,0.07)] group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_6px_18px_-2px_rgba(0,0,0,0.1)] group-hover:ring-1 group-hover:ring-[var(--acc-300)] [&>svg]:scale-[0.85]">
                        <Icon name="plus" />
                      </div>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight">新規投稿</h4>
                    </button>
                    {/* 再投稿：同アクセント（トップ帯だけ一段明るく） */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('repost')}
                      className="group text-left bg-white border-2 border-slate-300 rounded-2xl p-6 md:p-7 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 border-t-[3px] border-t-[var(--acc-500)] hover:border-t-[var(--acc-600)]"
                    >
                      <div className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center border-2 border-[var(--acc-200)] bg-gradient-to-br from-white via-[var(--acc-50)] to-[var(--acc-100)] text-[var(--acc-900)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_3px_12px_-2px_rgba(0,0,0,0.07)] group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_6px_18px_-2px_rgba(0,0,0,0.1)] group-hover:ring-1 group-hover:ring-[var(--acc-300)] [&>svg]:scale-[0.85]">
                        <Icon name="history" />
                      </div>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight">再投稿</h4>
                    </button>
                    {/* 定期配信：同アクセント（トップ帯をやや濃く） */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('scheduled')}
                      className="group text-left bg-white border-2 border-slate-300 rounded-2xl p-6 md:p-7 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 border-t-[3px] border-t-[var(--acc-700)] hover:border-t-[var(--acc-900)]"
                    >
                      <div className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center border-2 border-[var(--acc-200)] bg-gradient-to-br from-white via-[var(--acc-50)] to-[var(--acc-100)] text-[var(--acc-900)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_3px_12px_-2px_rgba(0,0,0,0.07)] group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_6px_18px_-2px_rgba(0,0,0,0.1)] group-hover:ring-1 group-hover:ring-[var(--acc-300)] [&>svg]:scale-[0.85]">
                        <Icon name="repeat" />
                      </div>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight">定期配信</h4>
                    </button>
                    {/* リストチェック：ブラック固定（操作・確認の軸） */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('checklist')}
                      className="group text-left relative overflow-hidden bg-white border-2 border-slate-400 rounded-2xl p-6 md:p-7 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 border-t-[4px] border-t-slate-800 ring-1 ring-slate-900/5"
                    >
                      <div className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center border-2 border-slate-600 bg-gradient-to-br from-slate-700 via-slate-900 to-slate-950 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_6px_16px_rgba(0,0,0,0.35)] group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_22px_rgba(0,0,0,0.4)] [&>svg]:scale-[0.85]">
                        <Icon name="list" />
                      </div>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight">リストチェック</h4>
                      {activeTasksCount > 0 && (
                        <div className="absolute top-3 right-3 bg-[var(--acc-600)] border-2 border-[var(--acc-500)] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm tracking-widest">
                          未完了 {activeTasksCount}
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )}
              
              {/* === タスク配信 === */}
              {activeTab === 'request' && (
                <div className="animate-fade-in w-full mt-4">
                  <form onSubmit={handleTaskSubmit} className="flex flex-col gap-6 w-full">
                    {/* 入力フロー：1→2→3→4｜5→6 の見える区切り */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-0 w-full">
                      {/* 左列：入力内容 (1〜4) */}
                      <div className="flex flex-col gap-5 w-full xl:pr-8 xl:border-r-2 xl:border-slate-300">
                        <div className="bg-white border-2 border-slate-300 rounded-xl p-5 shadow-sm">
                          <label className="text-base font-bold text-[var(--acc-600)] mb-3 block tracking-wide border-b-2 border-slate-300 pb-2">1. 依頼内容 <span className="text-rose-500">*</span></label>
                          <textarea value={requestForm.content} onChange={e => setRequestForm({...requestForm, content: e.target.value})} required rows="5" className={`${brutalInput} min-h-[160px]`} placeholder="具体的な指示内容を入力してください"></textarea>
                        </div>
                        
                        <div className="bg-white border-2 border-slate-300 rounded-xl p-5 shadow-sm">
                          <label className="text-base font-bold text-[var(--acc-600)] mb-3 block tracking-wide border-b-2 border-slate-300 pb-2">2. 期限 (DL) <span className="text-rose-500">*</span></label>
                          <input type="date" min={todayForMin} value={requestForm.deadline} onChange={e => setRequestForm({...requestForm, deadline: e.target.value})} required className={brutalInput} />
                        </div>
                        
                        <div className="bg-white border-2 border-slate-300 rounded-xl p-5 shadow-sm">
                          <label className="text-base font-bold text-[var(--acc-600)] mb-3 block tracking-wide border-b-2 border-slate-300 pb-2">3. URL (任意 / 最大3つ)</label>
                          <div className="space-y-3">
                            {requestForm.urls.map((url, i) => (
                              <div key={i} className="flex gap-3">
                                <input type="url" value={url} onChange={e => handleRequestUrlChange(i, e.target.value)} className={brutalInput + " py-3"} placeholder="https://..." />
                                {requestForm.urls.length > 1 && (
                                  <button type="button" onClick={() => {
                                    const newUrls = requestForm.urls.filter((_, index) => index !== i);
                                    setRequestForm({ ...requestForm, urls: newUrls });
                                  }} className="w-16 bg-rose-500 text-white border-2 border-slate-300 shadow-sm rounded-xl flex items-center justify-center hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"><Icon name="trash" /></button>
                                )}
                              </div>
                            ))}
                            {requestForm.urls.length < 3 && (
                              <button type="button" onClick={() => setRequestForm({ ...requestForm, urls: [...requestForm.urls, ''] })} className={brutalBtnSecondary + " w-full py-3 text-base"}>
                                <Icon name="plusCircle" /> URLを追加
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="bg-white border-2 border-slate-300 rounded-xl p-5 shadow-sm">
                          <label className="text-base font-bold text-[var(--acc-600)] mb-3 block tracking-wide border-b-2 border-slate-300 pb-2">4. 参考画像・PDF (任意 / 最大3件)</label>
                          {requestImages.length < 3 && (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-100 transition-colors relative cursor-pointer group">
                              <input type="file" multiple accept={ACCEPT_IMAGES_AND_PDF} onChange={(e) => handleImageChange(e, 'request')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                              <div className="flex flex-col items-center gap-4 text-black group-hover:scale-110 transition-transform">
                                <div className="w-16 h-16 bg-white border-2 border-slate-300 rounded-full flex items-center justify-center shadow-sm"><Icon name="image" /></div>
                                <span className="text-base font-black">タップして画像またはPDFを選択<br/><span className="text-xs text-gray-500">（自動でDriveに保存されます）</span></span>
                              </div>
                            </div>
                          )}
                          {requestImages.length > 0 && (
                            <div className="flex flex-wrap gap-4 mt-6">
                              {requestImages.map((img, i) => (
                                <AttachmentThumb
                                  key={i}
                                  img={img}
                                  onRemove={() => removeImage(i, 'request')}
                                  removeBtnClass="absolute top-2 right-2 bg-rose-500 text-white border-2 border-slate-300 p-2 rounded-full hover:scale-110 transition-transform z-20"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 右列：配信先 (5〜6) */}
                      <div className="w-full flex flex-col gap-5 xl:pl-8">
                        {renderTargetSelector(requestSelectedStores, setRequestSelectedStores, requestSelectedRoles, setRequestSelectedRoles, 5)}
                      </div>
                    </div>

                    <div className="border-t-2 border-slate-300 pt-6 w-full mt-2">
                      <button type="submit" disabled={isSubmitting} className={brutalBtnPrimary + " w-full py-6 text-xl"}>
                        {isSubmitting ? <span className="animate-spin scale-150"><Icon name="loader" /></span> : <Icon name="send" />}
                        <span className="tracking-widest ml-4">{isSubmitting ? '処理中...' : 'この内容で配信する'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* === 再投稿 (履歴) === */}
              {activeTab === 'repost' && (
                <div className="animate-fade-in w-full mt-4">
                  <p className="text-base font-bold text-slate-600 mb-8 text-center border-b-2 border-slate-300 pb-6 leading-relaxed">
                    <strong className="text-slate-800">新規投稿</strong>で過去に配信した内容だけが一覧に出ます（定期配信の一覧とは別です）。
                    <br />
                    <span className="text-sm font-semibold text-slate-500 mt-2 block">依頼内容・URL・参考画像・PDF・配信先を引き継いでタスク配信画面を開きます。期限だけ選び直してください。</span>
                  </p>
                  
                  <div className="space-y-6 w-full">
                    {sentTasks.length === 0 ? (
                      <p className="text-center text-slate-500 font-bold py-20 text-lg">送信履歴がありません</p>
                    ) : sentTasks.map(task => (
                      <div key={task.id} className="bg-white p-6 rounded-2xl border-2 border-slate-300 flex flex-col md:flex-row justify-between items-center gap-6 hover:border-[var(--acc-200)] hover:shadow-md transition-all shadow-sm w-full">
                         <div className="flex-1 text-center md:text-left w-full">
                           <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                             <span className="bg-[var(--acc-500)] text-white text-xs font-bold px-3 py-1.5 rounded-lg tracking-widest">過去の配信</span>
                             <span className="text-sm text-slate-600 font-bold">{task.createdAt}</span>
                             {task.targetTags && <span className="text-xs font-bold text-slate-700 bg-slate-50 border-2 border-slate-300 px-3 py-1 rounded-lg">宛先: {task.targetTags}</span>}
                           </div>
                           <p className="text-slate-800 text-lg font-bold leading-relaxed">{formatContent(task.content)}</p>
                         </div>
                         <button onClick={() => handleRepostClick(task)} className={brutalBtnSecondary + " w-full md:w-auto px-8 flex-shrink-0"}>
                           再利用して作成
                         </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* === 定期配信 === */}
              {activeTab === 'scheduled' && (
                <div className="w-full space-y-10 animate-fade-in mt-4">
                  {scheduleEditingId && (
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <p className="text-base font-black text-amber-900">
                        編集中：保存すると<strong>次回の定期配信から</strong>この内容で送信されます（今日のタスクは増えません）。
                      </p>
                      <button type="button" onClick={handleCancelScheduleEdit} className={brutalBtnSecondary + " whitespace-nowrap py-3 px-6 text-sm"}>
                        編集をやめる
                      </button>
                    </div>
                  )}
                  <div className="bg-[var(--acc-50)] border-2 border-[var(--acc-200)] rounded-2xl p-6 md:p-8 space-y-5 shadow-sm">
                    <p className="text-lg md:text-xl font-black text-[var(--acc-900)] text-center leading-snug">
                      初回のみ当月分は即タスクに反映されます。
                    </p>
                    <ul className="space-y-3 text-base text-slate-800 font-bold leading-relaxed">
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-[var(--acc-500)] text-white text-sm flex items-center justify-center font-black">1</span>
                        <span>初回の期限は、下の「タスクの期限（毎月〜まで）」に従います。</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-[var(--acc-500)] text-white text-sm flex items-center justify-center font-black">2</span>
                        <span>2回目以降は、指定した<strong className="text-[var(--acc-600)]">日</strong>にだけ自動配信されます。</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-600 text-white text-sm flex items-center justify-center font-black">3</span>
                        <span>配信の時刻は<strong>午前10:00</strong>固定です。</span>
                      </li>
                    </ul>
                  </div>
                  
                  <form onSubmit={handleScheduleSubmit} className="flex flex-col gap-6 w-full">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-0 w-full">
                      {/* 左列：1〜4 */}
                      <div className="flex flex-col gap-5 w-full xl:pr-8 xl:border-r-2 xl:border-slate-300">
                        <div className="bg-white border-2 border-slate-300 rounded-xl p-5 shadow-sm">
                          <label className="text-base font-bold text-[var(--acc-600)] mb-3 block tracking-wide border-b-2 border-slate-300 pb-2">1. 配信スケジュール <span className="text-rose-500">*</span></label>
                          <p className="text-sm text-slate-600 mb-4">配信時刻は<strong>午前10:00</strong>固定です（変更はシステム管理者向け設定です）。</p>
                          <div className="flex flex-col sm:flex-row gap-4 mt-2">
                            <div className="flex-1">
                              <label className="text-xs font-bold text-slate-600 mb-2 block">毎月何日に配信するか</label>
                              <div className="relative">
                                <select value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className={brutalInput + " appearance-none text-center"}>
                                  {Array.from({length: 31}, (_, i) => <option key={i+1} value={i+1}>{i+1}日</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-bold">▼</div>
                              </div>
                            </div>
                            <div className="flex-1">
                              <label className="text-xs font-bold text-slate-600 mb-2 block">タスクの期限（毎月〜まで）</label>
                              <div className="relative">
                                <select value={scheduleForm.deadlineOffset} onChange={e => setScheduleForm({...scheduleForm, deadlineOffset: e.target.value})} className={brutalInput + " appearance-none text-center"}>
                                  <option value="月末">月末</option>
                                  {Array.from({length: 31}, (_, i) => <option key={i+1} value={`${i+1}日`}>{i+1}日</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-bold">▼</div>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-4">登録日: {todayForMin} ／ 保存される配信時刻: {SCHEDULE_DELIVERY_TIME}</p>

                          {!scheduleEditingId && (
                            <label className="flex items-start gap-3 mt-5 p-4 rounded-xl border-2 border-amber-200 bg-amber-50/80 cursor-pointer hover:bg-amber-50 transition-colors">
                              <input
                                type="checkbox"
                                checked={scheduleSkipInitialMonth}
                                onChange={(e) => setScheduleSkipInitialMonth(e.target.checked)}
                                className="mt-1 w-5 h-5 rounded border-2 border-slate-400 text-[var(--acc-600)] focus:ring-[var(--acc-500)]"
                              />
                              <span className="text-sm font-bold text-slate-800 leading-relaxed">
                                <span className="block text-amber-900">今月の初回分は作成しない</span>
                                <span className="block text-xs font-semibold text-slate-600 mt-1">今月の配信日が過ぎたあとに登録する場合など、チェックすると翌月の定期配信からのみ始まります。</span>
                              </span>
                            </label>
                          )}
                        </div>

                        <div className="bg-white border-2 border-slate-300 rounded-xl p-5 shadow-sm">
                          <label className="text-base font-bold text-[var(--acc-600)] mb-3 block tracking-wide border-b-2 border-slate-300 pb-2">2. 依頼内容 <span className="text-rose-500">*</span></label>
                          <textarea required value={scheduleForm.content} onChange={e => setScheduleForm({...scheduleForm, content: e.target.value})} rows="5" className={`${brutalInput} min-h-[160px]`} placeholder="例: 月末の棚卸し報告をお願いします"></textarea>
                        </div>

                        <div className="bg-white border-2 border-slate-300 rounded-xl p-5 shadow-sm">
                          <label className="text-base font-bold text-[var(--acc-600)] mb-3 block tracking-wide border-b-2 border-slate-300 pb-2">3. URL (任意 / 最大3つ)</label>
                          <div className="space-y-3">
                            {scheduleForm.urls.map((url, i) => (
                              <div key={i} className="flex gap-3">
                                <input type="url" value={url} onChange={e => handleScheduleUrlChange(i, e.target.value)} className={brutalInput + " py-3"} placeholder="https://..." />
                                {scheduleForm.urls.length > 1 && (
                                  <button type="button" onClick={() => {
                                    const newUrls = scheduleForm.urls.filter((_, index) => index !== i);
                                    setScheduleForm({ ...scheduleForm, urls: newUrls });
                                  }} className="w-14 bg-rose-500 text-white border-2 border-slate-300 shadow-sm rounded-xl flex items-center justify-center hover:opacity-90 transition-all"><Icon name="trash" /></button>
                                )}
                              </div>
                            ))}
                            {scheduleForm.urls.length < 3 && (
                              <button type="button" onClick={() => setScheduleForm({ ...scheduleForm, urls: [...scheduleForm.urls, ''] })} className={brutalBtnSecondary + " w-full py-2 text-sm"}>
                                <Icon name="plusCircle" /> URLを追加
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="bg-white border-2 border-slate-300 rounded-xl p-5 shadow-sm">
                          <label className="text-base font-bold text-[var(--acc-600)] mb-3 block tracking-wide border-b-2 border-slate-300 pb-2">4. 参考画像・PDF (任意 / 最大3件)</label>
                          {scheduleImages.length < 3 && (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-100 transition-colors relative cursor-pointer group">
                              <input type="file" multiple accept={ACCEPT_IMAGES_AND_PDF} onChange={(e) => handleImageChange(e, 'schedule')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                              <div className="flex flex-col items-center gap-3 text-slate-700 group-hover:scale-105 transition-transform">
                                <div className="w-14 h-14 bg-white border-2 border-slate-300 rounded-full flex items-center justify-center shadow-sm"><Icon name="image" /></div>
                                <span className="text-sm font-bold">タップして画像またはPDFを選択</span>
                              </div>
                            </div>
                          )}
                          {scheduleImages.length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-4">
                              {scheduleImages.map((img, i) => (
                                <AttachmentThumb
                                  key={i}
                                  img={img}
                                  sizeClass="w-28 h-28"
                                  onRemove={() => removeImage(i, 'schedule')}
                                  removeBtnClass="absolute top-1 right-1 bg-rose-500 text-white border-2 border-slate-300 p-1.5 rounded-full hover:scale-110 transition-transform z-20"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 右列：5〜6 */}
                      <div className="w-full flex flex-col gap-5 xl:pl-8">
                        {renderTargetSelector(scheduleSelectedStores, setScheduleSelectedStores, scheduleSelectedRoles, setScheduleSelectedRoles, 5)}
                      </div>
                    </div>

                    <div className="border-t-2 border-slate-300 pt-6 w-full mt-2 flex flex-col gap-4">
                      <button type="submit" disabled={isSubmitting} className={brutalBtnPrimary + " w-full py-6 text-xl"}>
                          {isSubmitting ? <span className="animate-spin scale-150"><Icon name="loader" /></span> : <Icon name="repeat" />}
                        <span className="tracking-widest ml-4">
                          {isSubmitting ? '処理中...' : scheduleEditingId ? '変更を保存する' : 'スケジュールを登録する'}
                        </span>
                      </button>
                    </div>
                  </form>

                  <div className="mt-10">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 tracking-tight border-b-2 border-slate-300 pb-4">稼働中の定期配信</h3>
                    <div className="space-y-6 w-full">
                      {scheduledTasks.length === 0 ? (
                        <p className="text-center text-gray-500 font-black py-10 text-xl">登録されている定期配信はありません</p>
                      ) : scheduledTasks.map(task => (
                        <div key={task.id} className="bg-white p-6 rounded-xl border-2 border-slate-300 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm w-full">
                           <div className="flex-1 text-center md:text-left w-full">
                             <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                               <span className="bg-[var(--acc-500)] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2"><Icon name="repeat"/> {task.cycle}</span>
                               <span className="text-xs font-bold text-slate-700 bg-slate-50 border-2 border-slate-300 px-3 py-1 rounded-lg">期限: 毎月 {task.deadlineOffset}</span>
                               {task.targetTags && <span className="text-xs font-bold text-slate-700 bg-slate-50 border-2 border-slate-300 px-3 py-1 rounded-lg">宛先: {task.targetTags}</span>}
                             </div>
                             <p className="text-slate-800 text-lg font-bold leading-relaxed">{formatContent(task.content)}</p>
                           </div>
                           <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-shrink-0">
                             <button type="button" onClick={() => handleEditScheduleClick(task)} className="w-full bg-white border-2 border-[var(--acc-300)] text-[var(--acc-700)] hover:bg-[var(--acc-50)] px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm">
                               <Icon name="calendar" /> 内容を編集
                             </button>
                             <button type="button" onClick={() => handleDeleteSchedule(task.id)} className="w-full bg-slate-50 border-2 border-slate-300 hover:bg-rose-500 hover:text-white text-slate-700 hover:border-rose-400 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm">
                               <Icon name="trash" /> 停止
                             </button>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* === リストチェック画面 === */}
              {activeTab === 'checklist' && (
                <div className="animate-fade-in w-full mt-4">
                  
                  <div className="flex flex-col sm:flex-row gap-4 mb-8 w-full max-w-2xl">
                    <button onClick={() => setTaskTab('active')} className={`flex-1 py-3 px-5 text-base rounded-lg border-2 font-bold transition-all flex items-center justify-center gap-2 ${taskTab === 'active' ? 'bg-[var(--acc-600)] text-white border-[var(--acc-600)]' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
                      未実施 <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${taskTab === 'active' ? 'bg-white text-[var(--acc-600)]' : 'bg-slate-600 text-white'}`}>{activeTasksCount}</span>
                    </button>
                    <button onClick={() => setTaskTab('completed')} className={`flex-1 py-3 px-5 text-base rounded-lg border-2 font-bold transition-all flex items-center justify-center gap-2 ${taskTab === 'completed' ? 'bg-white text-slate-800 border-slate-400' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}>
                      実施済み <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${taskTab === 'completed' ? 'bg-slate-600 text-white' : 'bg-slate-400 text-white'}`}>{completedTasksCount}</span>
                    </button>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-4 mb-6 no-scrollbar w-full border-b-2 border-slate-300">
                    <button onClick={() => setTaskFilter('ALL')} className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold border-2 border-slate-300 transition-all flex items-center gap-2 ${taskFilter === 'ALL' ? 'bg-[var(--acc-600)] text-white border-[var(--acc-600)]' : 'bg-white text-slate-700 hover:bg-slate-50'}`}>
                      全店
                      {activeTasksCount > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--acc-500)] text-white font-bold">{activeTasksCount}</span>}
                    </button>
                    {currentUser?.stores?.map(s => {
                      const storeTaskCount = tasks.filter(t => !t.completed && t.targetTags && t.targetTags.includes(s)).length;
                      return (
                        <button key={s} onClick={() => setTaskFilter(s)} className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold border-2 border-slate-300 transition-all flex items-center gap-2 ${taskFilter === s ? 'bg-[var(--acc-600)] text-white border-[var(--acc-600)]' : 'bg-white text-slate-700 hover:bg-slate-50'}`}>
                          {s}
                          {storeTaskCount > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--acc-500)] text-white font-bold">{storeTaskCount}</span>}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="space-y-6 pb-24 w-full">
                    {tasksLoading ? (
                      <div className="space-y-6 animate-pulse"><div className="h-32 bg-white border-2 border-slate-300 rounded-2xl shadow-lg w-full"></div></div>
                    ) : filteredTasks.length === 0 ? (
                      <div className="py-24 text-center flex flex-col items-center gap-6 text-gray-400 font-black uppercase tracking-[0.2em] w-full">
                        <div className="w-24 h-24 border-4 border-gray-300 rounded-full flex items-center justify-center [&>svg]:scale-125"><Icon name="check" /></div>
                        <p className="text-lg">タスクはありません</p>
                      </div>
                    ) : filteredTasks.map(task => (
                      <div key={task.id} className="bg-white border-2 border-slate-300 rounded-xl p-5 flex flex-col xl:flex-row gap-5 items-center animate-fade-in shadow-sm w-full">
                        <div className="flex-1 w-full min-w-0">
                          
                          <div className="flex flex-wrap gap-2 mb-3 items-center">
                            {task.targetTags && <span className="bg-[var(--acc-500)] text-white text-xs font-bold px-3 py-1 rounded-lg">{task.targetTags}</span>}
                            <span className="bg-slate-100 text-slate-700 border-2 border-slate-300 text-xs font-bold px-2 py-1 rounded-lg">{task.type}</span>
                            <span className="text-xs font-bold text-gray-500 ml-1">from {task.sender}</span>
                          </div>
                          
                          <h3 className={`text-lg md:text-xl font-black text-black leading-relaxed mb-6 break-words ${task.completed ? 'line-through opacity-40' : ''}`}>
                            {formatContent(task.content)}
                          </h3>
                          
                          {!task.completed && (
                            <div className="flex flex-col gap-4 border-t-2 border-slate-200 pt-4">
                              
                              <div className="flex flex-wrap gap-3 items-center">
                                <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-2">
                                  <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-300">提出期限</span>
                                  <span className="text-base font-bold text-slate-800">{task.deadline ? task.deadline.replace(/-/g, '/') + ' まで' : '期限なし'}</span>
                                </div>

                                {task.daysRemaining !== null && task.daysRemaining !== undefined && (
                                  <>
                                    {task.daysRemaining < 0 && (
                                      <div className="flex items-center justify-center px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold animate-pulse">⚠ 超過</div>
                                    )}
                                    {task.daysRemaining === 0 && (
                                      <div className="flex items-center justify-center px-4 py-2 bg-rose-500 text-white rounded-lg text-xs font-bold">今日まで</div>
                                    )}
                                    {task.daysRemaining === 1 && (
                                      <div className="flex items-center justify-center px-4 py-2 bg-orange-400 text-white rounded-lg text-xs font-bold">明日まで</div>
                                    )}
                                    {task.daysRemaining === 2 && (
                                      <div className="flex items-center justify-center px-4 py-2 bg-amber-300 text-slate-800 rounded-lg text-xs font-bold">残り2日</div>
                                    )}
                                  </>
                                )}
                              </div>

                              <div className="flex flex-col gap-4 w-full mt-4">
                                {task.urls && task.urls.map((u, i) => u && typeof u === 'string' && u.trim() !== '' && (
                                  <a key={i} href={u} target="_blank" rel="noreferrer" className="w-full bg-white border-2 border-slate-300 text-black text-sm font-black px-4 py-3 rounded-xl hover:bg-gray-50 transition-all shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-sm flex items-center justify-center gap-2 max-w-md">
                                    <Icon name="link" /> リンクを開く
                                  </a>
                                ))}
                                {task.images && task.images.map((imgUrl, i) => imgUrl && typeof imgUrl === 'string' && imgUrl.trim() !== '' && (
                                  <a key={`img-${i}`} href={imgUrl} target="_blank" rel="noreferrer" className="w-full bg-amber-100 border-2 border-slate-300 text-black text-sm font-black px-4 py-3 rounded-xl hover:bg-amber-200 transition-all shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-sm flex items-center justify-center gap-2 max-w-md">
                                    <Icon name="image" /> 添付を開く
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-shrink-0 border-t-2 xl:border-t-0 border-l-0 xl:border-l-2 border-slate-200 pt-4 xl:pt-0 xl:pl-6 flex items-center justify-center w-full xl:w-auto mt-4 xl:mt-0">
                          {!task.completed ? (
                            <button onClick={() => openConfirmModal(task)} className="w-14 h-14 rounded-xl border-2 border-slate-300 bg-white text-slate-300 hover:bg-emerald-500 hover:text-white hover:border-emerald-400 transition-all flex items-center justify-center shadow-sm hover:shadow-md group">
                              <span className="group-hover:scale-110 transition-transform inline-flex"><Icon name="check" /></span>
                            </button>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-14 h-14 rounded-xl border-2 border-slate-200 bg-slate-100 text-slate-400 flex items-center justify-center">
                                <span className="inline-flex"><Icon name="check" /></span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleUncompleteTask(task)}
                                className="text-[11px] font-bold text-slate-500 hover:text-rose-600 underline underline-offset-2 whitespace-nowrap"
                              >
                                完了を取り消す
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        /* ViteのデフォルトCSSを完全リセットし、幅の制限を破壊する */
        html, body, #root { 
          margin: 0 !important; 
          padding: 0 !important; 
          max-width: none !important; 
          width: 100% !important; 
          height: 100% !important; 
          text-align: left !important; 
        }
        body { background: #f8fafc; font-family: 'Noto Sans JP', sans-serif; -webkit-font-smoothing: antialiased; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
        .text-center-last { text-align-last: center; }
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
      `}} />
    </Fragment>
  );
}