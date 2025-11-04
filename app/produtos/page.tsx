"use client";
import { useEffect, useMemo, useState } from "react";
import { Home, ShoppingCart, CheckCircle2, Leaf, Package, Menu, X } from "lucide-react";
import { getEstoqueLocal } from "@/utils/googleSheets";

// Produtos (mantendo exatamente seu layout original)
const products = [
  // Varejo
  { id: 1, nome: "Água de Coco 300ml", categoria: "Água de Coco", tipo: "varejo", descricao: "Garrafinha individual", preco: 8.00, imagem: "/img/300ml.png" },
  { id: 3, nome: "Água de Coco 1L", categoria: "Água de Coco", tipo: "varejo", descricao: "Garrafa grande", preco: 24.00, imagem: "/img/1litro.png" },
  { id: 4, nome: "Coco Verde Inteiro", categoria: "Coco Fresco", tipo: "varejo", descricao: "Coco fresco para consumo", preco: 6.00, imagem: "/img/coco-verde.png" },
  // Atacado
  { id: 101, nome: "Coco Verde (50un)", categoria: "Coco Fresco", tipo: "atacado", descricao: "Coco Verde 50 unidades", preco: 150.00, imagem: "/img/caixa-300ml.jpg" },
  { id: 102, nome: "Caixa Água de Coco 300ml (12un)", categoria: "Água de Coco", tipo: "atacado", descricao: "Caixa com 12 unidades", preco: 60.00, imagem: "/img/caixa-500ml.jpg" },
  { id: 103, nome: "Caixa Água de Coco 1L (6un)", categoria: "Água de Coco", tipo: "atacado", descricao: "Caixa com 6 unidades", preco: 90.00, imagem: "/img/caixa-1l.jpg" },
];

const categorias = Array.from(new Set(products.map(p => p.categoria)));

interface CartItem {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  imagem: string;
  quantidade: number;
}

