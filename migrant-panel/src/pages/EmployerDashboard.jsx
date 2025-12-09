import { useEffect } from "react";
import { useEmployer } from "../context/EmployerContext";

export default function EmployerDashboard() {
  const { employer, fetchContractors } = useEmployer();

  useEffect(() => {
    fetchContractors().catch(() => {});
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold">Employer Dashboard</h2>
      <p className="mt-2 text-sm text-slate-600">Welcome {employer?.name}</p>
    </div>
  );
}
