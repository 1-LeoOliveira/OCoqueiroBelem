"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  CheckCircle,
  XCircle,
  RefreshCw,
  Droplets,
  Home,
  LogOut,
} from "lucide-react";
import { atualizarDisponibilidade, broadcastEstoque } from "@/utils/googleSheets";

// Tipos
interface Produto {
  id: number;
  nome: string;
  categoria: string;
  tipo: "varejo" | "atacado";
  preco: number;
  imagem: string;
}

interface EstoqueState {
  [key: number]: boolean;
}

// ✅ PRODUTOS SINCRONIZADOS COM A VITRINE
const produtos: Produto[] = [
  // Varejo
  { id: 1, nome: "Água de Coco 300ml", categoria: "Água de Coco", tipo: "varejo", preco: 8.0, imagem: "/img/300ml.png" },
  { id: 3, nome: "Água de Coco 1L", categoria: "Água de Coco", tipo: "varejo", preco: 24.0, imagem: "/img/1litro.png" },
  
  // Atacado
  { id: 101, nome: "Coco Verde (50un)", categoria: "Coco Fresco", tipo: "atacado", preco: 150.0, imagem: "/img/50un.png" },
  { id: 102, nome: "Caixa Água de Coco 300ml (12un)", categoria: "Água de Coco", tipo: "atacado", preco: 60.0, imagem: "/img/fardo300ml.png" },
  { id: 103, nome: "Caixa Água de Coco 1L (6un)", categoria: "Água de Coco", tipo: "atacado", preco: 90.0, imagem: "/img/fardo1L.png" },
];

const STORAGE_KEY = "coqueiro_belem_estoque";
const AUTH_KEY = "coqueiro_admin_auth";
const AUTH_TIMESTAMP_KEY = "coqueiro_admin_timestamp";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas

