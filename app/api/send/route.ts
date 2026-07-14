import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { batch, subject, htmlTemplate, attachments } = body;

    if (!batch || !Array.isArray(batch)) {
      return NextResponse.json(
        { error: "Lote de e-mails inválido ou ausente." },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: (process.env.SMTP_HOST || "smtp.ethereal.email").trim(),
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: (process.env.SMTP_USER || "").trim(),
        pass: (process.env.SMTP_PASS || "").trim(),
      },
    });

  const results = [];

  // Enviar cada e-mail do lote
  for (const recipient of batch) {
    let email = "";
    let nome = "";

    if (typeof recipient === "string") {
      email = recipient;
      nome = recipient.split("@")[0]; // Fallback para nome
    } else if (typeof recipient === "object" && recipient.email) {
      email = recipient.email;
      nome = recipient.nome || recipient.email.split("@")[0];
    }

    if (!email) {
      results.push({ email: "Desconhecido", status: "error", message: "E-mail inválido" });
      continue;
    }

    // Substituição de variáveis
    let finalHtml = htmlTemplate || "";
    if (finalHtml) {
      finalHtml = finalHtml.replace(/\{\{nome\}\}/g, nome);
      finalHtml = finalHtml.replace(/\{\{email\}\}/g, email);
    }

    try {
      await transporter.sendMail({
        from: `"Enviador" <${process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@example.com"}>`,
        to: email,
        subject: subject,
        html: finalHtml,
        attachments: attachments || [],
      });
      results.push({ email, status: "success" });
    } catch (error: any) {
      results.push({ email, status: "error", message: error.message || "Erro SMTP" });
    }
  }

  return NextResponse.json({ success: true, results });
} catch (error: any) {
  console.error("Erro na rota de envio:", error);
  return NextResponse.json(
    { error: "Erro interno no servidor." },
    { status: 500 }
  );
}
}
