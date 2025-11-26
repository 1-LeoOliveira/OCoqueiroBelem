"use client";
import { useEffect, useMemo, useState } from "react";
import { Home, ShoppingCart, CheckCircle2, Leaf, Package, Menu, X } from "lucide-react";
import { useEstoque } from "@/utils/googleSheets";

// Produtos
const products = [
  // Varejo
  { id: 1, nome: "Água de Coco 300ml", categoria: "Água de Coco", tipo: "varejo", descricao: "Garrafinha individual", preco: 8.00, imagem: "/img/300ml.png" },
  { id: 3, nome: "Água de Coco 1L", categoria: "Água de Coco", tipo: "varejo", descricao: "Garrafa grande", preco: 24.00, imagem: "/img/1litro.png" },
  // Atacado
  { id: 101, nome: "Coco Verde (50un)", categoria: "Coco Fresco", tipo: "atacado", descricao: "Coco Verde 50 unidades", preco: 150.00, imagem: "/img/50un.png" },
  { id: 102, nome: "Caixa Água de Coco 300ml (12un)", categoria: "Água de Coco", tipo: "atacado", descricao: "Caixa com 12 unidades", preco: 60.00, imagem: "/img/fardo300ml.png" },
  { id: 103, nome: "Caixa Água de Coco 1L (6un)", categoria: "Água de Coco", tipo: "atacado", descricao: "Caixa com 6 unidades", preco: 90.00, imagem: "/img/fardo1L.png" },
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

  // ✅ AGORA USA O HOOK QUE LÊ DA PLANILHA!
  const { estoque, loading, isProdutoDisponivel } = useEstoque();

  // Debug: Log do estoque quando carregar
  useEffect(() => {
    console.log('[Produtos] 📊 Estoque carregado do Google Sheets:', estoque);
    console.log('[Produtos] ⏳ Loading:', loading);
  }, [estoque, loading]);

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

  // ✅ Calcular total de itens no carrinho (soma das quantidades)
  const totalItensCarrinho = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantidade, 0);
  }, [cart]);

  const adicionarAoCarrinho = (produto: typeof products[0], event?: React.MouseEvent) => {
    // ✅ Usar a função do hook para verificar disponibilidade
    const disponivel = isProdutoDisponivel(produto.id);
    
    console.log(`[Produtos] 🔍 Verificando produto ${produto.id}:`, { 
      estoque: estoque[produto.id], 
      disponivel 
    });
    
    if (!disponivel) {
      console.log(`[Produtos] ❌ Produto ${produto.id} está INDISPONÍVEL`);
      alert("❌ Este produto está indisponível no momento.");
      return;
    }

    console.log(`[Produtos] ✅ Adicionando produto ${produto.id} ao carrinho`);

    // ✨ Animação profissional de arrastar para o carrinho
    if (event) {
      const target = event.currentTarget as HTMLElement;
      const productCard = target.closest('.product-card') as HTMLElement;
      const productImage = productCard?.querySelector('img') as HTMLImageElement;
      
      if (productImage) {
        const cartIcon = document.querySelector('.cart-icon') as HTMLElement;
        if (cartIcon) {
          // Cria um container para a animação
          const animationContainer = document.createElement('div');
          animationContainer.className = 'cart-animation-container';
          
          // Clone da imagem
          const clone = productImage.cloneNode(true) as HTMLImageElement;
          const rect = productImage.getBoundingClientRect();
          const cartRect = cartIcon.getBoundingClientRect();
          
          // Estilo inicial do container
          animationContainer.style.position = 'fixed';
          animationContainer.style.left = `${rect.left}px`;
          animationContainer.style.top = `${rect.top}px`;
          animationContainer.style.width = `${rect.width}px`;
          animationContainer.style.height = `${rect.height}px`;
          animationContainer.style.zIndex = '9999';
          animationContainer.style.pointerEvents = 'none';
          animationContainer.style.borderRadius = '12px';
          animationContainer.style.overflow = 'hidden';
          animationContainer.style.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.3)';
          animationContainer.style.transition = 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)';
          
          // Estilo do clone
          clone.style.width = '100%';
          clone.style.height = '100%';
          clone.style.objectFit = 'contain';
          clone.style.backgroundColor = 'white';
          
          animationContainer.appendChild(clone);
          document.body.appendChild(animationContainer);
          
          // Adiciona efeito de pulso no carrinho
          cartIcon.style.transition = 'transform 0.3s ease';
          
          // Força reflow
          animationContainer.offsetHeight;
          
          // Anima para o carrinho com efeito de curva
          requestAnimationFrame(() => {
            const targetX = cartRect.left + cartRect.width / 2;
            const targetY = cartRect.top + cartRect.height / 2;
            
            animationContainer.style.left = `${targetX}px`;
            animationContainer.style.top = `${targetY}px`;
            animationContainer.style.width = '50px';
            animationContainer.style.height = '50px';
            animationContainer.style.opacity = '0';
            animationContainer.style.transform = 'scale(0.2) rotate(180deg)';
            animationContainer.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.6)';
            
            // Pulso no carrinho
            setTimeout(() => {
              cartIcon.style.transform = 'scale(1.3)';
              setTimeout(() => {
                cartIcon.style.transform = 'scale(1)';
              }, 200);
            }, 500);
          });
          
          // Remove após animação
          setTimeout(() => {
            animationContainer.remove();
          }, 700);
        }
      }
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
          <a href="/pedidos" className="relative text-emerald-700 hover:text-emerald-900 transition-colors cart-icon">
            <ShoppingCart size={24} />
            {totalItensCarrinho > 0 && (
              <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-xs rounded-full w-5 h-5 grid place-items-center font-semibold">
                {totalItensCarrinho}
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

          <a href="/pedidos" className="relative text-emerald-700 p-2 cart-icon">
            <ShoppingCart size={22} />
            {totalItensCarrinho > 0 && (
              <span className="absolute top-0 right-0 bg-emerald-600 text-white text-xs rounded-full w-5 h-5 grid place-items-center font-semibold">
                {totalItensCarrinho}
              </span>
            )}
          </a>
        </div>

        {menuOpen && (
          <div className="bg-white border-t border-emerald-100 shadow-lg">
            <a href="/" className="flex items-center gap-3 px-4 py-3 text-emerald-700 hover:bg-emerald-50 transition-colors" onClick={() => setMenuOpen(false)}>
              <Home size={18} /> Página Inicial
            </a>
            <a href="/pedidos" className="flex items-center gap-3 px-4 py-3 text-emerald-700 hover:bg-emerald-50 transition-colors" onClick={() => setMenuOpen(false)}>
              <ShoppingCart size={18} /> Meu Carrinho ({totalItensCarrinho} {totalItensCarrinho === 1 ? 'item' : 'itens'})
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

      {/* Loading State */}
      {loading && (
        <div className="container mx-auto px-4 pb-6 text-center">
          <div className="inline-flex items-center gap-2 text-emerald-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
            <span>Carregando disponibilidade...</span>
          </div>
        </div>
      )}

      {/* Vitrine - AGORA LÊ DA PLANILHA! */}
      <main className="container mx-auto px-4 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {produtosFiltrados.map((p) => {
          // ✅ Usar a função do hook
          const disponivel = isProdutoDisponivel(p.id);
          
          console.log(`[Render] Produto ${p.id} (${p.nome}): disponivel=${disponivel}, estoque[${p.id}]=${estoque[p.id]}`);
          
          return (
            <div
              key={p.id}
              className={`product-card relative bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden transition-all duration-300 ${
                recentlyAdded === p.id
                  ? "animate-pop border-emerald-300 shadow-emerald-200"
                  : disponivel 
                    ? "border-emerald-100 hover:shadow-md hover:-translate-y-1"
                    : "border-gray-300 bg-gray-50"
              }`}
            >
              {/* Container da imagem */}
              <div 
                onClick={(e) => disponivel && adicionarAoCarrinho(p, e)} 
                className={`relative w-full h-40 md:h-48 flex items-center justify-center overflow-hidden transition-colors ${
                  disponivel 
                    ? "cursor-pointer hover:bg-emerald-50 bg-white" 
                    : "cursor-not-allowed bg-gray-100"
                }`}
              >
                <img 
                  src={p.imagem} 
                  alt={p.nome} 
                  className={`w-full h-full transition-all duration-300 ${
                    disponivel 
                      ? "" 
                      : "grayscale opacity-30 blur-[0.5px]"
                  }`}
                  style={{ objectFit: 'fill' }} 
                />
                
                {/* Badge "Esgotado" */}
                {!disponivel && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/5">
                    <span className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-md font-semibold shadow-md">
                      Esgotado
                    </span>
                  </div>
                )}
              </div>

              {/* Conteúdo do card */}
              <div 
                onClick={(e) => disponivel && adicionarAoCarrinho(p, e)} 
                className={`flex flex-col flex-1 p-4 md:p-5 ${
                  disponivel ? "cursor-pointer" : "cursor-not-allowed"
                }`}
              >
                <h2 className={`font-semibold text-base md:text-lg mb-1 transition-colors ${
                  disponivel ? "text-emerald-900" : "text-gray-400"
                }`}>
                  {p.nome}
                </h2>
                
                <p className={`text-xs md:text-sm flex-1 transition-colors ${
                  disponivel ? "text-emerald-600" : "text-gray-400"
                }`}>
                  {p.descricao}
                </p>

                <div className="flex items-center justify-between mt-3 md:mt-4">
                  <span className={`text-lg md:text-xl font-bold transition-colors ${
                    disponivel ? "text-emerald-800" : "text-gray-400 line-through"
                  }`}>
                    R$ {p.preco.toFixed(2)}
                  </span>
                  
                  <button
                    disabled={!disponivel}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (disponivel) {
                        adicionarAoCarrinho(p, e);
                      }
                    }}
                    className={`px-3 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-all duration-200 ${
                      disponivel
                        ? recentlyAdded === p.id
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1"
                          : "bg-emerald-600 text-white hover:bg-emerald-700 shadow hover:shadow-md"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
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
        <a href="/pedidos" className="cart-icon bg-emerald-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-emerald-700 transition-all relative">
          <ShoppingCart size={24} />
          {totalItensCarrinho > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 grid place-items-center font-bold">
              {totalItensCarrinho}
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