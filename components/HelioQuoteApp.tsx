'use client';

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect
} from 'react';
import Image from 'next/image';
import {
  Sun,
  Plus,
  Minus,
  Send,
  ShieldCheck,
  Zap,
  BatteryCharging,
  Layers,
  AlertCircle,
  Printer,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Lock,
  Mail,
  LogOut,
  FileText,
  ExternalLink,
  Navigation,
  Sparkles,
  Download
} from 'lucide-react';

const DEFAULT_CATALOG = [
  { id: 'sp-550', category: 'Solar Panels', name: 'Monocrystalline Solar Panel 550W', spec: 'Tier-1 Half-Cut PERC', wattage: 550, kwh: 0, unitPrice: 18500, quantity: 0 },
  { id: 'sp-600', category: 'Solar Panels', name: 'Bifacial N-Type Solar Panel 600W', spec: 'Double-Glass Module', wattage: 600, kwh: 0, unitPrice: 21500, quantity: 0 },
  { id: 'inv-5k', category: 'Inverters', name: '5kW Hybrid Solar Inverter', spec: '48V MPPT Pure Sine Wave', wattage: 0, kwh: 0, unitPrice: 78000, quantity: 0 },
  { id: 'inv-10k', category: 'Inverters', name: '10kW Three-Phase On-Grid Inverter', spec: 'Dual MPPT IP65', wattage: 0, kwh: 0, unitPrice: 135000, quantity: 0 },
  { id: 'bat-5k', category: 'Batteries & Storage', name: '5.12kWh LiFePO4 Wall Battery', spec: '48V 100Ah 6000 Cycles', wattage: 0, kwh: 5.12, unitPrice: 145000, quantity: 0 },
  { id: 'bat-200a', category: 'Batteries & Storage', name: '200Ah Tall Tubular Solar Battery', spec: '12V Deep Cycle C10', wattage: 0, kwh: 2.4, unitPrice: 32000, quantity: 0 },
  { id: 'mnt-alu', category: 'Mounting Structures', name: 'Anodized Aluminum Rail Kit (Per kW)', spec: 'Wind Load 140 km/h', wattage: 0, kwh: 0, unitPrice: 12000, quantity: 0 },
  { id: 'cbl-dc', category: 'Cables & Protection', name: '6mm² UV DC Solar Cable (100m Roll)', spec: 'TUV Certified Twin Core', wattage: 0, kwh: 0, unitPrice: 14500, quantity: 0 },
  { id: 'spd-box', category: 'Cables & Protection', name: 'AC/DC Combiner & SPD Protection Box', spec: 'IP66 MCB + Surge Arrester', wattage: 0, kwh: 0, unitPrice: 16000, quantity: 0 }
];

const CATEGORIES = [
  'All',
  'Solar Panels',
  'Inverters',
  'Batteries & Storage',
  'Mounting Structures',
  'Cables & Protection'
];

const CURRENCIES: Record<string, { symbol: string; rate: number }> = {
  BDT: { symbol: '৳', rate: 1 },
  USD: { symbol: '$', rate: 0.0084 },
  EUR: { symbol: '€', rate: 0.0078 }
};

const STORAGE_KEY = 'helioquote_nextjs_state_v1';

function createSeedQuote() {
  const seedItems = [
    { id: 'sp-550', category: 'Solar Panels', name: 'Monocrystalline Solar Panel 550W', spec: 'Tier-1 Half-Cut PERC', wattage: 550, kwh: 0, unitPrice: 18500, quantity: 16 },
    { id: 'inv-10k', category: 'Inverters', name: '10kW Three-Phase On-Grid Inverter', spec: 'Dual MPPT IP65', wattage: 0, kwh: 0, unitPrice: 135000, quantity: 1 },
    { id: 'bat-5k', category: 'Batteries & Storage', name: '5.12kWh LiFePO4 Wall Battery', spec: '48V 100Ah 6000 Cycles', wattage: 0, kwh: 5.12, unitPrice: 145000, quantity: 2 },
    { id: 'mnt-alu', category: 'Mounting Structures', name: 'Anodized Aluminum Rail Kit (Per kW)', spec: 'Wind Load 140 km/h', wattage: 0, kwh: 0, unitPrice: 12000, quantity: 9 },
    { id: 'cbl-dc', category: 'Cables & Protection', name: '6mm² UV DC Solar Cable (100m Roll)', spec: 'TUV Certified Twin Core', wattage: 0, kwh: 0, unitPrice: 14500, quantity: 2 }
  ];
  const sub = seedItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const labor = (sub * 10) / 100;
  const tax = ((sub + labor) * 5) / 100;

  return {
    _id: 'quote-1001',
    quoteRef: 'PRDF-2026-1001',
    projectName: 'Commercial Rooftop Hybrid Solar Plant',
    clientName: 'Apex Garments & Knitwear Ltd.',
    preparedBy: 'Engr. Tariqul Islam',
    currency: 'BDT',
    items: seedItems,
    laborPercent: 10,
    taxPercent: 5,
    discountAmount: 0,
    grandTotal: Math.round(sub + labor + tax),
    totalKwp: 8.8,
    totalKwh: 10.24,
    status: 'Pending',
    deptHeadNote: '',
    approvedBy: '',
    approvedAt: null,
    createdAt: new Date().toISOString()
  };
}

const HelioQuoteContext = createContext<any>(null);

function useHelioQuote() {
  const ctx = useContext(HelioQuoteContext);
  if (!ctx) {
    throw new Error('useHelioQuote must be used inside HelioQuoteProvider');
  }
  return ctx;
}

