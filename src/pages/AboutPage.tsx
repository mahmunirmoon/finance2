import { Check, Code2, Database, Flag, GraduationCap, HeartHandshake, Layers, MapPin, Phone, ShieldCheck, Sparkles, Users } from "lucide-react";
import Logo from "../layout/Logo";
import { faNum } from "../utils/format";

const BUILT = [
  "تعریف خانواده، اعضا، نیازها و نقش دلخواه (Mission 1)",
  "حساب‌ها، درآمد، هزینه، انتقال و موتور تراکنش مرکزی (Mission 2)",
  "بودجه، بدهی و طلب، اقساط، پرداخت‌های تکرارشونده و هشدارها (Mission 3)",
  "برنامه‌های مالی زندگی، تحصیل، ازدواج و صندوق اضطراری (Mission 4)",
  "گزارش‌های ماهانه و سالانه با نمودار و بینش قانون‌محور (Mission 5)",
  "خروجی CSV و Excel، چاپ/PDF و پشتیبان‌گیری/بازیابی JSON (Mission 5)",
];

const ROADMAP = [
  { title: "نرخ تبدیل ارز", desc: "اتصال ارزها به یکدیگر با نرخ معتبر" },
  { title: "هوش کمکی", desc: "پیشنهادهای هوشمند بودجه و پس‌انداز" },
  { title: "همگام‌سازی امن", desc: "همگام‌سازی رمزنگاری‌شده بین دستگاه‌ها" },
];

