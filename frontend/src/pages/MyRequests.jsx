import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import api from "../services/api";

function MyRequests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    api.get("/my-itr-requests/")
      .then(res => setRequests(res.data))
      .catch(console.error);
  }, []);

  return (
    <AppLayout title="My Requests">

      <div className="space-y-6">

        {requests.map(req => (
          <div key={req.id} className="bg-white p-6 rounded-xl shadow">

            <h2 className="font-bold text-lg">{req.package_name}</h2>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
              <div
                className="bg-blue-600 h-3 rounded-full"
                style={{ width: `${req.progress}%` }}
              />
            </div>

            {/* Timeline */}
            <div className="flex justify-between mt-4 text-xs">
              {req.timeline.map((t, i) => (
                <div key={i} className="text-center">
                  <div className={`w-3 h-3 mx-auto rounded-full ${
                    t.done ? "bg-blue-600" : "bg-gray-300"
                  }`} />
                  <p className="mt-1">{t.label}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm text-gray-600">
              Status: {req.request_status}
            </p>

          </div>
        ))}

      </div>
    </AppLayout>
  );
}

export default MyRequests;