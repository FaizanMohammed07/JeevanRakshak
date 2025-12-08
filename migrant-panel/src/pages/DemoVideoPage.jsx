import React from "react";
import { PlayCircle } from "lucide-react";
import { useTranslation } from "react-i18next";


export default function DemoVideoPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">
        {t("app.idDemoVideo")}
      </h1>

      <div className="rounded-xl overflow-hidden shadow-lg border border-sky-100">
        <div className="aspect-video">
          <iframe
            className="w-full h-full"
            src="/videos/Migrantvideo.mp4"
            title="Tutorial Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          ></iframe>
        </div>
      </div>

      <p className="text-sm text-slate-600 mt-3">
        {t("help.watchTutorial")}
      </p>
    </div>
  );
}
