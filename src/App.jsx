import React, { useState, useEffect } from 'react';

// --- アイコン部品 (外部ライブラリ不要のSVG版) ---
// Lucide-reactの代わりにSVGを使用してビルドエラーを回避します
const Icon = ({ name }) => {
  const icons = {
    dashboard: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>,
    send: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    map: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>,
    database: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>,
    loader: <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>,
    user: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  };
  return icons[name] || null;
};

// --- API層（GASとの通信窓口） ---
const isGAS = typeof google !== 'undefined' && google.script && google.script.run;

const api = {
  fetchEmployees: async () => {
    if (isGAS) return new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej).getEmployees());
    // ローカルプレビュー用ダミーデータ
    await new Promise(r => setTimeout(r, 1000));
    return Array.from({ length: 15 }, (_, i) => ({
      id: `emp_${i}`,
      name: `従業員 ${String.fromCharCode(65 + i)}`,
      role: i % 2 === 0 ? 'イース' : 'ベス',
      area: `第${(i % 3) + 1}エリア`
    }));
  },
  createTask: async (data) => {
    if (isGAS) return new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej).createNewTask(data));
    await new Promise(r => setTimeout(r, 1500));
    return { ...data, id: Date.now() };
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('request');
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // 初回読み込み
  useEffect(() => {
    api.fetchEmployees().then(data => {
      setEmployees(data);
      setLoading(false);
    });
  }, []);

  // タスク送信処理
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const assigneeId = formData.get('assignee');
    const assignee = employees.find(emp => emp.id === assigneeId);
    
    const taskData = {
      title: formData.get('title'),
      assigneeName: assignee ? assignee.name : '不明',
      area: assignee ? assignee.area : '未設定',
      status: 'todo'
    };

    setLoading(true);
    await api.createTask(taskData);
    setTasks(prev => [taskData, ...prev]);
    setLoading(false);
    setActiveTab('board');
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 flex-col gap-4">
      <div className="text-indigo-600 font-bold"><Icon name="loader" /></div>
      <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Synchronizing Data...</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      {/* サイドバー */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <Icon name="dashboard" />
          </div>
          <span className="font-black text-white text-lg tracking-tighter uppercase">TASKMASTER</span>
        </div>
        <nav className="p-4 space-y-2 mt-4">
          <button onClick={() => setActiveTab('request')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'request' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
            <Icon name="send" /> <span className="font-bold">タスク申請</span>
          </button>
          <button onClick={() => setActiveTab('board')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'board' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800'}`}>
            <Icon name="map" /> <span className="font-bold">エリア別ボード</span>
          </button>
        </nav>
      </aside>

      {/* メインエリア */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="font-black text-slate-800 uppercase tracking-tight">
            {activeTab === 'request' ? 'Request Task' : 'Operations Board'}
          </h2>
          <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest">
            <Icon name="database" /> GAS Live Connected
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {activeTab === 'request' ? (
            <div className="max-w-2xl mx-auto bg-white p-10 rounded-3xl border border-slate-200 shadow-xl">
              <h3 className="text-2xl font-black text-slate-800 mb-6 uppercase">New Task Request</h3>
              <form onSubmit={handleTaskSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Assignee</label>
                  <select name="assignee" required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold">
                    <option value="">担当者を選択してください...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.area} / {e.role})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Task Title</label>
                  <input name="title" required type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold" placeholder="例: 店舗運営チェックリストの提出" />
                </div>
                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-indigo-600 transition-all shadow-xl">
                  SUBMIT TO SPREADSHEET
                </button>
              </form>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6 h-full">
              {['TODO', 'IN PROGRESS', 'DONE'].map(status => (
                <div key={status} className="bg-slate-200/50 rounded-3xl border border-slate-200 p-5 flex flex-col">
                  <h4 className="font-black text-[11px] text-slate-400 mb-4 px-2 tracking-widest uppercase">{status}</h4>
                  <div className="space-y-4">
                    {tasks.map((t, i) => (
                      <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="font-black text-slate-800 mb-2">{t.title}</p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                          <Icon name="user" /> {t.assigneeName} ({t.area})
                        </div>
                      </div>
                    ))}
                    {tasks.length === 0 && <div className="p-8 text-center text-slate-400 text-xs font-bold border-2 border-dashed border-slate-300 rounded-2xl uppercase">No tasks found</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      {/* デザイン補完用インラインスタイル */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
        body { margin: 0; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}