function HelioQuoteProvider({
  children,
  initialRoute = '/',
  initialQuoteId = 'quote-1001'
}: {
  children: React.ReactNode;
  initialRoute?: string;
  initialQuoteId?: string;
}) {
  const [pathname, setPathname] = useState(initialRoute);
  const [previousRoute, setPreviousRoute] = useState('/');
  const [authRole, setAuthRole] = useState<'ENGINEER' | 'ADMIN' | null>(null);
  const [sessionUser, setSessionUser] = useState('Guest');

  const [quotes, setQuotes] = useState(() => [createSeedQuote()]);
  const [activeQuoteId, setActiveQuoteId] = useState(initialQuoteId || 'quote-1001');
  const [draftPdfQuote, setDraftPdfQuote] = useState<any>(null);
  const [engineerDashOpen, setEngineerDashOpen] = useState(false);

  const [projectName, setProjectName] = useState('Rooftop Hybrid Solar System');
  const [clientName, setClientName] = useState('GreenTex Industries Ltd.');
  const [preparedBy, setPreparedBy] = useState('');
  const [currency, setCurrency] = useState('BDT');
  const [activeCategory, setActiveCategory] = useState('All');

  const [items, setItems] = useState(DEFAULT_CATALOG);
  const [laborPercent, setLaborPercent] = useState(10);
  const [taxPercent, setTaxPercent] = useState(5);
  const [discountAmount, setDiscountAmount] = useState(0);

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('Cables & Protection');
  const [customSpec, setCustomSpec] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [calcError, setCalcError] = useState('');

  const [loginRoleTab, setLoginRoleTab] = useState<'ENGINEER' | 'ADMIN'>('ENGINEER');
  const [loginEmail, setLoginEmail] = useState('engineer@prdf.com');
  const [loginPassword, setLoginPassword] = useState('eng1234');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [dashFilter, setDashFilter] = useState('All');
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  const [toastMsg, setToastMsg] = useState('');
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendModalMessage, setSendModalMessage] = useState('Send');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.quotes) && parsed.quotes.length > 0) {
          setQuotes(parsed.quotes);
        }
        if (parsed.activeQuoteId && !initialQuoteId) {
          setActiveQuoteId(parsed.activeQuoteId);
        }
      }
    } catch {
      // Ignore storage errors
    }

    const handlePopState = () => {
      const browserPath = window.location.pathname || '/';
      if (browserPath.startsWith('/quotes/')) {
        const extractedId = browserPath.replace('/quotes/', '');
        if (extractedId) setActiveQuoteId(extractedId);
        setPathname('/quotes/[id]');
      } else if (
        browserPath === '/' ||
        browserPath === '/login' ||
        browserPath === '/dept-head/dashboard'
      ) {
        setPathname(browserPath);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [initialQuoteId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ quotes, activeQuoteId })
      );
    } catch {
      // Ignore storage errors
    }
  }, [quotes, activeQuoteId]);

  const pushRoute = (nextRoute: string, concreteUrl?: string) => {
    setPathname(nextRoute);
    try {
      const targetUrl =
        concreteUrl ||
        (nextRoute === '/quotes/[id]' ? `/quotes/${activeQuoteId}` : nextRoute);
      if (window.location.pathname !== targetUrl) {
        window.history.pushState({}, '', targetUrl);
      }
    } catch {
      // Ignore history errors
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (typeof window !== 'undefined') {
      window.clearTimeout((window as any).__prdfToastTimer);
      (window as any).__prdfToastTimer = window.setTimeout(() => {
        setToastMsg('');
      }, 3000);
    }
  };

  const sym = CURRENCIES[currency].symbol;
  const rate = CURRENCIES[currency].rate;

  const formatMoney = (bdtAmount: number) => {
    const converted = bdtAmount * rate;
    return `${sym}${converted.toLocaleString(undefined, {
      minimumFractionDigits: currency === 'BDT' ? 0 : 2,
      maximumFractionDigits: currency === 'BDT' ? 0 : 2
    })}`;
  };

  const switchLoginRoleTab = (role: 'ENGINEER' | 'ADMIN') => {
    setLoginRoleTab(role);
    setLoginError('');
    if (role === 'ADMIN') {
      setLoginEmail('admin@prdf.com');
      setLoginPassword('admin1234');
    } else {
      setLoginEmail('engineer@prdf.com');
      setLoginPassword('eng1234');
    }
  };

  const handleRoleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const normalizedEmail = loginEmail.trim().toLowerCase();

    const isAdminMatch =
      loginRoleTab === 'ADMIN' &&
      normalizedEmail === 'admin@prdf.com' &&
      loginPassword === 'admin1234';

    const isEngineerMatch =
      loginRoleTab === 'ENGINEER' &&
      (normalizedEmail === 'engineer@prdf.com' || normalizedEmail === 'eng@prdf.com') &&
      (loginPassword === 'eng1234' || loginPassword === 'engineer1234');

    if (!isAdminMatch && !isEngineerMatch) {
      if (loginRoleTab === 'ADMIN') {
        setLoginError('Invalid Admin credentials. Use admin@prdf.com and password admin1234.');
      } else {
        setLoginError('Invalid Engineer credentials. Use engineer@prdf.com and password eng1234.');
      }
      return;
    }

    setLoginLoading(true);
    setTimeout(() => {
      if (isAdminMatch) {
        setAuthRole('ADMIN');
        setSessionUser('Admin / Dept. Head (admin@prdf.com)');
        setPreparedBy('Admin');
        setLoginLoading(false);
        setPreviousRoute(pathname === '/login' ? '/' : pathname);
        pushRoute('/', '/');
        showToast('Signed in as Admin — opened Calculator');
      } else {
        setAuthRole('ENGINEER');
        setSessionUser(`Engineer (${normalizedEmail})`);
        if (!preparedBy.trim() || preparedBy === 'Admin') {
          setPreparedBy('PRDF Solar Engineer');
        }
        setLoginLoading(false);
        pushRoute('/', '/');
        showToast('Signed in as Solar Engineer');
      }
    }, 250);
  };

  const handleQuickEngineerSignIn = () => {
    setLoginRoleTab('ENGINEER');
    setLoginEmail('engineer@prdf.com');
    setLoginPassword('eng1234');
    setAuthRole('ENGINEER');
    setSessionUser('Engineer (engineer@prdf.com)');
    if (!preparedBy.trim() || preparedBy === 'Admin') {
      setPreparedBy('PRDF Solar Engineer');
    }
    pushRoute('/', '/');
    showToast('Signed in as Engineer (engineer@prdf.com)');
  };

  const handleQuickAdminSignIn = () => {
    setLoginRoleTab('ADMIN');
    setLoginEmail('admin@prdf.com');
    setLoginPassword('admin1234');
    setAuthRole('ADMIN');
    setSessionUser('Admin / Dept. Head (admin@prdf.com)');
    setPreparedBy('Admin');
    setPreviousRoute('/');
    pushRoute('/', '/');
    showToast('Signed in as Admin (admin@prdf.com)');
  };

  const handleLogout = () => {
    setAuthRole(null);
    setSessionUser('Guest');
    setPreparedBy('');
    pushRoute('/login', '/login');
    showToast('Signed out');
  };

  const handleGoHomeFromAdmin = () => {
    pushRoute('/', '/');
  };

  const navigateToRoute = (targetRoute: string) => {
    if (targetRoute !== '/dept-head/dashboard') {
      setEngineerDashOpen(false);
    }
    if (targetRoute === '/dept-head/dashboard' && authRole !== 'ADMIN' && authRole !== 'ENGINEER') {
      if (pathname !== '/login' && pathname !== '/dept-head/dashboard') {
        setPreviousRoute(pathname);
      }
      setLoginRoleTab('ADMIN');
      setLoginEmail('admin@prdf.com');
      setLoginPassword('admin1234');
      pushRoute('/login', '/login');
      showToast('Please sign in with Admin or Engineer credentials to view the dashboard.');
      return;
    }

    if (targetRoute !== pathname && targetRoute !== '/login') {
      setPreviousRoute(pathname);
    }
    pushRoute(targetRoute);
  };

  const openQuotePdf = (quoteId: string) => {
    setDraftPdfQuote(null);
    if (pathname !== '/quotes/[id]') {
      setPreviousRoute(pathname);
    }
    setActiveQuoteId(quoteId);
    pushRoute('/quotes/[id]', `/quotes/${quoteId}`);
  };

  const updateQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
      )
    );
  };

  const updateUnitPrice = (id: string, newPrice: string) => {
    const val = Math.max(0, Number(newPrice) || 0);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unitPrice: val / rate } : item))
    );
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customPrice) return;
    const newItem = {
      id: `custom-${Date.now()}`,
      category: customCategory,
      name: customName.trim(),
      spec: customSpec.trim() || 'Custom Gear',
      wattage: 0,
      kwh: 0,
      unitPrice: (Number(customPrice) || 0) / rate,
      quantity: 1
    };
    setItems((prev) => [...prev, newItem]);
    setCustomName('');
    setCustomSpec('');
    setCustomPrice('');
    setShowCustomForm(false);
    showToast(`Added "${newItem.name}" to catalog`);
  };

  const summary = useMemo(() => {
    const selectedItems = items.filter((i) => i.quantity > 0);
    const equipmentSubtotal = selectedItems.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity,
      0
    );
    const laborCost = (equipmentSubtotal * laborPercent) / 100;
    const taxCost = ((equipmentSubtotal + laborCost) * taxPercent) / 100;
    const discountBdt = discountAmount / rate;
    const grandTotal = Math.max(0, equipmentSubtotal + laborCost + taxCost - discountBdt);

    const totalKwp = selectedItems.reduce(
      (sum, i) => sum + ((i.wattage || 0) * i.quantity) / 1000,
      0
    );
    const totalKwh = selectedItems.reduce(
      (sum, i) => sum + (i.kwh || 0) * i.quantity,
      0
    );

    return {
      selectedItems,
      equipmentSubtotal,
      laborCost,
      taxCost,
      grandTotal,
      totalKwp: Number(totalKwp.toFixed(2)),
      totalKwh: Number(totalKwh.toFixed(2))
    };
  }, [items, laborPercent, taxPercent, discountAmount, rate]);

  const filteredCatalog =
    activeCategory === 'All'
      ? items
      : items.filter((item) => item.category === activeCategory);

  const buildCurrentQuotePayload = (quoteId: string, quoteRef: string, statusValue = 'Pending') => ({
    _id: quoteId,
    quoteRef,
    projectName: projectName.trim() || 'Solar PV Installation',
    clientName: clientName.trim() || 'Client Site',
    preparedBy: preparedBy.trim() || (authRole === 'ENGINEER' ? 'PRDF Solar Engineer' : 'Admin'),
    currency,
    items: summary.selectedItems.map((i) => ({
      ...i,
      unitPrice: Number((i.unitPrice * rate).toFixed(2))
    })),
    laborPercent,
    taxPercent,
    discountAmount: Number(discountAmount) || 0,
    grandTotal: Number((summary.grandTotal * rate).toFixed(2)),
    totalKwp: summary.totalKwp,
    totalKwh: summary.totalKwh,
    status: statusValue,
    deptHeadNote: '',
    approvedBy: '',
    approvedAt: null,
    createdAt: new Date().toISOString()
  });

  const sanitizePdfText = (value: unknown, currencyCode = 'BDT') => {
    const raw = String(value ?? '');
    return raw
      .replace(/৳/g, currencyCode === 'BDT' ? 'BDT ' : 'Tk ')
      .replace(/€/g, 'EUR ')
      .replace(/—/g, '-')
      .replace(/•/g, '|')
      .replace(/×/g, 'x')
      .replace(/[^\x20-\x7E]/g, ' ');
  };

  const escapePdfString = (str: string) =>
    sanitizePdfText(str).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  const handleDownloadRealTimePdf = (quoteObj: any) => {
    if (!quoteObj) return;

    try {
      const qSym = CURRENCIES[quoteObj.currency]?.symbol || '৳';
      const eqSub = quoteObj.items.reduce(
        (sum: number, item: any) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
        0
      );
      const lab = (eqSub * Number(quoteObj.laborPercent || 0)) / 100;
      const tx = ((eqSub + lab) * Number(quoteObj.taxPercent || 0)) / 100;
      const disc = Number(quoteObj.discountAmount || 0);
      const grand = Number(quoteObj.grandTotal ?? Math.max(0, eqSub + lab + tx - disc));

      const lines: string[] = [];
      const addLine = (text: string, x = 45, y = 780, font = 'F1', size = 10) => {
        lines.push(
          `BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfString(text)}) Tj ET`
        );
      };
      const addRule = (x1: number, y1: number, x2: number, y2: number, width = 1) => {
        lines.push(`${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
      };

      addLine('PANNA RURAL DEVELOPMENT FOUNDATION (PRDF)', 45, 795, 'F2', 14);
      addLine('Solar PV Installation & Energy Storage Bill of Quantities (BOQ)', 45, 778, 'F1', 10);
      addLine(`Ref: ${quoteObj.quoteRef}`, 410, 795, 'F2', 10);
      addLine(`Date: ${new Date(quoteObj.createdAt).toLocaleDateString()}`, 410, 780, 'F1', 9);
      addLine(`Status: ${quoteObj.status}`, 410, 766, 'F2', 9);

      addRule(45, 754, 550, 754, 1.2);

      addLine(`Project: ${quoteObj.projectName}`, 45, 734, 'F2', 10);
      addLine(`Client / Site: ${quoteObj.clientName}`, 45, 718, 'F1', 10);
      addLine(`Prepared By: ${quoteObj.preparedBy}`, 45, 702, 'F1', 10);
      addLine(`Solar Capacity: ${quoteObj.totalKwp} kWp`, 360, 734, 'F2', 10);
      addLine(`Battery Storage: ${quoteObj.totalKwh} kWh`, 360, 718, 'F1', 10);
      addLine(`Currency: ${quoteObj.currency}`, 360, 702, 'F1', 10);

      addRule(45, 688, 550, 688, 1);

      addLine('#', 45, 670, 'F2', 9);
      addLine('Equipment Description', 70, 670, 'F2', 9);
      addLine('Qty', 345, 670, 'F2', 9);
      addLine('Unit Price', 395, 670, 'F2', 9);
      addLine('Line Total', 480, 670, 'F2', 9);
      addRule(45, 662, 550, 662, 1);

      let yCursor = 644;
      quoteObj.items.forEach((item: any, idx: number) => {
        if (yCursor < 170) return;
        const unitVal = Number(item.unitPrice || 0);
        const qtyVal = Number(item.quantity || 0);
        const rowTotal = unitVal * qtyVal;

        addLine(String(idx + 1), 45, yCursor, 'F1', 9);
        addLine(String(item.name || '').slice(0, 46), 70, yCursor, 'F2', 9);
        addLine(String(qtyVal), 348, yCursor, 'F1', 9);
        addLine(`${qSym}${unitVal.toLocaleString()}`, 395, yCursor, 'F1', 9);
        addLine(`${qSym}${rowTotal.toLocaleString()}`, 480, yCursor, 'F2', 9);

        if (item.category || item.spec) {
          yCursor -= 13;
          addLine(
            `${item.category || ''}${item.spec ? ` - ${item.spec}` : ''}`.slice(0, 65),
            70,
            yCursor,
            'F1',
            8
          );
        }
        yCursor -= 18;
      });

      addRule(45, Math.max(yCursor + 6, 155), 550, Math.max(yCursor + 6, 155), 1);

      const summaryTop = Math.max(yCursor - 12, 140);
      addLine('Equipment Subtotal:', 350, summaryTop, 'F1', 9);
      addLine(`${qSym}${eqSub.toLocaleString()}`, 480, summaryTop, 'F2', 9);

      addLine(`Installation (${quoteObj.laborPercent}%):`, 350, summaryTop - 15, 'F1', 9);
      addLine(`${qSym}${lab.toLocaleString()}`, 480, summaryTop - 15, 'F1', 9);

      addLine(`VAT / Tax (${quoteObj.taxPercent}%):`, 350, summaryTop - 30, 'F1', 9);
      addLine(`${qSym}${tx.toLocaleString()}`, 480, summaryTop - 30, 'F1', 9);

      if (disc > 0) {
        addLine('Discount:', 350, summaryTop - 45, 'F1', 9);
        addLine(`-${qSym}${disc.toLocaleString()}`, 480, summaryTop - 45, 'F2', 9);
      }

      const grandY = disc > 0 ? summaryTop - 65 : summaryTop - 50;
      addRule(350, grandY + 12, 550, grandY + 12, 1.2);
      addLine('GRAND TOTAL:', 350, grandY, 'F2', 11);
      addLine(`${qSym}${grand.toLocaleString()}`, 475, grandY, 'F2', 11);

      addLine('DEPARTMENT HEAD AUTHORIZATION', 45, summaryTop, 'F2', 9);
      addLine(`Approval Status: ${quoteObj.status}`, 45, summaryTop - 15, 'F2', 9);
      if (quoteObj.status === 'Approved') {
        addLine(`Approved By: ${quoteObj.approvedBy || 'Department Head'}`, 45, summaryTop - 30, 'F1', 9);
        addLine(
          `Date: ${quoteObj.approvedAt ? new Date(quoteObj.approvedAt).toLocaleString() : new Date().toLocaleString()}`,
          45,
          summaryTop - 44,
          'F1',
          8
        );
      } else {
        addLine('Pending Department Head Signature', 45, summaryTop - 30, 'F1', 9);
      }
      if (quoteObj.deptHeadNote) {
        addLine(`Note: ${String(quoteObj.deptHeadNote).slice(0, 48)}`, 45, summaryTop - 58, 'F1', 8);
      }

      const streamContent = lines.join('\n');
      const objects = [
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
        '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
        '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
        '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
        `6 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`
      ];

      let pdfString = '%PDF-1.4\n';
      const offsets = [0];
      objects.forEach((obj) => {
        offsets.push(pdfString.length);
        pdfString += obj;
      });

      const xrefStart = pdfString.length;
      pdfString += `xref\n0 ${objects.length + 1}\n`;
      pdfString += '0000000000 65535 f \n';
      for (let i = 1; i < offsets.length; i += 1) {
        pdfString += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
      }
      pdfString += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

      const blob = new Blob([pdfString], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${quoteObj.quoteRef || 'solar-quotation'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1500);

      showToast(`Downloaded ${quoteObj.quoteRef || 'quotation'}.pdf`);
    } catch {
      showToast('Direct PDF download blocked; opening print dialog instead.');
      window.print();
    }
  };

  const handleSaveAndRequestApproval = () => {
    setCalcError('');
    if (!authRole) {
      setCalcError('Please log in first before submitting a quotation for approval.');
      setPreviousRoute('/');
      pushRoute('/login', '/login');
      showToast('Login required to submit quotation for approval');
      return;
    }
    if (!clientName.trim() || !preparedBy.trim()) {
      setCalcError('Please enter both Client / Site Name and Prepared By before submitting.');
      return;
    }
    if (summary.selectedItems.length === 0) {
      setCalcError('Please select at least one solar equipment item.');
      return;
    }

    if (authRole === 'ENGINEER') {
      const previewId = `preview-${Date.now()}`;
      const previewRef = `PRDF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const previewObj = buildCurrentQuotePayload(previewId, previewRef, 'Draft');
      setDraftPdfQuote(previewObj);
      setActiveQuoteId(previewId);
      setPreviousRoute('/');
      pushRoute('/quotes/[id]', `/quotes/${previewId}`);
      showToast('Opened quotation preview');
      return;
    }

    setSubmitting(true);
    const newId = `quote-${Date.now()}`;
    const quoteRef = `PRDF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const createdQuote = buildCurrentQuotePayload(newId, quoteRef, 'Pending');

    setDraftPdfQuote(null);
    setQuotes((prev) => [createdQuote, ...prev]);
    setActiveQuoteId(newId);
    setSubmitting(false);
    setSendModalMessage('Send');
    setSendModalOpen(true);
    showToast(`Saved ${quoteRef} & sent for Department Head approval`);
  };

  const handleSaveDraftPdfForApproval = (quoteObj: any) => {
    if (!quoteObj) return;
    const savedId = `quote-${Date.now()}`;
    const savedQuote = {
      ...quoteObj,
      _id: savedId,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    setQuotes((prev) => [savedQuote, ...prev]);
    setDraftPdfQuote(null);
    setActiveQuoteId(savedId);
    setSendModalMessage('Send');
    setSendModalOpen(true);
    showToast(`Saved ${savedQuote.quoteRef} & requested approval`);
  };

  const handleCloseSendModalAndGoCalculator = () => {
    setItems((prev) => prev.map((item) => ({ ...item, quantity: 0 })));
    setDiscountAmount(0);
    setSendModalOpen(false);
    pushRoute('/', '/');
  };

  const activeQuote =
    (draftPdfQuote && draftPdfQuote._id === activeQuoteId ? draftPdfQuote : null) ||
    quotes.find((q) => q._id === activeQuoteId) ||
    draftPdfQuote ||
    quotes[0];

  const handlePrintQuotation = (quoteObj: any) => {
    const targetQuote = quoteObj || activeQuote;

    try {
      if (typeof window !== 'undefined' && typeof window.print === 'function') {
        window.print();
        return;
      }
    } catch {
      // Fallback
    }

    if (targetQuote && typeof window !== 'undefined') {
      try {
        const qSym = CURRENCIES[targetQuote.currency]?.symbol || '৳';
        const eqSub = (targetQuote.items || []).reduce(
          (sum: number, item: any) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
          0
        );
        const labCost = (eqSub * Number(targetQuote.laborPercent || 0)) / 100;
        const txCost = ((eqSub + labCost) * Number(targetQuote.taxPercent || 0)) / 100;

        const rowsHtml = (targetQuote.items || [])
          .map(
            (item: any, idx: number) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${item.name}</strong><br/><small>${item.category || ''} ${item.spec ? '• ' + item.spec : ''}</small></td>
                <td style="text-align:center">${item.quantity}</td>
                <td style="text-align:right">${qSym}${Number(item.unitPrice || 0).toLocaleString()}</td>
                <td style="text-align:right"><strong>${qSym}${(Number(item.unitPrice || 0) * Number(item.quantity || 0)).toLocaleString()}</strong></td>
              </tr>
            `
          )
          .join('');

        const printWin = window.open('', '_blank', 'width=900,height=700');
        if (printWin) {
          printWin.document.open();
          printWin.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${targetQuote.quoteRef || 'Quotation'}</title>
                <style>
                  @page { size: A4 portrait; margin: 12mm; }
                  body { font-family: Arial, sans-serif; color: #0f172a; margin: 20px; }
                  .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px; }
                  .meta { display: flex; justify-content: space-between; background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 18px; font-size: 13px; }
                  table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 13px; }
                  th, td { border-bottom: 1px solid #e2e8f0; padding: 8px; text-align: left; }
                  th { border-bottom: 2px solid #0f172a; font-size: 11px; text-transform: uppercase; color: #475569; }
                  .totals { width: 280px; margin-left: auto; font-size: 13px; }
                  .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
                  .grand { font-weight: 800; font-size: 15px; border-top: 2px solid #0f172a; padding-top: 8px !important; }
                </style>
              </head>
              <body>
                <div class="header">
                  <div>
                    <h2 style="margin:0">HelioQuote Engineering</h2>
                    <div style="font-size:12px;color:#64748b">Solar PV Installation & Energy Storage Bill of Quantities (BOQ)</div>
                  </div>
                  <div style="text-align:right;font-size:12px">
                    <div><strong>Ref:</strong> ${targetQuote.quoteRef}</div>
                    <div><strong>Status:</strong> ${targetQuote.status}</div>
                  </div>
                </div>
                <div class="meta">
                  <div>
                    <div><strong>Client / Site:</strong> ${targetQuote.clientName}</div>
                    <div><strong>Project:</strong> ${targetQuote.projectName}</div>
                  </div>
                  <div style="text-align:right">
                    <div><strong>System:</strong> ${targetQuote.totalKwp} kWp | ${targetQuote.totalKwh} kWh</div>
                    <div><strong>Prepared By:</strong> ${targetQuote.preparedBy}</div>
                  </div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Equipment Description</th>
                      <th style="text-align:center">Qty</th>
                      <th style="text-align:right">Unit Price</th>
                      <th style="text-align:right">Total</th>
                    </tr>
                  </thead>
                  <tbody>${rowsHtml}</tbody>
                </table>
                <div class="totals">
                  <div><span>Equipment Subtotal:</span><span>${qSym}${eqSub.toLocaleString()}</span></div>
                  <div><span>Installation (${targetQuote.laborPercent}%):</span><span>${qSym}${labCost.toLocaleString()}</span></div>
                  <div><span>VAT / Tax (${targetQuote.taxPercent}%):</span><span>${qSym}${txCost.toLocaleString()}</span></div>
                  <div class="grand"><span>Grand Total:</span><span>${qSym}${Number(targetQuote.grandTotal || 0).toLocaleString()}</span></div>
                </div>
              </body>
            </html>
          `);
          printWin.document.close();
          printWin.focus();
          printWin.print();
          return;
        }
      } catch {
        // Fall through
      }
      handleDownloadRealTimePdf(targetQuote);
    }
  };

  const handleQuoteDecision = (quoteId: string, nextStatus: string) => {
    const noteText =
      remarksMap[quoteId] ??
      (nextStatus === 'Approved'
        ? 'BOM verified and approved for execution.'
        : 'Please review equipment quantities and pricing.');

    setQuotes((prev) =>
      prev.map((q) =>
        q._id === quoteId
          ? {
              ...q,
              status: nextStatus,
              deptHeadNote: noteText,
              approvedBy: sessionUser,
              approvedAt: nextStatus === 'Approved' ? new Date().toISOString() : null
            }
          : q
      )
    );
    showToast(`Quotation marked as ${nextStatus}`);
  };

  const filteredDashQuotes =
    dashFilter === 'All' ? quotes : quotes.filter((q) => q.status === dashFilter);

  const value = {
    pathname,
    previousRoute,
    authRole,
    sessionUser,
    quotes,
    activeQuote,
    activeQuoteId,
    draftPdfQuote,
    engineerDashOpen,
    setEngineerDashOpen,
    projectName,
    setProjectName,
    clientName,
    setClientName,
    preparedBy,
    setPreparedBy,
    currency,
    setCurrency,
    activeCategory,
    setActiveCategory,
    laborPercent,
    setLaborPercent,
    taxPercent,
    setTaxPercent,
    discountAmount,
    setDiscountAmount,
    showCustomForm,
    setShowCustomForm,
    customName,
    setCustomName,
    customCategory,
    setCustomCategory,
    customSpec,
    setCustomSpec,
    customPrice,
    setCustomPrice,
    submitting,
    calcError,
    loginRoleTab,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    loginLoading,
    loginError,
    dashFilter,
    setDashFilter,
    remarksMap,
    setRemarksMap,
    toastMsg,
    sendModalOpen,
    sendModalMessage,
    sym,
    rate,
    summary,
    filteredCatalog,
    filteredDashQuotes,
    formatMoney,
    switchLoginRoleTab,
    handleRoleLogin,
    handleQuickEngineerSignIn,
    handleQuickAdminSignIn,
    handleLogout,
    handleGoHomeFromAdmin,
    navigateToRoute,
    openQuotePdf,
    updateQty,
    updateUnitPrice,
    handleAddCustomItem,
    handleDownloadRealTimePdf,
    handleSaveAndRequestApproval,
    handleSaveDraftPdfForApproval,
    handleCloseSendModalAndGoCalculator,
    handlePrintQuotation,
    handleQuoteDecision
  };

  return (
    <HelioQuoteContext.Provider value={value}>
      {children}
    </HelioQuoteContext.Provider>
  );
}

function NextJsNavbar() {
  const {
    pathname,
    authRole,
    sessionUser,
    activeQuote,
    currency,
    setCurrency,
    navigateToRoute,
    handleQuickEngineerSignIn,
    handleQuickAdminSignIn,
    handleLogout
  } = useHelioQuote();

  return (
    <>
      {/* Path route name */}
      {/* <div className="bg-slate-950 text-slate-300 border-b border-slate-800 px-4 py-2 text-xs no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 font-medium text-slate-400">
            <Navigation className="w-3.5 h-3.5 text-amber-400" />
            <span>Next.js Route:</span>
            <span className="font-mono text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {pathname === '/quotes/[id]' ? `/quotes/${activeQuote?._id || 'id'}` : pathname}
            </span>
            <span
              className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                authRole === 'ADMIN'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : authRole === 'ENGINEER'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              {authRole ? `Session: ${sessionUser}` : 'Session: Guest'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { path: '/', label: '1. Calculator (/)' },
              { path: '/quotes/[id]', label: '2. PDF View (/quotes/[id])' },
              { path: '/login', label: '3. Role Login (/login)' },
              { path: '/dept-head/dashboard', label: '4. Admin Approval (/dept-head/dashboard)' }
            ].map((route) => {
              const active = pathname === route.path;
              return (
                <button
                  key={route.path}
                  type="button"
                  onClick={() => navigateToRoute(route.path)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition cursor-pointer ${
                    active
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {route.label}
                </button>
              );
            })}

            {!authRole ? (
              <>
                <button
                  type="button"
                  onClick={handleQuickEngineerSignIn}
                  className="px-2.5 py-1 rounded-lg font-semibold text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition cursor-pointer"
                >
                  Engineer Sign-In
                </button>
                <button
                  type="button"
                  onClick={handleQuickAdminSignIn}
                  className="px-2.5 py-1 rounded-lg font-semibold text-[11px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition cursor-pointer"
                >
                  Admin Sign-In
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 py-1 rounded-lg font-semibold text-[11px] bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition cursor-pointer"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div> */}

      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigateToRoute("/")}
            className="flex items-center gap-2.5 text-left cursor-pointer"
          >
            <div>
              {/* <Sun className="w-5 h-5" /> */}
              <img src="/images/logo.jpg" width={60} height={20} />
            </div>
            <div>
              {/* <span className="font-bold text-lg tracking-tight">Panna Rural Development Foundation</span> */}

              <span className="font-bold  text-green-400 text-lg tracking-tight">
                <span className="hidden md:inline">
                  Panna Rural Development Foundation
                </span>
                <span className="inline md:hidden">PRDF</span>
              </span>
              {/* <span className="ml-1.5 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-semibold">
                PRDF
              </span> */}
            </div>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-1.5 text-white focus:outline-none cursor-pointer"
            >
              <option value="BDT">BDT (৳)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>

            {authRole === "ADMIN" && (
              <button
                type="button"
                onClick={() => navigateToRoute("/dept-head/dashboard")}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-lg transition cursor-pointer"
              >
                <FileText className="w-4 h-4 text-emerald-100" />
                <span>Dashboard</span>
              </button>
            )}

            {authRole === "ADMIN" && (
              <div
                aria-disabled="true"
                className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-emerald-300 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-lg select-none cursor-default"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Admin</span>
              </div>
            )}

            {authRole === "ENGINEER" && (
              <button
                type="button"
                onClick={() => navigateToRoute("/dept-head/dashboard")}
                className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-lg border transition cursor-pointer ${
                  pathname === "/dept-head/dashboard"
                    ? "bg-emerald-600 text-white border-emerald-500"
                    : "bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            )}

            {authRole === "ENGINEER" && (
              <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-amber-300 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-lg">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Engineer</span>
              </div>
            )}

            {!authRole && (
              <button
                type="button"
                onClick={() => navigateToRoute("/login")}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg transition cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Login</span>
              </button>
            )}

            {authRole && (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-rose-600/20 hover:text-rose-300 border border-slate-700 text-xs sm:text-sm font-medium px-3 py-2 rounded-lg transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

function CalculatorPage() {
  const {
    authRole,
    quotes,
    engineerDashOpen,
    setEngineerDashOpen,
    projectName,
    setProjectName,
    clientName,
    setClientName,
    preparedBy,
    setPreparedBy,
    currency,
    activeCategory,
    setActiveCategory,
    laborPercent,
    setLaborPercent,
    taxPercent,
    setTaxPercent,
    discountAmount,
    setDiscountAmount,
    showCustomForm,
    setShowCustomForm,
    customName,
    setCustomName,
    customCategory,
    setCustomCategory,
    customPrice,
    setCustomPrice,
    submitting,
    calcError,
    sym,
    rate,
    summary,
    filteredCatalog,
    formatMoney,
    updateQty,
    updateUnitPrice,
    handleAddCustomItem,
    handleSaveAndRequestApproval
  } = useHelioQuote();

  return (
    <div className="flex-1">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {authRole === 'ADMIN' && engineerDashOpen && (
          <section className="bg-white rounded-2xl border border-emerald-200 p-6 mb-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Admin Quotation Status</h2>
                <p className="text-xs text-slate-500">Current status of quotations</p>
              </div>
              <button
                type="button"
                onClick={() => setEngineerDashOpen(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg bg-slate-100 cursor-pointer"
              >
                Hide Status
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {quotes.map((q: any) => (
                <div
                  key={q._id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                      {q.quoteRef}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {q.clientName} — {q.projectName}
                    </span>
                  </div>

                  <div>
                    {q.status === 'Pending' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                    {q.status === 'Approved' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Approved
                      </span>
                    )}
                    {q.status === 'Revision Requested' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-800 px-2.5 py-1 rounded-full">
                        <XCircle className="w-3 h-3" /> Revision Requested
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {calcError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{calcError}</span>
          </div>
        )}

        <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Project & Quotation Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Project Title</label>
              <input
                type="text"
                placeholder='Project Name '
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Client / Site Name *
              </label>
              <input
                type="text"
                placeholder="Client Name"
               
                onChange={(e) => setClientName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Prepared By (Engineer / Sales) *
              </label>
              <input
                type="text"
                placeholder="Enter name"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowCustomForm(!showCustomForm)}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 cursor-pointer"
              >
                + Add Custom Gear
              </button>
            </div>

            {showCustomForm && (
              <form
                onSubmit={handleAddCustomItem}
                className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-3"
              >
                <input
                  type="text"
                  placeholder="Gear Name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm"
                  required
                />
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder={`Unit Price (${sym})`}
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm"
                  required
                />
                <button
                  type="submit"
                  className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-800 cursor-pointer"
                >
                  Add Item
                </button>
              </form>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
              {filteredCatalog.map((item: any) => {
                const lineTotalBdt = item.unitPrice * item.quantity;
                return (
                  <div
                    key={item.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.category}
                        </span>
                        {item.wattage > 0 && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            {item.wattage}W
                          </span>
                        )}
                        {item.kwh > 0 && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {item.kwh} kWh
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900 text-sm">{item.name}</h3>
                      <p className="text-xs text-slate-500">{item.spec}</p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <label className="block text-[10px] uppercase text-slate-400">
                          Unit ({sym})
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={Number((item.unitPrice * rate).toFixed(currency === 'BDT' ? 0 : 2))}
                          onChange={(e) => updateUnitPrice(item.id, e.target.value)}
                          className="w-24 text-right border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-medium"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, -1)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold font-mono">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="w-24 text-right">
                        <span className="block text-[10px] uppercase text-slate-400">Total</span>
                        <span className="text-sm font-bold font-mono text-slate-900">
                          {formatMoney(lineTotalBdt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="font-bold text-slate-900 text-base">System & Cost Summary</h2>
              <Layers className="w-4 h-4 text-amber-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-amber-800 text-xs font-medium">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Solar Capacity</span>
                </div>
                <div className="text-lg font-extrabold text-slate-900 mt-1">
                  {summary.totalKwp} kWp
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-medium">
                  <BatteryCharging className="w-3.5 h-3.5" />
                  <span>Battery Bank</span>
                </div>
                <div className="text-lg font-extrabold text-slate-900 mt-1">
                  {summary.totalKwh} kWh
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {summary.selectedItems.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-3 text-center">
                  Select equipment items to calculate quotation
                </p>
              ) : (
                summary.selectedItems.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-xs text-slate-700">
                    <span className="truncate pr-2">
                      {item.quantity}× {item.name}
                    </span>
                    <span className="font-mono font-semibold shrink-0">
                      {formatMoney(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Equipment Subtotal</span>
                <span className="font-mono font-semibold">
                  {formatMoney(summary.equipmentSubtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  Installation ({laborPercent}%)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={laborPercent}
                    onChange={(e) => setLaborPercent(Math.max(0, Number(e.target.value) || 0))}
                    className="w-12 border border-slate-200 rounded px-1.5 py-0.5 text-xs font-mono text-center"
                  />
                </span>
                <span className="font-mono">{formatMoney(summary.laborCost)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  VAT / Tax ({taxPercent}%)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Math.max(0, Number(e.target.value) || 0))}
                    className="w-12 border border-slate-200 rounded px-1.5 py-0.5 text-xs font-mono text-center"
                  />
                </span>
                <span className="font-mono">{formatMoney(summary.taxCost)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Discount ({sym})</span>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-24 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-right"
                />
              </div>

              <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-3">
                <span>Grand Total</span>
                <span className="font-mono text-amber-600">
                  {formatMoney(summary.grandTotal)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={handleSaveAndRequestApproval}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-green-400 disabled:bg-amber-300 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-sm transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Saving...'
                  : authRole === 'ENGINEER'
                  ? 'Preview Quotation PDF'
                  : 'Save & Request Approval'}
              </span>
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
}

function QuotePdfViewPage() {
  const {
    activeQuote,
    authRole,
    draftPdfQuote,
    previousRoute,
    navigateToRoute,
    handleDownloadRealTimePdf,
    handlePrintQuotation,
    handleSaveDraftPdfForApproval
  } = useHelioQuote();

  if (!activeQuote) return null;

  const qSym = CURRENCIES[activeQuote.currency]?.symbol || '৳';
  const eqSub = activeQuote.items.reduce(
    (sum: number, item: any) => sum + item.unitPrice * item.quantity,
    0
  );
  const labCost = (eqSub * activeQuote.laborPercent) / 100;
  const txCost = ((eqSub + labCost) * activeQuote.taxPercent) / 100;

  return (
    <div className="flex-1 bg-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 no-print">
        <button
          type="button"
          onClick={() => navigateToRoute(previousRoute || '/')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2.5">
          {/* {authRole !== 'ENGINEER' && authRole !== 'ADMIN' && (
            <button
              type="button"
              onClick={() => navigateToRoute('/dept-head/dashboard')}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Admin Portal</span>
            </button>
          )} */}

          <button
            type="button"
            onClick={() => handleDownloadRealTimePdf(activeQuote)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-green-400 text-slate-950 text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={() => handlePrintQuotation(activeQuote)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mb-6 no-print">
        {activeQuote.status === 'Approved' && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Approved by {activeQuote.approvedBy || 'Department Head'} on{' '}
                {activeQuote.approvedAt
                  ? new Date(activeQuote.approvedAt).toLocaleDateString()
                  : new Date().toLocaleDateString()}
              </span>
            </div>
            {activeQuote.deptHeadNote && (
              <span className="text-xs italic">Note: &ldquo;{activeQuote.deptHeadNote}&rdquo;</span>
            )}
          </div>
        )}

        {activeQuote.status === 'Pending' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-5 py-3.5 rounded-2xl flex items-center gap-2.5 text-sm font-medium">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Awaiting Department Head review and digital approval.</span>
          </div>
        )}

        {activeQuote.status === 'Revision Requested' && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-5 py-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              <XCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>Revision Requested by Department Head</span>
            </div>
            {activeQuote.deptHeadNote && (
              <span className="text-xs font-medium">
                Remarks: &ldquo;{activeQuote.deptHeadNote}&rdquo;
              </span>
            )}
          </div>
        )}
      </div>

      <div
        id="pdf-quotation-sheet"
        className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12"
      >
        <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 text-slate-900 mb-1">
              <img src="/images/logo.jpg" height={20} width={45} alt="" />
              <span className="text-xl mt-1 font-extrabold tracking-tight">
                Panna Rural Development Foundation
              </span>
            </div>
            <p className="text-xs ml-4 text-slate-500">
              Solar PV Installation & Energy Storage Bill of Quantities
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-slate-400">Quotation Ref</div>
            <div className="font-mono font-bold text-slate-900">{activeQuote.quoteRef}</div>
            <div className="text-xs text-slate-500 mt-1">
              Date: {new Date(activeQuote.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl mb-8 text-sm">
          <div>
            <div className="text-xs text-slate-400 uppercase">Client / Site</div>
            <div className="font-bold text-slate-900">{activeQuote.clientName}</div>
            <div className="text-slate-600 mt-1">Project: {activeQuote.projectName}</div>
          </div>
          <div className="sm:text-right">
            <div className="text-xs text-slate-400 uppercase">System Specification</div>
            <div className="font-bold text-slate-900">
              {activeQuote.totalKwp} kWp Solar | {activeQuote.totalKwh} kWh Battery
            </div>
            <div className="text-slate-600 mt-1">Prepared By: {activeQuote.preparedBy}</div>
          </div>
        </div>

        <table className="w-full text-left border-collapse mb-8 text-sm">
          <thead>
            <tr className="border-b-2 border-slate-900 text-xs uppercase text-slate-600">
              <th className="py-2.5">#</th>
              <th className="py-2.5">Equipment Description</th>
              <th className="py-2.5 text-center">Qty</th>
              <th className="py-2.5 text-right">Unit Price</th>
              <th className="py-2.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {activeQuote.items.map((item: any, index: number) => (
              <tr key={index}>
                <td className="py-3 text-slate-500">{index + 1}</td>
                <td className="py-3">
                  <div className="font-semibold text-slate-900">{item.name}</div>
                  <div className="text-xs text-slate-500">
                    {item.category} {item.spec ? `• ${item.spec}` : ''}
                  </div>
                </td>
                <td className="py-3 text-center font-medium">{item.quantity}</td>
                <td className="py-3 text-right font-mono">
                  {qSym}
                  {Number(item.unitPrice).toLocaleString()}
                </td>
                <td className="py-3 text-right font-semibold font-mono text-slate-900">
                  {qSym}
                  {(item.unitPrice * item.quantity).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex flex-col sm:flex-row justify-between items-end gap-8 pt-4 border-t border-slate-200 print-avoid-break">
          <div className="w-full sm:w-64">
            {activeQuote.status === 'Approved' ? (
              <div className="border-2 border-emerald-600 rounded-xl p-3.5 text-emerald-700 bg-emerald-50/40">
                <div className="text-[10px] font-bold uppercase tracking-widest">
                  Official Department Approval
                </div>
                <div className="text-base font-extrabold mt-0.5">APPROVED</div>
                <div className="text-xs mt-1">
                  Signed by: {activeQuote.approvedBy || 'Department Head'}
                </div>
                <div className="text-[11px] text-emerald-600">
                  {activeQuote.approvedAt
                    ? new Date(activeQuote.approvedAt).toLocaleString()
                    : new Date().toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center text-xs text-slate-400">
                Pending Department Head Signature
              </div>
            )}
          </div>

          <div className="w-full sm:w-72 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Equipment Subtotal:</span>
              <span className="font-mono">
                {qSym}
                {eqSub.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Installation ({activeQuote.laborPercent}%):</span>
              <span className="font-mono">
                {qSym}
                {labCost.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>VAT / Tax ({activeQuote.taxPercent}%):</span>
              <span className="font-mono">
                {qSym}
                {txCost.toLocaleString()}
              </span>
            </div>
            {activeQuote.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span className="font-mono">
                  -{qSym}
                  {Number(activeQuote.discountAmount).toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-900 pt-2">
              <span>Grand Total:</span>
              <span className="font-mono">
                {qSym}
                {Number(activeQuote.grandTotal).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {authRole === 'ENGINEER' && (
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
            <div className="text-xs text-slate-500">
              {draftPdfQuote && draftPdfQuote._id === activeQuote._id
                ? 'Preview ready. Save this quotation and submit it for Department Head approval.'
                : `Quotation status: ${activeQuote.status}`}
            </div>

            <button
              type="button"
              onClick={() => handleSaveDraftPdfForApproval(activeQuote)}
              disabled={!(draftPdfQuote && draftPdfQuote._id === activeQuote._id)}
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>
                {draftPdfQuote && draftPdfQuote._id === activeQuote._id
                  ? 'Save & Request Approval'
                  : 'Saved & Requested'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LoginPage() {
  const {
    loginRoleTab,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    loginLoading,
    loginError,
    switchLoginRoleTab,
    handleRoleLogin,
    navigateToRoute
  } = useHelioQuote();

  return (
    <div className="flex-1 bg-slate-950 flex flex-col justify-center items-center px-4 py-12 no-print">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => navigateToRoute('/')}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Solar Calculator</span>
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => switchLoginRoleTab('ENGINEER')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                loginRoleTab === 'ENGINEER'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Engineer Login</span>
            </button>

            <button
              type="button"
              onClick={() => switchLoginRoleTab('ADMIN')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                loginRoleTab === 'ADMIN'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>

          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 border ${
              loginRoleTab === 'ADMIN'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}
          >
            {loginRoleTab === 'ADMIN' ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <Zap className="w-6 h-6" />
            )}
          </div>

          <h1 className="text-2xl font-bold text-white">
            {loginRoleTab === 'ADMIN' ? 'Admin Approval Login' : 'Engineer Login'}
          </h1>
          <p className="text-sm text-slate-400 mt-1 mb-6">
            {loginRoleTab === 'ADMIN'
              ? 'Sign in with Admin credentials to open the calculator and approve solar BOQ quotations.'
              : 'Sign in with Engineer credentials to calculate solar installation gear prices and prepare BOQs.'}
          </p>

          {loginError && (
            <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleRoleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder={loginRoleTab === 'ADMIN' ? 'admin@prdf.com' : 'engineer@prdf.com'}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={`w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none ${
                    loginRoleTab === 'ADMIN'
                      ? 'focus:border-emerald-500'
                      : 'focus:border-amber-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className={`w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none ${
                    loginRoleTab === 'ADMIN'
                      ? 'focus:border-emerald-500'
                      : 'focus:border-amber-500'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className={`w-full disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-xl text-sm transition mt-2 cursor-pointer ${
                loginRoleTab === 'ADMIN'
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              {loginLoading
                ? 'Authenticating...'
                : loginRoleTab === 'ADMIN'
                ? 'Sign In as Admin'
                : 'Sign In as Engineer'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function DeptHeadDashboardPage() {
  const {
    authRole,
    dashFilter,
    setDashFilter,
    filteredDashQuotes,
    remarksMap,
    setRemarksMap,
    handleGoHomeFromAdmin,
    openQuotePdf,
    handleQuoteDecision
  } = useHelioQuote();

  return (
    <div className="flex-1 bg-slate-50 text-slate-900 no-print">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleGoHomeFromAdmin}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl shadow-2xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700" />
            <span>Home</span>
          </button>

          {/* <span className="text-xs text-slate-500">
            Review quotations and approve or request revisions
          </span> */}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {['All', 'Pending', 'Approved', 'Revision Requested'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setDashFilter(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  dashFilter === tab
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="text-xs text-slate-500">
            Showing {filteredDashQuotes.length} quotation(s)
          </div>
        </div>

        {filteredDashQuotes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            No quotations found in this category.
          </div>
        ) : (
          <div className="space-y-5">
            {filteredDashQuotes.map((q: any) => {
              const qSym = CURRENCIES[q.currency]?.symbol || '৳';
              return (
                <div
                  key={q._id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5 mb-1">
                        <span className="font-mono text-xs font-bold bg-slate-100 px-2.5 py-1 rounded text-slate-700">
                          {q.quoteRef}
                        </span>
                        {q.status === 'Pending' && (
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                              authRole === 'ENGINEER'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            <Clock className="w-3 h-3" />{' '}
                            {authRole === 'ENGINEER' ? 'Pending' : 'Pending Approval'}
                          </span>
                        )}
                        {q.status === 'Approved' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        )}
                        {q.status === 'Revision Requested' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" /> Revision Requested
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900">
                        {q.clientName} — {q.projectName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Prepared by <strong className="text-slate-700">{q.preparedBy}</strong> •{' '}
                        {new Date(q.createdAt).toLocaleString()} • System:{' '}
                        <strong>{q.totalKwp} kWp</strong> / <strong>{q.totalKwh} kWh</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Grand Total</div>
                        <div className="text-xl font-extrabold text-slate-900 font-mono">
                          {qSym}
                          {Number(q.grandTotal).toLocaleString()}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openQuotePdf(q._id)}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2.5 rounded-xl cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        <span>PDF View</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="py-3 flex flex-wrap gap-2">
                    {q.items.map((item: any, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700"
                      >
                        {item.quantity}× {item.name}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <input
                      type="text"
                      placeholder="Add approval remarks or revision notes..."
                      value={remarksMap[q._id] ?? q.deptHeadNote ?? ''}
                      onChange={(e) =>
                        setRemarksMap((prev: any) => ({ ...prev, [q._id]: e.target.value }))
                      }
                      readOnly={authRole === 'ENGINEER'}
                      className="flex-1 border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />

                    {authRole !== 'ENGINEER' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuoteDecision(q._id, 'Revision Requested')}
                          className="px-4 py-2 rounded-xl text-xs font-bold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer"
                        >
                          Request Revision
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuoteDecision(q._id, 'Approved')}
                          className={`px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition ${
                            q.status === 'Approved'
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {q.status === 'Approved' ? 'Approved' : 'Approve Quotation'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function NextJsAppShell() {
  const {
    pathname,
    toastMsg,
    sendModalOpen,
    sendModalMessage,
    handleCloseSendModalAndGoCalculator
  } = useHelioQuote();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <NextJsNavbar />

      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white border border-slate-700 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 no-print">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {sendModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 no-print">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{sendModalMessage}</h3>
            <button
              type="button"
              onClick={handleCloseSendModalAndGoCalculator}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {pathname === '/' && <CalculatorPage />}
      {pathname === '/quotes/[id]' && <QuotePdfViewPage />}
      {pathname === '/login' && <LoginPage />}
      {pathname === '/dept-head/dashboard' && <DeptHeadDashboardPage />}
    </div>
  );
}

export default function HelioQuoteApp({
  initialRoute = '/',
  initialQuoteId = 'quote-1001'
}: {
  initialRoute?: string;
  initialQuoteId?: string;
}) {
  return (
    <HelioQuoteProvider initialRoute={initialRoute} initialQuoteId={initialQuoteId}>
      <NextJsAppShell />
    </HelioQuoteProvider>
  );
}
