import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getWorker as apiGetWorker, updateWorker as apiUpdateWorker } from "../api/contractors";

export default function EditWorker() {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiGetWorker(workerId);
        setWorker(res.worker);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load worker");
      } finally {
        setLoading(false);
      }
    };
    if (workerId) load();
  }, [workerId]);

  const handleChange = (field, value) => {
    setWorker((w) => ({ ...w, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        district: worker.district || "",
        taluk: worker.taluk || "",
        village: worker.village || "",
        address: worker.address || "",
      };
      await apiUpdateWorker(workerId, payload);
      // navigate back to list
      navigate("/contractor/manage-workers");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update worker");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading worker…</div>;
  if (!worker) return <div className="p-6 text-red-600">Worker not found</div>;

  return (
    <div className="rounded-lg bg-white p-6 shadow max-w-2xl">
      <div className="mb-4">
        <h3 className="text-xl font-bold">Edit Worker Details</h3>
        <p className="text-sm text-slate-600">Update address and location</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-700 mb-1">Name</label>
          <div className="text-gray-800 font-medium">{worker.name}</div>
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">Phone</label>
          <div className="text-gray-700 text-sm">{worker.phoneNumber}</div>
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">District</label>
          <input
            value={worker.district || ""}
            onChange={(e) => handleChange("district", e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">Taluk</label>
          <input
            value={worker.taluk || ""}
            onChange={(e) => handleChange("taluk", e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">Village</label>
          <input
            value={worker.village || ""}
            onChange={(e) => handleChange("village", e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-700 mb-1">Address</label>
          <textarea
            value={worker.address || ""}
            onChange={(e) => handleChange("address", e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        {error && <div className="text-red-600">{error}</div>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-200 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-sky-600 text-white rounded-md"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
