import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, DollarSign, AlertCircle, TrendingUp, CreditCard, Repeat, Crown, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FREE_LIMIT = 4;

interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingDay: number;
  billingCycle: number;
  category: string;
  color: string;
}

const categories = [
  { name: 'Streaming', color: '#E50914' },
  { name: 'Music', color: '#1DB954' },
  { name: 'Software', color: '#0078D4' },
  { name: 'Gaming', color: '#9147FF' },
  { name: 'Cloud', color: '#FF9900' },
  { name: 'Fitness', color: '#00D4AA' },
  { name: 'News', color: '#1DA1F2' },
  { name: 'Other', color: '#6B7280' },
];

const billingCycles = [
  { value: 1, label: 'Monatlich' },
  { value: 2, label: 'Alle 2 Monate' },
  { value: 3, label: 'Alle 3 Monate' },
  { value: 6, label: 'Alle 6 Monate' },
  { value: 12, label: 'Jährlich' },
];

function App() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const saved = localStorage.getItem('subscriptions');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((sub: Subscription) => ({
        ...sub,
        billingCycle: sub.billingCycle || 1
      }));
    }
    return [
      { id: '1', name: 'Netflix', amount: 15.99, billingDay: 15, billingCycle: 1, category: 'Streaming', color: '#E50914' },
      { id: '2', name: 'Spotify', amount: 9.99, billingDay: 1, billingCycle: 1, category: 'Music', color: '#1DB954' },
    ];
  });

  const [isPremium] = useState(() => localStorage.getItem('isPremium') === 'true');
  const [showModal, setShowModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [newSub, setNewSub] = useState({ name: '', amount: '', billingDay: '1', billingCycle: '1', category: 'Streaming' });

  useEffect(() => {
    localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  // PWA install prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // iOS detection - show banner if on iOS Safari and not in standalone
    const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isStandalone = (window.navigator as any).standalone;
    const dismissed = localStorage.getItem('installBannerDismissed');
    if (isIOS && !isStandalone && !dismissed) {
      setTimeout(() => setShowInstallBanner(true), 2000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
    setShowInstallBanner(false);
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('installBannerDismissed', 'true');
  };

  const handleAddClick = () => {
    if (!isPremium && subscriptions.length >= FREE_LIMIT) {
      setShowPaywall(true);
    } else {
      setShowModal(true);
    }
  };

  const addSubscription = () => {
    if (!newSub.name || !newSub.amount) return;
    const category = categories.find(c => c.name === newSub.category);
    const sub: Subscription = {
      id: Date.now().toString(),
      name: newSub.name,
      amount: parseFloat(newSub.amount),
      billingDay: parseInt(newSub.billingDay),
      billingCycle: parseInt(newSub.billingCycle),
      category: newSub.category,
      color: category?.color || '#6B7280',
    };
    setSubscriptions([...subscriptions, sub]);
    setNewSub({ name: '', amount: '', billingDay: '1', billingCycle: '1', category: 'Streaming' });
    setShowModal(false);
  };

  const deleteSubscription = (id: string) => {
    setSubscriptions(subscriptions.filter(s => s.id !== id));
  };

  const getMonthlyEquivalent = (sub: Subscription) => sub.amount / sub.billingCycle;
  const monthlyTotal = subscriptions.reduce((sum, s) => sum + getMonthlyEquivalent(s), 0);
  const yearlyTotal = monthlyTotal * 12;

  const getDaysUntilPayment = (billingDay: number) => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    let nextPayment: Date;
    if (billingDay >= currentDay) {
      nextPayment = new Date(currentYear, currentMonth, billingDay);
    } else {
      nextPayment = new Date(currentYear, currentMonth + 1, billingDay);
    }
    const diffTime = nextPayment.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getNextPaymentDate = (billingDay: number) => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    let nextPayment: Date;
    if (billingDay >= currentDay) {
      nextPayment = new Date(currentYear, currentMonth, billingDay);
    } else {
      nextPayment = new Date(currentYear, currentMonth + 1, billingDay);
    }
    return nextPayment.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
  };

  const getBillingCycleLabel = (cycle: number) => {
    if (cycle === 1) return 'Monatlich';
    if (cycle === 12) return 'Jährlich';
    return `Alle ${cycle} Monate`;
  };

  const upcomingPayments = [...subscriptions]
    .sort((a, b) => getDaysUntilPayment(a.billingDay) - getDaysUntilPayment(b.billingDay))
    .slice(0, 5);

  const slotsUsed = subscriptions.length;
  const slotsRemaining = isPremium ? '∞' : Math.max(0, FREE_LIMIT - slotsUsed);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-600/15 rounded-full blur-[100px]" />
        <div className="absolute -bottom-20 right-1/3 w-72 h-72 bg-emerald-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Install Banner */}
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-900/95 to-blue-900/95 backdrop-blur-xl border-b border-purple-500/30 px-4 py-3 flex items-center gap-3"
          >
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Smartphone className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Als App installieren</p>
              <p className="text-xs text-gray-400 truncate">
                {deferredPrompt ? 'Zum Homescreen hinzufügen' : 'Teilen → Zum Home-Bildschirm'}
              </p>
            </div>
            {deferredPrompt && (
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-semibold transition-colors shrink-0"
              >
                Installieren
              </button>
            )}
            <button onClick={dismissInstallBanner} className="p-1 text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12 ${showInstallBanner ? 'pt-24' : ''}`}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex items-start justify-between"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
              SubTracker
            </h1>
            <p className="text-gray-400 mt-2">Behalte deine Abonnements im Blick</p>
          </div>
          {!isPremium && (
            <button
              onClick={() => setShowPaywall(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl text-amber-400 text-sm font-medium hover:from-amber-500/30 hover:to-orange-500/30 transition-all"
            >
              <Crown className="w-4 h-4" />
              Premium
            </button>
          )}
          {isPremium && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl text-amber-400 text-sm font-medium">
              <Crown className="w-4 h-4" />
              Premium
            </div>
          )}
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <CreditCard className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-gray-400 text-sm">Monatlich (Ø)</span>
            </div>
            <p className="text-3xl font-bold">€{monthlyTotal.toFixed(2)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-gray-400 text-sm">Jährlich</span>
            </div>
            <p className="text-3xl font-bold">€{yearlyTotal.toFixed(2)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-emerald-600/20 to-emerald-900/20 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Repeat className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-gray-400 text-sm">Abonnements</span>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold">{slotsUsed}</p>
              {!isPremium && (
                <p className="text-gray-500 text-sm mb-1">/ {FREE_LIMIT} gratis</p>
              )}
            </div>
            {!isPremium && (
              <div className="mt-3">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (slotsUsed / FREE_LIMIT) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {slotsUsed >= FREE_LIMIT ? (
                    <span className="text-amber-400">Limit erreicht — <button onClick={() => setShowPaywall(true)} className="underline">Upgrade</button></span>
                  ) : (
                    `Noch ${slotsRemaining} gratis`
                  )}
                </p>
              </div>
            )}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Subscriptions List */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Deine Abos</h2>
              <button
                onClick={handleAddClick}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Hinzufügen
              </button>
            </div>

            <AnimatePresence>
              {subscriptions.map((sub) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex items-center gap-4"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ backgroundColor: sub.color + '25', border: `1px solid ${sub.color}40` }}
                  >
                    {sub.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{sub.name}</p>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor: sub.color + '20', color: sub.color }}
                      >
                        {sub.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Repeat className="w-3 h-3" />
                        {getBillingCycleLabel(sub.billingCycle)}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {getNextPaymentDate(sub.billingDay)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold">€{sub.amount.toFixed(2)}</p>
                    {sub.billingCycle > 1 && (
                      <p className="text-xs text-gray-500">€{getMonthlyEquivalent(sub).toFixed(2)}/Mo</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteSubscription(sub.id)}
                    className="p-2 text-gray-600 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {subscriptions.length === 0 && (
              <div className="text-center py-16 text-gray-600">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Noch keine Abonnements</p>
                <button onClick={handleAddClick} className="mt-3 text-purple-400 hover:text-purple-300 text-sm underline">
                  Erstes Abo hinzufügen
                </button>
              </div>
            )}

            {/* Free limit nudge */}
            {!isPremium && slotsUsed >= FREE_LIMIT && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowPaywall(true)}
                className="cursor-pointer border border-dashed border-amber-500/40 rounded-xl p-4 flex items-center gap-3 hover:border-amber-500/60 transition-colors"
              >
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Crown className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-400">Mehr Abos tracken?</p>
                  <p className="text-xs text-gray-500">Premium freischalten für unbegrenzte Abos</p>
                </div>
                <Plus className="w-4 h-4 text-amber-400 ml-auto" />
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                Nächste Zahlungen
              </h2>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                {upcomingPayments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Keine anstehenden Zahlungen</p>
                ) : (
                  <div className="space-y-4">
                    {upcomingPayments.map((sub) => {
                      const daysUntil = getDaysUntilPayment(sub.billingDay);
                      const isUrgent = daysUntil <= 3;
                      const isSoon = daysUntil <= 7;
                      return (
                        <div key={sub.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: sub.color + '30' }}
                            >
                              {sub.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{sub.name}</p>
                              <p className="text-xs text-gray-500">{getNextPaymentDate(sub.billingDay)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">€{sub.amount.toFixed(2)}</p>
                            <p className={`text-xs ${isUrgent ? 'text-red-400' : isSoon ? 'text-amber-400' : 'text-gray-500'}`}>
                              {daysUntil === 0 ? 'Heute' : daysUntil === 1 ? 'Morgen' : `in ${daysUntil} Tagen`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Yearly Projection */}
              <div className="mt-6 bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                  Jahresprojektion
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-end">
                    <span className="text-gray-400">Nächste 12 Monate</span>
                    <span className="text-2xl font-bold text-blue-400">€{yearlyTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Durchschnitt/Monat</span>
                    <span>€{monthlyTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Durchschnitt/Tag</span>
                    <span>€{(monthlyTotal / 30).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#16161d] border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-6">Neues Abonnement</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Name</label>
                  <input
                    type="text"
                    value={newSub.name}
                    onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                    placeholder="z.B. Netflix"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Betrag (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newSub.amount}
                    onChange={(e) => setNewSub({ ...newSub, amount: e.target.value })}
                    placeholder="9.99"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Abrechnungszyklus</label>
                  <select
                    value={newSub.billingCycle}
                    onChange={(e) => setNewSub({ ...newSub, billingCycle: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    {billingCycles.map((cycle) => (
                      <option key={cycle.value} value={cycle.value} className="bg-[#16161d]">
                        {cycle.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Abbuchungstag</label>
                  <select
                    value={newSub.billingDay}
                    onChange={(e) => setNewSub({ ...newSub, billingDay: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day} className="bg-[#16161d]">
                        {day}. Tag des Monats
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Kategorie</label>
                  <div className="grid grid-cols-4 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => setNewSub({ ...newSub, category: cat.name })}
                        className={`p-2 rounded-lg text-xs font-medium transition-all ${
                          newSub.category === cat.name ? 'ring-2 ring-offset-2 ring-offset-[#16161d]' : 'opacity-60 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: cat.color + '20',
                          color: cat.color,
                          ['--tw-ring-color' as string]: cat.color
                        }}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={addSubscription}
                  className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium transition-colors"
                >
                  Hinzufügen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paywall Modal */}
      <AnimatePresence>
        {showPaywall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPaywall(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#16161d] border border-amber-500/20 rounded-2xl p-6 w-full max-w-sm text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                <Crown className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Premium freischalten</h2>
              <p className="text-gray-400 text-sm mb-6">
                Du hast das Gratis-Limit von <span className="text-white font-semibold">{FREE_LIMIT} Abos</span> erreicht. Upgrade für unbegrenzte Abos.
              </p>

              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                <div className="text-3xl font-bold text-amber-400 mb-1">2,99€</div>
                <div className="text-gray-400 text-sm">pro Monat</div>
                <div className="mt-3 space-y-2 text-sm text-left">
                  {['Unbegrenzte Abos', 'Keine Werbung', 'Früher Zugang zu neuen Features'].map(f => (
                    <div key={f} className="flex items-center gap-2 text-gray-300">
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-xl font-semibold text-black transition-all mb-3">
                Jetzt upgraden →
              </button>
              <button
                onClick={() => setShowPaywall(false)}
                className="w-full py-3 text-gray-500 hover:text-gray-400 text-sm transition-colors"
              >
                Vielleicht später
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
