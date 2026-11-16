import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet, Target, TrendingUp, CreditCard, Plus, Trash2, Settings,
  Download, Upload, RefreshCw, CheckCircle2, ArrowUpRight,
  ArrowDownRight, PieChart, Sparkles, DollarSign
} from 'lucide-react';

const CURRENCIES = [
  { symbol: 'S/', label: 'Soles (PEN)' },
  { symbol: '$', label: 'Dólares / Pesos ($)' },
  { symbol: '€', label: 'Euros (EUR)' },
  { symbol: '£', label: 'Libras (GBP)' },
];

const DEFAULT_CONFIG = {
  userName: '',
  currency: '$',
  initialBalance: 0,
  recurringIncome: 0,
  incomeFrequency: 'semanal',
  useCreditCard: true,
  cardName: 'Tarjeta Principal',
  creditLimit: 1000,
  alertThresholdPercent: 50,
  setupComplete: false,
};

const DEMO_DATA = {
  config: {
    userName: 'Alex',
    currency: '$',
    initialBalance: 1250,
    recurringIncome: 450,
    incomeFrequency: 'semanal',
    useCreditCard: true,
    cardName: 'Visa Rewards',
    creditLimit: 2000,
    alertThresholdPercent: 50,
    setupComplete: true,
  },
  transactions: [
    { id: '1', title: 'Supermercado semanal', amount: 85, type: 'expense', method: 'card', category: 'Alimentación', date: '2026-11-10' },
    { id: '2', title: 'Ingreso semanal', amount: 450, type: 'income', method: 'cash', category: 'Ingresos', date: '2026-11-09' },
    { id: '3', title: 'Cena y cine', amount: 65, type: 'expense', method: 'card', category: 'Ocio', date: '2026-11-08' },
    { id: '4', title: 'Internet y suscripciones', amount: 45, type: 'expense', method: 'cash', category: 'Servicios', date: '2026-11-06' },
  ],
  goals: [
    { id: 'g1', name: 'Fondo de Emergencia', targetAmount: 2000, savedAmount: 850, weeklyContribution: 100, deadline: '2027-02-15' },
    { id: 'g2', name: 'Setup / Laptop Nueva', targetAmount: 1200, savedAmount: 400, weeklyContribution: 75, deadline: '2027-01-30' },
  ],
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('fp_config_v1');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('fp_tx_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('fp_goals_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [txForm, setTxForm] = useState({
    title: '',
    amount: '',
    type: 'expense',
    method: 'cash',
    category: 'Alimentación',
  });

  const [goalForm, setGoalForm] = useState({
    name: '',
    targetAmount: '',
    savedAmount: '0',
    weeklyContribution: '',
    deadline: '',
  });

  const [depositInputs, setDepositInputs] = useState({});

  useEffect(() => {
    localStorage.setItem('fp_config_v1', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('fp_tx_v1', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('fp_goals_v1', JSON.stringify(goals));
  }, [goals]);

  const metrics = useMemo(() => {
    let cashBalance = Number(config.initialBalance) || 0;
    let cardDebt = 0;
    let totalExpenses = 0;
    let totalIncome = Number(config.initialBalance) || 0;
    const categoryTotals = {};

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        cashBalance += amt;
        totalIncome += amt;
      } else if (tx.type === 'expense') {
        totalExpenses += amt;
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + amt;
        if (tx.method === 'card' && config.useCreditCard) {
          cardDebt += amt;
        } else {
          cashBalance -= amt;
        }
      } else if (tx.type === 'card_payment') {
        cashBalance -= amt;
        cardDebt = Math.max(0, cardDebt - amt);
      }
    });

    const totalAllocatedToGoals = goals.reduce((acc, g) => acc + (Number(g.savedAmount) || 0), 0);
    const netFreeCash = cashBalance - cardDebt;
    const cardUsagePercent = config.creditLimit > 0 ? Math.min(100, (cardDebt / config.creditLimit) * 100) : 0;

    return {
      cashBalance,
      cardDebt,
      netFreeCash,
      totalExpenses,
      totalIncome,
      categoryTotals,
      totalAllocatedToGoals,
      cardUsagePercent,
    };
  }, [config, transactions, goals]);

  const formatMoney = (val) => `${config.currency} ${Number(val || 0).toFixed(2)}`;

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!txForm.title.trim() || !txForm.amount || Number(txForm.amount) <= 0) return;
    const newTx = {
      id: Date.now().toString(),
      ...txForm,
      amount: parseFloat(txForm.amount),
      date: new Date().toISOString().split('T')[0],
    };
    setTransactions([newTx, ...transactions]);
    setTxForm({ ...txForm, title: '', amount: '' });
  };

  const handlePayCard = () => {
    if (metrics.cardDebt <= 0) return;
    const payTx = {
      id: Date.now().toString(),
      title: `Pago a ${config.cardName}`,
      amount: metrics.cardDebt,
      type: 'card_payment',
      method: 'cash',
      category: 'Pago Tarjeta',
      date: new Date().toISOString().split('T')[0],
    };
    setTransactions([payTx, ...transactions]);
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!goalForm.name.trim() || !goalForm.targetAmount || Number(goalForm.targetAmount) <= 0) return;
    const newGoal = {
      id: Date.now().toString(),
      name: goalForm.name,
      targetAmount: parseFloat(goalForm.targetAmount),
      savedAmount: parseFloat(goalForm.savedAmount) || 0,
      weeklyContribution: parseFloat(goalForm.weeklyContribution) || 0,
      deadline: goalForm.deadline || '',
    };
    setGoals([...goals, newGoal]);
    setGoalForm({ name: '', targetAmount: '', savedAmount: '0', weeklyContribution: '', deadline: '' });
  };

  const handleAddFundsToGoal = (goalId) => {
    const addVal = parseFloat(depositInputs[goalId]);
    if (!addVal || addVal <= 0) return;
    setGoals(
      goals.map((g) =>
        g.id === goalId ? { ...g, savedAmount: Math.min(g.targetAmount, g.savedAmount + addVal) } : g
      )
    );
    setDepositInputs({ ...depositInputs, [goalId]: '' });
  };

  const loadDemo = () => {
    setConfig(DEMO_DATA.config);
    setTransactions(DEMO_DATA.transactions);
    setGoals(DEMO_DATA.goals);
    setActiveTab('dashboard');
  };

  const resetAll = () => {
    if (!window.confirm('¿Seguro que deseas borrar todos los datos y reiniciar desde cero?')) return;
    setConfig(DEFAULT_CONFIG);
    setTransactions([]);
    setGoals([]);
  };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ config, transactions, goals }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respaldo-finanzas-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.config) setConfig(parsed.config);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.goals) setGoals(parsed.goals);
      } catch {
        alert('Archivo de respaldo inválido.');
      }
    };
    reader.readAsText(file);
  };

  if (!config.setupComplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Configura tu Espacio Financiero</h1>
                <p className="text-xs text-slate-500">Simple, privado y 100% adaptable a ti</p>
              </div>
            </div>
            <button
              onClick={loadDemo}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> Ver Demo
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setConfig({ ...config, setupComplete: true });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tu nombre (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Camila"
                  value={config.userName}
                  onChange={(e) => setConfig({ ...config, userName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Moneda</label>
                <select
                  value={config.currency}
                  onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.symbol} value={c.symbol}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Saldo disponible actual</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={config.initialBalance || ''}
                  onChange={(e) => setConfig({ ...config, initialBalance: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ingreso habitual</label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={config.recurringIncome || ''}
                    onChange={(e) => setConfig({ ...config, recurringIncome: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <select
                    value={config.incomeFrequency}
                    onChange={(e) => setConfig({ ...config, incomeFrequency: e.target.value })}
                    className="px-2 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="semanal">/sem</option>
                    <option value="quincenal">/quin</option>
                    <option value="mensual">/mes</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-slate-700">¿Usas tarjeta de crédito para tus gastos?</span>
                <input
                  type="checkbox"
                  checked={config.useCreditCard}
                  onChange={(e) => setConfig({ ...config, useCreditCard: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
              </label>

              {config.useCreditCard && (
                <div className="mt-3 p-3.5 bg-slate-50 rounded-xl grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nombre tarjeta</label>
                    <input
                      type="text"
                      value={config.cardName}
                      onChange={(e) => setConfig({ ...config, cardName: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Línea total</label>
                    <input
                      type="number"
                      value={config.creditLimit}
                      onChange={(e) => setConfig({ ...config, creditLimit: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Alerta uso (%)</label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={config.alertThresholdPercent}
                      onChange={(e) => setConfig({ ...config, alertThresholdPercent: parseInt(e.target.value) || 50 })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
            >
              Comenzar a gestionar mis finanzas
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base leading-tight">
                {config.userName ? `Finanzas de ${config.userName}` : 'Mi Panel Financiero'}
              </h1>
              <p className="text-xs text-slate-400">Control personal & metas</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'dashboard', label: 'Resumen' },
              { id: 'goals', label: 'Metas' },
              { id: 'settings', label: 'Ajustes' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
                  <span>Efectivo en Cuenta</span>
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{formatMoney(metrics.cashBalance)}</div>
                <p className="text-xs text-slate-400 mt-1">
                  Libre real (sin deuda): <strong className="text-emerald-600">{formatMoney(metrics.netFreeCash)}</strong>
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
                  <span>Acumulado en Metas</span>
                  <Target className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{formatMoney(metrics.totalAllocatedToGoals)}</div>
                <p className="text-xs text-slate-400 mt-1">
                  {goals.length} {goals.length === 1 ? 'meta activa' : 'metas activas'}
                </p>
              </div>

              {config.useCreditCard ? (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
                    <span>{config.cardName}</span>
                    <CreditCard className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-slate-900">{formatMoney(metrics.cardDebt)}</span>
                    <span className="text-xs text-slate-400">/ {formatMoney(config.creditLimit)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        metrics.cardUsagePercent >= config.alertThresholdPercent ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${metrics.cardUsagePercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-slate-500">
                      {metrics.cardUsagePercent.toFixed(0)}% usado (meta &lt;{config.alertThresholdPercent}%)
                    </span>
                    {metrics.cardDebt > 0 && (
                      <button
                        onClick={handlePayCard}
                        className="text-[11px] font-semibold text-indigo-600 hover:underline"
                      >
                        Pagar todo
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
                    <span>Total Gastado</span>
                    <TrendingUp className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{formatMoney(metrics.totalExpenses)}</div>
                  <p className="text-xs text-slate-400 mt-1">Ingreso base: {formatMoney(config.recurringIncome)}/{config.incomeFrequency}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit">
                <h2 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-600" /> Nuevo Movimiento
                </h2>
                <form onSubmit={handleAddTransaction} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setTxForm({ ...txForm, type: 'expense' })}
                      className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                        txForm.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      Gasto
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxForm({ ...txForm, type: 'income', method: 'cash' })}
                      className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                        txForm.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      Ingreso
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Descripción (ej. Mercado, Sueldo)"
                    value={txForm.title}
                    onChange={(e) => setTxForm({ ...txForm, title: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                    required
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Monto"
                      value={txForm.amount}
                      onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                      required
                    />
                    <select
                      value={txForm.category}
                      onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    >
                      <option value="Alimentación">Alimentación</option>
                      <option value="Transporte">Transporte</option>
                      <option value="Ocio">Ocio / Salidas</option>
                      <option value="Servicios">Servicios</option>
                      <option value="Compras">Compras</option>
                      <option value="Ingresos">Ingresos</option>
                    </select>
                  </div>

                  {txForm.type === 'expense' && config.useCreditCard && (
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                      <span>Método de pago:</span>
                      <div className="flex gap-2">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            checked={txForm.method === 'cash'}
                            onChange={() => setTxForm({ ...txForm, method: 'cash' })}
                          />
                          Efectivo/Débito
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            checked={txForm.method === 'card'}
                            onChange={() => setTxForm({ ...txForm, method: 'card' })}
                          />
                          {config.cardName}
                        </label>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition"
                  >
                    Guardar Movimiento
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 space-y-6">
                {Object.keys(metrics.categoryTotals).length > 0 && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-indigo-600" /> Distribución de Gastos
                    </h3>
                    <div className="space-y-2.5">
                      {Object.entries(metrics.categoryTotals).map(([cat, total]) => {
                        const pct = metrics.totalExpenses > 0 ? (total / metrics.totalExpenses) * 100 : 0;
                        return (
                          <div key={cat}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-slate-700">{cat}</span>
                              <span className="text-slate-500">
                                {formatMoney(total)} ({pct.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-sm text-slate-900 mb-3">Movimientos Recientes</h3>
                  {transactions.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">
                      Aún no tienes movimientos registrados. Agrega tu primer ingreso o gasto a la izquierda.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {transactions.map((tx) => (
                        <div key={tx.id} className="py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                tx.type === 'income'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-rose-50 text-rose-600'
                              }`}
                            >
                              {tx.type === 'income' ? (
                                <ArrowUpRight className="w-4 h-4" />
                              ) : (
                                <ArrowDownRight className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{tx.title}</p>
                              <p className="text-[11px] text-slate-400">
                                {tx.category} • {tx.date} {tx.method === 'card' ? `• ${config.cardName}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-sm font-bold ${
                                tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                              }`}
                            >
                              {tx.type === 'income' ? '+' : '-'}
                              {formatMoney(tx.amount)}
                            </span>
                            <button
                              onClick={() => setTransactions(transactions.filter((t) => t.id !== tx.id))}
                              className="text-slate-300 hover:text-rose-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'goals' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit">
              <h2 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" /> Crear Nueva Meta
              </h2>
              <form onSubmit={handleAddGoal} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nombre de la meta</label>
                  <input
                    type="text"
                    placeholder="Ej. Fondo de emergencia, Viaje..."
                    value={goalForm.name}
                    onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Monto objetivo</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="1000"
                      value={goalForm.targetAmount}
                      onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Ahorro inicial</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={goalForm.savedAmount}
                      onChange={(e) => setGoalForm({ ...goalForm, savedAmount: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Aporte semanal est.</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="50"
                      value={goalForm.weeklyContribution}
                      onChange={(e) => setGoalForm({ ...goalForm, weeklyContribution: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Fecha objetivo</label>
                    <input
                      type="date"
                      value={goalForm.deadline}
                      onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition"
                >
                  Agregar Meta
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {goals.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center">
                  <Target className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700">Aún no has creado ninguna meta financiera</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Define cuánto quieres ahorrar y te calcularemos cuántas semanas te tomará lograrlo.
                  </p>
                </div>
              ) : (
                goals.map((goal) => {
                  const pct = Math.min(100, (goal.savedAmount / goal.targetAmount) * 100);
                  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
                  const weeksLeft =
                    goal.weeklyContribution > 0 ? Math.ceil(remaining / goal.weeklyContribution) : null;

                  return (
                    <div key={goal.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            {goal.name}
                            {pct >= 100 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {formatMoney(goal.savedAmount)} ahorrados de {formatMoney(goal.targetAmount)}
                            {goal.deadline ? ` • Fecha límite: ${goal.deadline}` : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => setGoals(goals.filter((g) => g.id !== goal.id))}
                          className="text-slate-300 hover:text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden my-3">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">{pct.toFixed(1)}%</span> completado
                          {weeksLeft !== null && remaining > 0 && (
                            <span>
                              {' '}
                              • Te faltan aprox. <strong>{weeksLeft} semanas</strong> (a {formatMoney(goal.weeklyContribution)}/sem)
                            </span>
                          )}
                        </div>

                        {pct < 100 && (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="+ Monto"
                              value={depositInputs[goal.id] || ''}
                              onChange={(e) =>
                                setDepositInputs({ ...depositInputs, [goal.id]: e.target.value })
                              }
                              className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                            />
                            <button
                              onClick={() => handleAddFundsToGoal(goal.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg"
                            >
                              Abonar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-xl bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" /> Configuración y Respaldo
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre</label>
                <input
                  type="text"
                  value={config.userName}
                  onChange={(e) => setConfig({ ...config, userName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Moneda</label>
                <select
                  value={config.currency}
                  onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.symbol} value={c.symbol}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-3">
              <button
                onClick={exportBackup}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Exportar Respaldo (.JSON)
              </button>
              <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Importar Respaldo
                <input type="file" accept=".json" onChange={importBackup} className="hidden" />
              </label>
              <button
                onClick={loadDemo}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> Cargar Datos Demo
              </button>
              <button
                onClick={resetAll}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reiniciar App
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
