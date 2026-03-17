import React, { useState, useEffect, Fragment, useMemo } from 'react';

// --- デザイン用定数（ネオブルータリズム） ---
const brutalCard = "bg-white border-4 border-black shadow-[8px_8px_0_0_#000] rounded-2xl p-6 md:p-8 transition-all";
const brutalInput = "bg-white border-2 border-black shadow-[4px_4px_0_0_#000] rounded-xl p-4 font-black text-black focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all w-full text-base";
const brutalBtnPrimary = "bg-indigo-600 text-white border-4 border-black shadow-[6px_6px_0_0_#000] rounded-2xl font-black transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-x-2 active:translate-y-2 active:shadow-none flex items-center justify-center gap-2 py-4 text-xl";
const brutalBtnSecondary = "bg-white text-black border-4 border-black shadow-[6px_6px_0_0_#000] rounded-2xl font-black transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-x-2 active:translate-y-2 active:shadow-none flex items-center justify-center gap-2 py-4 text-xl";

// --- アイコン部品 ---
const Icon = ({ name }) => {
  const icons = {
    home: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    plus: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
    list: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>,
    loader: <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>,
    user: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    menu: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    x: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    chevronLeft: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
    link: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    send: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    check: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    logout: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
    alertTriangle: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>,
    history: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>,
    repeat: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>,
    plusCircle: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
    trash: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
    image: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
  };
  return icons[name] || null;
};

// --- 入力規則データ ---
const TEAMS = ['QSC＆監査', '原価低減 JOYFIT', '原価低減 FIT365', '販促', 'DX', 'PT', 'オプション', 'CS・ES', '競合対策', 'スタジオPG', 'リテンション', 'オープン・リニューアル', 'リスクアセスメント', 'ニュービジネス'];
const AREAS = ['第1エリア', '第2エリア', '第3エリア', '第4エリア', '第5エリア', '第6エリア', '第7エリア'];
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
  })
};

