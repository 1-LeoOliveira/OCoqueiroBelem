"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Trash2, ShoppingBag, Home, ChevronRight } from "lucide-react";

interface Item {
  id: number;
  nome: string;
  preco: number;
  imagem: string;
  quantidade: number;
}

export default function PedidosPage() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("carrinho");
    setItems(saved ? JSON.parse(saved) : []);
  }, []);

  const atualizar = (id: number, delta: number) => {
    setItems(prev => {
      const atualizados = prev
        .map(i =>
          i.id === id
            ? { ...i, quantidade: Math.max(i.quantidade + delta, 1) }
            : i
        )
        .filter(i => i.quantidade > 0);
      localStorage.setItem("carrinho", JSON.stringify(atualizados));
      return atualizados;
    });
  };

  const remover = (id: number) => {
    const filtrados = items.filter(i => i.id !== id);
    setItems(filtrados);
    localStorage.setItem("carrinho", JSON.stringify(filtrados));
  };

  const subtotal = useMemo(() => items.reduce((t, i) => t + i.preco * i.quantidade, 0), [items]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-emerald-50 to-white">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-emerald-100 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/produtos" className="text-emerald-700 flex items-center gap-2">
            <ArrowLeft size={18} /> Voltar
          </Link>
          <h1 className="font-bold text-emerald-900 flex items-center gap-2">
            <ShoppingBag className="text-emerald-600" size={20} /> Meu Pedido
          </h1>
          <Link href="/" className="text-emerald-700 flex items-center gap-1">
            <Home size={18} /> Início
          </Link>
        </div>
      </header>

      <section className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        {items.length === 0 ? (
          <div className="bg-white border border-emerald-100 rounded-2xl p-8 text-center shadow-sm">
            <p className="text-emerald-800 text-lg mb-4">Seu carrinho está vazio 🥥</p>
            <Link href="/produtos" className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700">
              Ver Produtos
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {items.map(item => (
                <div key={item.id} className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                  <div className="relative w-20 h-20 bg-emerald-50 rounded-xl overflow-hidden">
                    <Image src={item.imagem} alt={item.nome} fill className="object-contain p-2" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-emerald-900">{item.nome}</h2>
                    <p className="text-emerald-700 text-sm">R$ {item.preco.toFixed(2)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={() => atualizar(item.id, -1)} className="w-7 h-7 bg-emerald-100 rounded-md text-emerald-800">−</button>
                      <span className="w-6 text-center font-semibold text-emerald-900">{item.quantidade}</span>
                      <button onClick={() => atualizar(item.id, 1)} className="w-7 h-7 bg-emerald-100 rounded-md text-emerald-800">+</button>
                    </div>
                  </div>
                  <button onClick={() => remover(item.id)} className="text-emerald-600 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between text-emerald-900 font-medium">
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="mt-2 pt-3 border-t flex justify-between font-semibold text-emerald-900">
                <span>Total</span>
                <span className="text-lg text-emerald-700">R$ {subtotal.toFixed(2)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-700 transition-colors"
            >
              Prosseguir para Finalização <ChevronRight size={18} />
            </Link>
          </>
        )}
      </section>
    </main>
  );
}