export default function AdminCoqueiroPage() {
  const router = useRouter();
  const [estoque, setEstoque] = useState<EstoqueState>({});
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [filtroTipo, setFiltroTipo] = useState<"Todos" | "varejo" | "atacado">("Todos");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [mudancasPendentes, setMudancasPendentes] = useState(0);
  const [ultimaSincronizacao, setUltimaSincronizacao] = useState<Date | null>(null);
  const [autenticado, setAutenticado] = useState(false);
  const [carregando, setCarregando] = useState(true);

  // Verificar autenticação
  useEffect(() => {
    if (typeof window === "undefined") return;
    const auth = localStorage.getItem(AUTH_KEY);
    const timestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);

    if (!auth || !timestamp) {
      router.push("/login");
      return;
    }

    const loginTime = parseInt(timestamp);
    const now = Date.now();
    if (now - loginTime > SESSION_DURATION) {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(AUTH_TIMESTAMP_KEY);
      router.push("/login");
      return;
    }

    setAutenticado(true);
    setCarregando(false);
  }, [router]);

  // Carregar estoque local
  useEffect(() => {
    if (!autenticado || typeof window === "undefined") return;

    const estoqueLocal = localStorage.getItem(STORAGE_KEY);
    if (estoqueLocal) {
      setEstoque(JSON.parse(estoqueLocal));
    } else {
      const inicial: EstoqueState = {};
      produtos.forEach((p) => (inicial[p.id] = true));
      setEstoque(inicial);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inicial));
    }
  }, [autenticado]);

  // Alternar disponibilidade
  const toggleDisponibilidade = async (id: number) => {
    const novoEstoque = { ...estoque, [id]: !estoque[id] };
    setEstoque(novoEstoque);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novoEstoque));
    setMudancasPendentes((prev) => prev + 1);

    // 📄 Enviar atualização para API interna
    try {
      const res = await atualizarDisponibilidade(id, novoEstoque[id] !== false);
      if (res.success) {
        console.log("📊 Atualizado no Google Sheets com sucesso!");
        setMudancasPendentes((prev) => Math.max(0, prev - 1));
      } else {
        console.error("❌ Erro ao atualizar:", res.error);
      }
    } catch (error) {
      console.error("Erro ao comunicar com API:", error);
    }

    // 📡 Atualizar vitrine em tempo real
    broadcastEstoque(novoEstoque);
  };

  const categorias = ["Todas", ...Array.from(new Set(produtos.map((p) => p.categoria)))];
  const produtosFiltrados = produtos.filter((p) => {
    const matchCat = filtroCategoria === "Todas" || p.categoria === filtroCategoria;
    const matchTipo = filtroTipo === "Todos" || p.tipo === filtroTipo;
    const disponivel = estoque[p.id] !== false;
    const matchStatus =
      filtroStatus === "Todos" ||
      (filtroStatus === "Disponíveis" && disponivel) ||
      (filtroStatus === "Esgotados" && !disponivel);
    return matchCat && matchTipo && matchStatus;
  });

  const total = produtos.length;
  const disponiveis = produtos.filter((p) => estoque[p.id] !== false).length;
  const esgotados = total - disponiveis;
  const totalVarejo = produtos.filter(p => p.tipo === "varejo").length;
  const totalAtacado = produtos.filter(p => p.tipo === "atacado").length;

  if (carregando)
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center flex-col">
        <Droplets className="text-emerald-600 animate-pulse mb-4" size={48} />
        <p className="text-emerald-700 font-medium">Verificando autenticação...</p>
      </div>
    );

  if (!autenticado) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Cabeçalho */}
      <header className="bg-white shadow-sm border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center text-emerald-700 hover:text-emerald-900">
              <Home size={20} className="mr-2" /> Site
            </a>
            <h1 className="text-xl font-bold text-black flex items-center gap-2">
              <Droplets className="text-emerald-600" size={24} />
              Admin - O Coqueiro Belém
            </h1>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem(AUTH_KEY);
              localStorage.removeItem(AUTH_TIMESTAMP_KEY);
              router.push("/login");
            }}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} /> Sair
          </button>
        </div>
      </header>

      {/* Painel de Resumo */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card title="Total" value={total} icon={<Package className="text-emerald-600" size={32} />} />
          <Card title="Disponíveis" value={disponiveis} icon={<CheckCircle className="text-green-600" size={32} />} />
          <Card title="Esgotados" value={esgotados} icon={<XCircle className="text-red-600" size={32} />} />
          <Card title="Varejo" value={totalVarejo} icon={<Package className="text-blue-600" size={32} />} />
          <Card title="Atacado" value={totalAtacado} icon={<Package className="text-purple-600" size={32} />} />
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-emerald-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="px-4 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-black"
            >
              {categorias.map((cat: string) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
            
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as any)}
              className="px-4 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-black"
            >
              <option value="Todos">Todos os tipos</option>
              <option value="varejo">🛒 Varejo</option>
              <option value="atacado">📦 Atacado</option>
            </select>
            
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-4 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-black"
            >
              <option>Todos</option>
              <option>Disponíveis</option>
              <option>Esgotados</option>
            </select>
          </div>
        </div>

        {/* Info de produtos filtrados */}
        {produtosFiltrados.length !== total && (
          <div className="mb-4 text-center text-sm text-black">
            Exibindo {produtosFiltrados.length} de {total} produtos
          </div>
        )}

        {/* Grade de produtos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {produtosFiltrados.map((p) => {
            const disponivel = estoque[p.id] !== false;
            return (
              <div
                key={p.id}
                className={`bg-white rounded-xl p-4 shadow-sm border transition-all hover:shadow-md ${
                  disponivel ? "border-green-200" : "border-red-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-20 h-20 bg-emerald-50 rounded-lg flex items-center justify-center overflow-hidden">
                    <img src={p.imagem} alt={p.nome} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-black text-sm">{p.nome}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        p.tipo === "varejo" 
                          ? "bg-blue-100 text-blue-700" 
                          : "bg-purple-100 text-purple-700"
                      }`}>
                        {p.tipo === "varejo" ? "🛒" : "📦"}
                      </span>
                    </div>
                    <p className="text-xs text-black mb-2">{p.categoria}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-black">
                        R$ {p.preco.toFixed(2)}
                      </span>
                      <button
                        onClick={() => toggleDisponibilidade(p.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-all ${
                          disponivel
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {disponivel ? (
                          <>
                            <XCircle size={14} /> Esgotar
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} /> Repor
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mensagem quando não há produtos */}
        {produtosFiltrados.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-black">Nenhum produto encontrado com os filtros aplicados</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, value, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-black font-medium">{title}</p>
          <p className="text-2xl font-bold text-black">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}