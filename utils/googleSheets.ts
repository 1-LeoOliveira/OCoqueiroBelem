// utils/googleSheets.ts - O Coqueiro Belém
import { useState, useEffect, useCallback } from 'react';

// ============================================
// CONFIGURAÇÕES DO PROJETO
// ============================================
const GOOGLE_SHEETS_API_KEY = 'AIzaSyDVgYZobP5Aa222GtfVL25bhgacNBiNYUE';
const SPREADSHEET_ID = '1-63Zw_i7_ldl7rNXj2CBs70XtdRmdedDQUpdgUdV77w';
const SHEET_RANGE = 'Sheet1!A:D'; // ID, Nome, Disponivel, Categoria
const AUTO_RELOAD_INTERVAL = 2 * 60 * 1000; // 2 minutos

// ============================================
// TIPOS
// ============================================
export interface ProdutoEstoque {
  id: number;
  nome: string;
  disponivel: boolean;
  categoria?: string;
}

// ============================================
// DADOS DE FALLBACK LOCAL
// ============================================
// Backup local caso a API do Google falhe
const ESTOQUE_FALLBACK: Record<number, boolean> = {
  // Varejo
  1: true,   // Água de Coco 300ml
  3: true,   // Água de Coco 1L
  4: true,   // Coco Verde Inteiro
  5: true,   // Coco Gelado (unidade)
  6: true,   // Kit 6 Cocos Verdes
  
  // Atacado
  101: true, // Coco Verde (50un)
  102: true, // Caixa Água de Coco 300ml (12un)
  103: true, // Caixa Água de Coco 1L (6un)
};

// ============================================
// ARMAZENAMENTO LOCAL (Sem usar localStorage)
// ============================================
let estoqueAtualCache: Record<number, boolean> = { ...ESTOQUE_FALLBACK };
let ultimaAtualizacao: Date | null = null;

// Função para obter estoque local (para components)
export function getEstoqueLocal(): Record<number, boolean> {
  return { ...estoqueAtualCache };
}

// Função para atualizar estoque local
function setEstoqueLocal(novoEstoque: Record<number, boolean>) {
  estoqueAtualCache = { ...novoEstoque };
  ultimaAtualizacao = new Date();
  
  // Disparar evento personalizado para atualizar components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('estoqueAtualizado', { 
      detail: estoqueAtualCache 
    }));
  }
}

// ============================================
// PROCESSAR DADOS DA PLANILHA
// ============================================
function processarLinhaProduto(linha: string[], index: number): ProdutoEstoque | null {
  try {
    if (!linha || linha.length < 2) {
      console.log(`[Estoque] ⚠️ Linha ${index + 2} vazia ou incompleta`);
      return null;
    }

    const idRaw = linha[0]?.trim();
    const nome = linha[1]?.trim();
    const disponivelRaw = linha[2]?.trim();
    const categoria = linha[3]?.trim();

    // Validar ID
    const id = parseInt(idRaw || '0');
    if (isNaN(id) || id <= 0) {
      console.log(`[Estoque] ⚠️ ID inválido na linha ${index + 2}: "${idRaw}"`);
      return null;
    }

    // Validar nome
    if (!nome) {
      console.log(`[Estoque] ⚠️ Nome vazio na linha ${index + 2}`);
      return null;
    }

    // Processar disponibilidade
    // Se vazio ou TRUE = disponível, se FALSE = indisponível
    const disponivel = parseDisponibilidade(disponivelRaw);

    console.log(`[Estoque] ✅ Produto: ID=${id}, Nome="${nome}", Disponível=${disponivel}`);

    return { id, nome, disponivel, categoria };

  } catch (err) {
    console.error(`[Estoque] ❌ Erro ao processar linha ${index + 2}:`, err);
    return null;
  }
}

function parseDisponibilidade(valor: string | undefined): boolean {
  if (!valor || valor === '') {
    return true; // Vazio = disponível por padrão
  }
  
  const valorLower = valor.toLowerCase().trim();
  const indisponivel = ['false', 'não', 'nao', 'no', '0', 'indisponivel', 'indisponível', 'esgotado'];
  
  return !indisponivel.includes(valorLower);
}

