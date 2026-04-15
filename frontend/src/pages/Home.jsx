import React from "react";
import { Link } from "react-router-dom";

function Home() {
  const packages = [
    {
      name: "ITR 1 (Salaried person)",
      price: "₹499",
      description: "For salaried users who want an easy and verified filing process.",
      benefits: ["Secure filing", "Verified documents", "Fast support", "Easy upload"],
      highlight: true,
    },
    {
      name: "ITR (For Business Individual)",
      price: "₹599",
      description: "For business individuals who need deeper support and financial review.",
      benefits: [
        "24/hr. call support",
        "Computation",
        "TDS info",
        "Balance sheet",
        "Delivery at door step",
        "Verified document",
      ],
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Taxologer</h1>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="hover:text-blue-600">Features</a>
            <a href="#packages" className="hover:text-blue-600">Packages</a>
            <a href="#tracking" className="hover:text-blue-600">Tracking</a>
            <Link to="/login" className="hover:text-blue-600">Login</Link>
            <Link to="/register" className="rounded-xl bg-blue-600 text-white px-5 py-2.5 hover:bg-blue-700">Get Started</Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-br from-slate-950 via-blue-900 to-cyan-800 text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm mb-6">ITR filing starts at just ₹499</div>
            <h2 className="text-4xl md:text-6xl font-bold leading-tight">Professional tax filing with secure upload and real-time status tracking.</h2>
            <p className="text-lg text-blue-100 mt-6 max-w-2xl">Upload documents, capture live document photos, pay online, and track every stage of your service from one clean dashboard.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link to="/register" className="rounded-2xl bg-white text-blue-700 px-6 py-3 font-semibold text-center hover:bg-slate-100">Start Filing Now</Link>
              <Link to="/login" className="rounded-2xl border border-white/30 px-6 py-3 font-semibold text-center hover:bg-white/10">Login to Dashboard</Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl bg-white text-slate-900 p-6 shadow-2xl">
              <h3 className="text-xl font-bold">What you get</h3>
              <div className="grid sm:grid-cols-2 gap-4 mt-5">
                {[
                  "Live document photo capture",
                  "Secure upload option",
                  "Verified document workflow",
                  "Easy service tracking",
                  "Online payment support",
                  "Professional assistance",
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 border p-4 font-medium">{item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold">Why people choose Taxologer</h3>
            <p className="text-slate-600 mt-4">Built to feel simple for users and trustworthy enough to convert visitors into customers.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              ["Easy document upload", "Users can upload files or capture a live photo from camera on the same page."],
              ["Service tracking UI", "Users can see request progress clearly from pending to completed."],
              ["Professional assistance", "Packages are designed to clearly communicate value and support."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg transition">
                <h4 className="text-xl font-semibold">{title}</h4>
                <p className="mt-3 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="packages" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold">Choose your package</h3>
            <p className="text-slate-600 mt-4">Clear pricing. Better support. Faster decisions.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mt-12">
            {packages.map((pkg) => (
              <div key={pkg.name} className={`rounded-3xl p-8 border shadow-sm ${pkg.highlight ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200"}`}>
                {pkg.highlight ? <div className="inline-flex rounded-full bg-white text-blue-700 px-4 py-2 text-sm font-semibold mb-5">Most Popular</div> : null}
                <h4 className="text-3xl font-bold">{pkg.name}</h4>
                <p className={`mt-3 ${pkg.highlight ? "text-blue-100" : "text-slate-600"}`}>{pkg.description}</p>
                <div className="mt-6 text-4xl font-bold">{pkg.price}</div>
                <div className="mt-8 space-y-3">
                  {pkg.benefits.map((benefit) => (
                    <div key={benefit} className={`rounded-2xl px-4 py-3 ${pkg.highlight ? "bg-white/10" : "bg-slate-50 border"}`}>{benefit}</div>
                  ))}
                </div>
                <Link to="/register" className={`mt-8 inline-block rounded-2xl px-6 py-3 font-semibold ${pkg.highlight ? "bg-white text-blue-700" : "bg-blue-600 text-white"}`}>Choose Package</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tracking" className="py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="rounded-[2rem] bg-slate-950 text-white p-8 md:p-12">
            <h3 className="text-3xl font-bold">Track your service with clarity</h3>
            <div className="grid md:grid-cols-5 gap-4 mt-8">
              {["Pending", "Documents Submitted", "Under Review", "Document Verified", "Completed"].map((step, index) => (
                <div key={step} className="rounded-2xl bg-white/10 p-5 text-center">
                  <div className="w-10 h-10 rounded-full bg-blue-500 mx-auto flex items-center justify-center font-bold">{index + 1}</div>
                  <p className="mt-3 font-medium">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-300 py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between gap-4">
          <p>© 2026 Taxologer. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-white">Login</Link>
            <Link to="/register" className="hover:text-white">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
