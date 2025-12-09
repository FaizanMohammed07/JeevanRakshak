import twilio from "twilio";

// export const sendWhatsAppMessage = async (to, message) => {
//   const client = twilio(
//     process.env.TWILIO_ACCOUNT_SID,
//     process.env.TWILIO_AUTH_TOKEN
//   );

//   try {
//     await client.messages.create({
//       from: process.env.TWILIO_WHATSAPP_NUMBER,
//       to: `whatsapp:${to}`,
//       body: message,
//     });

//     console.log("WhatsApp message sent to", to);
//     return true;
//   } catch (err) {
//     console.error("WhatsApp send error:", err.message);
//     return false;
//   }
// };

export const sendWhatsAppMessage = async (to, message) => {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  const recipient = normalizeToWhatsAppUri(to, { defaultCountryCode: "91" });
  if (!recipient) {
    console.error("WhatsApp send error: invalid recipient", to);
    return false;
  }

  const from = normalizeToWhatsAppUri(process.env.TWILIO_WHATSAPP_NUMBER);
  if (!from) {
    console.error(
      "WhatsApp send error: invalid from number",
      process.env.TWILIO_WHATSAPP_NUMBER
    );
    return false;
  }

  try {
    await client.messages.create({
      from,
      to: recipient,
      body: message,
    });

    console.log("WhatsApp sent:", recipient);
    return true;
  } catch (err) {
    console.error("WhatsApp send error:", err.message);
    return false;
  }
};

const normalizeToWhatsAppUri = (value, { defaultCountryCode } = {}) => {
  if (!value) return null;
  const digits = value.toString().replace(/[^0-9]/g, "");
  if (!digits.length) return null;
  const formatted = digits.startsWith("91")
    ? `+${digits}`
    : defaultCountryCode
    ? `+${defaultCountryCode}${digits}`
    : `+${digits}`;
  return `whatsapp:${formatted}`;
};
