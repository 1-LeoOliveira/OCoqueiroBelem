"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Home, ArrowLeft, MapPin, Calendar, ChevronRight, Store } from "lucide-react";

interface Item { 
  id: number; 
  nome: string; 
  preco: number; 
  quantidade: number; 
}

interface Localizacao { 
  latitude: number; 
  longitude: number; 
}

type Metodo = "pix" | "dinheiro" | "cartão";
type TipoEntrega = "Belém-Centro" | "Icoaraci/Augusto Montenegro" | "Marco" |"Telegrafo"|"Pedreira"|"Sacramenta"|"Souza"|"Marambaia"|"Ananideua / Br316"|"Retirada no Local";

export default function Checkout() {
  const [items, setItems] = useState<Item[]>([]);
  const [regiao, setRegiao] = useState<TipoEntrega | "">("");
  const [dados, setDados] = useState({
    nome: "",
    telefone: "",
    endereco: "",
    observacoes: ""
  });
  const [loc, setLoc] = useState<Localizacao | null>(null);
  const [metodo, setMetodo] = useState<Metodo>("pix");
  const [pedido, setPedido] = useState("");
  const [agendar, setAgendar] = useState(false);
  const [dataAgendada, setDataAgendada] = useState("");
  const [horaAgendada, setHoraAgendada] = useState("");
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
  
  const diasSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
  
  const taxas = useMemo(() => ({
    "Belém-Centro": 0,
    "Icoaraci/Augusto Montenegro": 15,
    "Marco": 5,
    "Pedreira": 5,
    "Telegrafo": 5,
    "Sacramenta": 5,
    "Souza": 5,
    "Marambaia": 5,
    "Ananideua / Br316": 20,
    "Retirada no Local": 0
  }), []);
  
  // Números de WhatsApp por região
  const telefonesRegiao = useMemo(() => ({
    "Belém-Centro": "559181745677",
    "Icoaraci/Augusto Montenegro": "559181745677",
    "Marco": "559181745677",
    "Pedreira": "559181745677",
    "Telegrafo": "559181745677",
    "Sacramenta": "559181745677",
    "Souza": "559181745677",
    "Marambaia": "559181745677",
    "Retirada no Local": "559181745677",
    "Ananideua / Br316": "559181745677"
  }), []);
  
  const taxa = regiao ? taxas[regiao as TipoEntrega] ?? 0 : 0;
  const subtotal = items.reduce((t, i) => t + i.preco * i.quantidade, 0);
  const total = subtotal + taxa;
  const chavePix = "91981745677";
  const telEmpresa = regiao ? telefonesRegiao[regiao as TipoEntrega] : "559181745677";
  const pedidoMinimo = 0;
  const atingiuMinimo = subtotal >= pedidoMinimo;

  useEffect(() => {
    const saved = localStorage.getItem("carrinho");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
        setItems([]);
      }
    }
    setPedido(String(Math.floor(10000 + Math.random() * 90000)));
  }, []);

  const geo = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLoc({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }),
        error => console.error("Erro ao obter localização:", error)
      );
    }
  };

  const toggleDia = (d: string) => {
    setDiasSelecionados(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  const enviar = () => {
    // Validação de pedido mínimo
    if (!atingiuMinimo) {
      alert(`Pedido mínimo de R$ ${pedidoMinimo.toFixed(2)}. Faltam R$ ${(pedidoMinimo - subtotal).toFixed(2)}`);
      return;
    }

    // Validações
    if (!dados.nome || !dados.telefone || !regiao) {
      alert("Preencha nome, telefone e região/tipo de entrega");
      return;
    }

    // Se não for retirada, precisa do endereço
    if (regiao !== "Retirada no Local" && !dados.endereco) {
      alert("Preencha o endereço de entrega");
      return;
    }

    if (horaAgendada) {
      const [h] = horaAgendada.split(":").map(Number);
      if (h < 8 || h > 18) {
        alert("Horário permitido apenas entre 08:00 e 18:00.");
        return;
      }
    }

    // Construir mensagem
    let msg = `*Pedido - O COQUEIRO BELEM*\n`;
    msg += `*No:* #${pedido}\n\n`;
    
    msg += `*DADOS DO CLIENTE*\n`;
    msg += `*Nome:* ${dados.nome}\n`;
    msg += `*Telefone:* ${dados.telefone}\n`;
    
    if (regiao === "Retirada no Local") {
      msg += `*Tipo:* RETIRADA NO LOCAL\n`;
    } else {
      msg += `*Endereco:* ${dados.endereco}\n`;
      msg += `*Regiao:* ${regiao}\n`;
    }
    
    if (loc) {
      msg += `*Localizacao:* https://maps.google.com/?q=${loc.latitude},${loc.longitude}\n`;
    }
    
    msg += `\n`;

    // Agendamento
    if (agendar) {
      msg += `*AGENDAMENTO*\n`;
      if (dataAgendada) {
        const dataFormatada = new Date(dataAgendada + "T00:00:00").toLocaleDateString("pt-BR");
        msg += `*Data:* ${dataFormatada}`;
        if (horaAgendada) {
          msg += ` as ${horaAgendada}`;
        }
        msg += `\n`;
      }
      if (diasSelecionados.length) {
        msg += `*Repetir em:* ${diasSelecionados.join(", ")}\n`;
      }
      msg += `\n`;
    }

    // Itens do pedido
    msg += `*ITENS DO PEDIDO*\n`;
    items.forEach(item => {
      const totalItem = (item.preco * item.quantidade).toFixed(2);
      msg += `${item.nome} x${item.quantidade} - R$ ${totalItem}\n`;
    });
    
    msg += `\n`;

    // Valores
    msg += `*VALORES*\n`;
    msg += `*Subtotal:* R$ ${subtotal.toFixed(2)}\n`;
    if (regiao === "Retirada no Local") {
      msg += `*Entrega:* RETIRADA NO LOCAL (R$ 0,00)\n`;
    } else {
      msg += `*Entrega:* R$ ${taxa.toFixed(2)}\n`;
    }
    msg += `*TOTAL:* R$ ${total.toFixed(2)}\n`;
    msg += `\n`;

    // Pagamento
    msg += `*PAGAMENTO*\n`;
    msg += `*Forma:* ${metodo.toUpperCase()}\n`;
    if (metodo === "pix") {
      msg += `*Chave PIX:* ${chavePix}\n`;
    }
    msg += `\n`;

    // Observações
    if (dados.observacoes) {
      msg += `*OBSERVACOES*\n`;
      msg += `${dados.observacoes}\n`;
    }

    // Codificar a mensagem
    const msgCodificada = encodeURIComponent(msg);
    const link = `https://wa.me/${telEmpresa}?text=${msgCodificada}`;
    
    console.log("Mensagem:", msg);
    console.log("Telefone:", telEmpresa);
    console.log("Link:", link);
    
    window.open(link, "_blank");
  };

  const enderecoObrigatorio = regiao !== "Retirada no Local" && regiao !== "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-teal-50 to-white">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-emerald-100 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/pedidos" className="text-emerald-700 flex items-center gap-2">
            <ArrowLeft size={18} /> Voltar
          </Link>
          <h1 className="font-bold text-emerald-900">Finalizar Pedido</h1>
          <Link href="/" className="text-emerald-700 flex items-center gap-2">
            <Home size={18} /> Início
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-2xl space-y-8">
        {/* Resumo */}
        <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-emerald-900 mb-4 flex items-center gap-2">
            📋 Resumo do Pedido
          </h2>
          
          {/* Alerta de pedido mínimo */}
          {!atingiuMinimo && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                ⚠️ <strong>Pedido mínimo:</strong> R$ {pedidoMinimo.toFixed(2)}
                <br />
                <span className="text-amber-700">
                  Faltam R$ {(pedidoMinimo - subtotal).toFixed(2)} para atingir o valor mínimo
                </span>
              </p>
            </div>
          )}
          
          {/* Lista de Itens */}
          <div className="space-y-2 mb-4 border-b pb-4">
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-sm text-emerald-800">
                <span>{item.nome} x{item.quantidade}</span>
                <span>R$ {(item.preco * item.quantidade).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-emerald-800">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>
                {regiao === "Retirada no Local" ? "Retirada" : "Entrega"}
              </span>
              <span className={regiao === "Retirada no Local" ? "text-green-600 font-medium" : ""}>
                R$ {taxa.toFixed(2)}
              </span>
            </div>
            <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-lg text-emerald-700">R$ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Tipo de Entrega */}
        <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-emerald-900 flex items-center gap-2">
            🚚 Tipo de Entrega
          </h2>
          <select
            className="w-full border border-emerald-200 rounded-lg p-3 text-emerald-900 font-medium"
            value={regiao}
            onChange={e => setRegiao(e.target.value as TipoEntrega | "")}
          >
            <option value="">Selecione o tipo de entrega</option>
            <option value="Retirada no Local">🏪 Retirada no Local (Grátis)</option>
            <option value="Belém-Centro">🚚 Entrega em Belém-Centro (Grátis)</option>
            <option value="Icoaraci/Augusto Montenegro">🚚 Entrega em Icoaraci / Augusto Montenegro (R$ 15,00)</option>
            <option value="Marco">🚚 Entrega em Marco (R$ 5,00)</option>
            <option value="Pedreira">🚚 Entrega em Pedreira (R$ 5,00)</option>
            <option value="Telegrafo">🚚 Entrega em Telegrafo (R$ 5,00)</option>
            <option value="Sacramenta">🚚 Entrega em Sacramenta (R$ 5,00)</option>
            <option value="Souza">🚚 Entrega em Souza (R$ 5,00)</option>
            <option value="Marambaia">🚚 Entrega em Marambaia (R$ 5,00)</option>
            <option value="Ananideua / Br316">🚚 Entrega em Ananideua / BR 316 (R$ 20,00)</option>
          </select>

          {regiao === "Retirada no Local" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Store className="text-emerald-600 mt-1" size={20} />
                <div className="text-sm text-emerald-800">
                  <p className="font-semibold mb-1">📍 Endereço para Retirada:</p>
                  <p>Rua Timbiras, 769 - Jurunas Centro</p>
                  <p>Belém - PA</p>
                  <p className="mt-2 text-emerald-600">
                    ⏰ Horário: Segunda a Sábado, 10h às 20h
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dados */}
        <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-emerald-900">👤 Seus Dados</h2>
          
          <input
            className="w-full border border-emerald-200 rounded-lg p-3 text-emerald-900 placeholder-emerald-400"
            placeholder="Nome completo *"
            value={dados.nome}
            onChange={e => setDados({ ...dados, nome: e.target.value })}
          />
          
          <input
            className="w-full border border-emerald-200 rounded-lg p-3 text-emerald-900 placeholder-emerald-400"
            placeholder="Telefone (WhatsApp) *"
            value={dados.telefone}
            onChange={e => setDados({ ...dados, telefone: e.target.value })}
          />
          
          {regiao !== "Retirada no Local" && (
            <>
              <input
                className="w-full border border-emerald-200 rounded-lg p-3 text-emerald-900 placeholder-emerald-400"
                placeholder={`Endereço completo ${enderecoObrigatorio ? "*" : ""}`}
                value={dados.endereco}
                onChange={e => setDados({ ...dados, endereco: e.target.value })}
              />
              
              <button
                onClick={geo}
                className="px-4 py-2 border border-emerald-200 rounded-lg text-emerald-700 bg-emerald-50 flex items-center gap-2 hover:bg-emerald-100 transition-colors"
              >
                <MapPin size={18} /> Usar minha localização
              </button>
              
              {loc && (
                <div className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded">
                  ✓ Localização capturada
                </div>
              )}
            </>
          )}
          
          <textarea
            className="w-full border border-emerald-200 rounded-lg p-3 text-emerald-900 placeholder-emerald-400"
            rows={3}
            placeholder="Observações (opcional)"
            value={dados.observacoes}
            onChange={e => setDados({ ...dados, observacoes: e.target.value })}
          />
        </div>

        {/* Agendamento */}
        <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm space-y-3">
          <h2 className="font-semibold text-emerald-900 flex items-center gap-2">
            <Calendar size={18} /> Agendamento
          </h2>
          
          <label className="flex items-center gap-2 text-emerald-800 cursor-pointer">
            <input
              type="checkbox"
              checked={agendar}
              onChange={e => setAgendar(e.target.checked)}
              className="w-4 h-4 text-emerald-600"
            />
            Desejo agendar este pedido
          </label>
          
          {agendar && (
            <div className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  className="border border-emerald-200 rounded-lg p-3 text-emerald-900"
                  value={dataAgendada}
                  onChange={e => setDataAgendada(e.target.value)}
                />
                <input
                  type="time"
                  min="08:00"
                  max="18:00"
                  className="border border-emerald-200 rounded-lg p-3 text-emerald-900"
                  value={horaAgendada}
                  onChange={e => setHoraAgendada(e.target.value)}
                />
              </div>
              
              <p className="text-sm text-emerald-700">Ou selecione dias fixos da semana:</p>
              
              <div className="flex flex-wrap gap-2">
                {diasSemana.map(d => (
                  <button
                    key={d}
                    onClick={() => toggleDia(d)}
                    className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                      diasSelecionados.includes(d)
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "border-emerald-200 text-emerald-700 hover:border-emerald-400"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pagamento */}
        <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-emerald-900">💳 Forma de Pagamento</h2>
          
          <div className="grid grid-cols-3 gap-2">
            {(["pix", "dinheiro", "cartão"] as const).map(m => (
              <button
                key={m}
                onClick={() => setMetodo(m)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  metodo === m
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "border-emerald-200 text-emerald-700 hover:border-emerald-400"
                }`}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
          
          {metodo === "pix" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-800">
              <p className="font-semibold mb-1">Chave PIX:</p>
              <p className="font-mono bg-white px-2 py-1 rounded">{chavePix}</p>
              <p className="mt-2">
                <strong>Valor:</strong> R$ {total.toFixed(2)}
              </p>
            </div>
          )}
          
          <button
            onClick={enviar}
            disabled={!atingiuMinimo}
            className={`w-full mt-4 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold shadow-lg transition-all ${
              atingiuMinimo
                ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-[1.02] cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {atingiuMinimo ? (
              <>
                Enviar pedido pelo WhatsApp <ChevronRight size={18} />
              </>
            ) : (
              <>
                Pedido mínimo: R$ {pedidoMinimo.toFixed(2)}
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}