// ============================================
// BUSCAR DADOS DO GOOGLE SHEETS
// ============================================
async function buscarEstoqueDaPlanilha(): Promise<Record<number, boolean>> {
  try {
    console.log('[Estoque] 🔄 Buscando estoque da planilha...');
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_RANGE}?key=${GOOGLE_SHEETS_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    console.log('[Estoque] 📡 Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Estoque] ❌ Erro na API:', errorText);
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.values || data.values.length <= 1) {
      throw new Error('Planilha vazia ou só com cabeçalho');
    }
    
    // Processar produtos
    const [_cabecalho, ...linhas] = data.values;
    console.log(`[Estoque] 📊 ${linhas.length} produtos na planilha`);
    
    const produtos = linhas
      .map((linha, index) => processarLinhaProduto(linha, index))
      .filter((p): p is ProdutoEstoque => p !== null);
    
    // Converter para objeto { id: disponivel }
    const estoque: Record<number, boolean> = {};
    produtos.forEach(p => {
      estoque[p.id] = p.disponivel;
    });
    
    console.log('[Estoque] ✅ Estoque carregado:', estoque);
    return estoque;
    
  } catch (err) {
    console.error('[Estoque] 💥 Erro ao buscar planilha:', err);
    throw err;
  }
}

// ============================================
// HOOK PRINCIPAL
// ============================================
export interface UseEstoqueReturn {
  produtos: ProdutoEstoque[];
  estoque: Record<number, boolean>;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  usingFallback: boolean;
  
  // Funções
  recarregar: () => void;
  isProdutoDisponivel: (id: number) => boolean;
  
  // Status
  apiStatus: 'loading' | 'success' | 'error' | 'fallback';
}

export function useEstoque(): UseEstoqueReturn {
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([]);
  const [estoque, setEstoque] = useState<Record<number, boolean>>(getEstoqueLocal());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(ultimaAtualizacao);
  const [usingFallback, setUsingFallback] = useState(false);

  // Carregar dados
  const carregarEstoque = useCallback(async () => {
    try {
      console.log('[Hook] 🚀 Carregando estoque...');
      setLoading(true);
      setError(null);
      setUsingFallback(false);
      
      const novoEstoque = await buscarEstoqueDaPlanilha();
      
      // Atualizar cache local
      setEstoqueLocal(novoEstoque);
      setEstoque(novoEstoque);
      
      // Criar lista de produtos para o estado
      const listaProdutos: ProdutoEstoque[] = Object.entries(novoEstoque).map(([id, disponivel]) => ({
        id: parseInt(id),
        nome: `Produto ${id}`,
        disponivel
      }));
      
      setProdutos(listaProdutos);
      setLastUpdate(new Date());
      setLoading(false);
      
      console.log('[Hook] ✅ Estoque atualizado com sucesso!');
      
    } catch (err) {
      console.warn('[Hook] ⚠️ Erro ao carregar, usando fallback local...');
      
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMsg);
      
      // Usar fallback
      setEstoqueLocal(ESTOQUE_FALLBACK);
      setEstoque(ESTOQUE_FALLBACK);
      
      const listaProdutos: ProdutoEstoque[] = Object.entries(ESTOQUE_FALLBACK).map(([id, disponivel]) => ({
        id: parseInt(id),
        nome: `Produto ${id}`,
        disponivel
      }));
      
      setProdutos(listaProdutos);
      setUsingFallback(true);
      setLastUpdate(new Date());
      setLoading(false);
      
      console.log('[Hook] 🏠 Usando dados locais');
    }
  }, []);

  // Verificar disponibilidade de produto
  const isProdutoDisponivel = useCallback((id: number): boolean => {
    const disponivel = estoque[id] !== false; // undefined ou true = disponível
    console.log(`[Hook] 🔍 Produto ${id}: ${disponivel ? 'DISPONÍVEL' : 'INDISPONÍVEL'}`);
    return disponivel;
  }, [estoque]);

  // Recarregar manualmente
  const recarregar = useCallback(() => {
    console.log('[Hook] 🔄 Recarregamento manual solicitado');
    carregarEstoque();
  }, [carregarEstoque]);

  // Carregar na montagem
  useEffect(() => {
    console.log('[Hook] 🎬 Hook montado, carregando estoque inicial...');
    carregarEstoque();
  }, [carregarEstoque]);

  // Auto-reload
  useEffect(() => {
    if (!error && !usingFallback && AUTO_RELOAD_INTERVAL > 0) {
      console.log(`[Hook] ⏰ Auto-reload configurado (${AUTO_RELOAD_INTERVAL / 1000}s)`);
      
      const interval = setInterval(() => {
        console.log('[Hook] 🔄 Auto-reload executando...');
        carregarEstoque();
      }, AUTO_RELOAD_INTERVAL);

      return () => {
        console.log('[Hook] ⏰ Auto-reload cancelado');
        clearInterval(interval);
      };
    }
  }, [error, usingFallback, carregarEstoque]);

  // Status da API
  const apiStatus: UseEstoqueReturn['apiStatus'] = 
    usingFallback ? 'fallback' : 
    error ? 'error' : 
    loading ? 'loading' : 
    'success';

  return {
    produtos,
    estoque,
    loading,
    error,
    lastUpdate,
    usingFallback,
    recarregar,
    isProdutoDisponivel,
    apiStatus,
  };
}

