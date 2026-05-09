import ReportsLayout from "./reports/layout";
import NewReportPage from "./reports/static-weighbridge/new/page";

export default function HomePage() {
  return (
    <ReportsLayout>
      <NewReportPage />
    </ReportsLayout>
  );
}
