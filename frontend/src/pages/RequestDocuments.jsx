import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import api, { normalizeFileUrl } from "../services/api";

function RequestDocuments() {
  const { id } = useParams();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/request/${id}/documents/`)
      .then((res) => setDocuments(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <AppLayout title="Uploaded Documents" subtitle="View all uploaded files and document verification status.">
      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm border">Loading...</div>
      ) : documents.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm border">No documents found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="rounded-3xl bg-white p-5 shadow-sm border">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Document Type</p>
                  <p className="font-semibold text-lg">{doc.document_type}</p>
                  <p className="text-sm text-slate-500 mt-2">Uploaded At</p>
                  <p>{new Date(doc.uploaded_at).toLocaleString()}</p>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                  <span className={`rounded-full px-4 py-2 text-sm font-semibold ${doc.verification_status === "VERIFIED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {doc.verification_status}
                  </span>
                  <a href={normalizeFileUrl(doc.file_url || doc.file)} target="_blank" rel="noreferrer" className="rounded-xl bg-slate-900 text-white px-4 py-3">View</a>
                  <a href={normalizeFileUrl(doc.file_url || doc.file)} download className="rounded-xl bg-blue-600 text-white px-4 py-3">Download</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

export default RequestDocuments;
