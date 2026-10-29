import "server-only";

type TwilioMessage = {
  to: string;
  body: string;
  from: string;
};

export async function sendTwilioOtp(phone: string, code: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const smsFrom = process.env.TWILIO_SMS_FROM;
  const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;
  if (!accountSid || !authToken || !smsFrom || !whatsappFrom) {
    throw new Error("Twilio não está configurado.");
  }

  const body = `Seu código Navalha é ${code}. Ele expira em 10 minutos.`;
  await Promise.all([
    sendMessage(accountSid, authToken, {
      to: phone,
      body,
      from: smsFrom,
    }),
    sendMessage(accountSid, authToken, {
      to: `whatsapp:${phone}`,
      body,
      from: `whatsapp:${whatsappFrom}`,
    }),
  ]);
}

async function sendMessage(
  accountSid: string,
  authToken: string,
  message: TwilioMessage,
) {
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(message),
    },
  );
  if (!response.ok) {
    throw new Error(`Twilio recusou o envio (${response.status}).`);
  }
}
