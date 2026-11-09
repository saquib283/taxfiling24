import { CONTACT } from "@/lib/constants";
import { normalizePhoneNumber } from "./whatsapp-shared";

export function getSiteContact(settings: Record<string, string> = {}) {
  const phone = settings.contact_phone || settings.SUPPORT_PHONE || CONTACT.phone;
  const phoneRaw = phone.replace(/\D/g, "") || CONTACT.phoneRaw;
  const email = settings.contact_email || settings.SUPPORT_EMAIL || CONTACT.email;
  const address = settings.contact_address || settings.SUPPORT_ADDRESS || CONTACT.address;

  const configuredWa =
    settings.contact_whatsapp ||
    settings.SUPPORT_WHATSAPP ||
    process.env.WHATSAPP_PHONE_NUMBER;

  let whatsapp = `https://wa.me/${phoneRaw || CONTACT.phoneRaw}`;
  if (configuredWa) {
    if (configuredWa.startsWith("http")) {
      whatsapp = configuredWa;
    } else {
      const cleanWa = normalizePhoneNumber(configuredWa);
      if (cleanWa) {
        whatsapp = `https://wa.me/${cleanWa}`;
      }
    }
  }

  return {
    phone,
    phoneRaw,
    email,
    address,
    whatsapp,
  };
}
