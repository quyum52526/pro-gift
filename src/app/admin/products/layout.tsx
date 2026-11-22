import { AdminBar } from "@/components/admin/admin-bar";

export default function AdminProductsLayout({ children }: LayoutProps<"/admin/products">) {
  return (
    <>
      <AdminBar />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">{children}</div>
    </>
  );
}