export default function App() {
  const [authStep, setAuthStep] = useState('loading'); 
  const [inputEmail, setInputEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tempUser, setTempUser] = useState(null); 
  const [currentUser, setCurrentUser] = useState(null);
  
  const [allEmployees, setAllEmployees] = useState([]);
  const [allStores, setAllStores] = useState([]);
  const [regData, setRegData] = useState({ name: '', team: [], area: [], territory: {}, stores: [] });

  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskFilter, setTaskFilter] = useState('ALL');
  const [taskTab, setTaskTab] = useState('active');

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, task: null, step: 'confirm', rank: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [requestSelectedStores, setRequestSelectedStores] = useState([]);
  const [requestForm, setRequestForm] = useState({ content: '', deadline: '', urls: [''] });
  const [requestImages, setRequestImages] = useState([]); 

  const [sentTasks, setSentTasks] = useState([]);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  
  const [scheduleDate, setScheduleDate] = useState('1');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [scheduleForm, setScheduleForm] = useState({ deadlineOffset: '当日中', content: '', urls: [''] });
  const [scheduleImages, setScheduleImages] = useState([]); 
  const [scheduleSelectedStores, setScheduleSelectedStores] = useState([]);

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
    if (!document.getElementById('tailwindcss-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwindcss-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
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
    if (isSelected) delete newTerritory[areaName]; else newTerritory[areaName] = getTerritories(areaName);
    return { ...prev, area: newArea, territory: newTerritory };
  });
  const toggleTerritory = (areaName, terrName) => setRegData(prev => {
    const terrs = prev.territory[areaName] || [];
    const newTerrs = terrs.includes(terrName) ? terrs.filter(t => t !== terrName) : [...terrs, terrName].sort();
    return { ...prev, territory: { ...prev.territory, [areaName]: newTerrs } };
  });

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (regData.team.length === 0 || regData.area.length === 0) return alert('チーム名、エリアは選択必須です。');
    setIsSubmitting(true);
    const formattedTeam = regData.team.join(', ');
    const formattedArea = regData.area.join(', ');
    const formattedTerritory = Object.entries(regData.territory).filter(([_, ts]) => ts.length > 0).map(([a, ts]) => `${a}: ${ts.join(',')}`).join(' / ');
    const validStoreNames = allStores.filter(s => regData.area.includes(s.area) && (regData.territory[s.area] || []).includes(s.territory)).map(s => s.storeName);
    const finalStores = regData.stores.filter(s => validStoreNames.includes(s));
    
    const newEmail = tempUser?.email || inputEmail.trim();
    const newEmployee = { ...regData, team: formattedTeam, area: formattedArea, territory: formattedTerritory, email: newEmail, stores: finalStores };

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
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          let canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1200;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          let ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          let dataUrl = canvas.toDataURL('image/jpeg', 0.7); 
          const imageData = { name: file.name, type: 'image/jpeg', base64: dataUrl.split(',')[1], preview: dataUrl };
          if (formType === 'request') {
            setRequestImages(prev => prev.length < 3 ? [...prev, imageData] : prev);
          } else {
            setScheduleImages(prev => prev.length < 3 ? [...prev, imageData] : prev);
          }
        };
        img.src = reader.result;
      };
      if (file) reader.readAsDataURL(file);
    });
  };

  const removeImage = (index, formType) => {
    if (formType === 'request') setRequestImages(prev => prev.filter((_, i) => i !== index));
    else setScheduleImages(prev => prev.filter((_, i) => i !== index));
  };

  const generateTargetTags = (selectedStoreNames) => {
    if (selectedStoreNames.length === 0) return '';
    if (selectedStoreNames.length === allStores.length && allStores.length > 0) return '全店';
    
    let tags = [];
    AREAS.forEach(area => {
      const storesInArea = allStores.filter(s => s.area === area).map(s => s.storeName);
      if (storesInArea.length === 0) return;
      const selectedInArea = storesInArea.filter(s => selectedStoreNames.includes(s));
      
      if (selectedInArea.length > 0) {
        if (selectedInArea.length === storesInArea.length) {
          tags.push(area); 
        } else {
          tags.push(...selectedInArea);
        }
      }
    });
    return tags.join(', ');
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!requestSelectedStores.length) return alert('配信先を少なくとも1つ選択してください。');
    setIsSubmitting(true);
    const targetEmails = new Set();
    allEmployees.forEach(emp => {
      if (emp.stores && emp.stores.some(s => requestSelectedStores.includes(s))) {
        targetEmails.add(emp.email); 
      }
    });

    const validUrls = requestForm.urls.filter(u => u.trim() !== '');
    const finalTagsStr = generateTargetTags(requestSelectedStores);

    try {
      await api.createTask({
        type: '新規投稿',
        content: requestForm.content,
        deadline: requestForm.deadline,
        urls: validUrls, 
        sender: currentUser ? currentUser.name : "管理者",
        targets: Array.from(targetEmails),
        targetTags: finalTagsStr,
        images: requestImages.map(img => ({ name: img.name, type: img.type, base64: img.base64 }))
      });
      alert('タスクを配信しました！対象者に通知されます。');
      setRequestForm({ content: '', deadline: '', urls: [''] });
      setRequestImages([]);
      setRequestSelectedStores(allStores.map(s => s.storeName));
      setActiveTab('home');
      refreshTasks();
    } catch (error) { alert('送信失敗'); } finally { setIsSubmitting(false); }
  };

  const handleRepostClick = (task) => {
    let storedUrls = [''];
    if (Array.isArray(task.urls) && task.urls.length > 0) storedUrls = task.urls;
    else if (typeof task.url === 'string' && task.url) storedUrls = task.url.split('\n');
    
    setRequestForm({ content: task.content, deadline: '', urls: storedUrls });
    setRequestImages([]); 
    setRequestSelectedStores(allStores.map(s => s.storeName));
    setActiveTab('request');
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleSelectedStores.length) return alert('配信先を少なくとも1つ選択してください。');
    setIsSubmitting(true);
    const targetEmails = new Set();
    allEmployees.forEach(emp => {
      if (emp.stores && emp.stores.some(s => scheduleSelectedStores.includes(s))) {
        targetEmails.add(emp.email); 
      }
    });

    const validUrls = scheduleForm.urls.filter(u => u.trim() !== '');
    const finalTagsStr = generateTargetTags(scheduleSelectedStores);
    const cycleString = `毎月 ${scheduleDate}日 ${scheduleTime}`;

    try {
      await api.registerScheduledTask({
        sender: currentUser.name,
        cycle: cycleString,
        deadlineOffset: scheduleForm.deadlineOffset,
        content: scheduleForm.content,
        urls: validUrls,
        targetTags: finalTagsStr,
        targets: Array.from(targetEmails),
        images: scheduleImages.map(img => ({ name: img.name, type: img.type, base64: img.base64 }))
      });
      alert('スケジュールを登録しました！');
      setScheduleForm({ deadlineOffset: '当日中', content: '', urls: [''] });
      setScheduleDate('1');
      setScheduleTime('09:00');
      setScheduleImages([]);
      setScheduleSelectedStores(allStores.map(s => s.storeName));
      refreshTasks(); 
    } catch (error) { alert('登録失敗'); } finally { setIsSubmitting(false); }
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

  const renderTargetSelector = (selectedStores, setSelectedStores) => {
    return (
      <div className="border-4 border-black rounded-2xl p-6 bg-white shadow-[6px_6px_0_0_#000] max-h-96 overflow-y-auto w-full">
        <div className="mb-6 pb-6 border-b-4 border-gray-200">
          <label className="flex items-center font-black text-xl cursor-pointer w-max hover:opacity-70 transition-opacity">
            <input 
              type="checkbox" 
              checked={selectedStores.length === allStores.length && allStores.length > 0} 
              onChange={(e) => setSelectedStores(e.target.checked ? allStores.map(s => s.storeName) : [])}
              className="mr-4 w-7 h-7 border-2 border-black rounded accent-indigo-600 cursor-pointer" 
            />
            全店舗を選択
          </label>
        </div>
        {AREAS.map(area => {
          const storesInArea = allStores.filter(s => s.area === area);
          if (storesInArea.length === 0) return null;
          const isAllAreaSelected = storesInArea.every(s => selectedStores.includes(s.storeName));
          return (
            <div key={area} className="mb-8 last:mb-0">
              <label className="flex items-center font-black text-lg mb-4 cursor-pointer w-max hover:opacity-70 transition-opacity">
                <input 
                  type="checkbox" 
                  checked={isAllAreaSelected} 
                  onChange={(e) => {
                    const areaStoreNames = storesInArea.map(s => s.storeName);
                    if (e.target.checked) {
                      setSelectedStores(prev => Array.from(new Set([...prev, ...areaStoreNames])));
                    } else {
                      setSelectedStores(prev => prev.filter(s => !areaStoreNames.includes(s)));
                    }
                  }}
                  className="mr-4 w-6 h-6 border-2 border-black rounded accent-indigo-600 cursor-pointer" 
                />
                {area}
              </label>
              <div className="pl-10 flex flex-wrap gap-3">
                {storesInArea.map(store => (
                  <label key={store.storeName} className={`flex items-center font-bold text-sm border-2 border-black px-4 py-2 rounded-xl cursor-pointer transition-all ${selectedStores.includes(store.storeName) ? 'bg-indigo-100 shadow-[2px_2px_0_0_#000] -translate-y-[1px]' : 'bg-white hover:bg-gray-100'}`}>
                    <input 
                      type="checkbox" 
                      checked={selectedStores.includes(store.storeName)} 
                      onChange={(e) => {
                        if (e.target.checked) setSelectedStores(prev => [...prev, store.storeName]);
                        else setSelectedStores(prev => prev.filter(s => s !== store.storeName));
                      }} 
                      className="mr-2 w-5 h-5 border-2 border-black rounded accent-indigo-600 cursor-pointer" 
                    />
                    {store.storeName}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };


  if (authStep === 'loading') return (
    <div className="h-screen flex items-center justify-center bg-slate-50 flex-col gap-4 text-black">
      <div className="text-indigo-600 scale-150"><Icon name="loader" /></div>
      <p className="font-black tracking-widest text-sm uppercase animate-pulse mt-4">システムを起動しています...</p>
    </div>
  );

  return (
    <Fragment>
      {confirmModal.isOpen && confirmModal.task && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => confirmModal.step === 'confirm' && setConfirmModal({ isOpen: false, task: null, step: 'confirm', rank: null })}></div>
          <div className="bg-white rounded-[2.5rem] border-4 border-black p-8 md:p-12 max-w-xl w-full relative z-10 shadow-[12px_12px_0_0_#000] animate-fade-in overflow-hidden">
            {confirmModal.step === 'confirm' && (
              <div className="text-center">
                <div className="w-24 h-24 bg-rose-50 border-4 border-black text-rose-500 rounded-full mx-auto flex items-center justify-center mb-8 shadow-[4px_4px_0_0_#000]"><Icon name="alertTriangle" /></div>
                <h3 className="text-3xl font-black text-black mb-2 tracking-tighter">タスクを完了しますか？</h3>
                <p className="text-lg font-bold text-gray-600 mb-8">内容を確認して、よろしければ実行してください。</p>
                <div className="bg-gray-50 p-6 rounded-2xl mb-8 text-center border-4 border-black shadow-[4px_4px_0_0_#000]">
                  <p className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-3 border-b-2 border-black pb-3">対象タスク</p>
                  <p className="text-xl font-bold text-black leading-relaxed">{confirmModal.task.content}</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setConfirmModal({ isOpen: false, task: null, step: 'confirm', rank: null })} className={brutalBtnSecondary + " flex-1"}>キャンセル</button>
                  <button onClick={executeCompleteTask} className={brutalBtnPrimary + " flex-[2]"}>完了して順位を見る</button>
                </div>
              </div>
            )}
            {confirmModal.step === 'loading' && (
              <div className="text-center py-12">
                <div className="text-indigo-600 mb-8 flex justify-center scale-150"><Icon name="loader" /></div>
                <h3 className="text-3xl font-black text-black tracking-tighter animate-pulse">記録中...</h3>
              </div>
            )}
            {confirmModal.step === 'result' && (
              <div className="text-center py-8 animate-fade-in relative">
                <div className="w-40 h-40 bg-gradient-to-tr from-amber-300 via-yellow-300 to-orange-200 text-black border-4 border-black rounded-full mx-auto flex items-center justify-center mb-8 shadow-[8px_8px_0_0_#000] transform hover:scale-110 transition-transform"><span className="text-8xl font-black tracking-tighter drop-shadow-sm">{confirmModal.rank}</span><span className="text-2xl font-black mt-6 ml-1">位</span></div>
                <h3 className="text-4xl font-black text-black mb-4 tracking-tighter relative z-10">完了しました！</h3>
                <p className="text-lg font-bold text-gray-600 mb-10 relative z-10">このタスクを全社で <span className="text-black font-black text-2xl mx-1">{confirmModal.rank}番目</span> にクリアしました！</p>
                <div className="w-full bg-gray-100 border-4 border-black h-6 rounded-full overflow-hidden shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.1)]"><div className="bg-emerald-400 border-r-4 border-black h-full w-full animate-[progress_3.5s_ease-in-out]"></div></div>
              </div>
            )}
          </div>
        </div>
      )}

      {authStep === 'login' && (
        <div className="h-screen bg-[#f0f0f0] flex items-center justify-center p-6 relative overflow-hidden">
          <div className="bg-white border-4 border-black rounded-[2.5rem] p-12 max-w-lg w-full shadow-[12px_12px_0_0_#000] relative z-10">
            <div className="w-24 h-24 bg-indigo-600 border-4 border-black rounded-3xl mx-auto flex items-center justify-center text-white mb-8 shadow-[6px_6px_0_0_#000]"><Icon name="list" /></div>
            <h2 className="text-5xl font-black text-black mb-4 text-center tracking-tighter italic">ToDo List</h2>
            <p className="text-gray-600 text-lg font-bold mb-10 text-center leading-relaxed">チームのタスクを一元管理。</p>
            <form onSubmit={handleLoginSearch} className="space-y-8">
              <input type="email" required value={inputEmail} onChange={(e) => setInputEmail(e.target.value)} className={brutalInput + " text-center"} placeholder="メールアドレスを入力" />
              {loginError && <p className="text-rose-500 text-sm font-black text-center animate-bounce">{loginError}</p>}
              <button type="submit" className={brutalBtnPrimary + " w-full py-5 text-xl"}>ログイン / 新規登録</button>
            </form>
          </div>
        </div>
      )}

      {authStep === 'register' && (
        <div className="h-screen bg-[#f0f0f0] flex flex-col p-6 relative overflow-y-auto">
          <div className="bg-white border-4 border-black rounded-[2.5rem] p-8 md:p-16 max-w-3xl w-full shadow-[12px_12px_0_0_#000] relative z-10 mx-auto my-auto animate-fade-in">
            <h2 className="text-4xl font-black text-black mb-4 text-center tracking-tighter">アカウント作成</h2>
            <p className="text-gray-600 text-lg font-bold mb-10 text-center leading-relaxed">初めてのログインですね。<br/>プロフィールを登録して開始してください。</p>
            <form onSubmit={handleRegisterSubmit} className="space-y-10">
              <div>
                <label className="text-sm font-black text-black uppercase mb-3 block tracking-widest">メールアドレス (固定)</label>
                <input type="email" value={tempUser?.email || inputEmail || ''} disabled className="w-full px-6 py-5 bg-gray-100 border-4 border-black rounded-2xl text-gray-500 font-bold cursor-not-allowed text-lg shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.05)]" />
              </div>
              <div>
                <label className="text-sm font-black text-black uppercase mb-3 block tracking-widest">お名前 <span className="text-rose-500">*</span></label>
                <input type="text" required value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} className={brutalInput} placeholder="例: 岡本太郎 (空欄なし)" />
              </div>
              <div>
                <label className="text-sm font-black text-black uppercase mb-3 block tracking-widest">チーム名（複数選択可） <span className="text-rose-500">*</span></label>
                <div className="flex flex-wrap gap-3 p-6 bg-gray-50 border-4 border-black rounded-2xl shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.05)]">
                  {TEAMS.map(t => (
                    <button key={t} type="button" onClick={() => toggleTeam(t)} className={`px-5 py-3 rounded-xl font-black text-sm border-2 border-black transition-all flex items-center gap-2 ${regData.team.includes(t) ? 'bg-indigo-600 text-white shadow-[2px_2px_0_0_#000] -translate-y-0.5' : 'bg-white text-black hover:bg-gray-100'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-black text-black uppercase mb-3 block tracking-widest">エリア（複数選択可） <span className="text-rose-500">*</span></label>
                <div className="flex flex-wrap gap-3 p-6 bg-gray-50 border-4 border-black rounded-2xl shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.05)]">
                  {AREAS.map(a => (
                    <button key={a} type="button" onClick={() => toggleArea(a)} className={`px-5 py-3 rounded-xl font-black text-sm border-2 border-black transition-all flex items-center gap-2 ${regData.area.includes(a) ? 'bg-indigo-600 text-white shadow-[2px_2px_0_0_#000] -translate-y-0.5' : 'bg-white text-black hover:bg-gray-100'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              {regData.area.length > 0 && (
                <div>
                  <label className="text-sm font-black text-black uppercase mb-3 block tracking-widest">テリトリー（不要なものはタップして外す） <span className="text-rose-500">*</span></label>
                  <div className="p-8 bg-gray-50 border-4 border-black rounded-2xl shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.05)] space-y-8">
                    {regData.area.map(areaName => (
                      <div key={areaName} className="border-b-4 border-gray-200 pb-6 last:border-0 last:pb-0">
                        <p className="text-lg font-black text-black mb-4 flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-indigo-500 border-2 border-black"></span>{areaName}</p>
                        <div className="flex flex-wrap gap-3 pl-6">
                          {getTerritories(areaName).map(terr => {
                             const isSelected = regData.territory[areaName]?.includes(terr);
                             return (
                              <button key={terr} type="button" onClick={() => toggleTerritory(areaName, terr)} className={`px-5 py-3 rounded-xl font-black text-sm border-2 border-black transition-all flex items-center gap-2 ${isSelected ? 'bg-indigo-600 text-white shadow-[2px_2px_0_0_#000] -translate-y-0.5' : 'bg-white text-black hover:bg-gray-100'}`}>
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
                  <label className="text-sm font-black text-black uppercase mb-3 block tracking-widest">管轄店舗を選択</label>
                  <div className="p-8 bg-gray-50 border-4 border-black rounded-2xl shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.05)] space-y-8">
                    {regData.area.map(areaName => {
                      const selectedTerrs = regData.territory[areaName] || [];
                      const storesInArea = allStores.filter(s => s.area === areaName && selectedTerrs.includes(s.territory));
                      if (storesInArea.length === 0) return null;
                      return (
                        <div key={areaName} className="border-b-4 border-gray-200 pb-6 last:border-0 last:pb-0">
                           <p className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4">{areaName} の店舗</p>
                           <div className="flex flex-wrap gap-3 pl-6">
                             {storesInArea.map(store => {
                                const isSelected = regData.stores.includes(store.storeName);
                                return (
                                  <button key={store.storeName} type="button" onClick={() => { setRegData(prev => ({ ...prev, stores: isSelected ? prev.stores.filter(s => s !== store.storeName) : [...prev.stores, store.storeName] })) }} className={`px-5 py-3 rounded-xl font-black text-sm border-2 border-black transition-all flex items-center gap-2 ${isSelected ? 'bg-indigo-600 text-white shadow-[2px_2px_0_0_#000] -translate-y-0.5' : 'bg-white text-black hover:bg-gray-100'}`}>
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
        <div className="h-screen bg-[#f0f0f0] flex items-center justify-center p-6 relative overflow-hidden">
          <div className="bg-white border-4 border-black rounded-[2.5rem] p-12 max-w-lg w-full text-center shadow-[12px_12px_0_0_#000] relative z-10">
            <div className="w-32 h-32 bg-indigo-100 border-4 border-black rounded-full mx-auto flex items-center justify-center text-indigo-600 mb-8 shadow-[4px_4px_0_0_#000]"><Icon name="user" /></div>
            <p className="text-indigo-600 font-black text-sm uppercase tracking-widest mb-3">{tempUser?.team}</p>
            <h2 className="text-5xl font-black text-black mb-8 tracking-tighter">{tempUser?.name}</h2>
            <div className="bg-gray-50 border-4 border-black rounded-2xl p-6 mb-10 shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.05)]">
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

      {authStep === 'ready' && (
        <div className="flex h-screen bg-[#f0f0f0] font-sans text-black overflow-hidden relative">
          
          <aside className={`bg-white border-r-4 border-black flex flex-col transition-all duration-300 overflow-hidden z-50 absolute lg:relative h-full shadow-[8px_0_0_0_rgba(0,0,0,0.1)] ${isSidebarOpen ? 'w-80' : 'w-0 lg:w-80'}`}>
            <div className="h-20 border-b-4 border-black flex items-center justify-between px-8 bg-indigo-50">
              <span className="font-black text-black tracking-tighter uppercase text-xl italic">ToDo List</span>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-black hover:scale-110 transition-transform"><Icon name="x" /></button>
            </div>
            <div className="flex flex-col items-center p-8 flex-1 overflow-y-auto">
              <div className="w-32 h-32 bg-white border-4 border-black rounded-3xl flex items-center justify-center text-indigo-600 mb-6 shadow-[6px_6px_0_0_#000]"><Icon name="user" /></div>
              <p className="text-black font-black text-3xl tracking-tighter text-center mb-8">{currentUser?.name}</p>
              <div className="w-full space-y-8">
                <div className="bg-white rounded-2xl p-6 text-center border-4 border-black shadow-[4px_4px_0_0_#000]">
                  <p className="text-xs text-indigo-600 font-black uppercase mb-4 tracking-widest">担当エリア</p>
                  {currentUser?.territory ? (
                    <div className="space-y-3">
                      {String(currentUser.territory).split(' / ').map((t, i) => (
                        <p key={i} className="text-base font-black text-black leading-relaxed">{t}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-base font-black text-black">{currentUser?.area}</p>
                  )}
                </div>
                <div className="bg-white rounded-2xl p-6 text-center border-4 border-black shadow-[4px_4px_0_0_#000]">
                  <p className="text-xs text-indigo-600 font-black uppercase mb-4 tracking-widest">担当店舗</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {currentUser?.stores?.length > 0 ? currentUser.stores.map((s, i) => <span key={i} className="bg-gray-100 border-2 border-black text-black text-xs px-3 py-1.5 rounded-lg font-black shadow-[2px_2px_0_0_#000]">{s}</span>) : <span className="text-sm text-gray-500 font-bold">店舗なし</span>}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t-4 border-black bg-gray-50">
              <button onClick={handleLogout} className={brutalBtnSecondary + " w-full text-sm"}><Icon name="logout" /> ログアウト</button>
            </div>
          </aside>

          <main className="flex-1 flex flex-col overflow-hidden relative bg-[#f0f0f0]">
            <header className="h-20 bg-white border-b-4 border-black flex items-center px-8 absolute top-0 w-full z-10 gap-6 shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-black hover:scale-110 transition-transform"><Icon name="menu" /></button>
              {activeTab !== 'home' && <button onClick={() => setActiveTab('home')} className="flex items-center gap-2 text-base font-black text-black hover:opacity-70 transition-opacity -ml-2"><Icon name="chevronLeft" /> 戻る</button>}
              <h2 className="font-black text-black tracking-tighter flex-1 uppercase text-2xl">{activeTab === 'home' ? 'ダッシュボード' : activeTab === 'request' ? 'タスク配信' : activeTab === 'repost' ? '再投稿' : activeTab === 'scheduled' ? '定期配信' : 'リストチェック'}</h2>
            </header>

            <div className="flex-1 overflow-auto p-6 md:p-12 pt-32 md:pt-36 relative z-0">
              
              {/* === HOME === */}
              {activeTab === 'home' ? (
                <div className="max-w-6xl mx-auto animate-fade-in space-y-12">
                  <div className={brutalCard + " flex flex-col md:flex-row gap-8 items-center bg-indigo-50"}>
                    
                    {/* ★修正: 挨拶を消して未完了タスク件数を大きく表示 */}
                    <div className="flex-1 w-full text-center md:text-left flex flex-col justify-center">
                       <p className="text-gray-700 text-xl font-bold">現在あなたが抱えている未完了タスク</p>
                       <p className="text-black font-black text-5xl mt-3"><span className="text-rose-600">{activeTasksCount}</span> <span className="text-3xl">件</span></p>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                       <div className="bg-white p-6 rounded-2xl border-4 border-black flex-1 md:w-64 shadow-[4px_4px_0_0_#000]">
                         <p className="text-sm font-black text-indigo-600 uppercase mb-4 tracking-widest text-center md:text-left">あなたのタスク完了率</p>
                         <div className="flex items-center gap-4">
                            <div className="flex-1 bg-gray-100 border-2 border-black rounded-full h-4 overflow-hidden shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.1)]">
                              <div className="bg-emerald-400 border-r-2 border-black h-full w-full transition-all duration-1000 ease-out" style={{ width: `${requestedTasksProgress}%` }}></div>
                            </div>
                            <span className="text-3xl font-black text-black">{requestedTasksProgress}%</span>
                         </div>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <button onClick={() => setActiveTab('request')} className={brutalCard + " text-left hover:bg-indigo-50"}>
                      <div className="w-20 h-20 bg-white border-4 border-black text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-[4px_4px_0_0_#000]"><Icon name="plus" /></div>
                      <h4 className="text-3xl font-black text-black mb-4 tracking-tighter">新規投稿</h4>
                      <p className="text-gray-600 text-lg font-bold leading-relaxed">一斉配信とメール通知を実行します。</p>
                    </button>
                    <button onClick={() => setActiveTab('repost')} className={brutalCard + " text-left hover:bg-indigo-50"}>
                      <div className="w-20 h-20 bg-white border-4 border-black text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-[4px_4px_0_0_#000]"><Icon name="history" /></div>
                      <h4 className="text-3xl font-black text-black mb-4 tracking-tighter">再投稿</h4>
                      <p className="text-gray-600 text-lg font-bold leading-relaxed">過去に配信したタスクを複製して再利用します。</p>
                    </button>
                    <button onClick={() => setActiveTab('scheduled')} className={brutalCard + " text-left hover:bg-indigo-50"}>
                      <div className="w-20 h-20 bg-white border-4 border-black text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-[4px_4px_0_0_#000]"><Icon name="repeat" /></div>
                      <h4 className="text-3xl font-black text-black mb-4 tracking-tighter">定期配信</h4>
                      <p className="text-gray-600 text-lg font-bold leading-relaxed">毎月・毎週のルーチンタスクを自動化します。</p>
                    </button>
                    <button onClick={() => setActiveTab('checklist')} className={brutalCard + " text-left hover:bg-indigo-50 relative overflow-hidden"}>
                      <div className="w-20 h-20 bg-white border-4 border-black text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-[4px_4px_0_0_#000]"><Icon name="list" /></div>
                      <h4 className="text-3xl font-black text-black mb-4 tracking-tighter">リストチェック</h4>
                      <p className="text-gray-600 text-lg font-bold leading-relaxed">自分宛のタスクを確認し、完了報告を行います。</p>
                      {activeTasksCount > 0 && <div className="absolute top-8 right-8 bg-rose-500 border-2 border-black text-white text-sm font-black px-4 py-2 rounded-full shadow-[4px_4px_0_0_#000] animate-pulse tracking-widest uppercase">未完了 {activeTasksCount}</div>}
                    </button>
                  </div>
                </div>
              
              // === タスク配信 ===
              ) : activeTab === 'request' ? (
                <div className={`max-w-6xl mx-auto ${brutalCard} animate-fade-in`}>
                  <h3 className="text-4xl font-black text-black mb-10 tracking-tighter uppercase text-center border-b-4 border-black pb-6">タスクの配信</h3>
                  
                  <form onSubmit={handleTaskSubmit} className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                    {/* 左カラム：入力欄 */}
                    <div className="space-y-8">
                      <div>
                        <label className="text-sm font-black text-indigo-600 uppercase mb-3 block tracking-widest">依頼内容 <span className="text-rose-500">*</span></label>
                        <textarea value={requestForm.content} onChange={e => setRequestForm({...requestForm, content: e.target.value})} required rows="5" className={brutalInput} placeholder="具体的な指示内容を入力してください"></textarea>
                      </div>
                      
                      <div>
                        <label className="text-sm font-black text-indigo-600 uppercase mb-3 block tracking-widest">期限 (DL) <span className="text-rose-500">*</span></label>
                        <input type="date" min={todayForMin} value={requestForm.deadline} onChange={e => setRequestForm({...requestForm, deadline: e.target.value})} required className={brutalInput} />
                      </div>
                      
                      <div>
                        <label className="text-sm font-black text-indigo-600 uppercase mb-3 block tracking-widest">URL (任意 / 最大3つ)</label>
                        <div className="space-y-4">
                          {requestForm.urls.map((url, i) => (
                            <div key={i} className="flex gap-3">
                              <input type="url" value={url} onChange={e => handleRequestUrlChange(i, e.target.value)} className={brutalInput + " py-3"} placeholder="https://..." />
                              {requestForm.urls.length > 1 && (
                                <button type="button" onClick={() => {
                                  const newUrls = requestForm.urls.filter((_, index) => index !== i);
                                  setRequestForm({ ...requestForm, urls: newUrls });
                                }} className="w-16 bg-rose-500 text-white border-2 border-black shadow-[4px_4px_0_0_#000] rounded-xl flex items-center justify-center hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"><Icon name="trash" /></button>
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

                      <div>
                        <label className="text-sm font-black text-indigo-600 uppercase mb-3 block tracking-widest">参考画像 (任意 / 最大3枚)</label>
                        {requestImages.length < 3 && (
                          <div className="bg-gray-50 border-4 border-dashed border-black rounded-2xl p-10 text-center hover:bg-gray-100 transition-colors relative cursor-pointer group">
                            <input type="file" multiple accept="image/*" onChange={(e) => handleImageChange(e, 'request')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <div className="flex flex-col items-center gap-4 text-black group-hover:scale-110 transition-transform">
                              <div className="w-16 h-16 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0_0_#000]"><Icon name="image" /></div>
                              <span className="text-base font-black">タップして画像を選択<br/><span className="text-xs text-gray-500">（自動でDriveに保存されます）</span></span>
                            </div>
                          </div>
                        )}
                        {requestImages.length > 0 && (
                          <div className="flex flex-wrap gap-4 mt-6">
                            {requestImages.map((img, i) => (
                              <div key={i} className="relative w-32 h-32 rounded-xl overflow-hidden border-4 border-black shadow-[4px_4px_0_0_#000]">
                                <img src={img.preview} alt="preview" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeImage(i, 'request')} className="absolute top-2 right-2 bg-rose-500 text-white border-2 border-black p-2 rounded-full hover:scale-110 transition-transform z-20"><Icon name="x" /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 右カラム：ターゲット選択 */}
                    <div className="flex flex-col">
                      <label className="text-sm font-black text-indigo-600 uppercase mb-3 block tracking-widest">配信先を選択 <span className="text-rose-500">*</span></label>
                      <p className="text-xs font-bold text-gray-500 mb-4">デフォルトで全店舗が選択されています。不要な店舗のチェックを外して絞り込んでください。</p>
                      <div className="flex-1 bg-gray-50 border-4 border-black rounded-2xl shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.05)] p-2">
                        {renderTargetSelector(requestSelectedStores, setRequestSelectedStores)}
                      </div>
                      <div className="mt-8 pt-8 border-t-4 border-gray-200">
                        <button type="submit" disabled={isSubmitting} className={brutalBtnPrimary + " w-full py-6 text-2xl"}>
                          {isSubmitting ? <span className="animate-spin scale-150"><Icon name="loader" /></span> : <Icon name="send" />}
                          <span className="tracking-widest ml-2">{isSubmitting ? '処理中...' : 'この内容で配信する'}</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              
              // === 再投稿 (履歴) ===
              ) : activeTab === 'repost' ? (
                <div className={`max-w-5xl mx-auto ${brutalCard} animate-fade-in`}>
                  <h3 className="text-4xl font-black text-black mb-4 tracking-tighter uppercase text-center">再投稿（履歴）</h3>
                  <p className="text-lg font-bold text-gray-600 mb-10 text-center border-b-4 border-black pb-8">過去に送信したタスクの情報を引き継いで、新しく作成します。</p>
                  
                  <div className="space-y-6">
                    {sentTasks.length === 0 ? (
                      <p className="text-center text-gray-500 font-black py-20 text-xl">送信履歴がありません</p>
                    ) : sentTasks.map(task => (
                      <div key={task.id} className="bg-gray-50 p-8 rounded-2xl border-4 border-black flex flex-col md:flex-row justify-between items-center gap-8 hover:bg-indigo-50 transition-colors shadow-[6px_6px_0_0_#000]">
                         <div className="flex-1 text-center md:text-left w-full">
                           <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                             <span className="bg-black text-white text-xs font-black px-4 py-2 rounded-lg tracking-widest uppercase">過去の配信</span>
                             <span className="text-base text-gray-600 font-black">{task.createdAt}</span>
                             {task.targetTags && <span className="text-xs font-black text-black bg-white border-2 border-black px-3 py-1.5 rounded-lg shadow-[2px_2px_0_0_#000]">宛先: {task.targetTags}</span>}
                           </div>
                           <p className="text-black text-xl font-bold leading-relaxed">{task.content}</p>
                         </div>
                         <button onClick={() => handleRepostClick(task)} className={brutalBtnSecondary + " w-full md:w-auto px-10 flex-shrink-0"}>
                           再利用して作成
                         </button>
                      </div>
                    ))}
                  </div>
                </div>
              
              // === 定期配信 ===
              ) : activeTab === 'scheduled' ? (
                <div className="max-w-6xl mx-auto space-y-12 animate-fade-in">
                  <div className={brutalCard}>
                    <h3 className="text-4xl font-black text-black mb-4 tracking-tighter uppercase text-center">定期配信の作成</h3>
                    <p className="text-lg font-bold text-gray-600 mb-10 text-center border-b-4 border-black pb-8">毎月の決まった日に、システムが自動でタスクを配信します。</p>
                    
                    <form onSubmit={handleScheduleSubmit} className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                      <div className="space-y-8">
                        <div className="bg-indigo-50 border-4 border-black p-6 rounded-2xl shadow-[4px_4px_0_0_#000]">
                          <label className="text-sm font-black text-black uppercase mb-4 block tracking-widest border-b-2 border-black pb-2">配信スケジュールの設定</label>
                          <div className="flex flex-col md:flex-row gap-6 mt-4">
                            <div className="flex-1">
                              <label className="text-xs font-black text-gray-600 mb-2 block">毎月何日に配信しますか？</label>
                              <div className="relative">
                                <select value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className={brutalInput + " appearance-none text-center"}>
                                  {Array.from({length: 31}, (_, i) => <option key={i+1} value={i+1}>{i+1}日</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black font-black">▼</div>
                              </div>
                            </div>
                            <div className="flex-1">
                              <label className="text-xs font-black text-gray-600 mb-2 block">何時に配信しますか？</label>
                              <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className={brutalInput + " text-center"} />
                            </div>
                          </div>
                          <div className="mt-6 p-4 bg-white border-2 border-black rounded-xl text-center shadow-[2px_2px_0_0_#000] opacity-80">
                            <p className="text-xs font-black text-gray-500">作成日 (初回設定日): {todayForMin}</p>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-black text-indigo-600 uppercase mb-3 block tracking-widest">配信後の期限設定 (DL)</label>
                          <div className="relative">
                            <select value={scheduleForm.deadlineOffset} onChange={e => setScheduleForm({...scheduleForm, deadlineOffset: e.target.value})} className={brutalInput + " appearance-none"}>
                              <option value="当日中">配信した日の 当日中</option>
                              <option value="翌日まで">配信した日の 翌日まで</option>
                              <option value="3日後">配信した日から 3日後</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black font-black">▼</div>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-black text-indigo-600 uppercase mb-3 block tracking-widest">依頼内容 <span className="text-rose-500">*</span></label>
                          <textarea required value={scheduleForm.content} onChange={e => setScheduleForm({...scheduleForm, content: e.target.value})} rows="4" className="w-full h-full min-h-[120px] bg-slate-50 border-2 border-slate-200 rounded-[2rem] p-6 text-slate-800 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-bold placeholder-slate-400 shadow-inner text-center" placeholder="例: 月末の棚卸し報告をお願いします"></textarea>
                        </div>

                        <div>
                          <label className="text-sm font-black text-indigo-600 uppercase mb-1 block tracking-widest">URL (任意 / 最大3つ)</label>
                          <div className="space-y-3 mt-3">
                            {scheduleForm.urls.map((url, i) => (
                              <div key={i} className="flex gap-2">
                                <input type="url" value={url} onChange={e => handleScheduleUrlChange(i, e.target.value)} className="flex-1 p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-base font-bold text-slate-800 placeholder-slate-400 shadow-inner text-center" placeholder="https://..." />
                                {scheduleForm.urls.length > 1 && (
                                  <button type="button" onClick={() => {
                                    const newUrls = scheduleForm.urls.filter((_, index) => index !== i);
                                    setScheduleForm({ ...scheduleForm, urls: newUrls });
                                  }} className="w-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-100 transition-colors"><Icon name="trash" /></button>
                                )}
                              </div>
                            ))}
                            {scheduleForm.urls.length < 3 && (
                              <button type="button" onClick={() => setScheduleForm({ ...scheduleForm, urls: [...scheduleForm.urls, ''] })} className={brutalBtnSecondary + " w-full py-3 text-base"}>
                                <Icon name="plusCircle" /> URLを追加
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-black text-indigo-600 uppercase mb-3 block tracking-widest">参考画像 (任意 / 最大3枚)</label>
                        {scheduleImages.length < 3 && (
                          <div className="bg-gray-50 border-4 border-dashed border-black rounded-2xl p-10 text-center hover:bg-gray-100 transition-colors relative cursor-pointer group">
                            <input type="file" multiple accept="image/*" onChange={(e) => handleImageChange(e, 'schedule')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <div className="flex flex-col items-center gap-4 text-black group-hover:scale-110 transition-transform">
                              <div className="w-16 h-16 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0_0_#000]"><Icon name="image" /></div>
                              <span className="text-base font-black">タップして画像を選択<br/><span className="text-xs text-gray-500">（自動でDriveに保存されます）</span></span>
                            </div>
                          </div>
                        )}
                        {scheduleImages.length > 0 && (
                          <div className="flex flex-wrap gap-4 mt-6">
                            {scheduleImages.map((img, i) => (
                              <div key={i} className="relative w-32 h-32 rounded-xl overflow-hidden border-4 border-black shadow-[4px_4px_0_0_#000]">
                                <img src={img.preview} alt="preview" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeImage(i, 'schedule')} className="absolute top-2 right-2 bg-rose-500 text-white border-2 border-black p-2 rounded-full hover:scale-110 transition-transform z-20"><Icon name="x" /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <label className="text-sm font-black text-indigo-600 uppercase mb-3 block tracking-widest">配信先を選択 <span className="text-rose-500">*</span></label>
                        <p className="text-xs font-bold text-gray-500 mb-4">デフォルトで全店舗が選択されています。不要な店舗のチェックを外して絞り込んでください。</p>
                        <div className="flex-1 bg-gray-50 border-4 border-black rounded-2xl shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.05)] p-2">
                          {renderTargetSelector(scheduleSelectedStores, setScheduleSelectedStores)}
                        </div>
                        <div className="mt-8 pt-8 border-t-4 border-gray-200">
                          <button type="submit" disabled={isSubmitting} className={brutalBtnPrimary + " w-full py-6 text-2xl"}>
                            {isSubmitting ? <span className="animate-spin scale-150"><Icon name="loader" /></span> : <Icon name="repeat" />}
                            <span className="tracking-widest ml-2">{isSubmitting ? '処理中...' : 'スケジュールを登録する'}</span>
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* 登録済みのスケジュール一覧 */}
                  <div className={brutalCard}>
                    <h3 className="text-3xl font-black text-black mb-8 tracking-tighter text-center border-b-4 border-black pb-6">稼働中の定期配信</h3>
                    <div className="space-y-6">
                      {scheduledTasks.length === 0 ? (
                        <p className="text-center text-gray-500 font-black py-10 text-xl">登録されている定期配信はありません</p>
                      ) : scheduledTasks.map(task => (
                        <div key={task.id} className="bg-gray-50 p-8 rounded-2xl border-4 border-black flex flex-col md:flex-row justify-between items-center gap-8 shadow-[6px_6px_0_0_#000]">
                           <div className="flex-1 text-center md:text-left w-full">
                             <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                               <span className="bg-black text-white text-xs font-black px-4 py-2 rounded-lg tracking-widest flex items-center gap-2"><Icon name="repeat"/> {task.cycle}</span>
                               <span className="text-sm text-black font-black bg-white border-2 border-black px-3 py-1.5 rounded-lg shadow-[2px_2px_0_0_#000]">期限: {task.deadlineOffset}</span>
                               {task.targetTags && <span className="text-sm text-black font-black bg-white border-2 border-black px-3 py-1.5 rounded-lg shadow-[2px_2px_0_0_#000]">宛先: {task.targetTags}</span>}
                             </div>
                             <p className="text-black text-xl font-bold leading-relaxed">{task.content}</p>
                           </div>
                           <button onClick={() => handleDeleteSchedule(task.id)} className="w-full md:w-auto bg-rose-50 border-4 border-black hover:bg-rose-500 hover:text-white text-rose-600 px-8 py-4 rounded-2xl font-black transition-all flex-shrink-0 flex items-center justify-center gap-2 shadow-[4px_4px_0_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none text-lg">
                             <Icon name="trash" /> 停止 (削除)
                           </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              
              // === リストチェック画面 ===
              ) : activeTab === 'checklist' ? (
                <div className="max-w-6xl mx-auto h-full flex flex-col animate-fade-in">
                  
                  <div className="flex gap-4 mb-10 max-w-xl mx-auto md:mx-0">
                    <button onClick={() => setTaskTab('active')} className={`flex-1 py-4 text-xl rounded-2xl border-4 border-black font-black transition-all flex items-center justify-center gap-3 ${taskTab === 'active' ? 'bg-indigo-600 text-white translate-x-1 translate-y-1 shadow-none' : 'bg-white text-black shadow-[6px_6px_0_0_#000] hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#000]'}`}>
                      未実施 <span className={`px-3 py-1 rounded-full text-sm border-2 border-black ${taskTab === 'active' ? 'bg-white text-indigo-600' : 'bg-black text-white'}`}>{activeTasksCount}</span>
                    </button>
                    <button onClick={() => setTaskTab('completed')} className={`flex-1 py-4 text-xl rounded-2xl border-4 border-black font-black transition-all flex items-center justify-center gap-3 ${taskTab === 'completed' ? 'bg-indigo-600 text-white translate-x-1 translate-y-1 shadow-none' : 'bg-white text-black shadow-[6px_6px_0_0_#000] hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#000]'}`}>
                      実施済み <span className={`px-3 py-1 rounded-full text-sm border-2 border-black ${taskTab === 'completed' ? 'bg-white text-indigo-600' : 'bg-black text-white'}`}>{completedTasksCount}</span>
                    </button>
                  </div>

                  <div className="flex gap-4 overflow-x-auto pb-4 mb-8 no-scrollbar justify-center md:justify-start px-2">
                    <button onClick={() => setTaskFilter('ALL')} className={`flex-shrink-0 px-8 py-4 rounded-xl text-base font-black border-4 border-black transition-all flex items-center gap-3 shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] ${taskFilter === 'ALL' ? 'bg-black text-white' : 'bg-white text-black'}`}>
                      すべて
                      {activeTasksCount > 0 && <span className={`text-[12px] px-2.5 py-1 rounded-full border-2 border-black ${taskFilter === 'ALL' ? 'bg-rose-500 text-white' : 'bg-rose-500 text-white'}`}>{activeTasksCount}</span>}
                    </button>
                    {currentUser?.stores?.map(s => {
                      const storeTaskCount = tasks.filter(t => !t.completed && t.targetTags && t.targetTags.includes(s)).length;
                      return (
                        <button key={s} onClick={() => setTaskFilter(s)} className={`flex-shrink-0 px-8 py-4 rounded-xl text-base font-black border-4 border-black transition-all flex items-center gap-3 shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] ${taskFilter === s ? 'bg-black text-white' : 'bg-white text-black'}`}>
                          {s}
                          {storeTaskCount > 0 && <span className={`text-[12px] px-2.5 py-1 rounded-full border-2 border-black ${taskFilter === s ? 'bg-rose-500 text-white' : 'bg-rose-500 text-white'}`}>{storeTaskCount}</span>}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="space-y-8 pb-24">
                    {tasksLoading ? (
                      <div className="space-y-8 animate-pulse"><div className="h-40 bg-white border-4 border-black rounded-[2.5rem] shadow-[8px_8px_0_0_#000]"></div></div>
                    ) : filteredTasks.length === 0 ? (
                      <div className="py-32 text-center flex flex-col items-center gap-6 text-gray-400 font-black uppercase tracking-[0.3em]">
                        <div className="w-32 h-32 border-[12px] border-gray-300 rounded-full flex items-center justify-center text-6xl"><Icon name="check" /></div>
                        <p className="text-2xl">タスクはありません</p>
                      </div>
                    ) : filteredTasks.map(task => (
                      <div key={task.id} className={`${brutalCard} flex flex-col md:flex-row gap-8 animate-fade-in`}>
                        <div className="flex-1 text-center md:text-left w-full">
                          <div className="flex items-center justify-center md:justify-start gap-4 mb-6 uppercase">
                            <span className="bg-black text-white border-2 border-black text-xs font-black px-4 py-2 rounded-lg tracking-widest">{task.sender}からの依頼</span>
                            
                            {!task.completed && task.daysRemaining !== null && task.daysRemaining !== undefined && (
                              <div className="flex items-center">
                                {task.daysRemaining < 0 && (
                                  <div className="flex items-center justify-center px-4 py-2 bg-black text-white border-2 border-black rounded-lg shadow-[2px_2px_0_0_#000] animate-pulse">
                                    <span className="text-[10px] font-black leading-none tracking-widest">⚠ 超過</span>
                                  </div>
                                )}
                                {task.daysRemaining === 0 && (
                                  <div className="flex items-center justify-center px-4 py-2 bg-rose-500 text-white border-2 border-black rounded-lg shadow-[2px_2px_0_0_#000]">
                                    <span className="text-[10px] font-black leading-none tracking-widest">今日まで</span>
                                  </div>
                                )}
                                {task.daysRemaining === 1 && (
                                  <div className="flex items-center justify-center px-4 py-2 bg-orange-500 text-white border-2 border-black rounded-lg shadow-[2px_2px_0_0_#000]">
                                    <span className="text-[10px] font-black leading-none tracking-widest">明日まで</span>
                                  </div>
                                )}
                                {task.daysRemaining === 2 && (
                                  <div className="flex items-center justify-center px-4 py-2 bg-amber-400 text-black border-2 border-black rounded-lg shadow-[2px_2px_0_0_#000]">
                                    <span className="text-[10px] font-black leading-none tracking-widest">残り2日</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <h3 className={`text-2xl font-black text-black leading-relaxed ${task.completed ? 'line-through opacity-40' : ''}`}>{task.content}</h3>
                          
                          {!task.completed && (
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-8 items-center">
                              <div className={`flex flex-col px-6 py-3 rounded-2xl border-4 border-black shadow-[4px_4px_0_0_#000] ${task.daysRemaining <= 0 ? 'bg-rose-50 text-rose-600' : 'bg-white text-black'}`}>
                                <span className="text-xs font-black uppercase tracking-widest mb-1">期限</span>
                                <span className="text-xl font-black tracking-tight">{task.deadline}</span>
                              </div>

                              {task.urls && task.urls.map((u, i) => u && typeof u === 'string' && u.trim() !== '' && (
                                <a key={i} href={u} target="_blank" rel="noreferrer" className="bg-white border-4 border-black text-black text-sm font-black px-6 py-4 rounded-xl hover:bg-indigo-50 transition-all shadow-[4px_4px_0_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_#000] flex items-center gap-2 w-max h-full min-h-[70px]">
                                  <Icon name="link" /> リンクを開く
                                </a>
                              ))}

                              {task.images && task.images.map((imgUrl, i) => imgUrl && typeof imgUrl === 'string' && imgUrl.trim() !== '' && (
                                <a key={`img-${i}`} href={imgUrl} target="_blank" rel="noreferrer" className="bg-amber-100 border-4 border-black text-black text-sm font-black px-6 py-4 rounded-xl hover:bg-amber-200 transition-all shadow-[4px_4px_0_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_#000] flex items-center gap-2 w-max h-full min-h-[70px]">
                                  <Icon name="image" /> 画像を開く
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-center pt-6 md:pt-0 border-t-4 border-gray-100 md:border-t-0 md:border-l-4 md:pl-8 mt-6 md:mt-0">
                          {!task.completed ? (
                            <button onClick={() => openConfirmModal(task)} className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-black bg-white text-gray-300 hover:bg-emerald-400 hover:text-white transition-all flex items-center justify-center shadow-[6px_6px_0_0_#000] group flex-shrink-0 active:translate-x-2 active:translate-y-2 active:shadow-none">
                              <span className="group-hover:scale-125 transition-transform scale-110"><Icon name="check" /></span>
                            </button>
                          ) : (
                            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-black bg-gray-200 text-gray-400 transition-all flex items-center justify-center shadow-inner flex-shrink-0">
                              <span className="scale-125"><Icon name="check" /></span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </main>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        body { margin: 0; background: #f0f0f0; font-family: 'Inter', 'Noto Sans JP', sans-serif; -webkit-font-smoothing: antialiased; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
        .text-center-last { text-align-last: center; }
      `}} />
    </Fragment>
  );
}