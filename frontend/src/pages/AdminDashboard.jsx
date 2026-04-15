import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import api from "../services/api";

function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/dashboard/").then((res) => setData(res.data));
  }, []);

  return (
    <AppLayout title="Admin Dashboard" subtitle="Overview of users, requests, and payments.">
      {!data ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm border">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            ["Users", data.total_users],
            ["Requests", data.total_requests],
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
      )}
    </AppLayout>
  );
}

export default AdminDashboard;
