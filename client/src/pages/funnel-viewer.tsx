import { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChefHat, MessageSquare, Sparkles, FileText } from "lucide-react";

interface Question {
  id: string;
  question: string;
  answer: string;
}

interface FunnelData {
  id: string;
  name: string;
  description: string;
  instructions: string;
  questions: Question[];
  temperature: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function FunnelViewer() {
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFunnelData = async () => {
      try {
        const response = await fetch('/attached_assets/[P.O] - Receitas sem Glúten_1760773130289.json');
        const data = await response.json();
        setFunnelData(data);
      } catch (error) {
        console.error('Erro ao carregar o funil:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFunnelData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-black">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 space-y-8">
            <div className="flex items-center justify-center h-96">
              <div className="text-white text-xl">Carregando funil...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!funnelData) {
    return (
      <div className="flex min-h-screen bg-black">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 space-y-8">
            <div className="flex items-center justify-center h-96">
              <div className="text-white text-xl">Erro ao carregar o funil</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 space-y-8 max-w-5xl">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <ChefHat className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white" data-testid="text-funnel-name">
                  {funnelData.name}
                </h1>
                <p className="text-gray-400 mt-1" data-testid="text-funnel-description">
                  {funnelData.description}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                {funnelData.published ? 'Publicado' : 'Rascunho'}
              </Badge>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                <MessageSquare className="w-3 h-3 mr-1" />
                {funnelData.questions.length} Perguntas
              </Badge>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Instruções */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="w-5 h-5 text-purple-400" />
                Instruções do Assistente
              </CardTitle>
              <CardDescription className="text-gray-400">
                Diretrizes de comportamento e personalidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto bg-gray-950 p-4 rounded-lg border border-gray-800 text-sm"
                data-testid="text-instructions"
              >
                {funnelData.instructions}
              </div>
            </CardContent>
          </Card>

          {/* FAQ - Perguntas e Respostas */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <MessageSquare className="w-5 h-5 text-pink-400" />
                Perguntas Frequentes do Funil
              </CardTitle>
              <CardDescription className="text-gray-400">
                Objeções comuns e respostas de vendas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-4">
                {funnelData.questions.map((q, index) => (
                  <AccordionItem 
                    key={q.id} 
                    value={q.id}
                    className="bg-gray-950 border border-gray-800 rounded-lg px-4 data-[state=open]:border-purple-500/50"
                    data-testid={`accordion-question-${index}`}
                  >
                    <AccordionTrigger 
                      className="text-left hover:no-underline text-white hover:text-purple-400 transition-colors"
                      data-testid={`trigger-question-${index}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-purple-400 font-bold mt-1">Q{index + 1}:</span>
                        <span>{q.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent 
                      className="text-gray-300 pt-2 pb-4"
                      data-testid={`content-answer-${index}`}
                    >
                      <div className="flex gap-3 pl-8">
                        <span className="text-pink-400 font-bold">R:</span>
                        <p className="flex-1">{q.answer}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Informações do Funil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">ID:</span>
                <span className="text-gray-300 font-mono" data-testid="text-funnel-id">{funnelData.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Temperatura:</span>
                <span className="text-gray-300" data-testid="text-temperature">{funnelData.temperature}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Criado em:</span>
                <span className="text-gray-300" data-testid="text-created-at">
                  {new Date(funnelData.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Atualizado em:</span>
                <span className="text-gray-300" data-testid="text-updated-at">
                  {new Date(funnelData.updatedAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
