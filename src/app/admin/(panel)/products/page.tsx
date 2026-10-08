import { Plus } from "lucide-react";
import Link from "next/link";
import { Empty, Notice, PageHeader, Panel, StatusBadge, Table } from "@/components/admin/ui";
import { Price } from "@/components/price";
import { ageLabel, getCategory } from "@/lib/catalog";
import { db } from "@/lib/db";
import { thumbnailUrl } from "@/lib/media";
import { requireAdmin } from "@/lib/session";

const FILTERS = ["ALL", "PUBLISHED", "DRAFT", "ARCHIVED"] as const;

export default async function AdminProducts({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = FILTERS.find((f) => f === sp.status) ?? "ALL";
  const products = await db.product.findMany({
    where: status === "ALL" ? {} : { status },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orderItems: { where: { order: { status: "PAID" } } }, downloads: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Products"
        description="Add and edit products, upload PDFs and covers, set prices and status."
        actions={
          <Link href="/admin/products/new" className="btn btn-primary">
            <Plus size={18} /> Add product
          </Link>
        }
      />
      {sp.saved ? <Notice>Product saved.</Notice> : null}
      {sp.deleted ? <Notice>Product deleted.</Notice> : null}
      {sp.archived ? <Notice tone="info">That product has orders, so it was archived (hidden from the store) instead of deleted.</Notice> : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "ALL" ? "/admin/products" : `/admin/products?status=${f}`}
            className={`chip border-2 ${status === f ? "border-primary bg-primary text-white" : "border-line bg-white"}`}
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      <Panel>
        {products.length ? (
          <Table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th className="text-right">Sold</th>
                <th className="text-right">Grants</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const thumb = thumbnailUrl(p.thumbnail);
                const category = getCategory(p.category);
                return (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                        <span className="h-12 w-9 shrink-0 overflow-hidden rounded-lg" style={{ background: category?.tint }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : null}
                        </span>
                        <span>
                          <span className="block font-bold hover:text-primary">{p.title}</span>
                          <span className="text-xs text-muted">
                            {ageLabel(p.ageGroup)}
                            {p.featured ? " · Featured" : ""}
                            {!p.file ? " · No file uploaded" : ""}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="whitespace-nowrap">{category?.short ?? p.category}</td>
                    <td className="whitespace-nowrap">
                      <Price price={p.price} discountPrice={p.discountPrice} />
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="text-right tabular-nums">{p._count.orderItems}</td>
                    <td className="text-right tabular-nums">{p._count.downloads}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <Empty>No products here yet.</Empty>
        )}
      </Panel>
    </>
  );
}
