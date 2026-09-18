import Link from "next/link";

const ABOUT_PHOTO = {
  src: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1200&auto=format&fit=crop",
  alt: "Clinician reviewing digitized patient records on a tablet",
  caption:
    "About this photo: a clinician reviewing digitized records on a tablet — illustrative of MEDCARE's evidence-first timeline. Stock photo via Unsplash (National Cancer Institute / Oliver Thomas style medical imagery).",
};

const GALLERY = [
  {
    src: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=800&auto=format&fit=crop",
    alt: "Doctor consulting patient in clinic",
    title: "Patient journey",
    desc: "Visits, labs, meds and hospital stays in one timeline.",
  },
  {
    src: "https://images.unsplash.com/photo-1551190822-a9333d879b1f?q=80&w=800&auto=format&fit=crop",
    alt: "Medication bottles and prescriptions",
    title: "Medication clarity",
    desc: "Dosage conflicts surfaced, never silently resolved.",
  },
  {
    src: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?q=80&w=800&auto=format&fit=crop",
    alt: "Clinician reviewing medical documents",
    title: "Evidence always attached",
    desc: "Every fact cites document, page and exact quote.",
  },
];

const features = [
  {
    icon: "⬡",
    title: "Evidence-first",
    desc: "Every fact links to document + page + exact quote. Zero fabrication.",
    color: "text-clinical-400",
  },
  {
    icon: "⬡",
    title: "Controlled sharing",
    desc: "Authenticated, expiring, revocable, scoped, fully audited access.",
    color: "text-violet-400",
  },
  {
    icon: "⬡",
    title: "Decision support only",
    desc: "AI-organized from your records — never diagnosis or medical advice.",
    color: "text-amber-400",
  },
];

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-clinical-500/10 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 h-[400px] w-[400px] rounded-full bg-violet-500/8 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-clinical-500/30 bg-clinical-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-clinical-400">
          <span className="h-1.5 w-1.5 rounded-full bg-clinical-400 animate-pulse-slow" />
          MEDCARE · HE-05
        </div>

        {/* Hero */}
        <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[1.08] tracking-tight text-white md:text-7xl">
          Turn fragmented{" "}
          <span className="bg-gradient-to-r from-clinical-400 to-clinical-300 bg-clip-text text-transparent">
            medical records
          </span>{" "}
          into one patient journey.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-slate-400 leading-relaxed">
          Evidence-backed timeline · 30-second doctor cockpit · patient-controlled sharing · audited break-glass access.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup" className="btn-primary text-base px-7 py-3">
            Get Started
          </Link>
          <Link href="/signin?demo=patient" className="btn-ghost text-base px-7 py-3">
            Patient Demo
          </Link>
          <Link href="/signin?demo=doctor" className="btn-ghost text-base px-7 py-3">
            Doctor Portal
          </Link>
        </div>

        {/* Demo hint */}
        <p className="mt-4 text-xs text-slate-600">
          Demo: patient@demo.medcare · doctor@demo.medcare · password demo1234
        </p>

        {/* Feature cards */}
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {features.map(({ icon, title, desc, color }) => (
            <div key={title} className="glass-card p-6 animate-fade-in">
              <span className={`text-2xl ${color}`}>{icon}</span>
              <p className="mt-3 font-bold text-white">{title}</p>
              <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Pictures gallery */}
        <section className="mt-16">
          <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            See MEDSCOPE-AI in action
          </h2>
          <p className="mt-2 max-w-xl text-sm text-slate-400">
            Illustrative stock photos showing how records become a clear
            patient journey.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {GALLERY.map((g) => (
              <figure key={g.title} className="glass overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g.src}
                  alt={g.alt}
                  className="h-48 w-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <figcaption className="px-5 py-4">
                  <p className="font-bold text-white">{g.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{g.desc}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* About-this-photo section */}
        <section className="mt-16 grid items-center gap-8 md:grid-cols-2">
          <figure className="glass overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ABOUT_PHOTO.src}
              alt={ABOUT_PHOTO.alt}
              className="h-64 w-full object-cover md:h-80"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <figcaption className="border-t border-white/10 px-5 py-3 text-xs leading-relaxed text-slate-400">
              {ABOUT_PHOTO.caption}
            </figcaption>
          </figure>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              Built around evidence, designed for care.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              MEDCARE turns fragmented uploads into one traceable patient
              journey: every event cites its source document, page, and exact
              quote — with faithful date precision, conflict detection, and
              patient-controlled sharing.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Decision support only — never diagnosis or medical advice.
              Synthetic demo data.
            </p>
          </div>
        </section>

        {/* Stats strip */}
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[["15", "Documents"], ["19", "Events"], ["6", "Doc types"], ["1", "Conflict detected"]].map(([v, l]) => (
            <div key={l} className="glass-sm p-4 text-center">
              <p className="text-2xl font-black text-white">{v}</p>
              <p className="text-xs text-slate-500 mt-0.5">{l}</p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-xs text-slate-600">
          MEDCARE uses controlled, authenticated, auditable access. Synthetic demo data only.
        </p>
      </div>
    </main>
  );
}
