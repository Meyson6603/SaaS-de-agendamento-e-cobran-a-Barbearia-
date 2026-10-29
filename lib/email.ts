import "server-only";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail(input: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (process.env.OTP_DEV_MODE === "true") {
    console.info(`[OTP_DEV_MODE] E-mail enviado para ${input.to}: ${input.text}`);
    return;
  }

  if (!apiKey || !from) {
    throw new Error("E-mail transacional não está configurado.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`O provedor de e-mail recusou o envio (${response.status}).`);
  }
}
