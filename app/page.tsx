"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

import { parseJson } from "@/lib/parseJson";
import { startSendingEmails } from "@/lib/sendEmails";
import { SendResult } from "@/types/email";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const formSchema = z.object({
  subject: z.string().min(1, "O assunto é obrigatório."),
  jsonInput: z.string().min(1, "Insira os destinatários."),
  batchSize: z.number().min(1, "O lote mínimo é 1."),
  intervalSeconds: z.number().min(0, "O intervalo não pode ser negativo."),
});

export default function Home() {
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [logs, setLogs] = useState<SendResult[]>([]);
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "E-mail de Teste - Enviador MVP",
      jsonInput: `[
  {
    "nome": "Larissa",
    "email": "larissaamca@gmail.com"
  }
]`,
      batchSize: 100,
      intervalSeconds: 30,
    },
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Olá {{nome}},</p><p>Este é um e-mail de teste enviado pela nossa nova ferramenta.</p><p>Se você recebeu isso, a integração com o Gmail está funcionando perfeitamente! 🎉</p>",
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImage = {
            name: file.name,
            url: event.target.result as string,
          };
          setImages((prev) => [...prev, newImage]);

          // Opcionalmente inserir a imagem no Tiptap
          // Mas vamos deixar apenas o upload lateral para o usuário arrastar ou vamos usar tiptap-image se precisasse.
          // O escopo diz "As imagens deverão ser incorporadas automaticamente ao HTML do e-mail".
          // Vamos adicionar no final do HTML na hora do envio.
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const recipients = parseJson(values.jsonInput);

    if (!recipients) {
      alert("JSON de destinatários inválido.");
      return;
    }

    if (!editor) return;

    let finalHtml = editor.getHTML();
    const attachments: { filename: string; path: string; cid: string }[] = [];

    // Incorporar imagens no final do HTML usando CID para suporte no Gmail
    if (images.length > 0) {
      finalHtml += "<br/><br/>";
      images.forEach((img, i) => {
        const cid = `img_${i}_${Date.now()}@enviador`;
        finalHtml += `<img src="cid:${cid}" alt="${img.name}" style="max-width:100%;" /><br/>`;
        attachments.push({
          filename: img.name,
          path: img.url,
          cid: cid
        });
      });
    }

    setTotal(recipients.length);
    setProgress(0);
    setLogs([]);
    setIsSending(true);

    await startSendingEmails({
      subject: values.subject,
      recipients: recipients,
      htmlTemplate: finalHtml,
      attachments: attachments,
      batchSize: values.batchSize,
      intervalSeconds: values.intervalSeconds,
      onProgress: (sentCount, results) => {
        setProgress(sentCount);
        setLogs((prev) => [...prev, ...results]);
      },
      onFinish: () => {
        setIsSending(false);
      },
      onError: (error) => {
        setIsSending(false);
        alert(error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto space-y-10">
        <header className="space-y-2 border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Disparador de E-mails em Massa</h1>
          <p className="text-gray-500 text-lg">Envio de e-mails em massa de forma simples e direto.</p>
        </header>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-3">
            <Label className="text-gray-900 font-semibold text-base">Assunto</Label>
            <Input
              placeholder="Ex: Mentoria Faculdade & Primeiro Estágio"
              className="bg-white border-gray-300 text-gray-900 shadow-sm"
              {...form.register("subject")}
            />
            {form.formState.errors.subject && (
              <p className="text-red-500 text-sm">{form.formState.errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-gray-900 font-semibold text-base">Lista de Emails (JSON)</Label>
              <p className="text-gray-500 text-sm">Cole o array de e-mails em formato simples ou com nome.</p>
            </div>
            <Textarea
              placeholder={'[\n  "joao@gmail.com",\n  "maria@gmail.com"\n]'}
              className="min-h-[150px] bg-white border-gray-300 text-gray-900 font-mono text-sm shadow-sm"
              {...form.register("jsonInput")}
            />
            {form.formState.errors.jsonInput && (
              <p className="text-red-500 text-sm">{form.formState.errors.jsonInput.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-gray-900 font-semibold text-base">Mensagem (Editor HTML)</Label>
              <p className="text-gray-500 text-sm">Variáveis disponíveis: {"{{nome}} e {{email}}"}</p>
            </div>
            <div className="border border-gray-300 rounded-md bg-white p-3 text-gray-900 min-h-[200px] prose max-w-none shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
              <EditorContent editor={editor} />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-gray-900 font-semibold text-base">Imagens anexadas</Label>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="bg-white border-gray-300 text-gray-900 w-fit cursor-pointer file:text-gray-700 shadow-sm"
            />
            {images.length > 0 && (
              <ul className="space-y-1 mt-2">
                {images.map((img, i) => (
                  <li key={i} className="flex items-center space-x-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>{img.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-gray-900 font-semibold text-base">Quantidade por lote</Label>
              <Input
                type="number"
                className="bg-white border-gray-300 text-gray-900 shadow-sm"
                {...form.register("batchSize", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-gray-900 font-semibold text-base">Intervalo (segundos)</Label>
              <Input
                type="number"
                className="bg-white border-gray-300 text-gray-900 shadow-sm"
                {...form.register("intervalSeconds", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isSending}
              className="w-full h-12 text-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md rounded-md"
            >
              {isSending ? "Enviando..." : "Enviar Emails"}
            </Button>
          </div>
        </form>

        {(isSending || logs.length > 0) && (
          <div className="space-y-6 pt-8 border-t border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 font-medium">
                <span>Progresso do Envio</span>
                <span>{progress} / {total}</span>
              </div>
              <Progress value={total > 0 ? (progress / total) * 100 : 0} className="h-3 bg-gray-200" />
            </div>

            <div className="space-y-3">
              <Label className="text-gray-900 font-semibold text-base">Logs de Envio</Label>
              <ScrollArea className="h-[250px] w-full rounded-md border border-gray-200 bg-gray-50 p-4 shadow-inner">
                <div className="space-y-2">
                  {logs.map((log, i) => (
                    <div key={i} className="flex items-center space-x-2 text-sm">
                      {log.status === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      )}
                      <span className="text-gray-900 font-medium">{log.email}</span>
                      {log.message && <span className="text-gray-500">- {log.message}</span>}
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <p className="text-gray-500 text-sm italic">Aguardando início dos envios...</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
