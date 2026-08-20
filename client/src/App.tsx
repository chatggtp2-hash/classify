import { useState } from "react";
import { Sidebar, Page } from "./components/Sidebar";
import { DashboardPage } from "./pages/DashboardPage";
import { UploadPage } from "./pages/UploadPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { DocumentDetailsPage } from "./pages/DocumentDetailsPage";
import { PoliciesPage } from "./pages/PoliciesPage";
import { AuditPage } from "./pages/AuditPage";
import { DocumentRecord } from "./types";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  // Bumped whenever data changes, to force dependent pages to refetch.
  const [refreshKey, setRefreshKey] = useState(0);

  function navigate(nextPage: Page) {
    setPage(nextPage);
  }

  function selectDocument(id: string) {
    setSelectedDocId(id);
    setPage("details");
  }

  function handleUploaded(doc: DocumentRecord) {
    setRefreshKey((k) => k + 1);
    setSelectedDocId(doc.id);
  }

  function handleChanged() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="flex h-full">
      <Sidebar activePage={page} onNavigate={navigate} />
      <main className="flex-1 overflow-y-auto">
        {page === "dashboard" && <DashboardPage onNavigate={navigate} refreshKey={refreshKey} />}
        {page === "documents" && <DocumentsPage onSelect={selectDocument} refreshKey={refreshKey} />}
        {page === "upload" && <UploadPage onUploaded={handleUploaded} />}
        {page === "policies" && <PoliciesPage />}
        {page === "audit" && <AuditPage refreshKey={refreshKey} onSelectDocument={selectDocument} />}
        {page === "details" &&
          (selectedDocId ? (
            <DocumentDetailsPage documentId={selectedDocId} onChanged={handleChanged} />
          ) : (
            <div className="p-8">
              <p style={{ color: "var(--text-muted)" }}>No document selected. Go to Documents to pick one.</p>
            </div>
          ))}
      </main>
    </div>
  );
}
