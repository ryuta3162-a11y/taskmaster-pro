import React, { useState, useEffect } from 'react';

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
  fetchEmployees: async () => {
    if (isGAS) return new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej).getEmployees());
    // Canvasプレビュー用のモック
    await new Promise(r => setTimeout(r, 600));
    return [
      { name: '日下リュタ', email: 'r-kusaka@okamoto-group.co.jp', team: 'DX', brand: '両方', role: 'TMG', area: '第7エリア', territory: '1', stores: ['経堂', '草加'] },
      { name: '高江洲昌伍', email: 's-takaesu@okamoto-group.co.jp', team: '競合対策', brand: 'JoyFit', role: 'CMG', area: '第7エリア', territory: '2', stores: ['白井'] },
      { name: '店長 A子', email: 'r-kusaka+smg1@okamoto-group.co.jp', team: '店舗運営', brand: 'JoyFit', role: 'SMG', area: '第1エリア', territory: '1', stores: ['経堂'] },
      { name: '役員 H', email: 'r-kusaka+ir@okamoto-group.co.jp', team: '経営陣', brand: '両方', role: 'IR', area: '全エリア', territory: '-', stores: ['経堂', '草加', '白井', '西巣鴨', '神楽坂'] }
    ];
  },
  fetchTasksForUser: async (userEmail) => {
    if (isGAS) return new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej).getTasksForUser(userEmail));
    await new Promise(r => setTimeout(r, 1000));
    return []; // モック時は空
  },
  createTask: async (taskData) => {
    if (isGAS) return new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej).createNewTask(taskData));
    await new Promise(r => setTimeout(r, 1000));
    return { status: 'success' };
  },
  completeTask: async (taskId, userEmail) => {
    if (isGAS) return new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej).completeTask(taskId, userEmail));
    await new Promise(r => setTimeout(r, 600));
    return { status: 'success' };
  }
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
  
  const [dashboardData, setDashboardData] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskFilter, setTaskFilter] = useState('ALL');
  const [taskTab, setTaskTab] = useState('active');
  const [completingIds, setCompletingIds] = useState([]); 

  // 新規投稿用
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.fetchEmployees().then(employees => {
      setAllEmployees(employees);
      const savedEmail = localStorage.getItem('taskmaster_user_email');
      if (savedEmail) {
        const user = employees.find(e => e.email === savedEmail);
        if (user) {
          setCurrentUser(user);
          setAuthStep('ready');
        } else {
          localStorage.removeItem('taskmaster_user_email');
          setAuthStep('login');
        }
      } else {
        setAuthStep('login');
      }
    });
  }, []);

  // タスクの取得とダッシュボードの計算
  const refreshTasks = () => {
    if (currentUser) {
      setTasksLoading(true);
      api.fetchTasksForUser(currentUser.email).then(data => {
        setTasks(data);
        
        // ダッシュボード用の数値を計算
        const active = data.filter(t => !t.completed).length;
        const total = data.length;
        const progress = total === 0 ? 0 : Math.round(((total - active) / total) * 100);
        
        setDashboardData({
          myActiveTasks: active,
          teamActiveTasks: active, // 現状は自分のタスクを表示
          requestedTasksProgress: progress
        });
        
        setTasksLoading(false);
      });
    }
  };

  useEffect(() => {
    if (authStep === 'ready' && currentUser) {
      refreshTasks();
    }
  }, [authStep, currentUser, activeTab]);

  const handleLoginSearch = (e) => {
    e.preventDefault();
    setLoginError('');
    const user = allEmployees.find(emp => emp.email === inputEmail.trim());
    if (user) {
      setTempUser(user);
      setAuthStep('confirm');
    } else {
      setLoginError('該当するメールアドレスが見つかりませんでした。');
    }
  };

  const handleConfirmLogin = () => {
    localStorage.setItem('taskmaster_user_email', tempUser.email);
    setCurrentUser(tempUser);
    setAuthStep('ready');
  };

  const handleCancelLogin = () => {
    setTempUser(null);
    setInputEmail('');
    setAuthStep('login');
  };

  const handleLogout = () => {
    if (window.confirm('ログアウトしますか？')) {
      localStorage.removeItem('taskmaster_user_email');
      setCurrentUser(null);
      setAuthStep('login');
    }
  };

  // --- タスクの完了処理（本番用） ---
  const handleCompleteTask = async (taskId) => {
    if (!window.confirm('このタスクを完了にしますか？')) return;
    setCompletingIds(prev => [...prev, taskId]);
    
    try {
      await api.completeTask(taskId, currentUser.email);
      setTimeout(() => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
        setCompletingIds(prev => prev.filter(id => id !== taskId));
        refreshTasks(); // ダッシュボードの進捗を更新
      }, 400); 
    } catch (e) {
      alert('エラーが発生しました。もう一度お試しください。');
      setCompletingIds(prev => prev.filter(id => id !== taskId));
    }
  };

  // --- 新規投稿の送信処理（本番用） ---
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (selectedTags.length === 0) {
      alert('配信先（タグ）を1つ以上選択してください。');
      return;
    }
    
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    
    // 選ばれたタグに該当する社員のメールアドレスを抽出
    const targetEmails = new Set();
    allEmployees.forEach(emp => {
      if (selectedTags.includes(emp.area) || 
          selectedTags.includes(emp.brand) || 
          emp.stores.some(s => selectedTags.includes(s))) {
        targetEmails.add(emp.email);
      }
    });

    const taskData = {
      type: '新規投稿',
      content: formData.get('content'),
      deadline: formData.get('deadline'),
      url1: formData.get('url1'),
      sender: currentUser.name,
      targets: Array.from(targetEmails)
    };

    try {
      await api.createTask(taskData);
      alert('タスクを配信しました！');
      e.target.reset();
      setSelectedTags([]);
      setActiveTab('home');
      refreshTasks();
    } catch (error) {
      alert('送信に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const availableTags = Array.from(new Set(
    allEmployees.flatMap(emp => [emp.area, ...emp.stores]).filter(Boolean)
  )).sort();

  const filteredTasks = tasks.filter(t => {
    if (taskFilter !== 'ALL' && t.store !== taskFilter) return false;
    if (taskTab === 'active' && t.completed) return false;
    if (taskTab === 'completed' && !t.completed) return false;
    return true;
  });

  if (authStep === 'loading') return (
    <div className="h-screen flex items-center justify-center bg-slate-50 flex-col gap-4">
      <div className="text-blue-600 font-bold"><Icon name="loader" /></div>
      <p className="text-slate-500 font-bold tracking-widest text-sm">システムを準備しています...</p>
    </div>
  );

  if (authStep === 'login') return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[100px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-600/20 blur-[100px] rounded-full"></div>
      <div className="bg-white rounded-[2rem] p-10 max-w-md w-full shadow-2xl relative z-10">
        <div className="w-16 h-16 bg-slate-900 rounded-2xl mx-auto flex items-center justify-center text-white mb-6 shadow-lg"><Icon name="list" /></div>
        <h2 className="text-2xl font-black text-slate-800 mb-2 text-center tracking-tight">TODOリスト</h2>
        <p className="text-slate-500 text-sm font-bold mb-8 text-center">利用を開始するには、登録されている<br/>メールアドレスを入力してください。</p>
        <form onSubmit={handleLoginSearch} className="space-y-6">
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Icon name="mail" /></div>
              <input type="email" required value={inputEmail} onChange={(e) => setInputEmail(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-800 transition-colors" placeholder="例: xxx@okamoto-group.co.jp" />
            </div>
            {loginError && <p className="text-red-500 text-xs font-bold mt-2 px-1">{loginError}</p>}
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-blue-600 transition-all shadow-xl hover:-translate-y-1">次へ</button>
        </form>
      </div>
    </div>
  );

  if (authStep === 'confirm') return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[100px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-600/20 blur-[100px] rounded-full"></div>
      <div className="bg-white rounded-[2rem] p-10 max-w-md w-full shadow-2xl relative z-10 animate-fade-in">
        <h2 className="text-xl font-black text-slate-800 mb-2 text-center tracking-tight">アカウントの確認</h2>
        <p className="text-slate-500 text-xs font-bold mb-6 text-center">以下の内容で間違いなければ登録してください。</p>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
          <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-200"><Icon name="user" /></div>
          <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mb-1">{tempUser?.role}</p>
          <p className="text-2xl font-black text-slate-800 tracking-tight">{tempUser?.name}</p>
          <div className="flex justify-center gap-2 mt-4">
            <span className="bg-white px-3 py-1 rounded-full text-xs font-black text-slate-600 border border-slate-200">{tempUser?.area}</span>
            <span className="bg-white px-3 py-1 rounded-full text-xs font-black text-slate-600 border border-slate-200">{tempUser?.brand} 管轄</span>
          </div>
          {tempUser?.stores && tempUser.stores.length > 0 && <p className="text-xs font-bold text-slate-500 mt-3">管轄店舗: {tempUser.stores.join(', ')}</p>}
        </div>
        <div className="space-y-3">
          <button onClick={handleConfirmLogin} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-blue-600 transition-all shadow-xl hover:-translate-y-1">このアカウントで登録する</button>
          <button onClick={handleCancelLogin} className="w-full bg-white text-slate-500 font-black py-3 rounded-xl border-2 border-slate-100 hover:bg-slate-50 transition-colors">別のメールアドレスでやり直す</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      <aside className={`bg-slate-900 text-slate-300 flex flex-col shadow-2xl transition-all duration-300 overflow-hidden whitespace-nowrap z-50 absolute lg:relative h-full ${isSidebarOpen ? 'w-64' : 'w-0'}`}>
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6">
          <span className="font-black text-white tracking-tighter">アカウント情報</span>
          <button onClick={() => setIsSidebarOpen(false)} className="text-slate-500 hover:text-white transition-colors p-1"><Icon name="x" /></button>
        </div>
        <div className="flex flex-col items-center p-6 flex-1 overflow-y-auto">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-white mb-4 shadow-inner"><Icon name="user" /></div>
          <p className="text-white font-black text-lg">{currentUser?.name}</p>
          <p className="text-sm text-slate-400 font-bold mt-1">{currentUser?.role}</p>
          <div className="mt-6 w-full space-y-3">
            <div className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700">
              <p className="text-[10px] text-slate-400 font-black uppercase mb-1">エリア / ブランド</p>
              <p className="text-sm font-bold text-white">{currentUser?.area} / {currentUser?.brand}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-3 text-left border border-slate-700">
              <p className="text-[10px] text-slate-400 font-black uppercase mb-2 text-center">管轄店舗</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {currentUser?.stores?.map((store, i) => (
                  <span key={i} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-md font-bold">{store}</span>
                ))}
              </div>
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
          {!isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(true)} className="text-slate-500 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-slate-100">
              <Icon name="menu" />
            </button>
          )}
          {activeTab !== 'home' && (
             <button onClick={() => setActiveTab('home')} className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors py-2 px-3 rounded-lg hover:bg-slate-100 -ml-2">
               <span className="w-4 h-4"><Icon name="chevronLeft" /></span> 戻る
             </button>
          )}
          <h2 className="font-black text-slate-800 tracking-tight flex-1">
            {activeTab === 'home' && 'TODOリスト'}
            {activeTab === 'request' && '新規投稿'}
            {activeTab === 'repost' && '再投稿'}
            {activeTab === 'scheduled' && '定期配信'}
            {activeTab === 'checklist' && 'リストチェック'}
          </h2>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 pt-20">
          {isSidebarOpen && (
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
          )}

          {activeTab === 'home' ? (
            <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
              <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1 w-full text-center md:text-left">
                   <h3 className="text-xl font-black text-slate-800">お疲れ様です、{currentUser?.name}さん。</h3>
                   <p className="text-slate-500 text-sm font-bold mt-2">今日対応が必要なタスクが <span className="text-red-500 font-black">{dashboardData?.myActiveTasks || 0}件</span> あります。</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-1 md:w-44 text-center md:text-left">
                     <p className="text-[10px] font-black text-slate-400 uppercase mb-2">依頼タスク完了率</p>
                     <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${dashboardData?.requestedTasksProgress || 0}%` }}></div>
                        </div>
                        <span className="text-sm font-black text-slate-800">{dashboardData?.requestedTasksProgress || 0}%</span>
                     </div>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <button onClick={() => setActiveTab('request')} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-200 hover:-translate-y-1 transition-all group text-left">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-inner"><Icon name="plus" /></div>
                  <h4 className="text-lg md:text-xl font-black text-slate-800 mb-2">新規投稿</h4>
                  <p className="text-slate-500 text-xs md:text-sm font-bold leading-relaxed">ゼロから新しいタスクを作成し、対象者を絞り込んで配信します。</p>
                </button>
                <button onClick={() => setActiveTab('repost')} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-200 hover:-translate-y-1 transition-all group text-left">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-inner"><Icon name="copy" /></div>
                  <h4 className="text-lg md:text-xl font-black text-slate-800 mb-2">再投稿</h4>
                  <p className="text-slate-500 text-xs md:text-sm font-bold leading-relaxed">過去に配信したタスクを複製し、一部を修正して再度配信します。</p>
                </button>
                <button onClick={() => setActiveTab('scheduled')} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-200 hover:-translate-y-1 transition-all group text-left">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-inner"><Icon name="calendar" /></div>
                  <h4 className="text-lg md:text-xl font-black text-slate-800 mb-2">定期配信</h4>
                  <p className="text-slate-500 text-xs md:text-sm font-bold leading-relaxed">毎月決まった日に自動で配信されるルーチンタスクを設定・管理します。</p>
                </button>
                <button onClick={() => setActiveTab('checklist')} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-200 hover:-translate-y-1 transition-all group text-left relative overflow-hidden">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-inner"><Icon name="list" /></div>
                  <h4 className="text-lg md:text-xl font-black text-slate-800 mb-2">リストチェック</h4>
                  <p className="text-slate-500 text-xs md:text-sm font-bold leading-relaxed">自分に割り当てられたタスクの確認と、完了報告を行います。</p>
                  {dashboardData?.myActiveTasks > 0 && (
                    <div className="absolute top-6 right-6 md:top-8 md:right-8 bg-red-500 text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-full shadow-lg">未完了 {dashboardData.myActiveTasks}</div>
                  )}
                </button>
              </div>
            </div>

          ) : activeTab === 'request' ? (
            <div className="max-w-3xl mx-auto bg-white p-6 md:p-10 rounded-[2rem] border border-slate-200 shadow-xl animate-fade-in">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">タスクの作成</h3>
                  <p className="text-sm font-bold text-slate-500 mt-1">必要な情報を入力し、配信先を選択してください。</p>
                </div>
              </div>
              <form onSubmit={handleTaskSubmit} className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-black text-slate-700 mb-2">
                    <span className="text-blue-600"><Icon name="list" /></span> 依頼内容 <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-md uppercase">必須</span>
                  </label>
                  <textarea name="content" required rows="4" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-800 transition-colors resize-none" placeholder="例: 各店舗の衛生チェックリストの記入と提出をお願いします。"></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-black text-slate-700 mb-2">
                      <span className="text-blue-600"><Icon name="clock" /></span> 期限 (DL) <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-md uppercase">必須</span>
                    </label>
                    <input name="deadline" type="date" required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-800 transition-colors" />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-black text-slate-700 mb-2">
                      <span className="text-blue-600"><Icon name="link" /></span> 添付リンク (任意)
                    </label>
                    <input name="url1" type="url" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-800 transition-colors" placeholder="例: https://docs.google.com/..." />
                  </div>
                </div>
                <div className="pt-4">
                  <label className="flex items-center gap-2 text-sm font-black text-slate-700 mb-4">
                    <span className="text-blue-600"><Icon name="user" /></span> 配信先の選択 (タグ)
                  </label>
                  <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100">
                    <p className="text-xs font-bold text-slate-500 mb-4">対象とするエリアや店舗をクリックしてください（複数選択可）</p>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map(tag => (
                        <button 
                          key={tag}
                          type="button" 
                          onClick={() => toggleTag(tag)}
                          className={`px-4 py-2 rounded-full font-black text-sm transition-colors border-2 ${
                            selectedTags.includes(tag) 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          # {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pt-6">
                  <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-blue-600 transition-all shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0">
                    {isSubmitting ? <span className="animate-spin"><Icon name="loader" /></span> : <Icon name="send" />} 
                    {isSubmitting ? '配信中...' : 'この内容で配信する'}
                  </button>
                </div>
              </form>
            </div>

          ) : activeTab === 'checklist' ? (
            <div className="max-w-4xl mx-auto h-full flex flex-col animate-fade-in">
              <div className="mb-6">
                <h3 className="text-2xl font-black text-slate-800">リストチェック</h3>
                <p className="text-sm font-bold text-slate-500 mt-1">割り当てられたタスクの確認と完了報告を行います。</p>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
                <button onClick={() => setTaskFilter('ALL')} className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black transition-colors border-2 ${taskFilter === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                  すべての店舗
                </button>
                {currentUser?.stores?.map((store, i) => (
                  <button key={i} onClick={() => setTaskFilter(store)} className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black transition-colors border-2 ${taskFilter === store ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                    {store}
                  </button>
                ))}
              </div>

              <div className="flex bg-slate-200 p-1 rounded-xl mb-6 w-max">
                <button onClick={() => setTaskTab('active')} className={`px-6 py-2 rounded-lg text-sm font-black transition-all flex items-center gap-2 ${taskTab === 'active' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  未実施 <span className={`text-[10px] px-2 py-0.5 rounded-full ${taskTab === 'active' ? 'bg-red-500 text-white' : 'bg-slate-300 text-slate-500'}`}>{tasks.filter(t => !t.completed).length}</span>
                </button>
                <button onClick={() => setTaskTab('completed')} className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${taskTab === 'completed' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  実施済み
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pb-10 space-y-4">
                {tasksLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 flex gap-4 animate-pulse">
                        <div className="flex-1 space-y-4 py-1">
                          <div className="flex gap-2">
                            <div className="h-4 bg-slate-200 rounded w-16"></div>
                            <div className="h-4 bg-slate-200 rounded w-12"></div>
                          </div>
                          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                          <div className="h-8 bg-slate-200 rounded w-32 mt-4"></div>
                        </div>
                        <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-300"><Icon name="check" /></div>
                    <h3 className="font-black text-slate-800 text-lg mb-1">{taskTab === 'active' ? 'All Done!' : 'No tasks'}</h3>
                    <p className="text-sm text-slate-500 font-bold">{taskTab === 'active' ? '現在対応が必要なタスクはありません。' : '実施済みのタスクはありません。'}</p>
                  </div>
                ) : (
                  filteredTasks.map((task, i) => (
                    <div 
                      key={task.id} 
                      className={`bg-white border rounded-2xl p-5 flex gap-4 transition-all duration-500 
                        ${completingIds.includes(task.id) ? 'opacity-0 translate-x-8 scale-95' : 'animate-fade-in'}
                        ${task.completed ? 'opacity-60 border-slate-200' : 'border-slate-200 shadow-sm hover:shadow-md'}
                      `}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-2 mb-3 items-center">
                          <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded">{task.type}</span>
                          <span className="text-[10px] font-bold text-slate-400">from {task.sender}</span>
                        </div>
                        <h3 className={`font-bold text-sm leading-relaxed mb-4 ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                          {task.content}
                        </h3>
                        {!task.completed && (
                          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 flex-wrap">
                            <div className={`flex flex-col border rounded-lg px-3 py-1.5 ${task.daysRemaining < 0 ? 'bg-red-50 border-red-200 text-red-600' : task.daysRemaining === 0 ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                              <span className="text-[9px] font-black uppercase leading-none mb-1 opacity-70">DL (期限)</span>
                              <span className="font-black text-sm leading-none">{task.deadline ? new Date(task.deadline).toLocaleDateString() : '未設定'}</span>
                            </div>
                            {task.daysRemaining < 0 && <div className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg shadow-sm"><Icon name="alertTriangle" /> <span className="text-xs font-black">超過</span></div>}
                            {task.daysRemaining === 0 && <div className="flex items-center gap-1 px-3 py-2 bg-orange-500 text-white rounded-lg shadow-sm"><Icon name="clock" /> <span className="text-xs font-black">今日まで</span></div>}
                            {task.daysRemaining === 1 && <div className="flex items-center gap-1 px-3 py-2 bg-yellow-400 text-slate-800 rounded-lg shadow-sm"><span className="text-xs font-black">明日まで</span></div>}
                            {task.url && (
                              <a href={task.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 ml-auto text-xs font-black text-blue-600 bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                                <span className="w-3.5 h-3.5"><Icon name="link" /></span> リンクを開く
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {!task.completed && (
                        <div className="flex flex-col justify-start pl-2">
                          <button 
                            onClick={() => handleCompleteTask(task.id)} 
                            className="w-12 h-12 rounded-full bg-white border-2 border-slate-200 text-slate-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-500 hover:scale-110 transition-all shadow-sm"
                            title="完了にする"
                          >
                            <Icon name="check" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                <Icon name="loader" />
              </div>
              <p className="font-bold text-sm">この画面（{activeTab}）は現在開発中です...</p>
            </div>
          )}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
        body { margin: 0; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
}