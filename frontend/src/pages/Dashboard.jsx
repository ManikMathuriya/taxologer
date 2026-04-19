import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import api from "../services/api";

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/")
      .then((res) => setData(res.data))
      .catch((err) => {
        console.error(err);
        setError("Failed to load dashboard");
      });
  }, []);

  if (error) {
    return (
      <AppLayout title="Dashboard">
        <div className="bg-red-100 text-red-700 p-4 rounded">
          {error}
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout title="Dashboard">
        <div className="bg-white p-6 rounded shadow">Loading...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={`Hi, ${data.user?.first_name || data.user?.username || "User"}`}
      subtitle="Here is your account overview"
    >
      {/* 🔥 STATS (ONE VIEW) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <p className="text-gray-500 text-sm">Total Requests</p>
          <h2 className="text-3xl font-bold">{data.total_requests}</h2>
        </div>

        <div className="bg-white p-6 rounded-xl shadow text-center">
          <p className="text-gray-500 text-sm">Pending</p>
          <h2 className="text-3xl font-bold">{data.pending_requests}</h2>
        </div>

        <div className="bg-white p-6 rounded-xl shadow text-center">
          <p className="text-gray-500 text-sm">Completed</p>
          <h2 className="text-3xl font-bold">{data.completed_requests}</h2>
        </div>

        <div className="bg-white p-6 rounded-xl shadow text-center">
          <p className="text-gray-500 text-sm">Paid</p>
          <h2 className="text-3xl font-bold">{data.paid_requests}</h2>
        </div>
      </div>

      {/* 📦 AVAILABLE PACKAGES */}
      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Available Packages</h2>

        {!data.available_packages?.length ? (
          <p className="text-gray-500">No packages available</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {data.available_packages.map((pkg) => (
              <div
                key={pkg.id}
                className="border rounded-lg p-4 hover:shadow"
              >
                <h3 className="font-semibold text-lg">{pkg.name}</h3>
                <p className="text-gray-600">{pkg.description}</p>
                <p className="text-blue-600 font-bold mt-2">
                  ₹{pkg.price}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📄 RECENT REQUESTS */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">Recent Requests</h2>

        {!data.recent_requests?.length ? (
          <p className="text-gray-500">No requests yet</p>
        ) : (
          <div className="space-y-4">
            {data.recent_requests.map((req) => (
              <div
                key={req.id}
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">
                    {req.package_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {req.request_number}
                  </p>
                </div>

                <div className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  {req.request_status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default Dashboard;