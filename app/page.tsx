"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

import Papa from "papaparse";
import * as XLSX from "xlsx";

import { parseJson } from "@/lib/parseJson";
import { startSendingEmails } from "@/lib/sendEmails";
import { SendResult } from "@/types/email";
import { AlertCircle, CheckCircle2, GripVertical, Image as ImageIcon, Type, Link as LinkIcon, Trash2, ArrowUp, ArrowDown, Upload } from "lucide-react";

type Align = "left" | "center" | "right";

export type ImageBlock = {
  id: string;
  type: "image";
  imageSource: "url" | "upload";
  url: string;
  fileData?: string;
  fileName?: string;
  alt: string;
  align: Align;
};

export type TextBlock = {
  id: string;
  type: "text";
  content: string;
  align: Align;
};

export type ButtonBlock = {
  id: string;
  type: "button";
  text: string;
  url: string;
  align: Align;
  backgroundColor: string;
  textColor: string;
};

export type EmailBlock = ImageBlock | TextBlock | ButtonBlock;

const formSchema = z.object({
  subject: z.string().min(1, "O assunto é obrigatório."),
  jsonInput: z.string().min(1, "Insira os destinatários."),
  batchSize: z.number().min(1, "O lote mínimo é 1."),
  intervalSeconds: z.number().min(0, "O intervalo não pode ser negativo."),
});

