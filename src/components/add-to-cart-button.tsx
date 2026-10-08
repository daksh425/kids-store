"use client";

import { Check, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart, type CartItem } from "@/lib/client/cart";
import { track } from "@/lib/client/track";

export function AddToCartButton({
  item,
  variant = "full",
  className = "",
}: {
  item: CartItem;
  variant?: "full" | "icon";
  className?: string;
}) {
  const cart = useCart();
  const inCart = cart.has(item.id);

  if (inCart) {
    return variant === "icon" ? (
      <Link href="/cart" className={`btn btn-sm btn-outline !px-2.5 text-mint-ink ${className}`} aria-label={`${item.title} is in your cart`}>
        <Check size={18} />
      </Link>
    ) : (
      <Link href="/cart" className={`btn btn-outline ${className}`}>
        <Check size={18} className="text-mint-ink" /> In cart: view cart
      </Link>
    );
  }

  const add = () => {
    cart.add(item);
    track("add_to_cart", item.id, { currency: "INR", value: item.price, items: [{ item_id: item.id, item_name: item.title }] });
  };

  return variant === "icon" ? (
    <button type="button" onClick={add} className={`btn btn-sm btn-outline !px-2.5 ${className}`} aria-label={`Add ${item.title} to cart`}>
      <ShoppingCart size={18} />
    </button>
  ) : (
    <button type="button" onClick={add} className={`btn btn-outline ${className}`}>
      <ShoppingCart size={18} /> Add to cart
    </button>
  );
}
