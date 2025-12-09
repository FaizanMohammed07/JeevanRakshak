import React, { useEffect, useState } from "react";
import { useContractor } from "../context/ContractorContext";

export default function ContractorPatients() {
  const { workers, fetchWorkers, linkWorker, removeWorker, loading, error } =
    useContractor();

  const [linkPhone, setLinkPhone] = useState("");
  useEffect(() => {
    fetchWorkers().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleLink = async (e) => {
    e.preventDefault();
    if (!linkPhone) return;
    try {
      await linkWorker(linkPhone);
      setLinkPhone("");
    } catch (err) {
      // error stored in context
    }
  };

  const handleRemove = async (id) => {
    try {
      await removeWorker(id);
    } catch (err) {
      // ignore
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="text-2xl font-bold">Add / Remove Patients</h3>
      <p className="mt-2 text-sm text-slate-600">Manage patients (backend)</p>

      {/* Only link existing patients by phone - no creation here */}
      <form onSubmit={handleLink} className="mt-4 flex gap-2">
        <input
          value={linkPhone}
          onChange={(e) => setLinkPhone(e.target.value)}
          placeholder="Link existing patient by phone"
          className="w-1/3 rounded-md border px-3 py-2"
        />
        <button
          className="rounded-md bg-emerald-600 px-4 py-2 text-white disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          Link
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 px-4 py-2 text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6">
        {!workers || workers.length === 0 ? (
          <p className="text-sm text-slate-500">No patients added yet.</p>
        ) : (
          <ul className="space-y-3">
            {workers.map((p) => (
              <li
                key={p._id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.phoneNumber}</div>
                </div>
                <button
                  onClick={() => handleRemove(p._id)}
                  className="rounded-md bg-red-500 px-3 py-1 text-white text-sm"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
