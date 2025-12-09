import { useEffect, useState } from "react";
import { useEmployer } from "../context/EmployerContext";
import BroadcastDialog from "../components/BroadcastDialog";

export default function EmployerDashboard() {
  const { employer, fetchContractors } = useEmployer();
  const [showBroadcast, setShowBroadcast] = useState(false);

  useEffect(() => {
    fetchContractors().catch(() => {});
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold">Employer Dashboard</h2>
      <p className="mt-2 text-sm text-slate-600">Welcome {employer?.name}</p>
      <div className="mt-4">
        <button
          onClick={() => setShowBroadcast(true)}
          className="px-3 py-2 rounded bg-green-600 text-white"
        >
          Broadcast Announcement
        </button>
      </div>

      <BroadcastDialog open={showBroadcast} onClose={() => setShowBroadcast(false)} />
    </div>
  );
}
