"use client";

import { useState, FormEvent } from "react";
import { FULL_NAME_REGEX, WHATSAPP_REGEX } from "@/lib/validators";

interface FormState {
  fullName: string;
  whatsappNumber: string;
  address: string;
  pincode: string;  
}

interface FormErrors {
  fullName?: string;
  whatsappNumber?: string;
  address?: string;
  pincode?: string;
  form?: string;
}

const initialState: FormState = { fullName: "", whatsappNumber: "", address: "", pincode: "" };

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

  function handlePincodeChange(value: string) {
    const filtered = value.replace(/\D/g, "").slice(0, 6);
    setForm((f) => ({ ...f, pincode: filtered }));
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    const fullName = form.fullName.trim();
    const whatsappNumber = form.whatsappNumber.trim();
    const address = form.address.trim();
    const pincode = form.pincode.trim();

    if (!fullName) {
      next.fullName = "Full name is required.";
    } else if (!FULL_NAME_REGEX.test(fullName)) {
      next.fullName =
        "Only letters, single spaces, and dots are allowed (e.g. \"A. John doe\").";
    }

    if (!whatsappNumber) {
      next.whatsappNumber = "WhatsApp number is required.";
    } else if (!WHATSAPP_REGEX.test(`91${whatsappNumber}`)) {
      next.whatsappNumber = "Enter a valid Indian WhatsApp number (10 digits).";
    }

    if (!address) {
      next.address = "Address is required.";
    }

    if (!pincode) {
      next.pincode = "Pincode is required.";
    } else if (!/^\d{6}$/.test(pincode)) {
      next.pincode = "Pincode must be a 6-digit number.";
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
        pincode: form.pincode.trim(),
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
    const burstPieces = [
      { x: -70, y: -110, rot: "-20deg", color: "#d4ad5a" },
      { x: -20, y: -140, rot: "18deg", color: "#edc86c" },
      { x: 30, y: -126, rot: "42deg", color: "#a55a2a" },
      { x: 86, y: -96, rot: "-38deg", color: "#f3d88d" },
      { x: 110, y: -30, rot: "24deg", color: "#d4ad5a" },
      { x: 108, y: 34, rot: "-14deg", color: "#eb9d35" },
      { x: 72, y: 96, rot: "28deg", color: "#ffefb0" },
      { x: 0, y: 120, rot: "-46deg", color: "#d4ad5a" },
      { x: -84, y: 92, rot: "16deg", color: "#a55a2a" },
      { x: -118, y: 30, rot: "31deg", color: "#f3d88d" },
      { x: -110, y: -30, rot: "-24deg", color: "#c58b24" },
      { x: 0, y: -80, rot: "-18deg", color: "#edd8a7" },
      { x: 65, y: -28, rot: "-55deg", color: "#e5b95c" },
      { x: -60, y: 58, rot: "42deg", color: "#d0622f" },
      { x: 24, y: 64, rot: "-32deg", color: "#f4d785" },
      { x: -24, y: -12, rot: "68deg", color: "#b47331" },
    ];

    return (
      <div className="ticket-edge bg-card border border-line rounded-2xl shadow-[0_20px_50px_-20px_rgba(24,21,17,0.35)] p-8 text-center relative overflow-hidden">
        <div className="paper-burst" aria-hidden="true">
          {burstPieces.map((piece, index) => (
            <span
              key={index}
              className="paper-piece"
              style={{
                ["--x" as any]: `${piece.x}px`,
                ["--y" as any]: `${piece.y}px`,
                ["--rot" as any]: piece.rot,
                ["--paper-color" as any]: piece.color,
              }}
            />
          ))}
        </div>
        <div className="stamp inline-block px-4 py-1 rounded-full border-2 border-gold text-gold-dark font-display text-sm tracking-widest uppercase mb-4 relative z-10">
          Registered
        </div>
        <h2 className="font-display text-2xl text-ink mb-2 relative z-10">
          Your voucher is on its way
        </h2>
        <p className="text-charcoal/70 mb-4 relative z-10">
          Voucher <span className="font-mono text-gold-dark">{voucherId}</span> has
          been generated. {" "}
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
          placeholder="e.g. John Doe"
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
        <div className="flex items-center gap-2 rounded-lg bg-parchment/40 px-4 py-2.5 transition focus-within:ring-1 focus-within:ring-gold">
          <span className="shrink-0 text-ink font-medium">+91</span>
          <input
            id="whatsappNumber"
            type="tel"
            inputMode="numeric"
            value={form.whatsappNumber}
            onChange={(e) => handleWhatsappChange(e.target.value)}
            placeholder="9876543210"
            aria-invalid={!!errors.whatsappNumber}
            aria-describedby={errors.whatsappNumber ? "whatsapp-error" : undefined}
            className="w-full"
          />
        </div>
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

      <div>
        <label htmlFor="pincode" className="block text-sm font-medium text-ink mb-1.5">
          Pincode
        </label>
        <input
          id="pincode"
          type="tel"
          inputMode="numeric"
          maxLength={6}
          value={form.pincode}
          onChange={(e) => handlePincodeChange(e.target.value)}
          placeholder="e.g. 560001"
          aria-invalid={!!errors.pincode}
          aria-describedby={errors.pincode ? "pincode-error" : undefined}
          className="w-full rounded-lg border border-line bg-parchment/40 px-4 py-2.5 text-ink placeholder:text-charcoal/40 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition"
        />
        {errors.pincode && (
          <p id="pincode-error" className="mt-1.5 text-sm text-error">
            {errors.pincode}
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
