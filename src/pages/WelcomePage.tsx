import { ArrowLeft, Flag, PiggyBank, ShieldCheck, Sparkles, Users } from "lucide-react";
import Logo from "../layout/Logo";

/** تصویر جایگزین محلی */
function FallbackArt() {
  return (
    <svg viewBox="0 0 400 300" className="w-full" role="img" aria-label="اعضای خانواده">
      <rect width="400" height="300" rx="28" fill="#dcebe5" />
      <circle cx="200" cy="120" r="86" fill="#ffffff" fillOpacity="0.6" />
      <circle cx="140" cy="110" r="34" fill="#E9C06A" />
      <circle cx="205" cy="95" r="40" fill="#146855" />
      <circle cx="262" cy="118" r="30" fill="#8bbbad" />
      <circle cx="168" cy="170" r="26" fill="#f2d79e" />
      <circle cx="238" cy="172" r="24" fill="#b9d6cb" />
      <rect x="90" y="216" width="220" height="14" rx="7" fill="#146855" fillOpacity="0.15" />
      <circle cx="330" cy="60" r="20" fill="#E3A93F" />
      <path d="M330 50v20M320 60h20" stroke="#fdf6e7" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

interface WelcomePageProps {
  onStart: () => void;
  onDemo: () => void;
}

/** صفحه خوش‌آمدگویی — اولین اجرای برنامه */
export default function WelcomePage({ onStart, onDemo }: WelcomePageProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="bg-girih absolute inset-0" aria-hidden="true" />
      <div className="absolute -top-32 -start-32 h-96 w-96 rounded-full bg-pine-200/40 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-44 -end-24 h-[28rem] w-[28rem] rounded-full bg-saffron-200/40 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 sm:px-8">
        <header className="animate-fade-in flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <Logo size={42} />
            <div>
              <p className="text-sm font-extrabold text-ink">مدیریت مالی خانواده</p>
              <p className="text-[11px] text-mute">پایه‌ای برای آرامش مالی خانه</p>
            </div>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-extrabold text-pine-700 sm:inline-flex">
            <Sparkles size={13} className="text-saffron-500" />
            نسخه کامل · مأموریت ۵ از ۵
          </span>
        </header>

        <div className="grid flex-1 items-center gap-10 pb-12 pt-4 lg:grid-cols-2 lg:gap-14">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-pine-600/10 px-3.5 py-1.5 text-[11px] font-extrabold text-pine-700">
              همه داده‌ها روی مرورگر شما می‌ماند · پشتیبان‌گیری JSON
            </span>
            <h1 className="font-display mt-5 text-5xl leading-[1.2] text-ink sm:text-6xl">
              مدیریت مالی <span className="text-pine-600">خانواده</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-8 text-ink-soft">
              برای شروع، ابتدا خانواده خود را تعریف کنید؛ حساب‌ها و تراکنش‌ها را ثبت کنید،
              بودجه و اقساط را مدیریت کنید و برای اتفاق‌های مهم زندگی برنامه مالی بسازید.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                onClick={onStart}
                className="group inline-flex items-center gap-2.5 rounded-xl bg-pine-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-pop transition-all duration-200 hover:bg-pine-700 hover:shadow-card active:scale-[0.97]"
              >
                شروع راه‌اندازی
                <ArrowLeft size={17} className="transition-transform duration-200 group-hover:-translate-x-1" />
              </button>
              <button
                onClick={onDemo}
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-3.5 text-sm font-bold text-ink-soft shadow-card transition-all duration-200 hover:border-pine-300 hover:text-pine-700 active:scale-[0.97]"
              >
                <Users size={16} className="text-pine-600" />
                مشاهده نسخه نمونه کامل
              </button>
            </div>

            <ul className="mt-9 space-y-3">
              {[
                { icon: <Users size={15} />, text: "تعریف اعضا با نقش، پروفایل مالی و نیازها" },
                { icon: <Flag size={15} />, text: "بودجه، بدهی و طلب، اقساط و پرداخت‌های تکرارشونده" },
                { icon: <PiggyBank size={15} />, text: "برنامه مالی ازدواج، دانشگاه، خودرو و صندوق اضطراری" },
                { icon: <ShieldCheck size={15} />, text: "گزارش‌ها، نمودارها، خروجی Excel/CSV و پشتیبان‌گیری" },
              ].map((b, i) => (
                <li key={i} className="animate-fade-up flex items-center gap-3 text-sm text-ink-soft" style={{ animationDelay: `${250 + i * 110}ms` }}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-pine-600 shadow-card">{b.icon}</span>
                  {b.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-fade-up relative" style={{ animationDelay: "140ms" }}>
            <div className="absolute -inset-3 rotate-2 rounded-[2rem] border-2 border-dashed border-pine-200" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-pop">
              <FallbackArt />
            </div>
            <div className="animate-float absolute -top-5 -start-3 hidden items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2.5 shadow-pop sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-saffron-50 text-saffron-600">
                <PiggyBank size={16} />
              </span>
              <div>
                <p className="text-[11px] font-extrabold text-ink">اهداف پس‌انداز</p>
                <p className="text-[10px] text-mute">صندوق اضطراری و برنامه‌های زندگی</p>
              </div>
            </div>
            <div className="animate-float-slow absolute -bottom-5 -end-3 hidden items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2.5 shadow-pop sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pine-50 text-pine-600">
                <Flag size={16} />
              </span>
              <div>
                <p className="text-[11px] font-extrabold text-ink">گزارش سالانه</p>
                <p className="text-[10px] text-mute">۱۲ ماه شمسی با بینش‌های خودکار</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
