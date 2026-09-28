// Pure constants, safe to import from client components.

export const ORDER_STEPS = ["CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;
export const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Payment Pending", PAYMENT_FAILED: "Payment Failed", CONFIRMED: "Confirmed", SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery", DELIVERED: "Delivered", CANCELLED: "Cancelled", PAID: "Paid",
};

export const NEXT_STATUS: Record<string, string[]> = {
  CONFIRMED: ["SHIPPED", "CANCELLED"], SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED"], OUT_FOR_DELIVERY: ["DELIVERED"],
  PENDING_PAYMENT: ["CANCELLED"], PAYMENT_FAILED: ["CANCELLED"],
};