// ============================================
// FUNÇÃO DE DEBUG
// ============================================
export async function testarAPIEstoque() {
  try {
    console.log('🧪 TESTE MANUAL DA API - ESTOQUE');
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_RANGE}?key=${GOOGLE_SHEETS_API_KEY}`;
    console.log('🔗 URL:', url);
    
    const response = await fetch(url);
    console.log('📡 Status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro:', errorText);
      return { sucesso: false, erro: errorText };
    }
    
    const data = await response.json();
    console.log('✅ Dados recebidos:', data);
    console.log('📊 Linhas:', data.values?.length || 0);
    
    if (data.values && data.values.length > 1) {
      console.log('📋 Cabeçalho:', data.values[0]);
      console.log('📦 Primeiras linhas:', data.values.slice(1, 4));
    }
    
    return { sucesso: true, dados: data };
    
  } catch (err) {
    console.error('💥 Erro na requisição:', err);
    return { sucesso: false, erro: err };
  }
}

// ============================================
// FUNÇÕES PARA O PAINEL ADMIN
// ============================================

/**
 * Atualizar disponibilidade de um produto via API
 */
export async function atualizarDisponibilidade(
  produtoId: number, 
  disponivel: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[API] 📤 Atualizando produto ${produtoId} para ${disponivel ? 'disponível' : 'indisponível'}`);
    
    // Mapear ID do produto para linha na planilha
    const linhaNaPlanilha = produtoId === 1 ? 2 : 
                           produtoId === 3 ? 3 : 
                           produtoId === 4 ? 4 : 
                           produtoId === 5 ? 5 :
                           produtoId === 6 ? 6 :
                           produtoId === 101 ? 7 : 
                           produtoId === 102 ? 8 : 
                           produtoId === 103 ? 9 : 2;

    const url = '/api/admin/atualizar-estoque';
    const body = {
      alteracoes: [{
        id: produtoId,
        linha: linhaNaPlanilha,
        disponivel: disponivel,
      }]
    };

    console.log('[API] 🔗 URL:', url);
    console.log('[API] 📦 Body:', JSON.stringify(body));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    console.log('[API] 📡 Status:', response.status, response.statusText);
    console.log('[API] 📄 Content-Type:', response.headers.get('content-type'));

    // Verificar se é HTML (erro 404)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      console.error('[API] ❌ Resposta é HTML, não JSON - API não encontrada!');
      const htmlText = await response.text();
      console.error('[API] 📄 HTML recebido:', htmlText.substring(0, 200));
      return { 
        success: false, 
        error: 'API não encontrada. Verifique se o arquivo route.ts existe em app/api/admin/atualizar-estoque/' 
      };
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        const textError = await response.text();
        console.error('[API] ❌ Erro ao parsear resposta:', textError);
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${textError}` 
        };
      }
      console.error('[API] ❌ Erro na resposta:', errorData);
      return { 
        success: false, 
        error: errorData.error || `HTTP ${response.status}` 
      };
    }

    const data = await response.json();
    console.log('[API] ✅ Resposta:', data);

    if (data.erros > 0) {
      return { 
        success: false, 
        error: `${data.erros} erro(s) ao atualizar` 
      };
    }

    // Atualizar cache local
    const novoEstoque = getEstoqueLocal();
    novoEstoque[produtoId] = disponivel;
    setEstoqueLocal(novoEstoque);

    return { success: true };

  } catch (error) {
    console.error('[API] 💥 Erro ao atualizar:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Broadcast de estoque atualizado para outros componentes
 */
export function broadcastEstoque(estoque: Record<number, boolean>) {
  console.log('[Broadcast] 📡 Transmitindo atualização de estoque');
  
  // Atualizar cache local
  setEstoqueLocal(estoque);
  
  // Disparar evento customizado
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('estoqueAtualizado', { 
      detail: estoque 
    }));
    
    // Também disparar evento de storage para sincronizar entre abas
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'coqueiro_estoque_update',
      newValue: JSON.stringify(estoque),
      url: window.location.href
    }));
  }
}

// Expor no console
if (typeof window !== 'undefined') {
  (window as any).testarEstoque = testarAPIEstoque;
  (window as any).getEstoqueAtual = getEstoqueLocal;
  (window as any).atualizarDisponibilidade = atualizarDisponibilidade;
  console.log('🔧 Debug disponível:');
  console.log('  - window.testarEstoque() - Testar API');
  console.log('  - window.getEstoqueAtual() - Ver estoque em cache');
  console.log('  - window.atualizarDisponibilidade(id, disponivel) - Atualizar produto');
}