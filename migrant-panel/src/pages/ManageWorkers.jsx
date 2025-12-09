import React, { useEffect, useState } from "react";
import { listWorkers } from "../api/contractors";
import { Link } from "react-router-dom";

export default function ManageWorkers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await listWorkers();
      setWorkers(res.workers || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load workers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="text-2xl font-bold mb-2">Manage Worker Details</h3>
      <p className="text-sm text-slate-600 mb-4">
        Edit address and location details for migrant workers assigned to you.
      </p>

      {loading ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : workers.length === 0 ? (
        <div className="text-sm text-slate-500">No workers assigned.</div>
      ) : (
        <ul className="space-y-3">
          {workers.map((w) => (
            <li
              key={w._id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div>
                <div className="font-semibold">{w.name}</div>
                <div className="text-xs text-slate-500">{w.phoneNumber}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {w.district || "-"}, {w.taluk || "-"}, {w.village || "-"}
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/contractor/manage-workers/${w._id}`}
                  className="px-3 py-1 bg-sky-600 text-white rounded-md text-sm"
                >
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
