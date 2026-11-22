import { AdminBar } from "@/components/admin/admin-bar";

export default function AdminVendorsLayout({ children }: LayoutProps<"/admin/vendors">) {
  return (
    <>
      <AdminBar />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">{children}</div>
    </>
  );
}
