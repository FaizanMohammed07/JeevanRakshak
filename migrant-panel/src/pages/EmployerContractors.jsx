import { useEffect, useState } from "react";
import { useEmployer } from "../context/EmployerContext";
import { linkContractorByPhone, unlinkContractor } from "../api/employers";

export default function EmployerContractors() {
  const { contractors, fetchContractors } = useEmployer();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContractors().catch(() => {});
  }, []);

  const handleLink = async () => {
    setError(null);
    setLoading(true);
    try {
      await linkContractorByPhone(phone);
      await fetchContractors();
      setPhone("");
    } catch (err) {
      setError(err.response?.data?.msg || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (id) => {
    setLoading(true);
    try {
      await unlinkContractor(id);
      await fetchContractors();
    } catch (err) {
      setError(err.response?.data?.msg || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold">Managed Contractors</h3>
      <div className="mt-4">
        <div className="flex gap-2">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Contractor phone"
            className="rounded border px-3 py-2"
          />
          <button
            onClick={handleLink}
            disabled={loading}
            className="bg-sky-600 text-white px-3 py-2 rounded"
          >
            Link
          </button>
        </div>
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </div>

      <div className="mt-6 grid gap-3">
        {contractors?.length ? (
          contractors.map((c) => (
            <div
              key={c._id}
              className="rounded border p-3 flex justify-between items-center"
            >
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-sm text-slate-600">{c.phoneNumber}</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleUnlink(c._id)}
                  className="text-red-600"
                >
                  Unlink
                </button>
                <a
                  href={`/employer/contractors/${c._id}`}
                  className="text-sky-600 underline text-sm"
                >
                  View
                </a>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No contractors linked</p>
        )}
      </div>
    </div>
  );
}
