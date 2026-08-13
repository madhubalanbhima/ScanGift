import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 rounded-full border border-gold/40 text-gold-dark text-xs tracking-[0.25em] uppercase mb-4">
            eGold Voucher Program
          </div>
          <h1 className="font-display text-4xl text-ink">Claim your e-voucher</h1>
          <p className="mt-3 text-charcoal/70">
            Fill in your details once. We&apos;ll send your voucher straight to
            your WhatsApp.
          </p>
        </div>

        <RegisterForm />
      </div>
    </main>
  );
}
