import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  PieChart,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleDemoLogin = async () => {
    try {
      await login('demo@fintrack.app', 'Demo@1234');
      navigate('/dashboard');
    } catch (e) {
      navigate('/login?demo=1');
    }
  };

  const features = [
    {
      title: 'Effortless Tracking',
      desc: 'Record expenses and income with notes, dates, and payment methods in seconds.',
      icon: Wallet,
      color: 'bg-indigo-50 text-primary',
    },
    {
      title: 'Smart Categorization',
      desc: 'Custom colors, icons, and automated default categories tailored for your finances.',
      icon: Sparkles,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Insightful Visualizations',
      desc: 'Donut category breakdowns, monthly cashflow bars, and daily spending trends.',
      icon: PieChart,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Monthly Budgets',
      desc: 'Set overall or category limits and get visual warning alerts before overspending.',
      icon: TrendingUp,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Bank-Grade Security',
      desc: 'Encrypted passwords, JWT tokens with rotating refresh cookies, and complete data isolation.',
      icon: ShieldCheck,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: '100% Responsive',
      desc: 'Flawless experience on phone, tablet, and desktop with intuitive bottom navigation.',
      icon: Smartphone,
      color: 'bg-rose-50 text-rose-600',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Create Your Account',
      desc: 'Sign up in seconds. Your default income and expense categories are seeded automatically.',
    },
    {
      step: '02',
      title: 'Log Daily Expenses',
      desc: 'Quickly record transactions from anywhere on your mobile or desktop device.',
    },
    {
      step: '03',
      title: 'Master Your Wealth',
      desc: 'Analyze trends, monitor budget caps, and hit your monthly savings targets.',
    },
  ];

  const faqs = [
    {
      q: 'Is FinTrack completely free?',
      a: 'Yes! FinTrack is free to use with all features including transaction tracking, analytics, and budgeting.',
    },
    {
      q: 'How is my financial data protected?',
      a: 'Every user sees strictly their own data. Passwords are encrypted with bcrypt (cost 12), and authenticated sessions use rotating httpOnly cookies.',
    },
    {
      q: 'Can I set budgets per category?',
      a: 'Absolutely. You can set an overall monthly budget as well as separate limits for groceries, dining, entertainment, and more.',
    },
    {
      q: 'Does FinTrack require bank connection credentials?',
      a: 'No. FinTrack is a privacy-first manual personal tracker. We never ask for or connect to your bank accounts.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm shadow-primary/30">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Fin<span className="text-primary">Track</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl transition-colors"
            >
              Sign In
            </Link>
            <Link to="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
          <Sparkles className="w-4 h-4" />
          <span>Smart, Private Personal Finance Tracker</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Take control of your money with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">
            clarity and confidence
          </span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Track expenses, monitor monthly category budgets, and uncover spending trends
          with beautiful, interactive charts.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto flex items-center gap-2 text-base px-8">
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            onClick={handleDemoLogin}
            className="w-full sm:w-auto text-base px-8"
          >
            Explore Live Demo
          </Button>
        </div>

        {/* Dashboard Preview Mockup */}
        <div className="mt-16 relative max-w-5xl mx-auto rounded-3xl overflow-hidden border border-slate-200/80 shadow-2xl bg-white p-3 sm:p-5">
          <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 p-6 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Good morning, Alex 👋</h3>
                <p className="text-xs text-slate-500 mt-0.5">Here is your financial snapshot for this month</p>
              </div>
              <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600">
                This Month (May 2025)
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 font-medium">Total Balance</span>
                <p className="text-2xl font-bold text-primary mt-1">$4,850.00</p>
                <span className="text-xs text-emerald-600 font-medium">+14% vs last month</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 font-medium">Income</span>
                <p className="text-2xl font-bold text-income mt-1">+$5,800.00</p>
                <span className="text-xs text-slate-500">2 deposits</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 font-medium">Expenses</span>
                <p className="text-2xl font-bold text-expense mt-1">-$950.00</p>
                <span className="text-xs text-emerald-600 font-medium">-8% vs last month</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Everything you need to master personal cashflow
            </h2>
            <p className="text-slate-600 mt-3 text-base">
              Designed for speed, clarity, and peace of mind with modern tools and zero clutter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-all shadow-sm"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{feat.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">How FinTrack Works</h2>
          <p className="text-slate-600 mt-3">Three simple steps to financial discipline</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.step} className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm relative">
              <span className="text-4xl font-black text-primary/20 tracking-tighter block mb-3">
                {s.step}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-600 mt-2">Answers to common questions about FinTrack</p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <h3 className="text-base font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                  <span>{faq.q}</span>
                </h3>
                <p className="text-sm text-slate-600 pl-7">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-primary text-white text-center px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to take charge of your finances?
          </h2>
          <p className="mt-4 text-indigo-100 text-base max-w-xl mx-auto">
            Join FinTrack today. Track every penny, stay under budget, and grow your savings.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="bg-white text-primary hover:bg-slate-100 shadow-md font-semibold px-8">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="font-semibold text-slate-800">FinTrack</span>
            <span>© {new Date().getFullYear()} FinTrack. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-slate-800">Sign In</Link>
            <Link to="/register" className="hover:text-slate-800">Register</Link>
            <span>Portfolio Demo Project</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

