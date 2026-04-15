import React, { useState } from "react";
import AppLayout from "../components/AppLayout";
import api from "../services/api";
import { useParams } from "react-router-dom";

function UploadDocuments() {
  const { id } = useParams();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [type, setType] = useState("PAN");

  const handleFile = (e) => {
    const f = e.target.files[0];
    setFile(f);

    if (f) {
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("Select file");

    const form = new FormData();
    form.append("file", file);
    form.append("itr_request", id);
    form.append("document_type", type);

    try {
      await api.post("/upload-document/", form);
      alert("Uploaded successfully");
    } catch {
      alert("Upload failed");
    }
  };

  return (
    <AppLayout title="Upload Documents">

      <div className="bg-white p-6 rounded-xl shadow max-w-xl">

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="mb-4 border px-3 py-2 rounded w-full"
        >
          <option value="PAN">PAN</option>
          <option value="AADHAAR">AADHAAR</option>
          <option value="FORM16">FORM16</option>
        </select>

        {/* Camera + Upload */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="mb-4"
        />

        {/* Preview */}
        {preview && (
          <img src={preview} alt="preview" className="mb-4 rounded-lg" />
        )}

        <button
          onClick={handleUpload}
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          Upload
        </button>

      </div>
    </AppLayout>
  );
}

export default UploadDocuments;