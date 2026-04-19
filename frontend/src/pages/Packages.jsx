import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import api from "../services/api";

function Packages() {
  const [packages, setPackages] = useState([]);
  const [discountCode, setDiscountCode] = useState("");
  const [serviceMode, setServiceMode] = useState("UPLOAD");

  useEffect(() => {
    api.get("/packages/")
      .then((res) => setPackages(res.data))
      .catch(console.error);
  }, []);

  const handleSelect = async (id) => {
    try {
      await api.post("/create-request/", {
        package: id,
        service_mode: serviceMode,
        discount_code: discountCode,
      });

      alert("Request created successfully");
    } catch {
      alert("Error creating request");
    }
  };

  return (
    <AppLayout title="Choose Package">

      <input
        placeholder="Enter Referral / MP Code"
        value={discountCode}
        onChange={(e) => setDiscountCode(e.target.value)}
        className="border px-4 py-2 mb-4 rounded"
      />

      <div className="grid md:grid-cols-2 gap-6">
        {packages.map((p) => (
          <div key={p.id} className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold">{p.name}</h2>
            <p>{p.description}</p>
            <p className="text-2xl mt-2">₹{p.price}</p>

            <button
              onClick={() => handleSelect(p.id)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
            >
              Select
            </button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}

export default Packages;