export default function ProdutosPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tipoVenda, setTipoVenda] = useState<"varejo" | "atacado">("varejo");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("Todos");
  const [recentlyAdded, setRecentlyAdded] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [estoque, setEstoque] = useState<Record<number, boolean>>({});

  // 🔄 Sincroniza estoque em tempo real
  useEffect(() => {
    setEstoque(getEstoqueLocal());
    const atualizar = () => setEstoque(getEstoqueLocal());
    window.addEventListener("estoqueAtualizado", atualizar);
    return () => window.removeEventListener("estoqueAtualizado", atualizar);
  }, []);

  // 🛒 Carregar carrinho
  useEffect(() => {
    const saved = localStorage.getItem("carrinho");
    if (saved) setCart(JSON.parse(saved));
  }, []);

  // 💾 Salvar carrinho
  useEffect(() => {
    if (cart.length > 0) localStorage.setItem("carrinho", JSON.stringify(cart));
    else localStorage.removeItem("carrinho");
  }, [cart]);

  const categoriasComTodos = ["Todos", ...categorias];

  const produtosFiltrados = useMemo(() => {
    let filtered = products.filter(p => p.tipo === tipoVenda);
    if (categoriaSelecionada !== "Todos") {
      filtered = filtered.filter(p => p.categoria === categoriaSelecionada);
    }
    return filtered;
  }, [categoriaSelecionada, tipoVenda]);

  const adicionarAoCarrinho = (produto: typeof products[0]) => {
    // Verifica disponibilidade
    if (estoque[produto.id] === false) {
      alert("❌ Este produto está indisponível no momento.");
      return;
    }

    setCart((prev) => {
      const existente = prev.find((i) => i.id === produto.id);
      if (existente) {
        return prev.map((i) =>
          i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i
        );
      } else {
        return [
          ...prev,
          {
            id: produto.id,
            nome: produto.nome,
            descricao: produto.descricao,
            preco: produto.preco,
            imagem: produto.imagem,
            quantidade: 1,
          },
        ];
      }
    });
    setRecentlyAdded(produto.id);
    setTimeout(() => setRecentlyAdded(null), 1800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-emerald-50 to-white pb-20 md:pb-0">
      {/* Cabeçalho Desktop */}
      <header className="hidden md:block sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-emerald-100 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-emerald-700 hover:text-emerald-900 transition-colors">
            <Home size={18} /> Início
          </a>
          <h1 className="font-bold text-emerald-900 text-xl flex items-center gap-2">
            <Leaf size={20} className="text-emerald-600" />
            Produtos O Coqueiro
          </h1>
          <a href="/pedidos" className="relative text-emerald-700 hover:text-emerald-900 transition-colors">
            <ShoppingCart size={24} />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-xs rounded-full w-5 h-5 grid place-items-center font-semibold">
                {cart.length}
              </span>
            )}
          </a>
        </div>
      </header>

      {/* Cabeçalho Mobile */}
      <header className="md:hidden sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-emerald-100 shadow-sm">
        <div className="px-4 h-14 flex items-center justify-between">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-emerald-700 p-2">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <h1 className="font-bold text-emerald-900 text-base flex items-center gap-1">
            <Leaf size={18} className="text-emerald-600" />
            O Coqueiro
          </h1>

          <a href="/pedidos" className="relative text-emerald-700 p-2">
            <ShoppingCart size={22} />
            {cart.length > 0 && (
              <span className="absolute top-0 right-0 bg-emerald-600 text-white text-xs rounded-full w-5 h-5 grid place-items-center font-semibold">
                {cart.length}
              </span>
            )}
          </a>
        </div>

        {/* Menu Mobile Dropdown */}
        {menuOpen && (
          <div className="bg-white border-t border-emerald-100 shadow-lg">
            <a href="/" className="flex items-center gap-3 px-4 py-3 text-emerald-700 hover:bg-emerald-50 transition-colors" onClick={() => setMenuOpen(false)}>
              <Home size={18} /> Página Inicial
            </a>
            <a href="/pedidos" className="flex items-center gap-3 px-4 py-3 text-emerald-700 hover:bg-emerald-50 transition-colors" onClick={() => setMenuOpen(false)}>
              <ShoppingCart size={18} /> Meu Carrinho ({cart.length})
            </a>
          </div>
        )}
      </header>

      {/* Toggle Varejo/Atacado */}
      <div className="container mx-auto px-4 pt-6 pb-4">
        <div className="bg-white rounded-xl p-2 shadow-sm border border-emerald-100 flex gap-2 max-w-md mx-auto">
          <button
            onClick={() => {
              setTipoVenda("varejo");
              setCategoriaSelecionada("Todos");
            }}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              tipoVenda === "varejo"
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-white text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            <ShoppingCart size={18} />
            Varejo
          </button>
          <button
            onClick={() => {
              setTipoVenda("atacado");
              setCategoriaSelecionada("Todos");
            }}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              tipoVenda === "atacado"
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-white text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            <Package size={18} />
            Atacado
          </button>
        </div>
      </div>

      {/* Filtro de categorias */}
      <div className="container mx-auto px-4 pb-6">
        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
          {categoriasComTodos.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaSelecionada(cat)}
              className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium border transition-all ${
                categoriaSelecionada === cat
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-emerald-800 border-emerald-200 hover:border-emerald-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Indicador de Seção */}
      <div className="container mx-auto px-4 pb-4">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold text-emerald-900">
            {tipoVenda === "varejo" ? "🛒 Compra Individual" : "📦 Compra no Atacado"}
          </h2>
          <p className="text-sm text-emerald-600 mt-1">
            {tipoVenda === "varejo"
              ? "Perfeito para consumo pessoal e pequenas quantidades"
              : "Preços especiais para revendedores e grandes volumes"}
          </p>
        </div>
      </div>

      {/* Vitrine (com selo de disponibilidade) */}
      <main className="container mx-auto px-4 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {produtosFiltrados.map((p) => {
          const disponivel = estoque[p.id] !== false;
          return (
            <div
              key={p.id}
              className={`relative bg-white rounded-2xl border border-emerald-100 shadow-sm flex flex-col overflow-hidden transition-all duration-300 ${
                recentlyAdded === p.id
                  ? "animate-pop border-emerald-300 shadow-emerald-200"
                  : "hover:shadow-md hover:-translate-y-1"
              } ${!disponivel ? "opacity-60" : ""}`}
            >
              {!disponivel && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-md font-semibold shadow-md">
                  Indisponível
                </span>
              )}

              <div onClick={() => adicionarAoCarrinho(p)} className="relative w-full h-40 md:h-48 bg-white flex items-center justify-center cursor-pointer hover:bg-emerald-50 transition-colors overflow-hidden">
                <img src={p.imagem} alt={p.nome} className="w-full h-full" style={{ objectFit: 'fill' }} />
              </div>

              <div onClick={() => adicionarAoCarrinho(p)} className="flex flex-col flex-1 p-4 md:p-5 cursor-pointer">
                <h2 className="text-emerald-900 font-semibold text-base md:text-lg mb-1">
                  {p.nome}
                </h2>
                <p className="text-xs md:text-sm text-emerald-600 flex-1">
                  {p.descricao}
                </p>

                <div className="flex items-center justify-between mt-3 md:mt-4">
                  <span className="text-lg md:text-xl font-bold text-emerald-800">
                    R$ {p.preco.toFixed(2)}
                  </span>
                  <button
                    disabled={!disponivel}
                    onClick={(e) => {
                      e.stopPropagation();
                      adicionarAoCarrinho(p);
                    }}
                    className={`px-3 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-all duration-200 ${
                      disponivel
                        ? recentlyAdded === p.id
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1"
                          : "bg-emerald-600 text-white hover:bg-emerald-700 shadow"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {recentlyAdded === p.id ? (
                      <>
                        <CheckCircle2 size={16} /> OK
                      </>
                    ) : disponivel ? (
                      "Adicionar"
                    ) : (
                      "Indisponível"
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* Botão Flutuante Mobile */}
      <div className="md:hidden fixed bottom-4 right-4 z-30">
        <a href="/pedidos" className="bg-emerald-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-emerald-700 transition-colors relative">
          <ShoppingCart size={24} />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 grid place-items-center font-bold">
              {cart.length}
            </span>
          )}
        </a>
      </div>

      <style jsx global>{`
        @keyframes pop {
          0% { transform: scale(1); box-shadow: 0 0 0 rgba(16, 185, 129, 0); }
          40% { transform: scale(1.05); box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
          100% { transform: scale(1); box-shadow: 0 0 0 rgba(16, 185, 129, 0); }
        }
        .animate-pop { animation: pop 0.35s ease-out; }
      `}</style>
    </div>
  );
}
