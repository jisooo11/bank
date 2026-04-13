import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  PieChart,
  PlusCircle,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';

const SAMPLE_TRANSACTIONS = [
  { id: 1, type: 'income', amount: 3000000, category: '월급', date: '2026-04-05' },
  { id: 2, type: 'income', amount: 200000, category: '부업', date: '2026-04-01' },
  { id: 3, type: 'expense', amount: 150000, category: '식비', date: '2026-04-02' },
  { id: 4, type: 'expense', amount: 50000, category: '교통', date: '2026-04-08' },
  { id: 5, type: 'expense', amount: 80000, category: '생활', date: '2026-04-09' },
  { id: 6, type: 'income', amount: 3000000, category: '월급', date: '2026-03-05' },
  { id: 7, type: 'income', amount: 150000, category: '금융수입', date: '2026-03-10' },
  { id: 8, type: 'expense', amount: 520000, category: '주거', date: '2026-03-12' },
  { id: 9, type: 'expense', amount: 300000, category: '생활', date: '2026-03-18' },
  { id: 10, type: 'expense', amount: 120000, category: '교통', date: '2026-03-25' },
  { id: 11, type: 'income', amount: 3000000, category: '월급', date: '2026-02-05' },
  { id: 12, type: 'expense', amount: 450000, category: '주거', date: '2026-02-10' },
  { id: 13, type: 'expense', amount: 200000, category: '생활', date: '2026-02-15' },
  { id: 14, type: 'expense', amount: 100000, category: '교통', date: '2026-02-20' },
];

const CATEGORY_OPTIONS = {
  income: ['월급', '부업', '금융수입'],
  expense: ['주거', '생활', '식비', '교통'],
};

const INITIAL_PROFILE = {
  monthlyInvestmentBudget: '',
  availableCash: '',
  debt: '',
  riskProfile: '중립형',
  investmentHorizon: '3년 이상',
  goal: '장기 자산 증식',
  notes: '',
};

function formatCurrency(value) {
  return `${new Intl.NumberFormat('ko-KR').format(value)}원`;
}

