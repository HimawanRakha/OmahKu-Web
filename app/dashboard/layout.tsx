import { Navbar } from "@/components/Navbar";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div className="flex flex-1">
        <DashboardSidebar variant="user" />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </>
  );
}
