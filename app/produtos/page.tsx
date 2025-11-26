"use client";
import { ShoppingCart } from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen text-emerald-50 overflow-hidden">
      {/* Background com cor que combina com coco */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-50 via-emerald-100 to-teal-200">
        {/* Padrão decorativo */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(52, 211, 153, 0.4) 0%, transparent 50%),
                           radial-gradient(circle at 80% 80%, rgba(251, 191, 36, 0.4) 0%, transparent 50%),
                           radial-gradient(circle at 40% 20%, rgba(16, 185, 129, 0.3) 0%, transparent 50%)`
        }} />
      </div>

      {/* Conteúdo principal */}
      <section className="relative container mx-auto px-6 sm:px-8 py-24 flex flex-col items-center text-center">
        {/* Logo dentro de um círculo */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 mb-8">
          <div className="absolute inset-0 rounded-full bg-white shadow-2xl overflow-hidden border-8">
            <img
              src="/img/logo2.jpeg"
              alt="Logo O Coqueiro Belém"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Brilho decorativo */}
          <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-emerald-400/20 to-amber-400/20 blur-xl -z-10" />
        </div>

        <p className="mt-6 text-base sm:text-lg text-emerald-800 font-medium max-w-2xl leading-relaxed px-2 drop-shadow-sm">
          Refrescância natural e sabor do Pará! Distribuímos água de coco e derivados
          com qualidade, frescor e amor pela natureza.
        </p>

        <div className="mt-10">
          <a
            href="/produtos"
            className="px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg hover:scale-105 transition-transform inline-block"
          >
            Ver Produtos
          </a>
        </div>
      </section>

      {/* Benefícios */}
      <section className="relative container mx-auto px-6 sm:px-8 pb-20">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-10 shadow-xl border border-emerald-200">
          <h2 className="text-2xl font-bold text-center text-emerald-900 mb-10">
            Por que escolher O Coqueiro Belém?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "100% Natural",
                desc: "Coco fresco selecionado, sem conservantes.",
                icon: "🥥",
              },
              {
                title: "Entrega Rápida",
                desc: "Levamos o sabor do coco até você, no mesmo dia.",
                icon: "🚚",
              },
              {
                title: "Atacado e Varejo",
                desc: "Abasteça sua loja ou garanta seu estoque pessoal.",
                icon: "💧",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/30 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-sm border border-emerald-200/30 text-center"
              >
                <div className="text-4xl mb-3 opacity-70">{item.icon}</div>
                <h3 className="font-bold text-emerald-900 text-lg mb-1">
                  {item.title}
                </h3>
                <p className="text-emerald-800 text-sm sm:text-base">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Botão Flutuante Mobile - Ver Produtos */}
      <div className="md:hidden fixed bottom-4 right-4 z-30">
        <a
          href="/produtos"
          className="bg-emerald-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-emerald-700 transition-colors"
        >
          <ShoppingCart size={24} />
        </a>
      </div>

      {/* Botão Desktop no Final */}
      <section className="relative container mx-auto px-6 sm:px-8 pb-16">
        <div className="text-center">
          <a
            href="/produtos"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg hover:scale-105 transition-transform"
          >
            <ShoppingCart size={20} />
            Ver Todos os Produtos
          </a>
        </div>
      </section>
    </main>
  );
}