export default function App() {
  const [transactions, setTransactions] = useState(() => {
    const savedTransactions = localStorage.getItem('transactions');
    if (!savedTransactions) {
      return SAMPLE_TRANSACTIONS;
    }

    try {
      return JSON.parse(savedTransactions);
    } catch (error) {
      console.error('거래 내역을 불러오지 못했습니다.', error);
      return SAMPLE_TRANSACTIONS;
    }
  });

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS.expense[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');

  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [advice, setAdvice] = useState('');
  const [error, setError] = useState('');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    return transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'income') {
          acc.totalIncome += transaction.amount;
        } else {
          acc.totalExpense += transaction.amount;
        }

        acc.balance = acc.totalIncome - acc.totalExpense;
        return acc;
      },
      { totalIncome: 0, totalExpense: 0, balance: 0 }
    );
  }, [transactions]);

  const monthlyStats = useMemo(() => {
    const grouped = {};

    transactions.forEach((transaction) => {
      const month = transaction.date.slice(0, 7);

      if (!grouped[month]) {
        grouped[month] = { month, income: 0, expense: 0 };
      }

      if (transaction.type === 'income') {
        grouped[month].income += transaction.amount;
      } else {
        grouped[month].expense += transaction.amount;
      }
    });

    return Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  const maxMonthlyAmount = Math.max(
    0,
    ...monthlyStats.flatMap((month) => [month.income, month.expense])
  );

  const { incomeStats, expenseStats } = useMemo(() => {
    const incomeGroup = {};
    const expenseGroup = {};
    const incomeColors = ['#10b981', '#3b82f6', '#6366f1', '#06b6d4'];
    const expenseColors = ['#ef4444', '#f59e0b', '#ec4899', '#f43f5e'];

    transactions.forEach((transaction) => {
      const target = transaction.type === 'income' ? incomeGroup : expenseGroup;
      target[transaction.category] = (target[transaction.category] || 0) + transaction.amount;
    });

    const formatStats = (group, colors) =>
      Object.entries(group)
        .map(([label, value], index) => ({
          label,
          value,
          color: colors[index % colors.length],
        }))
        .sort((a, b) => b.value - a.value);

    return {
      incomeStats: formatStats(incomeGroup, incomeColors),
      expenseStats: formatStats(expenseGroup, expenseColors),
    };
  }, [transactions]);

  const financialSummary = useMemo(() => {
    const recentMonths = monthlyStats.slice(-3);
    const averageIncome =
      recentMonths.length > 0
        ? Math.round(
            recentMonths.reduce((sum, month) => sum + month.income, 0) / recentMonths.length
          )
        : 0;
    const averageExpense =
      recentMonths.length > 0
        ? Math.round(
            recentMonths.reduce((sum, month) => sum + month.expense, 0) / recentMonths.length
          )
        : 0;

    return {
      totalIncome,
      totalExpense,
      balance,
      averageIncome,
      averageExpense,
      savingsEstimate: averageIncome - averageExpense,
      recentMonths,
    };
  }, [balance, monthlyStats, totalExpense, totalIncome]);

  const handleTypeChange = (nextType) => {
    setType(nextType);
    setCategory(CATEGORY_OPTIONS[nextType][0]);
  };

  const handleAddTransaction = (event) => {
    event.preventDefault();

    if (!amount || !category || !date) {
      alert('모든 항목을 입력해주세요.');
      return;
    }

    const newTransaction = {
      id: Date.now(),
      type,
      amount: Number(amount),
      category,
      date,
    };

    setTransactions((current) =>
      [newTransaction, ...current].sort((a, b) => new Date(b.date) - new Date(a.date))
    );
    setAmount('');
    setCategory(CATEGORY_OPTIONS[type][0]);
  };

  const handleDelete = (id) => {
    setTransactions((current) => current.filter((transaction) => transaction.id !== id));
  };

  const handleDoubleClickAmount = (transaction) => {
    setEditingId(transaction.id);
    setEditAmount(String(transaction.amount));
  };

  const handleSaveAmount = (id) => {
    const parsedAmount = Number(editAmount);

    if (!Number.isNaN(parsedAmount) && parsedAmount >= 0) {
      if (parsedAmount === 0) {
        setTransactions((current) => current.filter((transaction) => transaction.id !== id));
      } else {
        setTransactions((current) =>
          current.map((transaction) =>
            transaction.id === id ? { ...transaction, amount: parsedAmount } : transaction
          )
        );
      }
    }

    setEditingId(null);
  };

  const handleAmountKeyDown = (event, id) => {
    if (event.key === 'Enter') {
      handleSaveAmount(id);
    } else if (event.key === 'Escape') {
      setEditingId(null);
    }
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const handleRequestAdvice = async () => {
    setIsLoadingAdvice(true);
    setError('');

    try {
      const response = await fetch('/api/investment-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: {
            ...profile,
            monthlyInvestmentBudget: Number(profile.monthlyInvestmentBudget || 0),
            availableCash: Number(profile.availableCash || 0),
            debt: Number(profile.debt || 0),
          },
          financialSummary,
          transactions: transactions.slice(0, 30),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '투자 조언을 불러오지 못했습니다.');
      }

      setAdvice(result.advice);
    } catch (requestError) {
      setAdvice('');
      setError(requestError.message);
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  const adviceLines = advice
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);

  const renderDonutChart = (stats, total, title) => {
    if (!stats.length || total === 0) {
      return null;
    }

    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    let startOffset = 0;

    return (
      <div className="flex flex-col items-center bg-gray-50 rounded-xl p-4 md:p-6 w-full">
        <h3 className="font-semibold text-gray-700 mb-6">{title}</h3>
        <div className="relative w-40 h-40">
          <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
            {stats.map((item) => {
              const sliceLength = (item.value / total) * circumference;
              const strokeDasharray = `${sliceLength} ${circumference}`;
              const strokeDashoffset = -startOffset;
              startOffset += sliceLength;

              return (
                <circle
                  key={item.label}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="24"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-xs text-gray-500">총액</span>
            <span className="text-sm font-bold text-gray-800">
              {new Intl.NumberFormat('ko-KR', {
                notation: 'compact',
                maximumFractionDigits: 1,
              }).format(total)}
              원
            </span>
          </div>
        </div>
        <div className="mt-6 w-full space-y-3">
          {stats.map((item) => (
            <div key={item.label} className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-600">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800">{formatCurrency(item.value)}</span>
                <span className="text-xs text-gray-400 w-8 text-right">
                  {((item.value / total) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="text-blue-600" size={32} />
              스마트 가계부
            </h1>
            <button
              onClick={() => setTransactions(SAMPLE_TRANSACTIONS)}
              className="text-sm bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
            >
              샘플 데이터 채우기
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <span className="text-gray-500 text-sm font-medium mb-1">총 잔액</span>
              <span className={`text-3xl font-bold ${balance >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
                {formatCurrency(balance)}
              </span>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-full">
                <TrendingUp size={24} />
              </div>
              <div>
                <span className="text-gray-500 text-sm font-medium block">총 수입</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(totalIncome)}</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-full">
                <TrendingDown size={24} />
              </div>
              <div>
                <span className="text-gray-500 text-sm font-medium block">총 지출</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(totalExpense)}</span>
              </div>
            </div>
          </div>
        </header>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={20} />
            월별 수입/지출 요약
          </h2>
          {monthlyStats.length > 0 ? (
            <div className="flex items-end justify-around h-48 gap-2 mt-4 pt-6 border-b border-gray-100 pb-2">
              {monthlyStats.map(({ month, income, expense }) => {
                const [year, monthNumber] = month.split('-');
                const incomePercentage = maxMonthlyAmount > 0 ? (income / maxMonthlyAmount) * 100 : 0;
                const expensePercentage = maxMonthlyAmount > 0 ? (expense / maxMonthlyAmount) * 100 : 0;

                return (
                  <div
                    key={month}
                    className="flex flex-col items-center flex-1 group h-full justify-end relative"
                  >
                    <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-gray-700 whitespace-nowrap bg-white py-2 px-3 rounded shadow-md border border-gray-100 z-10 pointer-events-none flex flex-col gap-1">
                      <span className="text-green-600">수입: {formatCurrency(income)}</span>
                      <span className="text-red-600">지출: {formatCurrency(expense)}</span>
                    </div>
                    <div className="flex items-end gap-1 w-full max-w-[60px] justify-center h-full">
                      <div
                        className="w-1/2 max-w-[24px] bg-green-400 group-hover:bg-green-500 rounded-t-md transition-all duration-500 ease-out"
                        style={{ height: `${incomePercentage}%`, minHeight: incomePercentage > 0 ? '4px' : 0 }}
                      />
                      <div
                        className="w-1/2 max-w-[24px] bg-red-400 group-hover:bg-red-500 rounded-t-md transition-all duration-500 ease-out"
                        style={{ height: `${expensePercentage}%`, minHeight: expensePercentage > 0 ? '4px' : 0 }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-3 font-medium text-center">
                      <span className="block sm:hidden">{Number(monthNumber)}월</span>
                      <span className="hidden sm:block">
                        {year.slice(2)}년 {Number(monthNumber)}월
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8 text-sm">거래 내역이 없습니다.</p>
          )}
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <PieChart className="text-blue-600" size={20} />
            카테고리 비중
          </h2>
          {transactions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {totalIncome > 0 ? (
                renderDonutChart(incomeStats, totalIncome, '수입 비중')
              ) : (
                <div className="flex items-center justify-center bg-gray-50 rounded-xl p-6 text-gray-500 text-sm">
                  수입 내역이 없습니다.
                </div>
              )}
              {totalExpense > 0 ? (
                renderDonutChart(expenseStats, totalExpense, '지출 비중')
              ) : (
                <div className="flex items-center justify-center bg-gray-50 rounded-xl p-6 text-gray-500 text-sm">
                  지출 내역이 없습니다.
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8 text-sm">거래 내역이 없습니다.</p>
          )}
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">새 거래 추가</h2>
          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={type === 'income'}
                  onChange={(event) => handleTypeChange(event.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className={type === 'income' ? 'font-medium text-green-600' : 'text-gray-600'}>
                  수입
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={type === 'expense'}
                  onChange={(event) => handleTypeChange(event.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className={type === 'expense' ? 'font-medium text-red-600' : 'text-gray-600'}>
                  지출
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-gray-600">날짜</label>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-600">카테고리</label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                  required
                >
                  {CATEGORY_OPTIONS[type].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 md:col-span-2 flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <label className="text-sm text-gray-600">금액</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors h-[46px] px-6"
                >
                  <PlusCircle size={20} />
                  추가
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Sparkles className="text-blue-600" size={20} />
              AI 투자 조언
            </h2>
            <span className="text-sm text-gray-500">
              최근 가계부 데이터와 입력한 재정 상태를 함께 분석합니다.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-600">월 투자 가능 금액</label>
              <input
                type="number"
                name="monthlyInvestmentBudget"
                value={profile.monthlyInvestmentBudget}
                onChange={handleProfileChange}
                min="0"
                placeholder="예: 300000"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-gray-600">현재 투자 가능한 현금</label>
              <input
                type="number"
                name="availableCash"
                value={profile.availableCash}
                onChange={handleProfileChange}
                min="0"
                placeholder="예: 5000000"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-gray-600">총 부채</label>
              <input
                type="number"
                name="debt"
                value={profile.debt}
                onChange={handleProfileChange}
                min="0"
                placeholder="예: 10000000"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-gray-600">위험 성향</label>
              <select
                name="riskProfile"
                value={profile.riskProfile}
                onChange={handleProfileChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              >
                <option>안정형</option>
                <option>중립형</option>
                <option>공격형</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-gray-600">투자 기간</label>
              <select
                name="investmentHorizon"
                value={profile.investmentHorizon}
                onChange={handleProfileChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              >
                <option>1년 이내</option>
                <option>1년~3년</option>
                <option>3년 이상</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-gray-600">투자 목표</label>
              <input
                type="text"
                name="goal"
                value={profile.goal}
                onChange={handleProfileChange}
                placeholder="예: 배당 수익, 장기 성장"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm text-gray-600">추가 메모</label>
              <textarea
                name="notes"
                value={profile.notes}
                onChange={handleProfileChange}
                rows="3"
                placeholder="예: 비상금은 따로 보유 중, 매달 적립식 투자 선호"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors resize-none"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleRequestAdvice}
              disabled={isLoadingAdvice}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
            >
              {isLoadingAdvice ? '조언 생성 중...' : '투자 조언 요청'}
            </button>
            <span className="text-xs text-gray-500">
              참고용 조언이며, 실제 투자 판단과 손실 책임은 사용자에게 있습니다.
            </span>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          {advice ? (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Gemini 투자 조언</h3>
              <div className="space-y-2">
                {adviceLines.map((line, index) => (
                  <p
                    key={`${index}-${line}`}
                    className="text-sm leading-6 text-gray-700 bg-white/80 rounded-lg px-3 py-2"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">거래 내역</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm">
                  <th className="p-4 font-medium">날짜</th>
                  <th className="p-4 font-medium">구분</th>
                  <th className="p-4 font-medium">카테고리</th>
                  <th className="p-4 font-medium text-right">금액</th>
                  <th className="p-4 font-medium text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-600">{transaction.date}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.type === 'income'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {transaction.type === 'income' ? '수입' : '지출'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-900 font-medium">{transaction.category}</td>
                      <td
                        className={`p-4 text-right font-bold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-gray-900'
                        }`}
                        onDoubleClick={() => handleDoubleClickAmount(transaction)}
                      >
                        {editingId === transaction.id ? (
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(event) => setEditAmount(event.target.value)}
                            onBlur={() => handleSaveAmount(transaction.id)}
                            onKeyDown={(event) => handleAmountKeyDown(event, transaction.id)}
                            className="w-28 md:w-32 text-right p-1.5 border-2 border-blue-400 rounded-lg focus:outline-none focus:border-blue-600 bg-white text-gray-900 font-normal shadow-sm"
                            autoFocus
                          />
                        ) : (
                          <span
                            className="cursor-pointer border-b border-dashed border-gray-300 pb-0.5 hover:text-blue-600 transition-colors"
                            title="더블클릭해서 금액 수정"
                          >
                            {transaction.type === 'income' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      등록된 거래 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
