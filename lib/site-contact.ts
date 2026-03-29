import { CONTACT } from "@/lib/constants";

export function getSiteContact(settings: Record<string, string> = {}) {
  const phone = settings.contact_phone || settings.SUPPORT_PHONE || CONTACT.phone;
  const phoneRaw = phone.replace(/\D/g, "") || CONTACT.phoneRaw;
  const email = settings.contact_email || settings.SUPPORT_EMAIL || CONTACT.email;
  const address = settings.contact_address || settings.SUPPORT_ADDRESS || CONTACT.address;
  const whatsapp =
    settings.contact_whatsapp ||
    settings.SUPPORT_WHATSAPP ||
    `https://wa.me/${phoneRaw || CONTACT.phoneRaw}`;

  return {
    phone,
    phoneRaw,
    email,
    address,
    whatsapp,
  };
}
