import React, { useState, useEffect, Fragment, useMemo } from 'react';

// --- アイコン部品 ---
const Icon = ({ name }) => {
  const icons = {
    home: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    plus: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
    copy: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>,
    calendar: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    list: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>,
    loader: <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>,
    user: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    menu: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    x: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    chevronLeft: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
    mail: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
    link: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    clock: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    send: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    check: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    refresh: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>,
    logout: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
  };
  return icons[name] || null;
};

// --- API層（本番GAS連動） ---
const isGAS = typeof google !== 'undefined' && google.script && google.script.run;

const api = {
  fetchEmployees: () => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res([]), 600);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).getEmployees();
  }),
  fetchTasksForUser: (email) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res([]), 800);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).getTasksForUser(email);
  }),
  syncGoogleTasks: (email) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res({status:'success'}), 1000);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).syncTasksToGoogleTasks(email);
  }),
  createTask: (data) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res({status:'success'}), 1000);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).createNewTask(data);
  }),
  completeTask: (id, email) => new Promise((res, rej) => {
    if (!isGAS) return setTimeout(() => res({status:'success'}), 600);
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).completeTask(id, email);
  })
};

export default function App() {
  const [authStep, setAuthStep] = useState('loading');
  const [inputEmail, setInputEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tempUser, setTempUser] = useState(null); 
  const [currentUser, setCurrentUser] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);

  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({ myActiveTasks: 0, teamActiveTasks: 0, requestedTasksProgress: 0 });

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [taskFilter, setTaskFilter] = useState('ALL');
  const [taskTab, setTaskTab] = useState('active');
  const [completingIds, setCompletingIds] = useState([]); 

  const [selectedTags, setSelectedTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Tailwind & 初期化
  useEffect(() => {
    if (!document.getElementById('tailwindcss-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwindcss-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }

    api.fetchEmployees().then(employees => {
      const emps = Array.isArray(employees) ? employees : [];
      setAllEmployees(emps);
      const savedEmail = localStorage.getItem('taskmaster_user_email');
      const user = emps.find(e => e.email === savedEmail);
      if (user) {
        setCurrentUser(user);
        setAuthStep('ready');
      } else {
        setAuthStep('login');
      }
    }).catch(() => setAuthStep('login'));
  }, []);

  // 2. データ取得 & Google ToDo同期
  const refreshTasks = (shouldSync = false) => {
    if (!currentUser) return;
    setTasksLoading(true);
    
    // スプレッドシートからタスク取得
    api.fetchTasksForUser(currentUser.email).then(data => {
      const taskList = Array.isArray(data) ? data : [];
      setTasks(taskList);
      
      const active = taskList.filter(t => !t.completed).length;
      const total = taskList.length;
      setDashboardData({
        myActiveTasks: active,
        teamActiveTasks: active,
        requestedTasksProgress: total === 0 ? 0 : Math.round(((total - active) / total) * 100)
      });
      setTasksLoading(false);

      // 同期が必要な場合
      if (shouldSync && active > 0) {
        setIsSyncing(true);
        api.syncGoogleTasks(currentUser.email).then(() => {
          setIsSyncing(false);
        }).catch(() => setIsSyncing(false));
      }
    }).catch(() => setTasksLoading(false));
  };

  // 初回表示時とタブ切り替え時に更新
  useEffect(() => {
    if (authStep === 'ready') {
      // リストチェック画面に入った時だけ同期も行う
      const needSync = (activeTab === 'checklist');
      refreshTasks(needSync);
    }
  }, [authStep, currentUser, activeTab]);

  // --- ヘルパー ---
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const storeMatch = taskFilter === 'ALL' || t.store === taskFilter;
      const statusMatch = taskTab === 'active' ? !t.completed : t.completed;
      return storeMatch && statusMatch;
    });
  }, [tasks, taskFilter, taskTab]);

  const availableTags = useMemo(() => {
    return Array.from(new Set(
      allEmployees.flatMap(emp => [emp.area, ...(emp.stores || [])]).filter(Boolean)
    )).sort();
  }, [allEmployees]);

  // --- ハンドラー ---
  const handleLoginSearch = (e) => {
    e.preventDefault();
    const user = allEmployees.find(emp => emp.email === inputEmail.trim());
    if (user) { setTempUser(user); setAuthStep('confirm'); } 
    else { setLoginError('メールアドレスが見つかりません。'); }
  };

  const handleConfirmLogin = () => {
    localStorage.setItem('taskmaster_user_email', tempUser.email);
    setCurrentUser(tempUser);
    setAuthStep('ready');
  };

  const handleLogout = () => {
    if (window.confirm('ログアウトしますか？')) {
      localStorage.removeItem('taskmaster_user_email');
      setAuthStep('login');
    }
  };

  const handleCompleteTask = async (taskId) => {
    if (!window.confirm('このタスクを完了にしますか？')) return;
    setCompletingIds(prev => [...prev, taskId]);
    try {
      await api.completeTask(taskId, currentUser.email);
      setTimeout(() => { refreshTasks(); setCompletingIds(prev => prev.filter(id => id !== taskId)); }, 400);
    } catch (e) {
      alert('エラーが発生しました。');
      setCompletingIds(prev => prev.filter(id => id !== taskId));
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTags.length) return alert('配信先を選択してください。');
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    const targetEmails = new Set();
    allEmployees.forEach(emp => {
      if (selectedTags.includes(emp.area) || emp.stores?.some(s => selectedTags.includes(s))) {
        targetEmails.add(emp.email);
      }
    });

    try {
      await api.createTask({
        type: '新規投稿',
        content: formData.get('content'),
        deadline: formData.get('deadline'),
        url1: formData.get('url1'),
        sender: currentUser.name,
        targets: Array.from(targetEmails)
      });
      alert('配信しました！');
      setSelectedTags([]);
      setActiveTab('home');
    } catch (error) { alert('送信失敗'); } 
    finally { setIsSubmitting(false); }
  };

  if (authStep === 'loading') return (
    <div className="h-screen flex items-center justify-center bg-slate-900 flex-col gap-4 text-white">
      <div className="text-blue-500"><Icon name="loader" /></div>
      <p className="font-black tracking-widest text-xs uppercase animate-pulse">Initializing System...</p>
    </div>
  );

  return (
    <Fragment>
      {authStep === 'login' && (
        <div className="h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none rotate-12 scale-150"><Icon name="list" /></div>
            <div className="w-16 h-16 bg-slate-900 rounded-2xl mx-auto flex items-center justify-center text-white mb-6 shadow-lg"><Icon name="list" /></div>
            <h2 className="text-3xl font-black text-slate-800 mb-2 text-center tracking-tighter">TODOマスター</h2>
            <p className="text-slate-400 text-sm font-bold mb-8 text-center leading-relaxed">業務タスクを一元管理。ログインして<br/>最新の状況を確認しましょう。</p>
            <form onSubmit={handleLoginSearch} className="space-y-6">
              <input type="email" required value={inputEmail} onChange={(e) => setInputEmail(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-800 transition-all" placeholder="xxx@okamoto-group.co.jp" />
              {loginError && <p className="text-red-500 text-xs font-black text-center animate-bounce">{loginError}</p>}
              <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-blue-600 transition-all shadow-xl hover:-translate-y-1">ログイン</button>
            </form>
          </div>
        </div>
      )}

      {authStep === 'confirm' && (
        <div className="h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-2xl">
            <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto flex items-center justify-center text-white mb-6 shadow-xl"><Icon name="user" /></div>
            <p className="text-blue-600 font-black text-xs uppercase tracking-widest mb-1">{tempUser?.role}</p>
            <h2 className="text-3xl font-black text-slate-800 mb-8 tracking-tighter">{tempUser?.name}</h2>
            <div className="space-y-3">
              <button onClick={handleConfirmLogin} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-blue-600 transition-all shadow-xl">このアカウントで開始</button>
              <button onClick={() => setAuthStep('login')} className="w-full text-slate-400 font-black text-sm uppercase tracking-widest pt-2">戻る</button>
            </div>
          </div>
        </div>
      )}

      {authStep === 'ready' && (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
          {/* サイドバー */}
          <aside className={`bg-slate-900 text-slate-300 flex flex-col shadow-2xl transition-all duration-300 overflow-hidden z-50 absolute lg:relative h-full ${isSidebarOpen ? 'w-64' : 'w-0'}`}>
            <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6">
              <span className="font-black text-white tracking-tighter uppercase text-[10px]">Account Profile</span>
              <button onClick={() => setIsSidebarOpen(false)} className="text-slate-500 p-2 hover:text-white transition-colors"><Icon name="x" /></button>
            </div>
            <div className="flex flex-col items-center p-8 flex-1 overflow-y-auto">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-white mb-4 shadow-inner ring-4 ring-slate-800/50"><Icon name="user" /></div>
              <p className="text-white font-black text-lg tracking-tight">{currentUser?.name}</p>
              <div className="mt-8 w-full space-y-3">
                <div className="bg-slate-800/50 rounded-2xl p-4 text-center border border-slate-700/50">
                  <p className="text-[10px] text-slate-500 font-black uppercase mb-1 tracking-widest">Area / Brand</p>
                  <p className="text-sm font-bold text-slate-200">{currentUser?.area} / {currentUser?.brand}</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-800">
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-slate-800 hover:bg-red-600 hover:text-white text-slate-400 rounded-2xl transition-all font-black text-xs uppercase tracking-widest">
                <Icon name="logout" /> Sign Out
              </button>
            </div>
          </aside>

          <main className="flex-1 flex flex-col overflow-hidden relative">
            <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-6 absolute top-0 w-full z-10 gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="text-slate-500 hover:text-blue-600 transition-colors p-2 rounded-xl hover:bg-slate-50"><Icon name="menu" /></button>
              {activeTab !== 'home' && (
                 <button onClick={() => setActiveTab('home')} className="flex items-center gap-1 text-xs font-black text-slate-400 hover:text-blue-600 transition-all py-2 px-3 rounded-xl hover:bg-slate-50 -ml-2"><Icon name="chevronLeft" /> BACK</button>
              )}
              <h2 className="font-black text-slate-800 tracking-tighter flex-1">
                {activeTab === 'home' ? 'DASHBOARD' : activeTab === 'request' ? 'NEW REQUEST' : activeTab === 'checklist' ? 'TASK CHECK' : 'SETTING'}
              </h2>
              {/* 同期ステータス表示 */}
              {isSyncing && (
                <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 animate-pulse">
                  <Icon name="refresh" /> <span className="hidden md:inline">GOOGLE TODO 同期中</span>
                </div>
              )}
            </header>

            <div className="flex-1 overflow-auto p-4 md:p-10 pt-20">
              {activeTab === 'home' ? (
                <div className="max-w-5xl mx-auto animate-fade-in space-y-8">
                  {/* ダッシュボード */}
                  <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="flex-1 w-full text-center md:text-left z-10">
                       <h3 className="text-2xl font-black text-slate-800 tracking-tighter">お疲れ様です、{currentUser?.name}さん。</h3>
                       <p className="text-slate-400 text-sm font-bold mt-2">現在、対応を待っているタスクが <span className="text-red-500 font-black">{dashboardData.myActiveTasks}件</span> あります。</p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto z-10">
                       <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex-1 md:w-48 text-center md:text-left shadow-inner">
                         <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Your Progress</p>
                         <div className="flex items-center gap-4">
                            <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                              <div className="bg-emerald-500 h-full transition-all duration-1000 ease-out" style={{ width: `${dashboardData.requestedTasksProgress}%` }}></div>
                            </div>
                            <span className="text-lg font-black text-slate-800">{dashboardData.requestedTasksProgress}%</span>
                         </div>
                       </div>
                    </div>
                  </div>

                  {/* メインメニュー */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button onClick={() => setActiveTab('request')} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group text-left">
                      <div className="w-14 h-14 bg-slate-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner"><Icon name="plus" /></div>
                      <h4 className="text-xl font-black text-slate-800 mb-2 tracking-tighter">新規投稿</h4>
                      <p className="text-slate-400 text-sm font-bold leading-relaxed">タスクを配信し、関係者のGoogle ToDoへ通知を送ります。</p>
                    </button>
                    <button className="bg-white p-8 rounded-[2.5rem] border border-slate-50 opacity-50 grayscale cursor-not-allowed transition-all text-left">
                      <div className="w-14 h-14 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-6"><Icon name="copy" /></div>
                      <h4 className="text-xl font-black text-slate-300 mb-2 tracking-tighter">再投稿 (準備中)</h4>
                      <p className="text-slate-200 text-sm font-bold leading-relaxed">過去タスクの複製機能。</p>
                    </button>
                    <button className="bg-white p-8 rounded-[2.5rem] border border-slate-50 opacity-50 grayscale cursor-not-allowed transition-all text-left">
                      <div className="w-14 h-14 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-6"><Icon name="calendar" /></div>
                      <h4 className="text-xl font-black text-slate-300 mb-2 tracking-tighter">定期配信 (準備中)</h4>
                      <p className="text-slate-200 text-sm font-bold leading-relaxed">ルーチンタスクの自動管理機能。</p>
                    </button>
                    <button onClick={() => setActiveTab('checklist')} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group text-left relative overflow-hidden">
                      <div className="w-14 h-14 bg-slate-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner"><Icon name="list" /></div>
                      <h4 className="text-xl font-black text-slate-800 mb-2 tracking-tighter">リストチェック</h4>
                      <p className="text-slate-400 text-sm font-bold leading-relaxed">自分宛タスクの確認、資料閲覧、完了報告を行います。</p>
                      {dashboardData.myActiveTasks > 0 && <div className="absolute top-8 right-8 bg-red-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg animate-pulse tracking-widest uppercase">Unfinished {dashboardData.myActiveTasks}</div>}
                    </button>
                  </div>
                </div>
              ) : activeTab === 'request' ? (
                <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-xl animate-fade-in">
                  <h3 className="text-3xl font-black text-slate-800 mb-8 tracking-tighter uppercase">Task Broadcast</h3>
                  <form onSubmit={handleTaskSubmit} className="space-y-8">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Instruction / 依頼内容</label>
                      <textarea name="content" required rows="4" className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none focus:border-blue-500 font-bold text-slate-800 transition-all shadow-inner" placeholder="具体的な指示内容を入力してください"></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Deadline / 期限</label>
                        <input name="deadline" type="date" required className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-800 shadow-inner" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-[0.2em]">Material Link / 資料URL</label>
                        <input name="url1" type="url" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-800 shadow-inner" placeholder="https://..." />
                      </div>
                    </div>
                    <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 shadow-inner">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-5 tracking-[0.2em]">Assign Targets / 配信先のタグ</p>
                      <div className="flex flex-wrap gap-2">
                        {availableTags.map(tag => (
                          <button key={tag} type="button" onClick={() => setSelectedTags(p => p.includes(tag) ? p.filter(t=>t!==tag) : [...p, tag])} className={`px-5 py-2.5 rounded-full font-black text-xs border-2 transition-all ${selectedTags.includes(tag) ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600'}`}># {tag}</button>
                        ))}
                      </div>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white font-black py-6 rounded-3xl hover:bg-blue-600 transition-all shadow-2xl flex items-center justify-center gap-4 group">
                      {isSubmitting ? <span className="animate-spin text-2xl"><Icon name="loader" /></span> : <Icon name="send" />}
                      <span className="tracking-widest uppercase text-sm">{isSubmitting ? 'Processing...' : 'Broadcast Task'}</span>
                    </button>
                  </form>
                </div>
              ) : activeTab === 'checklist' ? (
                <div className="max-w-5xl mx-auto h-full flex flex-col animate-fade-in">
                  {/* 店舗フィルタ */}
                  <div className="flex gap-2 overflow-x-auto pb-6 mb-4 no-scrollbar">
                    <button onClick={() => setTaskFilter('ALL')} className={`flex-shrink-0 px-6 py-3 rounded-2xl text-xs font-black border-2 transition-all ${taskFilter === 'ALL' ? 'bg-slate-800 text-white border-slate-800 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-100'}`}>ALL STORES</button>
                    {currentUser?.stores?.map(s => <button key={s} onClick={() => setTaskFilter(s)} className={`flex-shrink-0 px-6 py-3 rounded-2xl text-xs font-black border-2 transition-all ${taskFilter === s ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-100'}`}>{s.toUpperCase()}</button>)}
                  </div>

                  {/* 未完了/完了切り替え */}
                  <div className="flex bg-slate-200/50 p-1.5 rounded-2xl mb-8 w-max shadow-inner">
                    <button onClick={() => setTaskTab('active')} className={`px-10 py-3 rounded-xl text-xs font-black transition-all ${taskTab === 'active' ? 'bg-white shadow-md text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>ACTIVE</button>
                    <button onClick={() => setTaskTab('completed')} className={`px-10 py-3 rounded-xl text-xs font-black transition-all ${taskTab === 'completed' ? 'bg-white shadow-md text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>COMPLETED</button>
                  </div>

                  {/* タスクリスト */}
                  <div className="space-y-6 pb-20">
                    {tasksLoading ? (
                      <div className="space-y-6 animate-pulse">
                        {[1,2,3].map(n => <div key={n} className="h-32 bg-white border border-slate-100 rounded-[2rem]"></div>)}
                      </div>
                    ) : filteredTasks.length === 0 ? (
                      <div className="py-32 text-center flex flex-col items-center gap-6 opacity-20 font-black uppercase tracking-[0.3em]">
                        <div className="w-24 h-24 border-8 border-slate-300 rounded-full flex items-center justify-center text-4xl"><Icon name="check" /></div>
                        <p>No Records</p>
                      </div>
                    ) : filteredTasks.map(task => (
                      <div key={task.id} className={`bg-white border rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row gap-8 transition-all duration-700 ${completingIds.includes(task.id) ? 'opacity-0 translate-x-32 rotate-2 scale-90' : 'shadow-sm border-slate-50 hover:shadow-xl hover:border-blue-50'}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-lg tracking-widest uppercase">{task.sender}</span>
                            <span className="text-[10px] text-slate-300 font-black tracking-widest uppercase">Request</span>
                          </div>
                          <h3 className={`text-lg font-bold text-slate-800 leading-relaxed ${task.completed ? 'line-through opacity-40' : ''}`}>{task.content}</h3>
                          {!task.completed && (
                            <div className="flex flex-wrap gap-4 mt-6 items-center">
                              <div className={`flex flex-col px-4 py-2 rounded-2xl border-2 ${task.daysRemaining <= 0 ? 'bg-red-50 border-red-100 text-red-500' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                <span className="text-[8px] font-black uppercase tracking-widest mb-1">Due Date</span>
                                <span className="text-sm font-black tracking-tight">{task.deadline}</span>
                              </div>
                              {task.url && (
                                <a href={task.url} target="_blank" className="bg-slate-900 text-white text-[10px] font-black px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10">
                                  <Icon name="link" /> VIEW DOCUMENT
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                        {!task.completed && (
                          <button onClick={() => handleCompleteTask(task.id)} className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-slate-50 text-slate-100 hover:bg-emerald-500 hover:border-emerald-400 hover:text-white transition-all flex items-center justify-center shadow-inner group">
                            <span className="group-hover:scale-125 transition-transform"><Icon name="check" /></span>
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
      `}} />
    </Fragment>
  );
}