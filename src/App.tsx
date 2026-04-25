import React, { useState, useMemo, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Plus, Trash2, List, LayoutDashboard, TrendingUp, Wallet, Lock, Sun, Moon, FileUp, FileDown, RefreshCw, Settings } from 'lucide-react';
import { Transaction, FundHolding, TransactionAction, Account } from './types';

// The password to access the app (Set this in Cloudflare Pages Environment Variables as APP_ADMIN)
// If not set, the app will not require a password.
const APP_PASSWORD = (import.meta as any).env?.VITE_APP_ADMIN; 

const INITIAL_ACCOUNTS: Account[] = [
  { id: 'default', name: '支付宝' },
  { id: 'alipay', name: '支付宝1' },
  { id: 'tiantian', name: '京东金融' }
];

// Initial data precisely matching Screenshot 1
const INITIAL_TRANSACTIONS: Transaction[] = [

];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isReady, setIsReady] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(window.location.pathname.startsWith('/admin') || window.location.hash.startsWith('#/admin'));
  const [kvStatus, setKvStatus] = useState<'checking' | 'enabled' | 'disabled'>('checking');
  
  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminMode(window.location.pathname.startsWith('/admin') || window.location.hash.startsWith('#/admin'));
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Check backend mode
  useEffect(() => {
    const init = async () => {
      try {
        const pingRes = await fetch('/api/ping');
        if (pingRes.ok) {
          setKvStatus('enabled');
          const sessionPass = localStorage.getItem('fund_app_password') || '';
          
          // Try authenticating
          const authRes = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: sessionPass })
          });
          const authData = await authRes.json();
          if (authData.success) {
            setIsAuthenticated(true);
            if (sessionPass) setPasswordInput(sessionPass);
          }
        } else {
          setKvStatus('disabled');
        }
      } catch (err) {
        setKvStatus('disabled');
      }
      setIsReady(true);
    };
    init();
  }, []);

  // Check local storage for existing session if KV is disabled
  useEffect(() => {
    if (kvStatus === 'disabled') {
      if (APP_PASSWORD) {
        const session = localStorage.getItem('fund_app_session');
        if (session === 'authenticated') {
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(true);
      }
    }
  }, [kvStatus]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (kvStatus === 'enabled') {
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: passwordInput })
        });
        const data = await res.json();
        if (data.success) {
          setIsAuthenticated(true);
          localStorage.setItem('fund_app_password', passwordInput);
          setErrorVisible(false);
        } else {
          setErrorVisible(true);
          setTimeout(() => setErrorVisible(false), 3000);
        }
      } catch (err) {
        setErrorVisible(true);
        setTimeout(() => setErrorVisible(false), 3000);
      }
    } else {
      if (passwordInput === APP_PASSWORD) {
        setIsAuthenticated(true);
        localStorage.setItem('fund_app_session', 'authenticated');
        setErrorVisible(false);
      } else {
        setErrorVisible(true);
        setTimeout(() => setErrorVisible(false), 3000);
      }
    }
  };

  if (!isReady) return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 dark:bg-[#0F0F0F] text-gray-500 dark:text-[#888]">Loading...</div>;

  if (isAdminMode && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0F0F0F] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm flex justify-end mb-4">
           <button 
             onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
             className="text-gray-500 hover:text-gray-900 dark:text-[#888] dark:hover:text-[#E0E0E0] p-2 transition-colors"
           >
             {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
           </button>
        </div>
        <form onSubmit={handleLogin} className="bg-white dark:bg-[#050505] border border-gray-200 dark:border-[#2A2A2A] p-8 w-full max-w-sm flex flex-col gap-6 shadow-2xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-[#1A1A1A] flex items-center justify-center border border-gray-300 dark:border-[#333]">
              <Lock className="text-[#D43F33]" size={20} />
            </div>
            <h1 className="text-xl font-serif italic text-gray-900 dark:text-[#E0E0E0]">基金账本系统</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-[#666]">私有部署验证</p>
          </div>
          
          <div className="space-y-2">
            <input 
              type="password" 
              placeholder="请输入访问密码" 
              className={`w-full bg-gray-50 dark:bg-[#0A0A0A] border ${errorVisible ? 'border-red-500' : 'border-gray-300 dark:border-[#333] focus:border-[#D43F33]'} text-gray-900 dark:text-[#E0E0E0] px-4 py-3 text-sm font-mono outline-none transition-colors text-center tracking-widest`}
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              autoFocus
            />
            {errorVisible && <p className="text-xs text-red-500 text-center animate-pulse">密码错误，请重试</p>}
          </div>

          <button type="submit" className="w-full bg-[#D43F33] text-white dark:text-[#111] hover:bg-gray-800 dark:hover:bg-[#E0E0E0] px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-colors">
            验证进入
          </button>
        </form>
      </div>
    );
  }

  return <FundDashboard theme={theme} setTheme={setTheme} kvStatus={kvStatus as 'enabled'|'disabled'} password={passwordInput} readonly={!isAdminMode} />;
}

