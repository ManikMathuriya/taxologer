import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import api from "../services/api";

function Packages() {
  const [packages, setPackages] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [serviceMode, setServiceMode] = useState("UPLOAD");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/packages/")
      .then((res) => {
        setPackages(res.data || []);
        if (!res.data || res.data.length === 0) {
          setMessage("No packages found in production database.");
        }
      })
      .catch((err) => {
        console.error("Packages error:", err?.response?.data || err.message);
        setMessage(
          err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "Failed to load packages."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (id) => {
    try {
      setLoadingId(id);

      await api.post("/create-request/", {
        package: id,
        service_mode: serviceMode,
      });

      alert("Request created successfully");
      navigate("/my-requests");
    } catch (err) {
      console.error("Create request error:", err?.response?.data || err.message);
      alert("Error creating request");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <AppLayout
      title="Choose Your Package"
      subtitle="Simple pricing. No hidden charges."
    >
      <div className="mb-8">
        <select
          value={serviceMode}
          onChange={(e) => setServiceMode(e.target.value)}
          className="border px-4 py-2 rounded-lg"
        >
          <option value="UPLOAD">Upload Documents</option>
          <option value="WHATSAPP">WhatsApp Support</option>
        </select>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl p-6 shadow border">
          Loading packages...
        </div>
      )}

      {!loading && message && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl p-6 mb-6">
          {message}
        </div>
      )}

      {!loading && packages.length > 0 && (
        <div className="grid md:grid-cols-2 gap-8">
          {packages.map((pkg, index) => (
            <div
              key={pkg.id}
              className={`relative rounded-3xl p-6 border shadow-lg bg-white transition hover:scale-[1.02] ${
                index === 1 ? "border-blue-600" : ""
              }`}
            >
              {index === 1 && (
                <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <h2 className="text-2xl font-bold">{pkg.name}</h2>
              <p className="text-gray-600 mt-2">{pkg.description}</p>

              <div className="mt-6 text-4xl font-bold text-blue-600">
                ₹{pkg.price}
              </div>

              <ul className="mt-6 space-y-2">
                {pkg.benefits?.map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    ✅ {b}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelect(pkg.id)}
                disabled={loadingId === pkg.id}
                className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700"
              >
                {loadingId === pkg.id ? "Processing..." : "Choose Plan"}
              </button>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

export default Packages;