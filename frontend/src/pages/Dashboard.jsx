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
      .catch((err) => setError(err.response?.data?.error || "Failed to load dashboard"));
  }, []);

  return (
    <AppLayout title={`Hi, ${data?.user?.name || "User"}`} subtitle="Welcome back. Here is your current filing summary.">
      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}
      {!data ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm border">Loading...</div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              ["Total Requests", data.total_requests],
              ["Pending", data.pending_requests],
              ["Completed", data.completed_requests],
              ["Paid", data.paid_requests],
            ].map(([title, value]) => (
              <div key={title} className="rounded-3xl bg-white p-6 shadow-sm border">
                <p className="text-sm text-slate-500">{title}</p>
                <h3 className="text-4xl font-bold mt-2">{value}</h3>
              </div>
            ))}
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm border">
            <h2 className="text-2xl font-bold mb-4">Recent Requests</h2>
            {!data.recent_requests?.length ? (
              <p className="text-slate-600">No recent requests yet.</p>
            ) : (
              <div className="grid gap-4">
                {data.recent_requests.map((item) => (
                  <div key={item.id} className="rounded-2xl border p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="font-semibold text-lg">{item.package_name}</p>
                        <p className="text-slate-600">{item.request_number}</p>
                      </div>
                      <div className="text-sm font-medium rounded-full bg-blue-50 text-blue-700 px-4 py-2 w-fit">
                        {item.request_status.replaceAll("_", " ")}
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-slate-600 mb-2">
                        <span>Progress</span>
                        <span>{item.progress}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default Dashboard;
