"use client";

import { Images } from "lucide-react";
import PhotoGallery from "@/components/files/PhotoGallery";

export default function FilesPage() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2.5">
          <Images className="w-5 h-5" style={{ color: "#4f46e5" }} />
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>Photos &amp; Files</h1>
        </div>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
          All photos and documents across accounts, properties, jobs, and projects
        </p>
      </div>
      <PhotoGallery recordLevel="global" />
    </div>
  );
}
