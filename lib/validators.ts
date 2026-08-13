// Letters and spaces, with single spaces and dots allowed (for initials, e.g. "A. B. Nair").
// Disallows leading/trailing/double spaces or dots and any digits/special characters.
export const FULL_NAME_REGEX = /^[A-Za-z]+(?:[ .][A-Za-z]+)*\.?$/;

// Digits only, 7–15 characters (covers international WhatsApp numbers with country code).
export const WHATSAPP_REGEX = /^[0-9]{7,15}$/;

export interface RegistrationInput {
  fullName: string;
  whatsappNumber: string;
  address: string;
}

export interface ValidationErrors {
  fullName?: string;
  whatsappNumber?: string;
  address?: string;
}

export function validateRegistration(
  input: Partial<RegistrationInput>
): ValidationErrors {
  const errors: ValidationErrors = {};

  const fullName = (input.fullName ?? "").trim();
  const whatsappNumber = (input.whatsappNumber ?? "").trim();
  const address = (input.address ?? "").trim();

  if (!fullName) {
    errors.fullName = "Full name is required.";
  } else if (!FULL_NAME_REGEX.test(fullName)) {
    errors.fullName =
      "Full name can only contain letters, single spaces, and dots (for initials).";
  }

  if (!whatsappNumber) {
    errors.whatsappNumber = "WhatsApp number is required.";
  } else if (!WHATSAPP_REGEX.test(whatsappNumber)) {
    errors.whatsappNumber = "WhatsApp number must contain digits only (7–15 digits).";
  }

  if (!address) {
    errors.address = "Address is required.";
  }

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