const TECH = ["React", "TypeScript", "Vite", "Tailwind CSS", "Recharts", "Lucide Icons"];

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-up flex flex-col items-start gap-4 rounded-2xl border border-line bg-surface p-6 shadow-card sm:flex-row sm:items-center sm:p-7">
        <Logo size={56} />
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">سیستم جامع مدیریت مالی خانواده</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-ink-soft">
            از تعریف خانواده تا گزارش سالانه — همه در {faNum(5)} مأموریت ساخته شده است.
            داده‌محور، بدون وابستگی به سن یا عدد ثابت، و کاملاً محلی روی مرورگر شما.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {["۱", "۲", "۳", "۴", "۵"].map((n) => (
              <span key={n} className="rounded-full bg-pine-600 px-3 py-1 text-[10px] font-extrabold text-white">
                مأموریت {n} — کامل
              </span>
            ))}
            <span className="rounded-full bg-paper px-3 py-1 text-[10px] font-extrabold text-mute">نسخه ۱٫۰</span>
          </div>
        </div>
      </div>

      {/* درباره ما — طراحی و برنامه‌نویسی */}
      <section
        className="animate-fade-up relative overflow-hidden rounded-2xl bg-pine-800 text-pine-50 shadow-pop"
        style={{ animationDelay: "40ms" }}
        aria-label="درباره ما"
      >
        <div className="pointer-events-none absolute -end-16 -top-16 h-48 w-48 rounded-full bg-pine-700/70" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-20 -start-10 h-40 w-40 rounded-full bg-pine-700/50" aria-hidden="true" />
        <div className="relative grid gap-6 p-6 sm:p-7 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-black text-saffron-300">
              <Code2 size={14} />
              درباره ما · طراحی و برنامه‌نویسی
            </p>
            <h2 className="font-display mt-2.5 text-3xl leading-tight text-white sm:text-4xl">
              آقای نریمان مبارک
            </h2>
            <p className="mt-2 max-w-md text-[13px] font-semibold leading-6 text-pine-100/90">
              این برنامه وب‌اپ توسط ایشان، از آبادان و از دانشجویان سرکار خانم دکتر آقایی،
              طراحی و برنامه‌نویسی شده است.
            </p>
            <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-extrabold text-pine-200">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} className="text-saffron-300" />
                آبادان
              </span>
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap size={13} className="text-saffron-300" />
                از دانشجویان سرکار خانم دکتر آقایی
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-pine-600/60 bg-pine-900/60 px-5 py-4">
            <p className="flex items-start gap-2.5 text-[13px] font-bold leading-7 text-pine-100">
              <HeartHandshake size={19} className="mt-1 shrink-0 text-saffron-300" />
              <span>
                با تشکر فراوان از{" "}
                <span className="text-saffron-300">خانم دکتر ماه منیر آقایی</span>{" "}
                و آموزش‌های خوب و کاربردی ایشان.
              </span>
            </p>
            <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-pine-700/60 pt-3 text-[13px] font-bold text-pine-100">
              <Phone size={15} className="shrink-0 text-saffron-300" />
              <span className="text-saffron-300">شماره تماس استاد:</span>
              <span dir="ltr" className="tracking-wider">۰۰۹۷۱ ۵۵۱ ۵۴۴ ۹۸۸</span>
            </p>
          </div>
        </div>
        <div className="relative h-1 w-full bg-gradient-to-l from-saffron-400 via-pine-400 to-pine-700" aria-hidden="true" />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="animate-fade-up rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6" style={{ animationDelay: "80ms" }}>
          <h2 className="flex items-center gap-2 text-base font-extrabold text-ink">
            <Check size={16} className="text-success" />
            آنچه ساخته شده
          </h2>
          <ul className="mt-4 space-y-2.5">
            {BUILT.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-ink-soft">
                <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                  <Check size={10} strokeWidth={3.5} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="animate-fade-up rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6" style={{ animationDelay: "140ms" }}>
          <h2 className="flex items-center gap-2 text-base font-extrabold text-ink">
            <Flag size={16} className="text-saffron-500" />
            چشم‌انداز آینده
          </h2>
          <ul className="mt-4 space-y-3">
            {ROADMAP.map((r, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl bg-paper/60 px-3.5 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-xs font-extrabold text-saffron-600 shadow-card">
                  {faNum(i + 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-ink">{r.title}</p>
                  <p className="text-[11px] text-mute">{r.desc}</p>
                </div>
                <span className="rounded-full bg-saffron-100 px-2.5 py-1 text-[9px] font-extrabold text-saffron-700">به‌زودی</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="animate-fade-up rounded-2xl border border-pine-200 bg-pine-50/70 p-5 sm:p-6" style={{ animationDelay: "200ms" }}>
        <h2 className="flex items-center gap-2 text-base font-extrabold text-pine-800">
          <Sparkles size={16} className="text-saffron-500" />
          اصول حاکم بر معماری
        </h2>
        <ul className="mt-3 grid gap-2.5 text-sm leading-7 text-pine-800/90 sm:grid-cols-2">
          <li className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-saffron-500" /> هیچ عدد Hard-coded مالی وجود ندارد؛ همه‌چیز از تراکنش‌ها محاسبه می‌شود.</li>
          <li className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-saffron-500" /> ارزهای مختلف هرگز بدون نرخ تبدیل معتبر با هم جمع نمی‌شوند.</li>
          <li className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-saffron-500" /> بازپرداخت بدهی و دریافت طلب دوباره به‌عنوان هزینه/درآمد شمرده نمی‌شوند.</li>
          <li className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-saffron-500" /> هیچ قابلیتی بر اساس سن فعال نمی‌شود؛ انتخاب کاربر منبع حقیقت است.</li>
        </ul>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-surface px-3.5 py-3 shadow-card">
            <Users size={15} className="text-pine-600" />
            <span className="text-[11px] font-bold text-ink-soft">تعداد اعضا نامحدود</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-surface px-3.5 py-3 shadow-card">
            <Layers size={15} className="text-pine-600" />
            <span className="text-[11px] font-bold text-ink-soft">برنامه‌های سفارشی زندگی</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-surface px-3.5 py-3 shadow-card">
            <Database size={15} className="text-pine-600" />
            <span className="text-[11px] font-bold text-ink-soft">ذخیره محلی + پشتیبان JSON</span>
          </div>
        </div>
      </section>

      <section className="animate-fade-up flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface px-5 py-4 shadow-card" style={{ animationDelay: "260ms" }}>
        <ShieldCheck size={16} className="text-pine-600" />
        <span className="me-2 text-xs font-extrabold text-ink-soft">ساخته‌شده با:</span>
        {TECH.map((t) => (
          <span key={t} className="rounded-full bg-paper px-3 py-1 text-[10px] font-extrabold text-ink-soft">{t}</span>
        ))}
      </section>
    </div>
  );
}
