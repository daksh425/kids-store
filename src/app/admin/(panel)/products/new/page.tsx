import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/session";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Add product" actions={<Link href="/admin/products" className="btn btn-outline">Cancel</Link>} />
      <ProductForm
        product={{
          title: "",
          slug: "",
          shortDescription: "",
          description: "",
          category: "ebooks",
          ageGroup: "4-6",
          price: 99,
          discountPrice: null,
          pages: null,
          format: "PDF",
          includes: [],
          featured: false,
          status: "DRAFT",
          thumbnail: null,
          file: null,
          fileName: null,
          fileSize: null,
        }}
      />
    </>
  );
}
