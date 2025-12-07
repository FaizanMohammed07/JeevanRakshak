import twilio from "twilio";

export const sendWhatsAppMessage = async (to, message) => {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`,
      body: message,
    });

    console.log("WhatsApp message sent to", to);
    return true;
  } catch (err) {
    console.error("WhatsApp send error:", err.message);
    return false;
  }
};
