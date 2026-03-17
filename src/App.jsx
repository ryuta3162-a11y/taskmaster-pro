import React, { useState, useEffect, Fragment, useMemo } from 'react';

// --- アイコン部品 ---
const Icon = ({ name }) => {
  const icons = {
    home: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    plus: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
    calendar: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    list: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>,
    loader: <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>,
    user: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    menu: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    x: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    chevronLeft: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
    link: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    send: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    check: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    logout: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
    alertTriangle: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>,
    history: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>,
    repeat: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>,
    plusCircle: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
    trash: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
    image: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
  };
  return icons[name] || null;
};

// --- 共通データ ---
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
  const [dashboardData, setDashboardData] = useState({ myActiveTasks: 0, requestedTasksProgress: 0 });

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskFilter, setTaskFilter] = useState('ALL');
  const [taskTab, setTaskTab] = useState('active');

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, task: null, step: 'confirm', rank: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ★ URLも最大3つまでの配列で管理
  const [requestForm, setRequestForm] = useState({ content: '', deadline: '', urls: [''] });
  const [requestImages, setRequestImages] = useState([]); 
  const [selectedTags, setSelectedTags] = useState([]);

  const [sentTasks, setSentTasks] = useState([]);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({ cycle: '毎日 AM 9:00', deadlineOffset: '当日中', content: '', urls: [''] });
  const [scheduleImages, setScheduleImages] = useState([]); 
  const [scheduleTags, setScheduleTags] = useState([]);

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
      setAllStores(Array.isArray(stores) ? stores : []);
      const savedEmail = localStorage.getItem('taskmaster_user_email');
      const user = emps.find(e => e.email === savedEmail);
      if (user) { setCurrentUser(user); setAuthStep('ready'); } else { setAuthStep('login'); }
    }).catch(() => setAuthStep('login'));
  }, []);

  const refreshTasks = () => {
    if (!currentUser) return;
    setTasksLoading(true);
    api.fetchTasksForUser(currentUser.email).then(data => {
      const taskList = Array.isArray(data) ? data : [];
      setTasks(taskList);
      const active = taskList.filter(t => !t.completed).length;
      const total = taskList.length;
      setDashboardData({ myActiveTasks: active, requestedTasksProgress: total === 0 ? 0 : Math.round(((total - active) / total) * 100) });
      setTasksLoading(false);
    }).catch(() => setTasksLoading(false));
    api.getSentTasks(currentUser.name).then(res => setSentTasks(res || []));
    api.getScheduledTasks(currentUser.name).then(res => setScheduledTasks(res || []));
  };

  useEffect(() => { if (authStep === 'ready') refreshTasks(); }, [authStep, currentUser, activeTab]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => (taskFilter === 'ALL' || t.store === taskFilter) && (taskTab === 'active' ? !t.completed : t.completed));
  }, [tasks, taskFilter, taskTab]);

  const availableTags = useMemo(() => {
    return Array.from(new Set(allEmployees.flatMap(emp => [...(emp.area ? emp.area.split(', ') : []), ...(emp.stores || [])]).filter(Boolean))).sort();
  }, [allEmployees]);

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
    const newEmployee = { ...regData, team: formattedTeam, area: formattedArea, territory: formattedTerritory, email: tempUser.email, stores: finalStores };

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

  // 画像アップロード（最大3枚まで）
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
          
          const imageData = {
             name: file.name,
             type: 'image/jpeg',
             base64: dataUrl.split(',')[1],
             preview: dataUrl
          };
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

  // --- 新規投稿 ---
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTags.length) return alert('配信先を選択してください。');
    setIsSubmitting(true);
    const targetEmails = new Set();
    allEmployees.forEach(emp => {
      const empAreas = emp.area ? emp.area.split(', ') : [];
      if (empAreas.some(a => selectedTags.includes(a)) || emp.stores?.some(s => selectedTags.includes(s))) targetEmails.add(emp.email); 
    });

    // フィルタリングした配列のままGASへ送信
    const validUrls = requestForm.urls.filter(u => u.trim() !== '');

    try {
      await api.createTask({
        type: '新規投稿',
        content: requestForm.content,
        deadline: requestForm.deadline,
        urls: validUrls, 
        sender: currentUser ? currentUser.name : "管理者",
        targets: Array.from(targetEmails),
        targetTags: selectedTags.join(', '),
        images: requestImages.map(img => ({ name: img.name, type: img.type, base64: img.base64 }))
      });
      alert('タスクを配信しました！対象者に通知されます。');
      setRequestForm({ content: '', deadline: '', urls: [''] });
      setRequestImages([]);
      setSelectedTags([]);
      setActiveTab('home');
      refreshTasks();
    } catch (error) { alert('送信失敗'); } finally { setIsSubmitting(false); }
  };

  // --- 再投稿 ---
  const handleRepostClick = (task) => {
    setRequestForm({ content: task.content, deadline: '', urls: task.urls && task.urls.length > 0 ? task.urls : [''] });
    setRequestImages([]); 
    setSelectedTags(task.targetTags ? task.targetTags.split(', ') : []);
    setActiveTab('request');
  };

  // --- 定期配信 ---
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleTags.length) return alert('配信先を選択してください。');
    setIsSubmitting(true);
    const targetEmails = new Set();
    allEmployees.forEach(emp => {
      const empAreas = emp.area ? emp.area.split(', ') : [];
      if (empAreas.some(a => scheduleTags.includes(a)) || emp.stores?.some(s => scheduleTags.includes(s))) targetEmails.add(emp.email); 
    });

    const validUrls = scheduleForm.urls.filter(u => u.trim() !== '');

    try {
      await api.registerScheduledTask({
        sender: currentUser.name,
        cycle: scheduleForm.cycle,
        deadlineOffset: scheduleForm.deadlineOffset,
        content: scheduleForm.content,
        urls: validUrls,
        targetTags: scheduleTags.join(', '),
        targets: Array.from(targetEmails),
        images: scheduleImages.map(img => ({ name: img.name, type: img.type, base64: img.base64 }))
      });
      alert('スケジュールを登録しました！');
      setScheduleForm({ cycle: '毎日 AM 9:00', deadlineOffset: '当日中', content: '', urls: [''] });
      setScheduleImages([]);
      setScheduleTags([]);
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

  if (authStep === 'loading') return (
    <div className="h-screen flex items-center justify-center bg-slate-50 flex-col gap-4 text-slate-800">
      <div className="text-indigo-600"><Icon name="loader" /></div>
      <p className="font-black tracking-widest text-xs uppercase animate-pulse">システムを起動しています...</p>
    </div>
  );

  return (
    <Fragment>
      {confirmModal.isOpen && confirmModal.task && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => confirmModal.step === 'confirm' && setConfirmModal({ isOpen: false, task: null, step: 'confirm', rank: null })}></div>
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-lg w-full relative z-10 shadow-2xl border border-slate-100 animate-fade-in overflow-hidden">
            {confirmModal.step === 'confirm' && (
              <div className="text-center">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full mx-auto flex items-center justify-center mb-6 shadow-inner ring-4 ring-rose-100"><Icon name="alertTriangle" /></div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tighter">タスクを完了しますか？</h3>
                <p className="text-base font-bold text-slate-500 mb-6">内容を確認して、よろしければ実行してください。</p>
                <div className="bg-slate-50 p-6 rounded-3xl mb-6 text-center border border-slate-200 shadow-inner">
                  <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2 border-b border-slate-200 pb-2">対象タスク</p>
                  <p className="text-lg font-bold text-slate-700 leading-relaxed">{confirmModal.task.content}</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setConfirmModal({ isOpen: false, task: null, step: 'confirm', rank: null })} className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-500 font-black rounded-2xl hover:bg-slate-50 transition-all text-base">キャンセル</button>
                  <button onClick={executeCompleteTask} className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30 text-base">完了して順位を見る</button>
                </div>
              </div>
            )}
            {confirmModal.step === 'loading' && (
              <div className="text-center py-10">
                <div className="text-indigo-600 mb-6 flex justify-center scale-150"><Icon name="loader" /></div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter animate-pulse">記録中...</h3>
              </div>
            )}
            {confirmModal.step === 'result' && (
              <div className="text-center py-6 animate-fade-in relative">
                <div className="w-36 h-36 bg-gradient-to-tr from-amber-300 via-yellow-200 to-orange-100 text-yellow-800 rounded-full mx-auto flex items-center justify-center mb-6 shadow-xl border-4 border-white transform hover:scale-110 transition-transform"><span className="text-7xl font-black tracking-tighter drop-shadow-sm">{confirmModal.rank}</span><span className="text-xl font-black mt-4 ml-1">位</span></div>
                <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter relative z-10">完了しました！</h3>
                <p className="text-base font-bold text-slate-500 mb-8 relative z-10">このタスクを全社で <span className="text-slate-800 font-black text-lg">{confirmModal.rank}番目</span> にクリアしました！</p>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden"><div className="bg-emerald-400 h-full w-full animate-[progress_3.5s_ease-in-out]"></div></div>
              </div>
            )}
          </div>
        </div>
      )}

      {authStep === 'login' && (
        <div className="h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 max-w-md w-full shadow-xl relative z-10">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-600/30"><Icon name="list" /></div>
            <h2 className="text-4xl font-black text-slate-800 mb-2 text-center tracking-tighter">TODOマスター</h2>
            <p className="text-slate-500 text-base font-bold mb-8 text-center leading-relaxed">業務タスクを一元管理。</p>
            <form onSubmit={handleLoginSearch} className="space-y-6">
              <input type="email" required value={inputEmail} onChange={(e) => setInputEmail(e.target.value)} className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-bold text-slate-800 placeholder-slate-400 transition-all text-center text-lg" placeholder="メールアドレスを入力" />
              {loginError && <p className="text-rose-500 text-sm font-black text-center animate-bounce">{loginError}</p>}
              <button type="submit" className="w-full bg-slate-800 text-white font-black py-5 text-lg rounded-2xl hover:bg-slate-900 transition-all shadow-lg hover:-translate-y-1">ログイン / 新規登録</button>
            </form>
          </div>
        </div>
      )}

      {authStep === 'register' && (
        <div className="h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-y-auto py-12">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 max-w-2xl w-full shadow-xl relative z-10 my-auto animate-fade-in">
            <h2 className="text-3xl font-black text-slate-800 mb-2 text-center tracking-tighter">アカウント作成</h2>
            <p className="text-slate-500 text-base font-bold mb-8 text-center leading-relaxed">初めてのログインですね。<br/>プロフィールを登録して開始してください。</p>
            <form onSubmit={handleRegisterSubmit} className="space-y-8">
              <div>
                <label className="text-sm font-black text-slate-500 uppercase mb-2 block text-center">メールアドレス (固定)</label>
                <input type="email" value={tempUser?.email || ''} disabled className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 font-bold cursor-not-allowed text-center text-lg" />
              </div>
              <div>
                <label className="text-sm font-black text-slate-500 uppercase mb-2 block text-center">お名前 <span className="text-rose-500">*</span></label>
                <input type="text" required value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-bold text-slate-800 transition-all shadow-inner text-center text-lg" placeholder="例: 岡本太郎 (空欄なし)" />
              </div>
              <div>
                <label className="text-sm font-black text-slate-500 uppercase mb-2 block text-center">チーム名（複数選択可） <span className="text-rose-500">*</span></label>
                <div className="flex flex-wrap justify-center gap-3 p-5 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner">
                  {TEAMS.map(t => (
                    <button key={t} type="button" onClick={() => toggleTeam(t)} className={`px-4 py-3 rounded-xl font-black text-sm border transition-all flex items-center justify-center gap-2 ${regData.team.includes(t) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${regData.team.includes(t) ? 'bg-white border-white text-indigo-600' : 'border-slate-300 bg-white'}`}>{regData.team.includes(t) && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div>{t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-black text-slate-500 uppercase mb-2 block text-center">エリア（複数選択可） <span className="text-rose-500">*</span></label>
                <div className="flex flex-wrap justify-center gap-3 p-5 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner">
                  {AREAS.map(a => (
                    <button key={a} type="button" onClick={() => toggleArea(a)} className={`px-4 py-3 rounded-xl font-black text-sm border transition-all flex items-center justify-center gap-2 ${regData.area.includes(a) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${regData.area.includes(a) ? 'bg-white border-white text-indigo-600' : 'border-slate-300 bg-white'}`}>{regData.area.includes(a) && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div>{a}
                    </button>
                  ))}
                </div>
              </div>
              {regData.area.length > 0 && (
                <div>
                  <label className="text-sm font-black text-slate-500 uppercase mb-2 block text-center">テリトリー（不要なものはタップして外す） <span className="text-rose-500">*</span></label>
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner space-y-5">
                    {regData.area.map(areaName => (
                      <div key={areaName} className="border-b border-slate-200 pb-5 last:border-0 last:pb-0">
                        <p className="text-sm font-bold text-slate-600 mb-3 flex items-center justify-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>{areaName}</p>
                        <div className="flex flex-wrap justify-center gap-3">
                          {getTerritories(areaName).map(terr => {
                             const isSelected = regData.territory[areaName]?.includes(terr);
                             return (
                              <button key={terr} type="button" onClick={() => toggleTerritory(areaName, terr)} className={`px-4 py-3 rounded-xl font-black text-sm border transition-all flex items-center justify-center gap-2 ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isSelected ? 'bg-white border-white text-indigo-600' : 'border-slate-300 bg-white'}`}>{isSelected && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div>{terr}
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
                  <label className="text-sm font-black text-slate-500 uppercase mb-2 block text-center">管轄店舗を選択</label>
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner space-y-6">
                    {regData.area.map(areaName => {
                      const selectedTerrs = regData.territory[areaName] || [];
                      const storesInArea = allStores.filter(s => s.area === areaName && selectedTerrs.includes(s.territory));
                      if (storesInArea.length === 0) return null;
                      return (
                        <div key={areaName} className="border-b border-slate-200 pb-5 last:border-0 last:pb-0">
                           <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 text-center">{areaName} の店舗</p>
                           <div className="flex flex-wrap justify-center gap-3">
                             {storesInArea.map(store => {
                                const isSelected = regData.stores.includes(store.storeName);
                                return (
                                  <button key={store.storeName} type="button" onClick={() => { setRegData(prev => ({ ...prev, stores: isSelected ? prev.stores.filter(s => s !== store.storeName) : [...prev.stores, store.storeName] })) }} className={`px-4 py-3 rounded-xl font-black text-sm border transition-all flex items-center justify-center gap-2 ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isSelected ? 'bg-white border-white text-indigo-600' : 'border-slate-300 bg-white'}`}>{isSelected && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div>{store.storeName}
                                  </button>
                                )
                             })}
                           </div>
                        </div>
                      )
                    })}
                    {allStores.filter(s => regData.area.includes(s.area) && (regData.territory[s.area] || []).includes(s.territory)).length === 0 && (
                      <p className="text-sm font-bold text-slate-500 text-center">※ 選択したエリア・テリトリーに該当する店舗データがありません。</p>
                    )}
                  </div>
                </div>
              )}
              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => {setAuthStep('login'); setInputEmail('');}} className="w-1/3 bg-white border-2 border-slate-200 text-slate-500 font-black py-5 text-lg rounded-2xl hover:bg-slate-50 transition-all">戻る</button>
                <button type="submit" disabled={isSubmitting} className="w-2/3 bg-indigo-600 text-white font-black py-5 text-lg rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2">{isSubmitting ? <span className="animate-spin"><Icon name="loader" /></span> : '登録して開始'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {authStep === 'confirm' && (
        <div className="h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 max-w-md w-full text-center shadow-2xl relative z-10">
            <div className="w-28 h-28 bg-indigo-50 rounded-full mx-auto flex items-center justify-center text-indigo-600 mb-6 shadow-inner ring-4 ring-indigo-100"><Icon name="user" /></div>
            <p className="text-indigo-600 font-black text-sm uppercase tracking-widest mb-2">{tempUser?.team}</p>
            <h2 className="text-4xl font-black text-slate-800 mb-6 tracking-tighter">{tempUser?.name}</h2>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-8">
              <p className="text-xs text-slate-400 font-black uppercase mb-3 tracking-widest">担当エリア</p>
              {tempUser?.territory ? (
                <div className="space-y-2">
                  {tempUser.territory.split(' / ').map((t, i) => (
                    <p key={i} className="text-base font-bold text-slate-700">{t}</p>
                  ))}
                </div>
              ) : (
                <p className="text-base font-bold text-slate-700">{tempUser?.area}</p>
              )}
            </div>
            <div className="space-y-4">
              <button onClick={handleConfirmLogin} className="w-full bg-slate-800 text-white font-black py-5 text-lg rounded-2xl hover:bg-slate-900 transition-all shadow-xl hover:-translate-y-1">このアカウントで開始</button>
              <button onClick={() => setAuthStep('login')} className="w-full text-slate-500 font-black text-base uppercase tracking-widest pt-4 hover:text-slate-700 transition-colors">別のアカウントにする</button>
            </div>
          </div>
        </div>
      )}

      {authStep === 'ready' && (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
          <aside className={`bg-white border-r border-slate-200 flex flex-col shadow-2xl transition-all duration-300 overflow-hidden z-50 absolute lg:relative h-full ${isSidebarOpen ? 'w-80' : 'w-0'}`}>
            <div className="h-16 border-b border-slate-100 flex items-center justify-between px-8">
              <span className="font-black text-slate-800 tracking-tighter uppercase text-xs text-indigo-600">TaskMaster Pro</span>
              <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 p-2 hover:text-slate-600 transition-colors"><Icon name="x" /></button>
            </div>
            <div className="flex flex-col items-center p-8 flex-1 overflow-y-auto">
              <div className="w-28 h-28 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-6 shadow-inner ring-4 ring-indigo-100"><Icon name="user" /></div>
              <p className="text-slate-800 font-black text-2xl tracking-tight text-center mb-8">{currentUser?.name}</p>
              <div className="w-full space-y-6">
                <div className="bg-slate-50 rounded-3xl p-6 text-center border border-slate-100">
                  <p className="text-xs text-slate-400 font-black uppercase mb-4 tracking-widest">担当エリア</p>
                  {currentUser?.territory ? (
                    <div className="space-y-3">
                      {currentUser.territory.split(' / ').map((t, i) => (
                        <p key={i} className="text-base font-bold text-slate-700 leading-relaxed">{t}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-base font-bold text-slate-700">{currentUser?.area}</p>
                  )}
                </div>
                <div className="bg-slate-50 rounded-3xl p-6 text-center border border-slate-100">
                  <p className="text-xs text-slate-400 font-black uppercase mb-4 tracking-widest">担当店舗</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {currentUser?.stores?.length > 0 ? currentUser.stores.map((s, i) => <span key={i} className="bg-white border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-lg font-bold shadow-sm">{s}</span>) : <span className="text-sm text-slate-400 font-bold">店舗なし</span>}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100">
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-4 py-5 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-2xl transition-all font-black text-sm uppercase tracking-widest border-2 border-slate-100 hover:border-rose-200"><Icon name="logout" /> ログアウト</button>
            </div>
          </aside>

          <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50">
            <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-6 absolute top-0 w-full z-10 gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="text-slate-500 hover:text-indigo-600 transition-colors p-2 rounded-xl hover:bg-slate-100"><Icon name="menu" /></button>
              {activeTab !== 'home' && <button onClick={() => setActiveTab('home')} className="flex items-center gap-1 text-sm font-black text-slate-500 hover:text-slate-800 transition-all py-2 px-3 rounded-xl hover:bg-slate-100 -ml-2"><Icon name="chevronLeft" /> 戻る</button>}
              <h2 className="font-black text-slate-800 tracking-tighter flex-1 uppercase text-lg">{activeTab === 'home' ? 'ダッシュボード' : activeTab === 'request' ? 'タスク配信' : activeTab === 'repost' ? '再投稿' : activeTab === 'scheduled' ? '定期配信' : 'リストチェック'}</h2>
            </header>

            <div className="flex-1 overflow-auto p-4 md:p-10 pt-28 md:pt-32 relative z-0">
              
              {/* === HOME === */}
              {activeTab === 'home' ? (
                <div className="max-w-5xl mx-auto animate-fade-in space-y-8">
                  <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
                    <div className="flex-1 w-full text-center md:text-left z-10">
                       <h3 className="text-3xl font-black text-slate-800 tracking-tighter">お疲れ様です、{currentUser?.name}さん。</h3>
                       <p className="text-slate-500 text-base font-bold mt-3">未完了タスク: <span className="text-rose-500 font-black text-xl">{dashboardData.myActiveTasks}件</span></p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto z-10">
                       <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex-1 md:w-56 shadow-inner">
                         <p className="text-xs font-black text-indigo-600 uppercase mb-4 tracking-widest text-center md:text-left">あなたのタスク完了率</p>
                         <div className="flex items-center gap-4">
                            <div className="flex-1 bg-white border border-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                              <div className="bg-emerald-400 h-full transition-all duration-1000 ease-out" style={{ width: `${dashboardData.requestedTasksProgress}%` }}></div>
                            </div>
                            <span className="text-2xl font-black text-slate-800">{dashboardData.requestedTasksProgress}%</span>
                         </div>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button onClick={() => setActiveTab('request')} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-lg hover:shadow-2xl hover:border-indigo-300 transition-all group text-center md:text-left">
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm border border-indigo-100 mx-auto md:mx-0"><Icon name="plus" /></div>
                      <h4 className="text-2xl font-black text-slate-800 mb-3 tracking-tighter">新規投稿</h4>
                      <p className="text-slate-500 text-base font-bold leading-relaxed">一斉配信とメール通知を実行します。</p>
                    </button>
                    <button onClick={() => setActiveTab('repost')} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-lg hover:shadow-2xl hover:border-indigo-300 transition-all group text-center md:text-left">
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm border border-indigo-100 mx-auto md:mx-0"><Icon name="history" /></div>
                      <h4 className="text-2xl font-black text-slate-800 mb-3 tracking-tighter">再投稿</h4>
                      <p className="text-slate-500 text-base font-bold leading-relaxed">過去に配信したタスクを複製して再利用します。</p>
                    </button>
                    <button onClick={() => setActiveTab('scheduled')} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-lg hover:shadow-2xl hover:border-indigo-300 transition-all group text-center md:text-left">
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm border border-indigo-100 mx-auto md:mx-0"><Icon name="repeat" /></div>
                      <h4 className="text-2xl font-black text-slate-800 mb-3 tracking-tighter">定期配信</h4>
                      <p className="text-slate-500 text-base font-bold leading-relaxed">毎月・毎週のルーチンタスクを自動化します。</p>
                    </button>
                    <button onClick={() => setActiveTab('checklist')} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-lg hover:shadow-2xl hover:border-indigo-300 transition-all group text-center md:text-left relative overflow-hidden">
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm border border-indigo-100 mx-auto md:mx-0"><Icon name="list" /></div>
                      <h4 className="text-2xl font-black text-slate-800 mb-3 tracking-tighter">リストチェック</h4>
                      <p className="text-slate-500 text-base font-bold leading-relaxed">自分宛のタスクを確認し、完了報告を行います。</p>
                      {dashboardData.myActiveTasks > 0 && <div className="absolute top-8 right-8 bg-rose-500 text-white text-xs font-black px-4 py-2 rounded-full shadow-lg shadow-rose-200 animate-pulse tracking-widest uppercase">未完了 {dashboardData.myActiveTasks}</div>}
                    </button>
                  </div>
                </div>
              
              // === タスク配信 ===
              ) : activeTab === 'request' ? (
                <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-200 shadow-xl animate-fade-in">
                  <h3 className="text-3xl font-black text-slate-800 mb-8 tracking-tighter uppercase text-center">タスクの配信</h3>
                  <form onSubmit={handleTaskSubmit} className="space-y-8">
                    <div>
                      <label className="text-xs font-black text-indigo-600 uppercase mb-3 block tracking-[0.2em] text-center">依頼内容</label>
                      <textarea value={requestForm.content} onChange={e => setRequestForm({...requestForm, content: e.target.value})} required rows="4" className="w-full p-6 bg-slate-50 border-2 border-slate-200 rounded-[2rem] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-base font-bold text-slate-800 transition-all shadow-inner text-center" placeholder="具体的な指示内容を入力してください"></textarea>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-black text-indigo-600 uppercase mb-3 block tracking-[0.2em] text-center">期限 (DL)</label>
                        <input type="date" value={requestForm.deadline} onChange={e => setRequestForm({...requestForm, deadline: e.target.value})} required className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-base font-bold text-slate-800 shadow-inner text-center" />
                      </div>
                      
                      <div>
                        <label className="text-xs font-black text-indigo-600 uppercase mb-1 block tracking-[0.2em] text-center">URL (任意 / 最大3つ)</label>
                        <div className="space-y-3 mt-3">
                          {requestForm.urls.map((url, i) => (
                            <div key={i} className="flex gap-2">
                              <input type="url" value={url} onChange={e => handleRequestUrlChange(i, e.target.value)} className="flex-1 p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-base font-bold text-slate-800 placeholder-slate-400 shadow-inner text-center" placeholder="https://..." />
                              {requestForm.urls.length > 1 && (
                                <button type="button" onClick={() => {
                                  const newUrls = requestForm.urls.filter((_, index) => index !== i);
                                  setRequestForm({ ...requestForm, urls: newUrls });
                                }} className="w-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-100 transition-colors"><Icon name="trash" /></button>
                              )}
                            </div>
                          ))}
                          {requestForm.urls.length < 3 && (
                            <button type="button" onClick={() => setRequestForm({ ...requestForm, urls: [...requestForm.urls, ''] })} className="w-full py-3 bg-indigo-50 text-indigo-600 font-black rounded-2xl hover:bg-indigo-100 transition-all text-xs flex items-center justify-center gap-2">
                              <Icon name="plusCircle" /> URLを追加
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-black text-indigo-600 uppercase mb-3 block tracking-[0.2em] text-center">参考画像 (任意 / 最大3枚)</label>
                      {requestImages.length < 3 && (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-[2rem] p-8 text-center hover:bg-slate-100 transition-colors relative cursor-pointer group">
                          <input type="file" multiple accept="image/*" onChange={(e) => handleImageChange(e, 'request')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                          <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-indigo-500 transition-colors">
                            <Icon name="image" />
                            <span className="text-sm font-bold">タップして画像を選択（自動でDriveに保存されます）</span>
                          </div>
                        </div>
                      )}
                      {requestImages.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-4 mt-4">
                          {requestImages.map((img, i) => (
                            <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-md border-2 border-slate-200">
                              <img src={img.preview} alt="preview" className="w-full h-full object-cover" />
                              <button type="button" onClick={() => removeImage(i, 'request')} className="absolute top-1 right-1 bg-slate-900/60 text-white p-1.5 rounded-full hover:bg-rose-500 transition-colors backdrop-blur-sm z-20"><Icon name="x" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 shadow-inner text-center">
                      <p className="text-xs font-black text-indigo-600 uppercase mb-5 tracking-[0.2em]">配信先を選択</p>
                      <div className="flex flex-wrap justify-center gap-3">
                        {availableTags.map(tag => (
                          <button key={tag} type="button" onClick={() => setSelectedTags(p => p.includes(tag) ? p.filter(t=>t!==tag) : [...p, tag])} className={`px-5 py-3 rounded-full font-black text-sm border-2 transition-all ${selectedTags.includes(tag) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'}`}># {tag}</button>
                        ))}
                      </div>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-slate-800 text-white font-black py-6 text-lg rounded-3xl hover:bg-slate-900 transition-all shadow-xl flex items-center justify-center gap-4 hover:-translate-y-1">
                      {isSubmitting ? <span className="animate-spin text-2xl"><Icon name="loader" /></span> : <Icon name="send" />}
                      <span className="tracking-widest uppercase">{isSubmitting ? '処理中...' : 'この内容で配信する'}</span>
                    </button>
                  </form>
                </div>
              
              // === 再投稿 (履歴) ===
              ) : activeTab === 'repost' ? (
                <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-200 shadow-xl animate-fade-in text-center">
                  <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter uppercase">再投稿（履歴）</h3>
                  <p className="text-base font-bold text-slate-500 mb-8 text-center">過去に送信したタスクの情報を引き継いで、新しく作成します。</p>
                  
                  <div className="space-y-4">
                    {sentTasks.length === 0 ? (
                      <p className="text-center text-slate-400 font-bold py-10">送信履歴がありません</p>
                    ) : sentTasks.map(task => (
                      <div key={task.id} className="bg-slate-50 p-8 rounded-3xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 hover:border-indigo-400 transition-colors group">
                         <div className="flex-1 text-center md:text-left">
                           <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                             <span className="bg-indigo-100 text-indigo-600 text-xs font-black px-3 py-1 rounded tracking-widest uppercase">過去の配信</span>
                             <span className="text-sm text-slate-400 font-bold">{task.createdAt}</span>
                             {task.targetTags && <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md">宛先: {task.targetTags}</span>}
                           </div>
                           <p className="text-slate-800 text-lg font-bold leading-relaxed">{task.content}</p>
                         </div>
                         <button onClick={() => handleRepostClick(task)} className="w-full md:w-auto bg-white border-2 border-indigo-100 hover:bg-indigo-50 text-indigo-600 px-8 py-4 rounded-2xl font-black transition-all group-hover:-translate-y-1 text-base flex-shrink-0">
                           再利用して作成
                         </button>
                      </div>
                    ))}
                  </div>
                </div>
              
              // === 定期配信 ===
              ) : activeTab === 'scheduled' ? (
                <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                  <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-200 shadow-xl">
                    <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter uppercase text-center">定期配信の作成</h3>
                    <p className="text-base font-bold text-slate-500 mb-8 text-center">毎月・毎週のルーチン作業をシステムに自動で配信させます。</p>
                    
                    <form onSubmit={handleScheduleSubmit} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-xs font-black text-indigo-600 uppercase mb-3 block tracking-[0.2em] text-center">配信サイクル</label>
                          <select value={scheduleForm.cycle} onChange={e => setScheduleForm({...scheduleForm, cycle: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 text-slate-800 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-bold appearance-none text-center-last text-center shadow-inner">
                            <option>毎日 AM 9:00</option>
                            <option>毎週 月曜日 AM 9:00</option>
                            <option>毎月 1日 AM 9:00</option>
                            <option>毎月 15日 AM 9:00</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-black text-indigo-600 uppercase mb-3 block tracking-[0.2em] text-center">自動期限設定</label>
                          <select value={scheduleForm.deadlineOffset} onChange={e => setScheduleForm({...scheduleForm, deadlineOffset: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 text-slate-800 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-bold appearance-none text-center-last text-center shadow-inner">
                            <option>当日中</option>
                            <option>翌日まで</option>
                            <option>3日後</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-xs font-black text-indigo-600 uppercase mb-3 block tracking-[0.2em] text-center">依頼内容</label>
                          <textarea required value={scheduleForm.content} onChange={e => setScheduleForm({...scheduleForm, content: e.target.value})} rows="4" className="w-full h-full min-h-[120px] bg-slate-50 border-2 border-slate-200 rounded-[2rem] p-6 text-slate-800 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-bold placeholder-slate-400 shadow-inner text-center" placeholder="例: 月末の棚卸し報告をお願いします"></textarea>
                        </div>

                        <div>
                          <label className="text-xs font-black text-indigo-600 uppercase mb-1 block tracking-[0.2em] text-center">URL (任意 / 最大3つ)</label>
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
                              <button type="button" onClick={() => setScheduleForm({ ...scheduleForm, urls: [...scheduleForm.urls, ''] })} className="w-full py-3 bg-indigo-50 text-indigo-600 font-black rounded-2xl hover:bg-indigo-100 transition-all text-xs flex items-center justify-center gap-2">
                                <Icon name="plusCircle" /> URLを追加
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-black text-indigo-600 uppercase mb-3 block tracking-[0.2em] text-center">参考画像 (任意 / 最大3枚)</label>
                        {scheduleImages.length < 3 && (
                          <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-[2rem] p-8 text-center hover:bg-slate-100 transition-colors relative cursor-pointer group">
                            <input type="file" multiple accept="image/*" onChange={(e) => handleImageChange(e, 'schedule')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-indigo-500 transition-colors">
                              <Icon name="image" />
                              <span className="text-sm font-bold">タップして画像を選択（自動でDriveに保存されます）</span>
                            </div>
                          </div>
                        )}
                        {scheduleImages.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-4 mt-4">
                            {scheduleImages.map((img, i) => (
                              <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-md border-2 border-slate-200">
                                <img src={img.preview} alt="preview" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeImage(i, 'schedule')} className="absolute top-1 right-1 bg-slate-900/60 text-white p-1.5 rounded-full hover:bg-rose-500 transition-colors backdrop-blur-sm z-20"><Icon name="x" /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 shadow-inner text-center">
                        <p className="text-xs font-black text-indigo-600 uppercase mb-5 tracking-[0.2em]">配信先</p>
                        <div className="flex flex-wrap justify-center gap-3">
                          {availableTags.map(tag => (
                            <button key={tag} type="button" onClick={() => setScheduleTags(p => p.includes(tag) ? p.filter(t=>t!==tag) : [...p, tag])} className={`px-5 py-3 rounded-full font-black text-sm border-2 transition-all ${scheduleTags.includes(tag) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'}`}># {tag}</button>
                          ))}
                        </div>
                      </div>
                      <button type="submit" disabled={isSubmitting} className="w-full bg-slate-800 text-white font-black py-6 text-lg rounded-3xl hover:bg-slate-900 transition-all shadow-xl hover:-translate-y-1 tracking-widest uppercase">
                        {isSubmitting ? '処理中...' : 'スケジュールを登録する'}
                      </button>
                    </form>
                  </div>

                  {/* 登録済みのスケジュール一覧 */}
                  <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-200 shadow-xl">
                    <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tighter text-center">稼働中の定期配信</h3>
                    <div className="space-y-4">
                      {scheduledTasks.length === 0 ? (
                        <p className="text-center text-slate-400 font-bold">登録されている定期配信はありません</p>
                      ) : scheduledTasks.map(task => (
                        <div key={task.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
                           <div className="flex-1 text-center md:text-left">
                             <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                               <span className="bg-indigo-100 text-indigo-600 text-xs font-black px-3 py-1 rounded tracking-widest"><Icon name="repeat"/> {task.cycle}</span>
                               <span className="text-xs text-slate-500 font-bold bg-white border border-slate-200 px-2 py-1 rounded-md">期限: {task.deadlineOffset}</span>
                               <span className="text-xs text-slate-500 font-bold bg-white border border-slate-200 px-2 py-1 rounded-md">宛先: {task.targetTags}</span>
                             </div>
                             <p className="text-slate-800 text-base font-bold">{task.content}</p>
                           </div>
                           <button onClick={() => handleDeleteSchedule(task.id)} className="w-full md:w-auto bg-white border-2 border-rose-100 hover:bg-rose-50 text-rose-500 px-6 py-3 rounded-2xl font-black transition-all flex-shrink-0 flex items-center justify-center gap-2">
                             <Icon name="trash" /> 停止 (削除)
                           </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              
              // === リストチェック画面 ===
              ) : activeTab === 'checklist' ? (
                <div className="max-w-5xl mx-auto h-full flex flex-col animate-fade-in">
                  
                  {/* タグフィルター */}
                  <div className="flex gap-3 overflow-x-auto pb-6 mb-4 no-scrollbar justify-center md:justify-start">
                    <button onClick={() => setTaskFilter('ALL')} className={`flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-black border-2 transition-all ${taskFilter === 'ALL' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>すべて</button>
                    {currentUser?.stores?.map(s => (
                      <button key={s} onClick={() => setTaskFilter(s)} className={`flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-black border-2 transition-all ${taskFilter === s ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex bg-slate-100 border border-slate-200 p-2 rounded-2xl mb-8 w-max shadow-inner mx-auto md:mx-0">
                    <button onClick={() => setTaskTab('active')} className={`px-10 py-3 rounded-xl text-sm font-black transition-all ${taskTab === 'active' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>未完了</button>
                    <button onClick={() => setTaskTab('completed')} className={`px-10 py-3 rounded-xl text-sm font-black transition-all ${taskTab === 'completed' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>完了済み</button>
                  </div>
                  
                  <div className="space-y-6 pb-20">
                    {tasksLoading ? (
                      <div className="space-y-6 animate-pulse"><div className="h-32 bg-white border border-slate-200 rounded-[2.5rem]"></div></div>
                    ) : filteredTasks.length === 0 ? (
                      <div className="py-32 text-center flex flex-col items-center gap-6 opacity-30 font-black uppercase tracking-[0.3em] text-slate-500">
                        <div className="w-28 h-28 border-[10px] border-slate-300 rounded-full flex items-center justify-center text-5xl"><Icon name="check" /></div>
                        <p className="text-lg">タスクはありません</p>
                      </div>
                    ) : filteredTasks.map(task => (
                      <div key={task.id} className="bg-white border rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row gap-8 transition-all duration-700 shadow-sm border-slate-200 hover:shadow-lg animate-fade-in">
                        <div className="flex-1 text-center md:text-left">
                          <div className="flex items-center justify-center md:justify-start gap-3 mb-4 uppercase">
                            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-xs font-black px-4 py-1.5 rounded-lg tracking-widest">{task.sender}からの依頼</span>
                          </div>
                          <h3 className={`text-xl font-bold text-slate-800 leading-relaxed ${task.completed ? 'line-through opacity-40' : ''}`}>{task.content}</h3>
                          
                          {!task.completed && (
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6 items-center">
                              <div className={`flex flex-col px-5 py-2.5 rounded-2xl border-2 ${task.daysRemaining <= 0 ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                <span className="text-[10px] font-black uppercase tracking-widest mb-1">期限</span>
                                <span className="text-base font-black tracking-tight">{task.deadline}</span>
                              </div>

                              {/* ★ リンクの表示（GHI列） */}
                              {task.urls && task.urls.map((u, i) => u.trim() && (
                                <a key={i} href={u} target="_blank" rel="noreferrer" className="bg-white border-2 border-slate-200 text-slate-600 text-xs font-black px-6 py-4 rounded-2xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 w-max">
                                  <Icon name="link" /> リンク {i + 1} を開く
                                </a>
                              ))}

                              {/* ★ 画像の表示（JKL列） */}
                              {task.images && task.images.map((imgUrl, i) => imgUrl.trim() && (
                                <a key={i} href={imgUrl} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm hover:shadow-md transition-all h-20 w-20">
                                  <img src={imgUrl} alt="添付画像" className="w-full h-full object-cover" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {!task.completed && (
                          <button onClick={() => openConfirmModal(task)} className="mx-auto md:mx-0 w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-slate-100 text-slate-300 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-500 transition-all flex items-center justify-center shadow-inner group flex-shrink-0">
                            <span className="group-hover:scale-125 transition-transform scale-110"><Icon name="check" /></span>
                          </button>
                        )}
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
        body { margin: 0; background: #f8fafc; font-family: 'Inter', 'Noto Sans JP', sans-serif; -webkit-font-smoothing: antialiased; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .animate-spin { animation: spin 1.5s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
        .text-center-last { text-align-last: center; }
      `}} />
    </Fragment>
  );
}