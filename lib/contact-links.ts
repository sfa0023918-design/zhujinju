function normalizePhoneValue(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("00")) {
    return `+${trimmed.slice(2).replace(/[^\d]/g, "")}`;
  }

  if (trimmed.startsWith("+")) {
    return `+${trimmed.slice(1).replace(/[^\d]/g, "")}`;
  }

  return trimmed.replace(/[^\d]/g, "");
}

export function getTelHref(value: string) {
  const normalized = normalizePhoneValue(value);
  return normalized ? `tel:${normalized}` : null;
}

export function getWhatsAppHref(value: string) {
  const normalized = normalizePhoneValue(value);

  if (!normalized) {
    return null;
  }

  return `https://wa.me/${normalized.replace(/^\+/, "")}`;
}
