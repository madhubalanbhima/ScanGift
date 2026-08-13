"use client";

import { useState, FormEvent } from "react";
import { FULL_NAME_REGEX, WHATSAPP_REGEX } from "@/lib/validators";

interface FormState {
  fullName: string;
  whatsappNumber: string;
  address: string;
}

interface FormErrors {
  fullName?: string;
  whatsappNumber?: string;
  address?: string;
  form?: string;
}

const initialState: FormState = { fullName: "", whatsappNumber: "", address: "" };

function formatWhatsappDisplay(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  return digits ? `+91 ${digits}` : "+91";
}

export default function RegisterForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [voucherId, setVoucherId] = useState<string | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null);

  function handleFullNameChange(value: string) {
    // Only allow letters, spaces, and dots while typing.
    const filtered = value.replace(/[^A-Za-z. ]/g, "");
    setForm((f) => ({ ...f, fullName: filtered }));
  }

  function handleWhatsappChange(value: string) {
    const filtered = value.replace(/\D/g, "").slice(0, 10);
    setForm((f) => ({ ...f, whatsappNumber: filtered }));
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    const fullName = form.fullName.trim();
    const whatsappNumber = form.whatsappNumber.trim();
    const address = form.address.trim();

    if (!fullName) {
      next.fullName = "Full name is required.";
    } else if (!FULL_NAME_REGEX.test(fullName)) {
      next.fullName =
        "Only letters, single spaces, and dots are allowed (e.g. \"A. B. Nair\").";
    }

    if (!whatsappNumber) {
      next.whatsappNumber = "WhatsApp number is required.";
    } else if (!WHATSAPP_REGEX.test(`91${whatsappNumber}`)) {
      next.whatsappNumber = "Enter a valid Indian WhatsApp number (10 digits).";
    }

    if (!address) {
      next.address = "Address is required.";
    }

    return next;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        whatsappNumber: `91${form.whatsappNumber}`,
      };

      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data?.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ form: data?.message || "Registration failed. Please try again." });
        }
        return;
      }

      setVoucherId(data.voucherId);
      setDeliveryStatus(data.deliveryStatus);
      setForm(initialState);
    } catch (err) {
      setErrors({ form: "Network error. Please check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  }

  if (voucherId) {
    return (
      <div className="ticket-edge bg-card border border-line rounded-2xl shadow-[0_20px_50px_-20px_rgba(24,21,17,0.35)] p-8 text-center">
        <div className="stamp inline-block px-4 py-1 rounded-full border-2 border-gold text-gold-dark font-display text-sm tracking-widest uppercase mb-4">
          Registered
        </div>
        <h2 className="font-display text-2xl text-ink mb-2">
          Your voucher is on its way
        </h2>
        <p className="text-charcoal/70 mb-4">
          Voucher <span className="font-mono text-gold-dark">{voucherId}</span> has
          been generated.{" "}
          {deliveryStatus === "sent"
            ? "It's been sent to your WhatsApp number."
            : "We had trouble delivering it to WhatsApp — our team will follow up."}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="ticket-edge bg-card border border-line rounded-2xl shadow-[0_20px_50px_-20px_rgba(24,21,17,0.35)] p-8 space-y-6"
    >
      {errors.form && (
        <div className="rounded-lg bg-error/10 border border-error/30 text-error text-sm px-4 py-3">
          {errors.form}
        </div>
      )}

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-ink mb-1.5">
          Full name
        </label>
        <input
          id="fullName"
          type="text"
          value={form.fullName}
          onChange={(e) => handleFullNameChange(e.target.value)}
          placeholder="e.g. Anjali S. Nair"
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
          className="w-full rounded-lg border border-line bg-parchment/40 px-4 py-2.5 text-ink placeholder:text-charcoal/40 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition"
        />
        {errors.fullName && (
          <p id="fullName-error" className="mt-1.5 text-sm text-error">
            {errors.fullName}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="whatsappNumber" className="block text-sm font-medium text-ink mb-1.5">
          WhatsApp number
        </label>
        <input
          id="whatsappNumber"
          type="tel"
          inputMode="numeric"
          value={formatWhatsappDisplay(form.whatsappNumber)}
          onChange={(e) => handleWhatsappChange(e.target.value)}
          placeholder="+91 9876543210"
          aria-invalid={!!errors.whatsappNumber}
          aria-describedby={errors.whatsappNumber ? "whatsapp-error" : undefined}
          className="w-full rounded-lg border border-line bg-parchment/40 px-4 py-2.5 text-ink placeholder:text-charcoal/40 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition"
        />
        {errors.whatsappNumber && (
          <p id="whatsapp-error" className="mt-1.5 text-sm text-error">
            {errors.whatsappNumber}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-ink mb-1.5">
          Address
        </label>
        <textarea
          id="address"
          rows={4}
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          placeholder="House name, street, city, PIN code"
          aria-invalid={!!errors.address}
          aria-describedby={errors.address ? "address-error" : undefined}
          className="w-full rounded-lg border border-line bg-parchment/40 px-4 py-2.5 text-ink placeholder:text-charcoal/40 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition resize-none"
        />
        {errors.address && (
          <p id="address-error" className="mt-1.5 text-sm text-error">
            {errors.address}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-gold-foil text-ink font-semibold py-3 tracking-wide hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        {submitting ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}