// A component for editing a single Text Block with Tiptap
function TextEditor({ content, onChange }: { content: string, onChange: (val: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      TextStyle,
      Color,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="border border-gray-300 rounded-md bg-white p-2 text-gray-900 min-h-[100px] prose max-w-none shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
      <EditorContent editor={editor} />
    </div>
  );
}

export default function Home() {
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [logs, setLogs] = useState<SendResult[]>([]);
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const logsSectionRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "Assunto do e-mail",
      jsonInput: `[\n  {\n    "nome": "Larissa",\n    "email": "larissaamca@gmail.com"\n  }\n]`,
      batchSize: 100,
      intervalSeconds: 30,
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data.map((row: any) => ({
            nome: row.nome || row.Nome || row.name || row.Name || "",
            email: row.email || row.Email || ""
          })).filter((item: any) => item.email);
          form.setValue('jsonInput', JSON.stringify(data, null, 2), { shouldValidate: true });
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        const formattedData = json.map((row: any) => ({
            nome: row.nome || row.Nome || row.name || row.Name || "",
            email: row.email || row.Email || ""
        })).filter((item: any) => item.email);
        form.setValue('jsonInput', JSON.stringify(formattedData, null, 2), { shouldValidate: true });
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Formato de arquivo não suportado. Por favor envie CSV ou Excel (.xlsx, .xls).");
    }
  };

  const addBlock = (type: EmailBlock["type"]) => {
    const newId = Math.random().toString(36).substring(7);
    let newBlock: EmailBlock;
    
    if (type === "image") {
      newBlock = { id: newId, type: "image", imageSource: "url", url: "", alt: "", align: "center" };
    } else if (type === "text") {
      newBlock = { id: newId, type: "text", content: "<p>Insira seu texto aqui...</p>", align: "left" };
    } else {
      newBlock = { id: newId, type: "button", text: "Clique Aqui", url: "#", align: "center", backgroundColor: "#fde047", textColor: "#000000" };
    }
    
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<EmailBlock>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } as EmailBlock : b));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === blocks.length - 1)) return;
    
    const newBlocks = [...blocks];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[swapIndex]] = [newBlocks[swapIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const generateEmailContent = () => {
    let html = `<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.5; padding: 20px;">`;
    const attachments: { filename: string; path: string; cid: string }[] = [];
    
    blocks.forEach(block => {
      html += `\n<div style="text-align: ${block.align}; margin-bottom: 20px;">`;
      
      if (block.type === "image") {
        if (block.imageSource === "upload" && block.fileData) {
          const cid = `img_${block.id}@enviador`;
          html += `<img src="cid:${cid}" alt="${block.alt}" style="max-width: 100%; height: auto; border-radius: 8px;" />`;
          attachments.push({
            filename: block.fileName || "imagem.png",
            path: block.fileData,
            cid: cid
          });
        } else if (block.url) {
          html += `<img src="${block.url}" alt="${block.alt}" style="max-width: 100%; height: auto; border-radius: 8px;" />`;
        }
      } else if (block.type === "text") {
        html += block.content;
      } else if (block.type === "button") {
        html += `<a href="${block.url}" style="background-color: ${block.backgroundColor}; color: ${block.textColor}; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 30px; display: inline-block;">${block.text}</a>`;
      }
      
      html += `\n</div>`;
    });
    
    html += `\n</div>`;
    return { html, attachments };
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const recipients = parseJson(values.jsonInput);

    if (!recipients) {
      alert("JSON de destinatários inválido.");
      return;
    }

    const { html: finalHtml, attachments } = generateEmailContent();

    setTotal(recipients.length);
    setProgress(0);
    setLogs([]);
    setIsSending(true);

    setTimeout(() => {
      logsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

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
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="space-y-2 border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Criador de Template e Disparador</h1>
          <p className="text-gray-500 text-lg">Crie seu e-mail montando os blocos na ordem que preferir.</p>
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
            <div className="flex items-center justify-between">
              <Label className="text-gray-900 font-semibold text-base">Lista de Emails (JSON ou Planilha)</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" className="relative cursor-pointer overflow-hidden bg-gray-50 hover:bg-gray-100">
                  <Upload className="w-4 h-4 mr-2" /> 
                  Upload Planilha
                  <Input 
                    type="file" 
                    accept=".csv, .xlsx, .xls"
                    className="absolute inset-0 opacity-0 cursor-pointer w-[150%] h-[150%] -top-2 -left-2"
                    onChange={handleFileUpload}
                  />
                </Button>
              </div>
            </div>
            <p className="text-gray-500 text-sm">Cole o JSON manualmente ou faça upload de um arquivo CSV/Excel com colunas "nome" e "email". A prévia será atualizada abaixo para você confirmar.</p>
            <Textarea
              placeholder={'[\n  "joao@gmail.com",\n  "maria@gmail.com"\n]'}
              className="min-h-[150px] bg-white border-gray-300 text-gray-900 font-mono text-sm shadow-sm"
              {...form.register("jsonInput")}
            />
          </div>

          {/* BLOCK BUILDER */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-gray-900 font-semibold text-base">Conteúdo do E-mail</Label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => addBlock("image")}>
                  <ImageIcon className="w-4 h-4 mr-2" /> Imagem
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addBlock("text")}>
                  <Type className="w-4 h-4 mr-2" /> Texto
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addBlock("button")}>
                  <LinkIcon className="w-4 h-4 mr-2" /> Botão
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {blocks.length === 0 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center text-gray-500">
                  <p>Seu e-mail está vazio.</p>
                  <p className="text-sm">Clique nos botões acima para adicionar blocos (Imagem, Texto ou Botão).</p>
                </div>
              )}
              
              {blocks.map((block, index) => (
                <Card key={block.id} className="bg-gray-50 border-gray-200 shadow-sm">
                  <CardHeader className="py-2 px-4 flex flex-row items-center justify-between bg-gray-100 border-b border-gray-200">
                    <div className="flex items-center gap-2 font-medium text-gray-700">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      Bloco de {block.type === 'image' ? 'Imagem' : block.type === 'text' ? 'Texto' : 'Botão'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => moveBlock(index, 'up')} disabled={index === 0}>
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1}>
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeBlock(block.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    
                    {/* Alinhamento Geral */}
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500 uppercase tracking-wider">Alinhamento</Label>
                      <select 
                        className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm"
                        value={block.align}
                        onChange={(e) => updateBlock(block.id, { align: e.target.value as Align })}
                      >
                        <option value="left">Esquerda</option>
                        <option value="center">Centro</option>
                        <option value="right">Direita</option>
                      </select>
                    </div>

                    {/* Image Fields */}
                    {block.type === "image" && (
                      <div className="space-y-3">
                        <div className="flex gap-4">
                          <Button
                            type="button"
                            variant={block.imageSource === "url" ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateBlock(block.id, { imageSource: "url" })}
                          >
                            Usar Link (URL)
                          </Button>
                          <Button
                            type="button"
                            variant={block.imageSource === "upload" ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateBlock(block.id, { imageSource: "upload" })}
                          >
                            Fazer Upload
                          </Button>
                        </div>
                        
                        {block.imageSource === "url" ? (
                          <div>
                            <Label className="text-sm font-medium">URL da Imagem</Label>
                            <Input 
                              value={block.url || ""} 
                              onChange={(e) => updateBlock(block.id, { url: e.target.value })} 
                              placeholder="https://..." 
                            />
                          </div>
                        ) : (
                          <div>
                            <Label className="text-sm font-medium">Arquivo da Imagem</Label>
                            <Input 
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    updateBlock(block.id, { 
                                      fileData: event.target?.result as string,
                                      fileName: file.name
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                            {block.fileName && (
                              <p className="text-xs text-green-600 mt-1">Imagem selecionada: {block.fileName}</p>
                            )}
                          </div>
                        )}
                        <div>
                          <Label className="text-sm font-medium">Texto Alternativo (Alt)</Label>
                          <Input 
                            value={block.alt || ""} 
                            onChange={(e) => updateBlock(block.id, { alt: e.target.value })} 
                            placeholder="Descrição da imagem" 
                          />
                        </div>
                      </div>
                    )}

                    {/* Text Fields */}
                    {block.type === "text" && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Conteúdo (permite uso de {'{{nome}}'})</Label>
                        <TextEditor 
                          content={block.content} 
                          onChange={(html) => updateBlock(block.id, { content: html })} 
                        />
                      </div>
                    )}

                    {/* Button Fields */}
                    {block.type === "button" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Texto do Botão</Label>
                            <Input 
                              value={block.text || ""} 
                              onChange={(e) => updateBlock(block.id, { text: e.target.value })} 
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Link do Botão</Label>
                            <Input 
                              value={block.url || ""} 
                              onChange={(e) => updateBlock(block.id, { url: e.target.value })} 
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Cor de Fundo</Label>
                            <Input 
                              type="color"
                              value={block.backgroundColor || "#fde047"} 
                              onChange={(e) => updateBlock(block.id, { backgroundColor: e.target.value })} 
                              className="h-10 w-full p-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Cor do Texto</Label>
                            <Input 
                              type="color"
                              value={block.textColor || "#000000"} 
                              onChange={(e) => updateBlock(block.id, { textColor: e.target.value })} 
                              className="h-10 w-full p-1"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                  </CardContent>
                </Card>
              ))}
            </div>
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
              disabled={isSending || blocks.length === 0}
              className="w-full h-12 text-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md rounded-md"
            >
              {isSending ? "Enviando..." : "Enviar Emails"}
            </Button>
          </div>
        </form>

        {(isSending || logs.length > 0) && (
          <div ref={logsSectionRef} className="space-y-6 pt-8 border-t border-gray-200 mt-8 scroll-mt-6">
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
