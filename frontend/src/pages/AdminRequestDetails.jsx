import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import api, { normalizeFileUrl } from "../services/api";

function AdminRequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState("");

  const fetchDocuments = () => {
    api.get(`/request/${id}/documents/`)
      .then((res) => setDocuments(res.data))
      .catch(() => setMessage("Failed to load request documents."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDocuments();
  }, [id]);

  const handleVerifyDocuments = async () => {
    try {
      setVerifying(true);
      await api.post("/admin/verify-documents/", { request_id: id });
      setMessage("Documents verified successfully.");
      navigate("/admin/requests");
    } catch {
      setMessage("Failed to verify documents.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <AppLayout title="Admin Document Review" subtitle="Review uploaded files and verify them.">
      {message ? <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-700">{message}</div> : null}
      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm border">Loading...</div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm p-5 border">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Request #{id}</h2>
                <p className="text-slate-600">Review uploaded documents below</p>
              </div>
              <button onClick={handleVerifyDocuments} disabled={verifying} className="bg-emerald-600 text-white px-5 py-3 rounded-xl hover:bg-emerald-700 disabled:bg-slate-400">
                {verifying ? "Verifying..." : "Verify Documents"}
              </button>
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="bg-white p-6 rounded-3xl shadow-sm border">No documents uploaded for this request.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white p-5 rounded-3xl shadow-sm border">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Document Type</p>
                      <p className="font-semibold mb-2">{doc.document_type}</p>
                      <p className="text-sm text-slate-500 mb-1">Uploaded At</p>
                      <p>{new Date(doc.uploaded_at).toLocaleString()}</p>
                    </div>

                    <div className="flex gap-3 flex-wrap items-center">
                      <span className={`rounded-full px-4 py-2 text-sm font-semibold ${doc.verification_status === "VERIFIED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{doc.verification_status}</span>
                      <a href={normalizeFileUrl(doc.file_url || doc.file)} target="_blank" rel="noreferrer" className="inline-block bg-slate-900 text-white px-4 py-3 rounded-xl">View</a>
                      <a href={normalizeFileUrl(doc.file_url || doc.file)} download className="inline-block bg-blue-600 text-white px-4 py-3 rounded-xl">Download</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}

export default AdminRequestDetails;
