function App() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-3xl border border-cyan-400/30 bg-red/5 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur">
            <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-sm font-medium text-cyan-200">
              Tailwind CDN da duoc nap
            </span>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-red-400 sm:text-5xl">
              React + Tailwind CDN
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Day la doan giao dien mau dang dung class Tailwind truc tiep trong
              JSX ma khong can cai dat PostCSS hay file config.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button className="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">
                Nut Tailwind
              </button>
              <button className="rounded-2xl border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10">
                Kiem tra giao dien
              </button>
            </div>
          </section>

          <section className="rounded-3xl bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 p-[1px]">
            <div className="h-full rounded-3xl bg-slate-900 p-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">The thong tin demo</h2>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-medium text-emerald-300">
                  Dang hoat dong
                </span>
              </div>

              <div className="mt-8 space-y-4">
                <div className="rounded-2xl bg-red/5 p-4">
                  <p className="text-sm text-slate-400">Mau nen</p>
                  <p className="mt-1 text-lg font-semibold">
                    bg-slate-950 + gradient card
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Typography</p>
                  <p className="mt-1 text-lg font-semibold">
                    text-4xl font-black tracking-tight
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Spacing</p>
                  <p className="mt-1 text-lg font-semibold">
                    px-6 py-16 gap-8 rounded-3xl
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default App;
