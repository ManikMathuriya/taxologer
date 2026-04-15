import Sidebar from "./Sidebar";

export default function AppLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <Sidebar />

      <main className="flex-1 p-4 md:p-8">
        <div className="mb-8 rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-slate-600">{subtitle}</p>
          ) : null}
        </div>

        {children}
      </main>
    </div>
  );
}