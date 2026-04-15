import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import api from "../services/api";

function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const fetchRequests = () => {
    api.get("/admin/itr-requests/")
      .then((res) => setRequests(res.data))
      .catch((err) => setMessage(err.response?.data?.error || "Failed to load requests"));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.post("/admin/update-status/", { request_id: id, status });
      setMessage("Status updated successfully.");
      fetchRequests();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to update status.");
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const matchesSearch =
        String(item.request_number || "").toLowerCase().includes(search.toLowerCase()) ||
        String(item.user || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || item.request_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  return (
    <AppLayout title="Manage Requests" subtitle="Review, track, and update user requests.">
      {message ? <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-700">{message}</div> : null}

      <div className="bg-white p-4 rounded-3xl shadow-sm border mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Search by request number or user"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-4 py-3 rounded-xl"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border px-4 py-3 rounded-xl"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="DOCUMENTS_SUBMITTED">Documents Submitted</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="DOCUMENT_VERIFIED">Document Verified</option>
          <option value="FILED">Filed</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredRequests.map((item) => (
          <div key={item.id} className="bg-white p-5 rounded-3xl shadow-sm border">
            <div className="grid xl:grid-cols-5 gap-4 items-start">
              <div>
                <p className="text-sm text-slate-500">User</p>
                <p className="font-semibold">{item.user}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Request</p>
                <p>{item.request_number}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <span className="inline-block mt-1 rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-sm font-medium">{item.request_status}</span>
              </div>
              <div>
                <p className="text-sm text-slate-500">Payment</p>
                <span className="inline-block mt-1 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-sm font-medium">{item.payment_status}</span>
              </div>
              <div className="flex flex-col gap-2">
                <select onChange={(e) => updateStatus(item.id, e.target.value)} className="border px-3 py-2 rounded-xl" defaultValue="">
                  <option value="" disabled>Update Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="DOCUMENTS_SUBMITTED">Documents Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="DOCUMENT_VERIFIED">Verified</option>
                  <option value="FILED">Filed</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="REJECTED">Rejected</option>
                </select>

                <button onClick={() => navigate(`/admin/request-details/${item.id}`)} className="bg-slate-900 text-white px-4 py-3 rounded-xl hover:bg-slate-800">
                  Review Documents
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}

export default AdminRequests;
