import { ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { deleteProduct } from "../../actions";
import { ProductForm } from "../product-form";

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const product = await db.product.findUnique({ where: { id: (await params).id } });
  if (!product) notFound();
  const sold = await db.orderItem.count({ where: { productId: product.id } });

  return (
    <>
      <PageHeader
        title="Edit product"
        description={`${sold} order${sold === 1 ? "" : "s"} include this product.`}
        actions={
          <>
            {product.status === "PUBLISHED" ? (
              <Link href={`/product/${product.slug}`} target="_blank" className="btn btn-outline">
                <ExternalLink size={16} /> View in store
              </Link>
            ) : null}
            <form action={deleteProduct}>
              <input type="hidden" name="id" value={product.id} />
              <ConfirmButton
                message={sold ? "Archive this product? It will be hidden from the store; past orders keep working." : "Delete this product permanently?"}
                className="btn btn-outline text-coral-ink hover:!border-coral-ink hover:!text-coral-ink"
              >
                <Trash2 size={16} /> {sold ? "Archive" : "Delete"}
              </ConfirmButton>
            </form>
          </>
        }
      />
      <ProductForm product={product} />
    </>
  );
}
