"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { Page } from "components/shared/Page";
import { Button, Card, Input } from "components/ui";
import axios from "utils/axios";
import { toast } from "sonner";
import { useAuthContext } from "app/contexts/auth/context";

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: user?.email || "",
    customer_phone: "",
    delivery_address: "",
    delivery_area: "inside_dhaka",
    apply_reseller_price: false,
  });

  useEffect(() => {
    const savedCart = localStorage.getItem("shop_cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      router.push("/shop/cart");
    }
  }, [router]);

  const calculateTotals = () => {
    let subtotal = 0;
    let deliveryCharge = 0;
    let vatAmount = 0;

    cart.forEach((item) => {
      const price = item.reseller_price || item.effective_price || item.price;
      subtotal += price * item.quantity;

      // Calculate delivery charge
      if (formData.delivery_area === "inside_dhaka" && item.delivery_charge_inside_dhaka) {
        deliveryCharge += parseFloat(item.delivery_charge_inside_dhaka);
      } else if (
        formData.delivery_area === "outside_dhaka" &&
        item.delivery_charge_outside_dhaka
      ) {
        deliveryCharge += parseFloat(item.delivery_charge_outside_dhaka);
      }

      // Calculate VAT
      const itemVat = item.vat || 0;
      vatAmount += (price * item.quantity * itemVat) / 100;
    });

    const total = subtotal + deliveryCharge + vatAmount;

    return { subtotal, deliveryCharge, vatAmount, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderItems = cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        reseller_price: item.reseller_price || null,
      }));

      const orderData = {
        items: orderItems,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        delivery_address: formData.delivery_address,
        delivery_area: formData.delivery_area,
        apply_reseller_price: formData.apply_reseller_price,
      };

      const response = await axios.post("/api/vendors/orders/", orderData);

      // Clear cart
      localStorage.removeItem("shop_cart");
      setCart([]);

      setOrderNumber(response.data.order_number);
      setOrderPlaced(true);

      toast.success("Order placed successfully!");
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(
        error.response?.data?.detail ||
          "Failed to place order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  if (orderPlaced) {
    return (
      <Page title="Order Placed">
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-20"></div>
            <div className="relative rounded-full bg-gradient-to-br from-green-100 to-emerald-100 p-8 dark:from-green-900/30 dark:to-emerald-900/30">
              <CheckCircleIcon className="size-20 text-green-600 dark:text-green-400 sm:size-24" />
            </div>
          </div>
          <h2 className="mt-8 text-2xl font-bold text-gray-900 dark:text-dark-50 sm:text-4xl">
            Order Placed Successfully! 🎉
          </h2>
          <div className="mt-4 rounded-xl bg-gradient-to-r from-primary-50 to-purple-50 px-6 py-3 dark:from-primary-900/20 dark:to-purple-900/20">
            <p className="text-center text-base font-semibold text-gray-700 dark:text-dark-300">
              Order Number: <span className="text-primary-600 dark:text-primary-400">{orderNumber}</span>
            </p>
          </div>
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-dark-400 sm:text-base">
            We've sent a confirmation email to <br />
            <span className="font-semibold">{formData.customer_email}</span>
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => router.push("/shop/orders")}
              className="w-full rounded-xl px-8 py-3 text-base font-semibold shadow-lg sm:w-auto"
              color="primary"
              size="lg"
            >
              View Orders
            </Button>
            <Button
              onClick={() => router.push("/shop")}
              className="w-full rounded-xl border-2 px-8 py-3 text-base font-semibold sm:w-auto"
              variant="outlined"
              size="lg"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </Page>
    );
  }

  if (cart.length === 0) {
    return (
      <Page title="Checkout">
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <p className="text-gray-600 dark:text-dark-300">
            Your cart is empty
          </p>
          <Button
            onClick={() => router.push("/shop")}
            className="mt-4"
            color="primary"
          >
            Continue Shopping
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Checkout">
      <div className="space-y-4 sm:space-y-6">
        <Button
          onClick={() => router.back()}
          variant="outlined"
          size="sm"
          className="rounded-xl border-2"
        >
          <ArrowLeftIcon className="mr-2 size-4" />
          Back
        </Button>

        {/* Header with gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-500 to-purple-600 p-6 text-white shadow-lg sm:p-8">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
              Checkout
            </h1>
            <p className="mt-2 text-sm text-primary-50 sm:text-base">
              Complete your order and we'll get it ready for you
            </p>
          </div>
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Order Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Customer Information */}
            <Card className="border-2 border-gray-100 p-4 shadow-md dark:border-dark-600 sm:p-6">
              <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-dark-50 sm:text-xl">
                Customer Information
              </h2>
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  required
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                  className="rounded-xl border-2"
                />
                <Input
                  label="Email"
                  type="email"
                  required
                  value={formData.customer_email}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_email: e.target.value })
                  }
                  className="rounded-xl border-2"
                />
                <Input
                  label="Phone Number"
                  required
                  value={formData.customer_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_phone: e.target.value })
                  }
                  className="rounded-xl border-2"
                />
              </div>
            </Card>

            {/* Delivery Information */}
            <Card className="border-2 border-gray-100 p-4 shadow-md dark:border-dark-600 sm:p-6">
              <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-dark-50 sm:text-xl">
                Delivery Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-dark-300">
                    Delivery Area
                  </label>
                  <select
                    value={formData.delivery_area}
                    onChange={(e) =>
                      setFormData({ ...formData, delivery_area: e.target.value })
                    }
                    className="h-11 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-sm font-medium transition-all focus:border-primary-500 focus:outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-dark-50"
                    required
                  >
                    <option value="inside_dhaka">Inside Dhaka</option>
                    <option value="outside_dhaka">Outside Dhaka</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-dark-300">
                    Delivery Address
                  </label>
                  <textarea
                    value={formData.delivery_address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        delivery_address: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium transition-all focus:border-primary-500 focus:outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-dark-50"
                    required
                  />
                </div>
              </div>
            </Card>

            {/* Reseller Price Option */}
            {cart.some((item) => item.reseller_price || item.reseller_mrp_price) && (
              <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 dark:border-green-800 dark:from-green-900/20 dark:to-emerald-900/20 sm:p-6">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.apply_reseller_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        apply_reseller_price: e.target.checked,
                      })
                    }
                    className="size-5 rounded border-2 border-green-300 text-primary-600 focus:ring-2 focus:ring-green-500 dark:border-green-700"
                  />
                  <div>
                    <span className="text-sm font-bold text-green-800 dark:text-green-400 sm:text-base">
                      Apply Reseller Pricing
                    </span>
                    <p className="mt-1 text-xs text-green-700 dark:text-green-500">
                      Use reseller prices for items where available
                    </p>
                  </div>
                </label>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-purple-50 p-4 shadow-xl dark:border-primary-800 dark:from-dark-700 dark:to-dark-800 sm:p-6">
              <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-dark-50 sm:text-xl">
                Order Summary
              </h2>

              <div className="space-y-2 border-b-2 border-primary-200 pb-4 dark:border-primary-800">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs sm:text-sm">
                    <span className="flex-1 pr-2 font-medium text-gray-700 dark:text-dark-300">
                      {item.title} <span className="text-gray-500">x{item.quantity}</span>
                    </span>
                    <span className="font-bold text-gray-900 dark:text-dark-50">
                      ৳
                      {(
                        (item.reseller_price ||
                          item.effective_price ||
                          item.price) *
                        item.quantity
                      ).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2 border-b-2 border-primary-200 pb-4 dark:border-primary-800">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-700 dark:text-dark-300">Subtotal</span>
                  <span className="font-bold text-gray-900 dark:text-dark-50">
                    ৳{totals.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-700 dark:text-dark-300">
                    Delivery Charge
                  </span>
                  <span className="font-bold text-gray-900 dark:text-dark-50">
                    ৳{totals.deliveryCharge.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-700 dark:text-dark-300">VAT</span>
                  <span className="font-bold text-gray-900 dark:text-dark-50">
                    ৳{totals.vatAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-xl font-bold sm:text-2xl">
                  <span className="text-gray-900 dark:text-dark-50">Total</span>
                  <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                    ৳{totals.total.toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 py-3 text-base font-bold shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50"
                size="lg"
                disabled={loading}
              >
                {loading ? "Placing Order..." : "Place Order"}
              </Button>
            </Card>
          </div>
        </form>
      </div>
    </Page>
  );
}

