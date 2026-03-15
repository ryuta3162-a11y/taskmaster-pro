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
    alertTriangle: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>,
    logout: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
  };
  return icons[name] || null;
};

// --- API層（本番GAS連動） ---
const isGAS = typeof google !== 'undefined' && google.script && google.script.run;

const api = {
  fetchEmployees: () => new Promise((res, rej) => {
    if (!isGAS) {
      // ローカルテスト用モックデータ (10人分)
      return setTimeout(() => res([
        { name: '日下リュタ', email: 'r-kusaka@okamoto-group.co.jp', team: 'DX', brand: '両方', role: 'TMG', area: '第7エリア', stores: ['経堂', '草加'] },
        { name: '店長 A子', email: 'r-kusaka+smg1@okamoto-group.co.jp', team: '店舗運営', brand: 'JoyFit', role: 'SMG', area: '第1エリア', stores: ['経堂'] },
        { name: '役員 H', email: 'r-kusaka+ir@okamoto-group.co.jp', team: '経営陣', brand: '両方', role: 'IR', area: '全エリア', stores: ['全店'] }
      ]), 600);
    }
    google.script.run.withSuccessHandler(res).withFailureHandler(rej).getEmployees();
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

  // 2. データ更新
  const refreshTasks = () => {
    if (!currentUser) return;
    setTasksLoading(true);
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
    }).catch(() => {
      setTasks([]);
      setTasksLoading(false);
    });
  };

  useEffect(() => {
    if (authStep === 'ready') refreshTasks();
  }, [authStep, currentUser, activeTab]);

  // 3. メインタブの絞り込み
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

  // --- ハンドラー系 ---
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
    if (!window.confirm('完了にしますか？')) return;
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
    if (!selectedTags.length) return alert('配信先を選んでください。');
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
      refreshTasks();
    } catch (error) { alert('送信失敗'); } 
    finally { setIsSubmitting(false); }
  };

  if (authStep === 'loading') return (
    <div className="h-screen flex items-center justify-center bg-slate-900 flex-col gap-4 text-white">
      <div className="text-blue-500"><Icon name="loader" /></div>
      <p className="font-bold tracking-widest text-sm">LOADING SYSTEM...</p>
    </div>
  );

  return (
    <Fragment>
      {authStep === 'login' && (
        <div className="h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-10 max-w-md w-full shadow-2xl">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl mx-auto flex items-center justify-center text-white mb-6 shadow-lg"><Icon name="list" /></div>
            <h2 className="text-2xl font-black text-slate-800 mb-2 text-center tracking-tight">TODOリスト</h2>
            <p className="text-slate-500 text-sm font-bold mb-8 text-center">メールアドレスを入力してください。</p>
            <form onSubmit={handleLoginSearch} className="space-y-6">
              <input type="email" required value={inputEmail} onChange={(e) => setInputEmail(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold" placeholder="xxx@okamoto-group.co.jp" />
              {loginError && <p className="text-red-500 text-xs font-bold text-center">{loginError}</p>}
              <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-blue-600 transition-all shadow-xl">次へ</button>
            </form>
          </div>
        </div>
      )}

      {authStep === 'confirm' && (
        <div className="h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-10 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto flex items-center justify-center text-white mb-4 shadow-lg"><Icon name="user" /></div>
            <p className="text-blue-600 font-black text-xs uppercase mb-1">{tempUser?.role}</p>
            <h2 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">{tempUser?.name}</h2>
            <div className="space-y-3">
              <button onClick={handleConfirmLogin} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-blue-600 transition-all shadow-xl">ログインする</button>
              <button onClick={() => setAuthStep('login')} className="w-full text-slate-400 font-bold text-sm">戻る</button>
            </div>
          </div>
        </div>
      )}

      {authStep === 'ready' && (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
          {/* サイドバー */}
          <aside className={`bg-slate-900 text-slate-300 flex flex-col shadow-2xl transition-all duration-300 overflow-hidden z-50 absolute lg:relative h-full ${isSidebarOpen ? 'w-64' : 'w-0'}`}>
            <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6">
              <span className="font-black text-white tracking-tighter">Account</span>
              <button onClick={() => setIsSidebarOpen(false)} className="text-slate-500 p-1"><Icon name="x" /></button>
            </div>
            <div className="flex flex-col items-center p-6 flex-1 overflow-y-auto">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-white mb-4 shadow-inner"><Icon name="user" /></div>
              <p className="text-white font-black text-lg">{currentUser?.name}</p>
              <div className="mt-6 w-full space-y-3">
                <div className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">エリア / ブランド</p>
                  <p className="text-sm font-bold text-white">{currentUser?.area} / {currentUser?.brand}</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-800">
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-red-600 hover:text-white text-slate-400 rounded-xl transition-colors font-bold text-sm">
                <Icon name="logout" /> ログアウト
              </button>
            </div>
          </aside>

          <main className="flex-1 flex flex-col overflow-hidden relative">
            <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-6 absolute top-0 w-full z-10 gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="text-slate-500 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-slate-100"><Icon name="menu" /></button>
              {activeTab !== 'home' && (
                 <button onClick={() => setActiveTab('home')} className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-blue-600 py-2 px-3 rounded-lg hover:bg-slate-100 -ml-2"><Icon name="chevronLeft" /> 戻る</button>
              )}
              <h2 className="font-black text-slate-800 tracking-tight flex-1">
                {activeTab === 'home' ? 'TODOリスト' : activeTab === 'request' ? '新規投稿' : activeTab === 'checklist' ? 'リストチェック' : '開発中'}
              </h2>
            </header>

            <div className="flex-1 overflow-auto p-4 md:p-8 pt-20">
              {activeTab === 'home' ? (
                <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
                  {/* ダッシュボード */}
                  <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1 w-full text-center md:text-left">
                       <h3 className="text-xl font-black text-slate-800">お疲れ様です、{currentUser?.name}さん。</h3>
                       <p className="text-slate-500 text-sm font-bold mt-2">未完了タスク: <span className="text-red-500 font-black">{dashboardData.myActiveTasks}件</span></p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                       <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-1 md:w-44 text-center md:text-left">
                         <p className="text-[10px] font-black text-slate-400 uppercase mb-2">完了率</p>
                         <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-200 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${dashboardData.requestedTasksProgress}%` }}></div></div>
                            <span className="text-sm font-black text-slate-800">{dashboardData.requestedTasksProgress}%</span>
                         </div>
                       </div>
                    </div>
                  </div>
                  {/* メインメニュー */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <button onClick={() => setActiveTab('request')} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all group text-left">
                      <div className="w-12 h-12 bg-slate-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Icon name="plus" /></div>
                      <h4 className="text-lg md:text-xl font-black text-slate-800 mb-2">新規投稿</h4>
                      <p className="text-slate-500 text-xs font-bold leading-relaxed">新しくタスクを作成し配信します。</p>
                    </button>
                    <button onClick={() => setActiveTab('repost')} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:opacity-75 transition-all text-left">
                      <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-4"><Icon name="copy" /></div>
                      <h4 className="text-lg md:text-xl font-black text-slate-400 mb-2">再投稿</h4>
                      <p className="text-slate-300 text-xs font-bold leading-relaxed">過去タスクの複製。</p>
                    </button>
                    <button onClick={() => setActiveTab('scheduled')} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:opacity-75 transition-all text-left">
                      <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-4"><Icon name="calendar" /></div>
                      <h4 className="text-lg md:text-xl font-black text-slate-400 mb-2">定期配信</h4>
                      <p className="text-slate-300 text-xs font-bold leading-relaxed">ルーチン管理。</p>
                    </button>
                    <button onClick={() => setActiveTab('checklist')} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all group text-left relative overflow-hidden">
                      <div className="w-12 h-12 bg-slate-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Icon name="list" /></div>
                      <h4 className="text-lg md:text-xl font-black text-slate-800 mb-2">リストチェック</h4>
                      <p className="text-slate-500 text-xs font-bold leading-relaxed">割り当てられたタスクの確認。</p>
                      {dashboardData.myActiveTasks > 0 && <div className="absolute top-6 right-6 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">未完了 {dashboardData.myActiveTasks}</div>}
                    </button>
                  </div>
                </div>
              ) : activeTab === 'request' ? (
                <div className="max-w-3xl mx-auto bg-white p-6 md:p-10 rounded-[2rem] border border-slate-200 shadow-xl animate-fade-in">
                  <h3 className="text-2xl font-black text-slate-800 mb-8 tracking-tighter">タスクの配信</h3>
                  <form onSubmit={handleTaskSubmit} className="space-y-6">
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase mb-2 block">依頼内容</label>
                      <textarea name="content" required rows="4" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold" placeholder="内容を入力してください"></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <input name="deadline" type="date" required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none" />
                      <input name="url1" type="url" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none" placeholder="添付URL (任意)" />
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100">
                      <p className="text-xs font-bold text-slate-500 mb-4">対象エリア・店舗を選択（タグ）</p>
                      <div className="flex flex-wrap gap-2">
                        {availableTags.map(tag => (
                          <button key={tag} type="button" onClick={() => setSelectedTags(p => p.includes(tag) ? p.filter(t=>t!==tag) : [...p, tag])} className={`px-4 py-2 rounded-full font-black text-sm border-2 transition-all ${selectedTags.includes(tag) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}># {tag}</button>
                        ))}
                      </div>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-blue-600 transition-all shadow-xl">
                      {isSubmitting ? '送信中...' : 'この内容で配信する'}
                    </button>
                  </form>
                </div>
              ) : activeTab === 'checklist' ? (
                <div className="max-w-4xl mx-auto h-full flex flex-col animate-fade-in">
                  <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
                    <button onClick={() => setTaskFilter('ALL')} className={`px-4 py-2 rounded-full text-xs font-black border-2 transition-all ${taskFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-white text-slate-400 border-slate-200'}`}>すべて</button>
                    {currentUser?.stores?.map(s => <button key={s} onClick={() => setTaskFilter(s)} className={`px-4 py-2 rounded-full text-xs font-black border-2 transition-all ${taskFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border-slate-200'}`}>{s}</button>)}
                  </div>
                  <div className="flex bg-slate-200 p-1 rounded-xl mb-6 w-max">
                    <button onClick={() => setTaskTab('active')} className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${taskTab === 'active' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>未完了</button>
                    <button onClick={() => setTaskTab('completed')} className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${taskTab === 'completed' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>完了済み</button>
                  </div>
                  <div className="space-y-4">
                    {tasksLoading ? (
                      <div className="space-y-4 animate-pulse"><div className="h-24 bg-slate-200 rounded-3xl"></div><div className="h-24 bg-slate-200 rounded-3xl"></div></div>
                    ) : filteredTasks.length === 0 ? (
                      <div className="py-20 text-center text-slate-300 font-bold tracking-tighter uppercase"><Icon name="check" /><p className="mt-2">No Tasks Found</p></div>
                    ) : filteredTasks.map(task => (
                      <div key={task.id} className={`bg-white border rounded-3xl p-6 flex gap-4 transition-all duration-500 ${completingIds.includes(task.id) ? 'opacity-0 translate-x-12 scale-90' : 'shadow-sm border-slate-100 hover:shadow-md'}`}>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-blue-500 uppercase mb-2 tracking-widest">{task.sender} からの依頼</p>
                          <h3 className={`font-bold text-slate-800 leading-relaxed ${task.completed ? 'line-through opacity-50' : ''}`}>{task.content}</h3>
                          {!task.completed && (
                            <div className="flex gap-4 mt-4 items-center">
                              <span className="text-xs font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-lg">DL: {task.deadline}</span>
                              {task.url && <a href={task.url} target="_blank" className="text-xs font-black text-blue-600 flex items-center gap-1"><Icon name="link" /> 資料を開く</a>}
                            </div>
                          )}
                        </div>
                        {!task.completed && (
                          <button onClick={() => handleCompleteTask(task.id)} className="w-14 h-14 rounded-full border-2 border-slate-200 text-slate-200 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white transition-all flex items-center justify-center shadow-inner"><Icon name="check" /></button>
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
        body { margin: 0; background: #f8fafc; font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </Fragment>
  );
}