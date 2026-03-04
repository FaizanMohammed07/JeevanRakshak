import { Download, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "qrcode/lib/browser";

export default function HealthCard({ patient, onClose }) {
  const { t } = useTranslation();
  const cardRef = useRef(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const qrTarget = useMemo(
    () => `https://motorzan.com/patients/${patient?.phoneNumber || ""}`,
    [patient?.phoneNumber]
  );

  useEffect(() => {
    let isCancelled = false;

    const buildQr = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(qrTarget, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 256,
          color: {
            dark: "#111827",
            light: "#ffffff",
          },
        });

        if (!isCancelled) {
          setQrDataUrl(dataUrl);
        }
      } catch (error) {
        if (!isCancelled) {
          setQrDataUrl("");
        }
        console.error("QR generation failed:", error);
      }
    };

    buildQr();

    return () => {
      isCancelled = true;
    };
  }, [qrTarget]);

  const handleDownload = async () => {
    if (!cardRef.current) return;

    try {
      // Use html2canvas for rendering (you'll need to install it: npm install html2canvas)
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: false,
      });

      // Convert to image and download
      const link = document.createElement("a");
      link.download = `JeevanRakshak_${patient.name?.replace(/\s+/g, "_")}_${patient.phoneNumber}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download card. Please try again.");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        {/* Download Button */}
        <button
          onClick={handleDownload}
          className="absolute -top-12 right-0 flex items-center gap-2 bg-white px-4 py-2 rounded-lg font-semibold text-sky-600 hover:bg-sky-50 transition shadow-lg"
        >
          <Download className="h-5 w-5" />
          {t("Download Card") || "Download Card"}
        </button>

        {/* The Card */}
        <div
          ref={cardRef}
          className="bg-gradient-to-br from-sky-50 via-white to-emerald-50 rounded-3xl shadow-2xl border-2 border-sky-200 overflow-hidden"
        >
          {/* Header Section */}
          <div className="bg-gradient-to-r from-sky-600 to-emerald-500 px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur">
                  <ShieldCheck className="h-10 w-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight">
                    JEEVAN RAKSHAK 360
                  </h1>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/90 mt-1">
                    Kerala Migrant Health System
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-white/80">
                  Health ID
                </p>
                <p className="text-2xl font-bold">
                  {patient.migrant_health_id || patient._id?.slice(-8).toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8">
              {/* Left: Patient Information */}
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">
                    Full Name
                  </p>
                  <h2 className="text-4xl font-bold text-slate-900 mt-1">
                    {patient.name || "N/A"}
                  </h2>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100">
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      Gender
                    </p>
                    <p className="text-lg font-bold text-slate-900 mt-1">
                      {patient.gender || "Prefer not to say"}
                    </p>
                  </div>

                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      Age
                    </p>
                    <p className="text-lg font-bold text-slate-900 mt-1">
                      {patient.age ? `${patient.age} years` : "—"}
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      Blood Group
                    </p>
                    <p className="text-lg font-bold text-slate-900 mt-1">
                      {patient.blood_group || "—"}
                    </p>
                  </div>

                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      Phone
                    </p>
                    <p className="text-lg font-bold text-slate-900 mt-1">
                      {patient.phoneNumber || "—"}
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="bg-gradient-to-r from-sky-50 to-emerald-50 rounded-2xl p-4 border border-sky-100">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    Address
                  </p>
                  <p className="text-sm font-medium text-slate-800 mt-2">
                    {[
                      patient.village,
                      patient.taluk,
                      patient.district,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Address not provided"}
                  </p>
                </div>

                {/* Emergency Contact */}
                {patient.emergencyContact && (
                  <div className="bg-red-50 rounded-2xl p-4 border-2 border-red-200">
                    <p className="text-xs uppercase tracking-wider text-red-600 font-bold">
                      Emergency Contact
                    </p>
                    <p className="text-xl font-bold text-red-900 mt-1">
                      {patient.emergencyContact}
                    </p>
                  </div>
                )}
              </div>

              {/* Right: QR Code and Verification */}
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="bg-white p-6 rounded-3xl shadow-lg border-4 border-sky-200">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Health Card QR Code"
                      className="w-64 h-64 rounded-xl"
                    />
                  ) : (
                    <div className="w-64 h-64 rounded-xl bg-slate-100 flex items-center justify-center text-sm text-slate-500">
                      Generating QR...
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">
                    Scan for Details
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {patient.phoneNumber}
                  </p>
                </div>

                {/* Verification Badge */}
                <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-3 rounded-full shadow-lg">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="text-sm font-bold uppercase tracking-wider">
                      Verified Patient
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-4 text-white">
            <div className="flex items-center justify-between text-xs">
              <p className="uppercase tracking-[0.2em] text-white/70">
                Issued by Kerala Health Department
              </p>
              <p className="font-mono text-white/70">
                ID: {patient._id?.slice(-12).toUpperCase() || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-0 right-0 bg-white text-slate-600 hover:text-slate-900 p-2 rounded-full shadow-lg transform translate-x-4 -translate-y-4"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
