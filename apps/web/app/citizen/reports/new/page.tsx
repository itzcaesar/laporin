// ── app/citizen/reports/new/page.tsx ──
// New report form page (no layout wrapper)

import { ReportForm } from "@/components/sections/ReportForm";

// This page should not use the citizen layout
export default function NewReportPage() {
  return <ReportForm />;
}
