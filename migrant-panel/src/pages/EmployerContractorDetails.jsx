import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchContractorDetails, pingContractorById } from "../api/employers";

export default function EmployerContractorDetails() {
  const { contractorId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contractor, setContractor] = useState(null);
  const [patients, setPatients] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [pinging, setPinging] = useState(false);
  const [pingMsg, setPingMsg] = useState("Please check migrant wellbeing and report any issues.");

  useEffect(() => {
    if (!contractorId) return;
    load();
  }, [contractorId]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchContractorDetails(contractorId);
      setContractor(data.contractor);
      setPatients(data.patients || []);
      setSummary(data.summary || null);
    } catch (err) {
      setError(err?.response?.data?.msg || err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const handlePing = async () => {
    setPinging(true);
    try {
      await pingContractorById(contractorId, pingMsg);
      alert("Ping queued — contractor will receive a WhatsApp message shortly.");
    } catch (err) {
      alert(err?.response?.data?.msg || err.message || "Failed to ping");
    } finally {
      setPinging(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">{contractor?.name}</h3>
          <div className="text-sm text-slate-600">{contractor?.phoneNumber}</div>
          <div className="text-sm text-slate-500">Company: {contractor?.companyName || '—'}</div>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded border" onClick={() => navigate(-1)}>Back</button>
          <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={load}>Refresh</button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="rounded bg-white p-3 shadow-sm">
          <div className="text-sm text-slate-500">Total Migrants</div>
          <div className="text-2xl font-bold">{summary?.totalPatients ?? 0}</div>
        </div>
        <div className="rounded bg-white p-3 shadow-sm">
          <div className="text-sm text-slate-500">Active Alerts</div>
          <div className="text-2xl font-bold text-red-600">{summary?.contagiousAlerts ?? 0}</div>
        </div>
        <div className="rounded bg-white p-3 shadow-sm">
          <div className="text-sm text-slate-500">Last Activity</div>
          <div className="text-2xl font-bold">{summary?.lastActivity ? new Date(summary.lastActivity).toLocaleString() : '—'}</div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="font-semibold">Quick actions</h4>
        <div className="mt-2 flex gap-2">
          <input
            value={pingMsg}
            onChange={(e) => setPingMsg(e.target.value)}
            className="flex-1 rounded border px-3 py-2"
          />
          <button
            onClick={handlePing}
            disabled={pinging}
            className="px-3 py-2 rounded bg-emerald-600 text-white"
          >
            {pinging ? 'Sending…' : 'Ping Contractor'}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">Ping sends a WhatsApp message to the contractor phone number.</p>
      </div>

      <div className="mt-6">
        <h4 className="font-semibold">Migrants assigned</h4>
        <div className="mt-3 grid gap-2">
          {patients.length ? (
            patients.map((p) => (
              <div key={p._id} className="rounded border p-3 bg-white flex justify-between items-center">
                <div>
                  <div className="font-semibold">{p.name} <span className="text-sm text-slate-500">({p.age})</span></div>
                  <div className="text-sm text-slate-600">{p.phoneNumber} • {p.district} / {p.village}</div>
                  <div className="text-xs text-slate-500">Chronic: {(p.chronicDiseases || []).slice(0,2).join(', ') || '—'}</div>
                </div>
                <div className="text-right">
                  {p.contagiousAlert?.active ? (
                    <div className="text-red-600 font-semibold">Alert</div>
                  ) : (
                    <div className="text-green-600">OK</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-500">No migrants assigned to this contractor</div>
          )}
        </div>
      </div>
    </div>
  );
}
