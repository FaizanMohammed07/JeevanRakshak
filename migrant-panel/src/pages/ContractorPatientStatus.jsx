import React, { useEffect } from "react";
import { useContractor } from "../context/ContractorContext";

export default function ContractorPatientStatus() {
  const { workers, fetchWorkers, clearAlert, loading, error } = useContractor();

  useEffect(() => {
    fetchWorkers().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClear = async (id) => {
    try {
      await clearAlert(id);
    } catch (err) {
      // handled by context
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="text-2xl font-bold">Patient Status</h3>
      <p className="mt-2 text-sm text-slate-600">
        Shows contagious alerts for your linked patients.
      </p>

      {error && <div className="mt-4 text-red-600">{error}</div>}

      <div className="mt-6">
        {!workers || workers.length === 0 ? (
          <p className="text-sm text-slate-500">No patients linked yet.</p>
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
                  {p.contagiousAlert && p.contagiousAlert.active ? (
                    <div className="mt-2 rounded-md bg-red-50 px-3 py-2 text-red-700 text-sm">
                      <div>
                        <strong>Contagious:</strong>{" "}
                        {p.contagiousAlert.disease || "unspecified"}
                      </div>
                      <div className="text-xs text-slate-500">
                        Reported:{" "}
                        {new Date(
                          p.contagiousAlert.createdAt ||
                            p.contagiousAlert.createdAt
                        ).toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-emerald-600">
                      No active alert
                    </div>
                  )}
                </div>
                {p.contagiousAlert && p.contagiousAlert.active && (
                  <button
                    onClick={() => handleClear(p._id)}
                    className="rounded-md bg-amber-600 px-3 py-1 text-white text-sm"
                    disabled={loading}
                  >
                    Clear Alert
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