function FundDashboard({ theme, setTheme, kvStatus, password, readonly }: { theme: 'light' | 'dark', setTheme: (t: 'light' | 'dark') => void, kvStatus: 'enabled' | 'disabled', password: string, readonly?: boolean }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [activeAccountId, setActiveAccountId] = useState<string>('all');
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [currentNavs, setCurrentNavs] = useState<Record<string, number>>({});
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isManagingAccounts, setIsManagingAccounts] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');

  useEffect(() => {
    if (kvStatus === 'enabled') {
      fetch('/api/data', { headers: { 'Authorization': password } })
        .then(res => res.json())
        .then(data => {
           if (data.transactions) setTransactions(data.transactions);
           if (data.currentNavs) setCurrentNavs(data.currentNavs);
           if (data.accounts) setAccounts(data.accounts);
           setDataLoaded(true);
        })
        .catch(err => {
           console.error(err);
           setDataLoaded(true);
        });
    } else {
      const savedTx = localStorage.getItem('fund_transactions');
      if (savedTx) {
        try { setTransactions(JSON.parse(savedTx)); } catch (e) {}
      }
      const savedNavs = localStorage.getItem('fund_navs');
      if (savedNavs) {
        try { setCurrentNavs(JSON.parse(savedNavs)); } catch (e) {}
      }
      const savedAccounts = localStorage.getItem('fund_accounts');
      if (savedAccounts) {
        try { setAccounts(JSON.parse(savedAccounts)); } catch (e) {}
      }
      setDataLoaded(true);
    }
  }, [kvStatus, password]);

  useEffect(() => {
    if (!dataLoaded || readonly) return;
    if (kvStatus === 'enabled') {
       fetch('/api/data', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': password },
         body: JSON.stringify({ transactions, currentNavs, accounts })
       }).catch(err => console.error(err));
    } else {
       localStorage.setItem('fund_transactions', JSON.stringify(transactions));
       localStorage.setItem('fund_navs', JSON.stringify(currentNavs));
       localStorage.setItem('fund_accounts', JSON.stringify(accounts));
    }
  }, [transactions, currentNavs, accounts, kvStatus, password, dataLoaded, readonly]);

  const [isAdding, setIsAdding] = useState(false);

  
  // Form State
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    accountId: 'default',
    date: new Date().toISOString().split('T')[0],
    fundCode: '',
    fundName: '',
    action: '买入',
    amount: 0,
    nav: 0,
    shares: 0,
    isDividend: '否',
    cashFlow: 0
  });

  const filteredTransactions = useMemo(() => {
    if (activeAccountId === 'all') return transactions;
    return transactions.filter(t => t.accountId === activeAccountId);
  }, [transactions, activeAccountId]);

  // Calculate holdings from transactions
  const { holdings, totalInvested, totalMarketValue, totalProfit, totalYield } = useMemo(() => {
    const map = new Map<string, FundHolding>();

    let overallInvested = 0;
    let overallSold = 0;

    filteredTransactions.forEach(t => {
      if (!map.has(t.fundCode)) {
        map.set(t.fundCode, {
          fundCode: t.fundCode,
          fundName: t.fundName,
          totalInvested: 0,
          totalSold: 0,
          dividendReinvested: 0,
          holdingShares: 0,
          currentNav: currentNavs[t.fundCode] || 0,
          currentMarketValue: 0,
          costNav: 0,
          unrealizedProfit: 0,
          yieldRate: 0
        });
      }
      
      const holding = map.get(t.fundCode)!;
      
      if (t.action === '买入') {
        holding.totalInvested += t.amount;
        holding.holdingShares += t.shares;
        overallInvested += t.amount;
      } else if (t.action === '卖出') {
        holding.totalSold += t.amount;
        holding.holdingShares -= t.shares;
        overallSold += t.amount;
      } else if (t.action === '分红') {
        holding.dividendReinvested += t.amount;
      }
    });

    const calculatedHoldings = Array.from(map.values()).map(h => {
      h.currentMarketValue = h.holdingShares * (h.currentNav || 0);
      
      // Calculate Cost NAV: total cost / holding shares (assuming all buys)
      h.costNav = h.holdingShares > 0 ? (h.totalInvested - h.totalSold) / h.holdingShares : 0;
      
      // Unrealized profit
      const costBasis = h.totalInvested - h.totalSold;
      h.unrealizedProfit = h.currentMarketValue - costBasis;
      
      // Yield Rate
      h.yieldRate = costBasis > 0 ? h.unrealizedProfit / costBasis : 0;
      
      return h;
    });

    let marketValueSum = 0;
    calculatedHoldings.forEach(h => {
      marketValueSum += h.currentMarketValue;
    });

    const netInvested = overallInvested - overallSold;
    const overallProfit = marketValueSum - netInvested;
    const overallYield = netInvested > 0 ? overallProfit / netInvested : 0;

    return {
      holdings: calculatedHoldings,
      totalInvested: netInvested,
      totalMarketValue: marketValueSum,
      totalProfit: overallProfit,
      totalYield: overallYield
    };
  }, [filteredTransactions, currentNavs]);

  const handleDelete = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const handleUpdateNav = (code: string, val: number) => {
    setCurrentNavs(prev => ({ ...prev, [code]: val }));
  };

  const [isFetchingNav, setIsFetchingNav] = useState(false);

  const fetchFundNav = async (code: string): Promise<number | null> => {
    try {
      const res = await fetch(`/api/nav?code=${code}`);
      const data = await res.json();
      if (data && data.Data && data.Data.LSJZList && data.Data.LSJZList.length > 0) {
        return parseFloat(data.Data.LSJZList[0].DWJZ);
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleAutoFetchNavs = async () => {
    setIsFetchingNav(true);
    const newNavs = { ...currentNavs };
    
    // Fetch sequentially to avoid JSONP global callback collision
    for (const h of holdings) {
      if (!h.fundCode) continue;
      const nav = await fetchFundNav(h.fundCode);
      if (nav !== null && !isNaN(nav)) {
         newNavs[h.fundCode] = nav;
      }
    }
    setCurrentNavs(newNavs);
    setIsFetchingNav(false);
  };

  const handleExport = () => {
    const data = {
      transactions: transactions
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fund_data_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        if (data.transactions && Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
          alert('导入成功！');
        } else {
          alert('数据格式不正确');
        }
      } catch (error) {
        alert('文件解析失败，请确保导入正确的.txt数据文件');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F0F0F] text-gray-900 dark:text-[#E0E0E0] font-sans p-4 sm:p-8 selection:bg-[#D43F33] selection:text-white">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Editorial Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-gray-200 dark:border-[#2A2A2A] pb-8">
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-gray-400 dark:text-[#666] block mb-2 flex items-center gap-2">
              基金账本系统
              <button 
                 onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                 className="text-[#D43F33] hover:text-gray-900 dark:text-[#E0E0E0] transition-colors"
                 title="切换主题"
               >
                 {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
              </button>
              {(APP_PASSWORD || kvStatus === 'enabled') && (
                <button 
                  onClick={() => {
                    localStorage.removeItem('fund_app_session');
                    localStorage.removeItem('fund_app_password');
                    window.location.reload();
                  }}
                  className="text-[#D43F33] hover:text-gray-900 dark:text-[#E0E0E0] transition-colors"
                  title="退出登录"
                >
                  <Lock size={10} />
                </button>
              )}
            </span>
            <h1 className="text-4xl font-serif italic tracking-tight text-gray-900 dark:text-[#E0E0E0]">
              <span className="text-[#D43F33]">投</span>资组合<span className="text-[#D43F33]">分</span>析
            </h1>
          </div>
          <div className="flex flex-col gap-4 items-start sm:items-end w-full sm:w-auto">
            {/* Account Selector */}
            <div className="flex flex-wrap bg-gray-50 dark:bg-[#0A0A0A] p-1 border border-gray-200 dark:border-[#2A2A2A] rounded-none">
              <button 
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-colors ${activeAccountId === 'all' ? 'bg-[#D43F33] text-white' : 'text-gray-500 dark:text-[#888] hover:text-[#D43F33]'}`}
                onClick={() => setActiveAccountId('all')}
              >
                <Wallet size={12} /> 全部账户
              </button>
              {accounts.map(acc => (
                <button 
                  key={acc.id}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-colors border-l border-[#1A1A1A] ${activeAccountId === acc.id ? 'bg-[#D43F33] text-white' : 'text-gray-500 dark:text-[#888] hover:text-[#D43F33]'}`}
                  onClick={() => setActiveAccountId(acc.id)}
                >
                  {acc.name}
                </button>
              ))}
              {!readonly && (
                <button
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold transition-colors border-l border-[#1A1A1A] text-gray-400 hover:text-[#D43F33]"
                  onClick={() => setIsManagingAccounts(true)}
                  title="管理账户"
                >
                  <Settings size={12} />
                </button>
              )}
            </div>

            <div className="flex gap-4">
              {!readonly && (
                <>
                  <input type="file" id="import-data" accept=".txt,.json" className="hidden" onChange={handleImport} />
                  <button 
                    className={`px-4 sm:px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold transition-colors flex items-center gap-2 rounded-none border border-gray-300 dark:border-[#333] text-gray-500 dark:text-[#888] hover:border-[#D43F33] hover:text-[#D43F33]`}
                    onClick={() => document.getElementById('import-data')?.click()}
                    title="导入数据"
                  >
                    <FileUp size={14} className="hidden sm:block" /> 导入
                  </button>
                </>
              )}
              <button 
                className={`px-4 sm:px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold transition-colors flex items-center gap-2 rounded-none border border-gray-300 dark:border-[#333] text-gray-500 dark:text-[#888] hover:border-[#D43F33] hover:text-[#D43F33]`}
                onClick={handleExport}
                title="导出数据"
              >
                <FileDown size={14} className="hidden sm:block" /> 导出
              </button>
              <button 
                className={`px-4 sm:px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold transition-colors flex items-center gap-2 rounded-none ${activeTab === 'overview' ? 'bg-[#D43F33] text-white' : 'border border-gray-300 dark:border-[#333] text-gray-500 dark:text-[#888] hover:border-[#D43F33] hover:text-[#D43F33]'}`}
                onClick={() => setActiveTab('overview')}
              >
                <LayoutDashboard size={14} className="hidden sm:block" /> 总览
              </button>
              <button 
                className={`px-4 sm:px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold transition-colors flex items-center gap-2 rounded-none ${activeTab === 'transactions' ? 'bg-[#D43F33] text-white' : 'border border-gray-300 dark:border-[#333] text-gray-500 dark:text-[#888] hover:border-[#D43F33] hover:text-[#D43F33]'}`}
                onClick={() => setActiveTab('transactions')}
              >
                <List size={14} className="hidden sm:block" /> 流水
              </button>
            </div>
          </div>
        </header>

        {/* Manager's Advice Banner */}
        <div className="bg-white dark:bg-[#050505] border border-gray-200 dark:border-[#2A2A2A] border-l-4 border-l-[#D43F33] p-6 sm:p-8 flex flex-col sm:flex-row gap-6 text-gray-900 dark:text-[#E0E0E0] shadow-2xl">
           <div className="pt-1 hidden sm:block"><TrendingUp className="text-[#D43F33]" size={28} /></div>
           <div>
             <h4 className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-[#888] mb-4 flex items-center">
               <span className="w-4 h-px bg-[#D43F33] mr-3"></span>
               基金经理寄语 (15年从业经验分享)
             </h4>
             <ul className="list-none space-y-4 font-serif text-gray-700 dark:text-[#AAA] text-sm leading-relaxed">
               <li><strong className="text-gray-900 dark:text-[#E0E0E0] font-sans">1. 资产配置决定了90%的收益：</strong>不要把所有资金押注在单一主题（如全仓半导体或全仓医疗）。组合中应包含宽基（如沪深300）、红利、以及必要的债券打底。</li>
               <li><strong className="text-gray-900 dark:text-[#E0E0E0] font-sans">2. 模糊的正确胜过精确的错误：</strong>不要试图精准抄底或逃顶。采取定投方式建仓，用纪律克服人性的恐惧与贪婪。</li>
               <li><strong className="text-gray-900 dark:text-[#E0E0E0] font-sans">3. 关注成本，拥抱复利：</strong>记录“成本净值”非常关键。长期来看，分红再投资和控制交易频次是拉开收益差距的核心。系统已为你自动核算“未实现收益”与“成本净值”，请定期复盘。</li>
             </ul>
           </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            {/* Overview Stats (Matches Screenshot 3) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="总投入" value={totalInvested.toFixed(2)} isHighlight={false} />
              <StatCard title="总市值" value={totalMarketValue.toFixed(2)} isHighlight={false} />
              <StatCard title="总收益" value={totalProfit.toFixed(2)} isHighlight={true} />
              <StatCard title="总收益率" value={(totalYield * 100).toFixed(2) + '%'} isHighlight={true} />
            </div>

            {/* Holdings Table (Matches Screenshot 2) */}
            <div className="bg-white dark:bg-[#050505] border border-gray-200 dark:border-[#2A2A2A] rounded-none overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#0A0A0A] flex justify-between items-center">
                 <h2 className="text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-[#666] flex items-center">
                   <span className="w-4 h-px bg-[#D43F33] mr-3"></span>
                   持仓明细
                 </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-[#0A0A0A] text-gray-400 dark:text-[#666] border-b border-gray-200 dark:border-[#2A2A2A] whitespace-nowrap">
                    <tr>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-[0.1em] font-normal">基金代码</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-[0.1em] font-normal">基金名称</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-[0.1em] font-normal text-right">累计投入</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-[0.1em] font-normal text-right">累计卖出</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-[0.1em] font-normal text-right">分红再投</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-[0.1em] font-normal text-right">持有份额</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-[0.1em] font-normal text-right text-[#D43F33]">
                        <div className="flex items-center justify-end gap-2">
                          {!readonly && (
                            <button
                              onClick={handleAutoFetchNavs}
                              disabled={isFetchingNav || holdings.length === 0}
                              className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-[#333] transition-colors ${isFetchingNav ? 'animate-spin opacity-50' : ''}`}
                              title="自动获取最新净值 (基于天天基金数据)"
                            >
                              <RefreshCw size={12} />
                            </button>
                          )}
                          <span>当前净值</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-[0.1em] font-normal text-right">当前市值</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-[0.1em] font-normal text-right">成本净值</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-[0.1em] font-normal text-right text-gray-900 dark:text-[#E0E0E0]">未实现收益</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-[0.1em] font-normal text-right text-gray-900 dark:text-[#E0E0E0]">收益率</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-[#1A1A1A]">
                    {holdings.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-6 py-12 text-center text-gray-400 dark:text-[#666] font-serif italic text-lg">
                          暂无持仓记录，请在交易流水中添加记录。
                        </td>
                      </tr>
                    ) : (
                      holdings.map((h) => (
                        <tr key={h.fundCode} className="hover:bg-gray-100 dark:bg-[#111] transition-colors group">
                          <td className="px-6 py-4 text-gray-500 dark:text-[#888] font-mono text-xs">{h.fundCode}</td>
                          <td className="px-6 py-4 font-serif text-gray-900 dark:text-[#E0E0E0]">{h.fundName}</td>
                          <td className="px-6 py-4 text-right font-mono text-gray-700 dark:text-[#AAA]">{h.totalInvested.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-mono text-gray-700 dark:text-[#AAA]">{h.totalSold.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-mono text-gray-700 dark:text-[#AAA]">{h.dividendReinvested.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-mono text-gray-800 dark:text-[#CCC]">{h.holdingShares.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right">
                            {/* Editable Current NAV */}
                            {readonly ? (
                              <span className="text-gray-900 dark:text-[#E0E0E0] font-mono text-sm">
                                {h.currentNav ? h.currentNav.toFixed(4) : '-'}
                              </span>
                            ) : (
                              <input 
                                type="number" step="0.0001"
                                className="w-24 bg-gray-50 dark:bg-[#0A0A0A] border-b border-gray-300 dark:border-[#333] focus:border-[#D43F33] text-gray-900 dark:text-[#E0E0E0] px-1 py-1 text-sm font-mono outline-none text-right transition-colors"
                                value={h.currentNav || ''}
                                onChange={(e) => handleUpdateNav(h.fundCode, Number(e.target.value))}
                              />
                            )}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-gray-900 dark:text-[#E0E0E0]">{h.currentMarketValue.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-mono text-gray-700 dark:text-[#AAA]">{h.costNav.toFixed(4)}</td>
                          <td className={`px-6 py-4 text-right font-mono ${h.unrealizedProfit > 0 ? 'text-[#D43F33]' : h.unrealizedProfit < 0 ? 'text-gray-500 dark:text-[#888]' : 'text-gray-400 dark:text-[#666]'}`}>
                            {h.unrealizedProfit.toFixed(2)}
                          </td>
                          <td className={`px-6 py-4 text-right font-mono ${h.yieldRate > 0 ? 'text-[#D43F33]' : h.yieldRate < 0 ? 'text-gray-500 dark:text-[#888]' : 'text-gray-400 dark:text-[#666]'}`}>
                            {(h.yieldRate * 100).toFixed(2)}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            
            <div className="flex justify-end">
               {!readonly && (
                 <button 
                   className="bg-transparent border border-[#D43F33] text-[#D43F33] hover:bg-[#D43F33] hover:text-white dark:hover:text-[#0F0F0F] px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold transition-colors flex items-center gap-2 rounded-none"
                   onClick={() => {
                     setIsAdding(!isAdding);
                     if (!isAdding) {
                       setNewTx(prev => ({...prev, accountId: activeAccountId === 'all' ? (accounts[0]?.id || 'default') : activeAccountId}));
                     }
                   }}
                 >
                   <Plus size={14} /> 添加记录
                 </button>
               )}
            </div>

            {/* Transactions Table (Matches Screenshot 1) */}
            <div className="bg-white dark:bg-[#050505] border border-gray-200 dark:border-[#2A2A2A] rounded-none overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#0A0A0A] flex justify-between items-center">
                 <h2 className="text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-[#666] flex items-center">
                   <span className="w-4 h-px bg-[#D43F33] mr-3"></span>
                   交易记录
                 </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-[#0A0A0A] text-gray-400 dark:text-[#666] border-b border-gray-200 dark:border-[#2A2A2A] whitespace-nowrap">
                    <tr>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-[0.1em] font-normal">日期</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-[0.1em] font-normal">账户</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-[0.1em] font-normal">基金代码</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-[0.1em] font-normal">基金名称</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-[0.1em] font-normal">操作</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-[0.1em] font-normal text-right">金额</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-[0.1em] font-normal text-right">成交净值</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-[0.1em] font-normal text-right">份额</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-[0.1em] font-normal text-center">是否分红</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-[0.1em] font-normal text-right">现金流</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-[0.1em] font-normal text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-[#1A1A1A]">
                    {/* Add Form */}
                    {isAdding && (
                      <tr className="bg-gray-100 dark:bg-[#111] border-b-2 border-b-[#D43F33]">
                        <td className="px-4 py-4">
                          <input type="date" className="bg-gray-50 dark:bg-[#0A0A0A] border border-gray-300 dark:border-[#333] text-gray-900 dark:text-[#E0E0E0] px-2 py-2 text-sm font-mono w-full min-w-[130px] outline-none focus:border-[#D43F33] transition-colors cursor-pointer"
                            style={{ colorScheme: theme }}
                            value={newTx.date?.replace(/\//g, '-')} onChange={e=>setNewTx({...newTx, date: e.target.value})} />
                        </td>
                        <td className="px-4 py-4">
                          <select className="bg-gray-50 dark:bg-[#0A0A0A] border border-gray-300 dark:border-[#333] text-gray-900 dark:text-[#E0E0E0] px-3 py-2 text-sm font-mono w-full min-w-[90px] outline-none focus:border-[#D43F33] transition-colors cursor-pointer"
                            value={newTx.accountId} onChange={e=>setNewTx({...newTx, accountId: e.target.value})}
                          >
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <input type="text" className="bg-gray-50 dark:bg-[#0A0A0A] border border-gray-300 dark:border-[#333] text-gray-900 dark:text-[#E0E0E0] px-3 py-2 text-sm font-mono w-full min-w-[80px] outline-none focus:border-[#D43F33] transition-colors"
                            value={newTx.fundCode} onChange={e=>setNewTx({...newTx, fundCode: e.target.value})} placeholder="代码"/>
                        </td>
                        <td className="px-4 py-4">
                          <input type="text" className="bg-gray-50 dark:bg-[#0A0A0A] border border-gray-300 dark:border-[#333] text-gray-900 dark:text-[#E0E0E0] px-3 py-2 text-sm font-mono w-full min-w-[120px] outline-none focus:border-[#D43F33] transition-colors"
                            value={newTx.fundName} onChange={e=>setNewTx({...newTx, fundName: e.target.value})} placeholder="名称"/>
                        </td>
                        <td className="px-4 py-4">
                          <select className="bg-gray-50 dark:bg-[#0A0A0A] border border-gray-300 dark:border-[#333] text-gray-900 dark:text-[#E0E0E0] px-3 py-2 text-sm font-mono w-full min-w-[80px] outline-none focus:border-[#D43F33] transition-colors cursor-pointer"
                            value={newTx.action} onChange={e=>setNewTx({...newTx, action: e.target.value as any})}
                          >
                            <option value="买入">买入</option>
                            <option value="卖出">卖出</option>
                            <option value="分红">分红</option>
                          </select>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <input type="number" className="bg-gray-50 dark:bg-[#0A0A0A] border border-gray-300 dark:border-[#333] text-gray-900 dark:text-[#E0E0E0] px-3 py-2 text-sm font-mono text-right w-full min-w-[90px] outline-none focus:border-[#D43F33] transition-colors"
                            value={newTx.amount === 0 ? '' : newTx.amount} 
                            onChange={e => {
                              const val = Number(e.target.value);
                              const navVal = newTx.nav || 0;
                              setNewTx({
                                ...newTx, 
                                amount: val, 
                                shares: navVal > 0 ? Number((val / navVal).toFixed(8)) : newTx.shares
                              });
                            }} 
                            placeholder="金额"/>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <input type="number" step="0.0001" className="bg-gray-50 dark:bg-[#0A0A0A] border border-gray-300 dark:border-[#333] text-gray-900 dark:text-[#E0E0E0] px-3 py-2 text-sm font-mono text-right w-full min-w-[90px] outline-none focus:border-[#D43F33] transition-colors"
                            value={newTx.nav === 0 ? '' : newTx.nav} 
                            onChange={e => {
                              const val = Number(e.target.value);
                              const amtVal = newTx.amount || 0;
                              setNewTx({
                                ...newTx, 
                                nav: val, 
                                shares: val > 0 ? Number((amtVal / val).toFixed(8)) : newTx.shares
                              });
                            }} 
                            placeholder="净值"/>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <input type="number" step="0.01" className="bg-gray-50 dark:bg-[#0A0A0A] border border-gray-300 dark:border-[#333] text-gray-900 dark:text-[#E0E0E0] px-3 py-2 text-sm font-mono text-right w-full min-w-[90px] outline-none focus:border-[#D43F33] transition-colors"
                            value={newTx.shares === 0 ? '' : newTx.shares} 
                            onChange={e=>setNewTx({...newTx, shares: Number(e.target.value)})} 
                            placeholder="份额"/>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <select className="bg-gray-50 dark:bg-[#0A0A0A] border border-gray-300 dark:border-[#333] text-gray-900 dark:text-[#E0E0E0] px-3 py-2 text-sm font-mono w-full min-w-[70px] outline-none focus:border-[#D43F33] transition-colors cursor-pointer text-center"
                            value={newTx.isDividend} onChange={e=>setNewTx({...newTx, isDividend: e.target.value})}
                          >
                            <option value="否">否</option>
                            <option value="是">是</option>
                          </select>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <input type="number" className="bg-gray-50 dark:bg-[#0A0A0A] border border-gray-300 dark:border-[#333] text-gray-900 dark:text-[#E0E0E0] px-3 py-2 text-sm font-mono text-right w-full min-w-[80px] outline-none focus:border-[#D43F33] transition-colors"
                            value={newTx.cashFlow} onChange={e=>setNewTx({...newTx, cashFlow: Number(e.target.value)})} placeholder="0"/>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <button className="bg-[#D43F33] text-white dark:text-[#111] px-4 py-2 text-xs font-bold uppercase transition hover:bg-gray-800 dark:hover:bg-[#E0E0E0]"
                              onClick={() => {
                                if(newTx.fundCode) {
                                  setTransactions([...transactions, {
                                    ...newTx, 
                                    id: Math.random().toString(36).substr(2,9)
                                  } as Transaction]);
                                  setNewTx({accountId: activeAccountId === 'all' ? (accounts[0]?.id || 'default') : activeAccountId, date: new Date().toISOString().split('T')[0], action: '买入', amount: 0, nav: 0, shares:0, isDividend:'否', cashFlow: 0, fundCode: '', fundName: ''});
                                  setIsAdding(false);
                                }
                              }}
                            >保存</button>
                            <button className="text-gray-400 dark:text-[#666] hover:text-gray-900 dark:text-[#E0E0E0] px-3 py-2 text-sm transition-colors" onClick={()=>setIsAdding(false)}>✖</button>
                          </div>
                        </td>
                      </tr>
                    )}
                    
                    {filteredTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-100 dark:bg-[#111] transition-colors group">
                        <td className="px-6 py-4 text-gray-500 dark:text-[#888] font-mono text-sm">{t.date}</td>
                        <td className="px-6 py-4 text-gray-700 dark:text-[#AAA] text-sm">{accounts.find(a => a.id === t.accountId)?.name || '未知'}</td>
                        <td className="px-6 py-4 text-gray-900 dark:text-[#E0E0E0] font-mono text-sm">{t.fundCode}</td>
                        <td className="px-6 py-4 font-serif text-gray-900 dark:text-[#E0E0E0]">{t.fundName}</td>
                        <td className="px-6 py-4 text-gray-900 dark:text-[#E0E0E0] font-mono text-sm">{t.action}</td>
                        <td className="px-6 py-4 text-right text-gray-900 dark:text-[#E0E0E0] font-mono text-sm">{t.amount.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-gray-900 dark:text-[#E0E0E0] font-mono text-sm">{(t.nav || 0).toFixed(4)}</td>
                        <td className="px-6 py-4 text-right text-gray-900 dark:text-[#E0E0E0] font-mono text-sm">{t.shares.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center text-gray-500 dark:text-[#888] font-mono text-sm">{t.isDividend}</td>
                        <td className="px-6 py-4 text-right text-gray-500 dark:text-[#888] font-mono text-sm">{t.cashFlow.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          {!readonly && (
                            <button 
                              onClick={() => handleDelete(t.id)}
                              className="text-gray-400 dark:text-[#444] hover:text-[#D43F33] p-2 transition-colors rounded-none opacity-0 group-hover:opacity-100"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    
                    {filteredTransactions.length === 0 && !isAdding && (
                      <tr>
                        <td colSpan={11} className="px-6 py-12 text-center text-gray-400 dark:text-[#666] font-serif italic text-lg">
                          暂无交易记录。
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {isManagingAccounts && !readonly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] p-8 w-full max-w-md shadow-2xl relative">
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-[#E0E0E0] transition-colors"
              onClick={() => setIsManagingAccounts(false)}
            >
              ✖
            </button>
            <h2 className="text-2xl font-serif italic mb-6 text-gray-900 dark:text-[#E0E0E0]">账号管理</h2>
            
            <div className="flex flex-col gap-4 mb-6">
              {accounts.map(acc => (
                <div key={acc.id} className="flex justify-between items-center group">
                  <span className="font-mono text-sm text-gray-700 dark:text-[#AAA]">{acc.name}</span>
                  {accounts.length > 1 && (
                    <button 
                      className="text-gray-400 hover:text-[#D43F33] opacity-0 group-hover:opacity-100 transition-all p-2"
                      onClick={() => {
                        const newAccounts = accounts.filter(a => a.id !== acc.id);
                        setAccounts(newAccounts);
                        setTransactions(transactions.filter(t => t.accountId !== acc.id));
                        if (activeAccountId === acc.id) {
                          setActiveAccountId('all');
                        }
                      }}
                      title="删除账号"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 border-t border-gray-200 dark:border-[#2A2A2A] pt-6">
              <input 
                type="text" 
                placeholder="新账号名称" 
                className="flex-1 bg-gray-50 dark:bg-[#111] border border-gray-300 dark:border-[#333] text-gray-900 dark:text-[#E0E0E0] px-4 py-2 text-sm outline-none focus:border-[#D43F33] transition-colors"
                value={newAccountName}
                onChange={e => setNewAccountName(e.target.value)}
              />
              <button 
                className="bg-[#D43F33] text-white px-4 py-2 text-[10px] uppercase tracking-[0.1em] font-bold hover:bg-[#B32D22] transition-colors flex items-center gap-2"
                onClick={() => {
                  if (newAccountName.trim()) {
                    setAccounts([...accounts, { id: Math.random().toString(36).substr(2, 9), name: newAccountName.trim() }]);
                    setNewAccountName('');
                  }
                }}
              >
                <Plus size={14} /> 添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Sub-components matching the new structure
function StatCard({ 
  title, 
  value, 
  isHighlight = false 
}: { 
  title: string, 
  value: string, 
  isHighlight?: boolean 
}) {
  return (
    <div className="bg-gray-50 dark:bg-[#0A0A0A] p-6 border border-gray-200 dark:border-[#2A2A2A] relative group rounded-none hover:border-[#D43F33] transition-colors overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-100 dark:via-[#111] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="flex items-center gap-3 mb-6">
        <span className="w-3 h-px bg-[#D43F33]"></span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-[#666]">{title}</span>
      </div>
      <div className="font-mono text-3xl text-left pl-6 text-gray-900 dark:text-[#E0E0E0]">
        {value}
      </div>
    </div>
  );
}
