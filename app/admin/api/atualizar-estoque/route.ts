// app/api/admin/atualizar-estoque/route.ts
// IMPORTANTE: Este arquivo deve estar em: app/api/admin/atualizar-estoque/route.ts
import { NextRequest, NextResponse } from 'next/server';

// ============================================
// CONFIGURAÇÕES
// ============================================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwmNnUOBCQiHzzHRxI1LQ24jWc_9S9YWeqNj_6eihrv5qPoYTvz9k5s8tM2C23IlHdP/exec';
const SPREADSHEET_ID = '1-63Zw_i7_ldl7rNXj2CBs70XtdRmdedDQUpdgUdV77w';

// ============================================
// TIPOS
// ============================================
interface AlteracaoEstoque {
  id: number;              // ID do produto
  linha: number;           // Linha na planilha (começa em 2)
  disponivel: boolean;     // Novo status de disponibilidade
  nome?: string;           // Nome do produto (opcional, para logs)
}

interface RequestBody {
  alteracoes: AlteracaoEstoque[];
  spreadsheetId?: string;
}

// ============================================
// ENDPOINT GET - Teste de Saúde
// ============================================
export async function GET() {
  return NextResponse.json({
    status: 'OK',
    message: 'API de estoque funcionando!',
    timestamp: new Date().toISOString(),
    scriptConfigured: true,
    projeto: 'O Coqueiro Belém'
  });
}

// ============================================
// ENDPOINT POST - Atualizar Estoque
// ============================================
export async function POST(request: NextRequest) {
  try {
    console.log('[API] 📄 Recebendo requisição POST...');
    
    const body: RequestBody = await request.json();
    console.log('[API] 📦 Dados recebidos:', body);
    
    const { alteracoes, spreadsheetId = SPREADSHEET_ID } = body;

    // Validações
    if (!alteracoes || !Array.isArray(alteracoes)) {
      return NextResponse.json({ 
        error: 'Dados inválidos: alteracoes deve ser um array' 
      }, { status: 400 });
    }

    if (alteracoes.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhuma alteração fornecida' 
      }, { status: 400 });
    }

    console.log(`[API] 💾 Processando ${alteracoes.length} alterações de estoque...`);

    // Processar alterações em paralelo
    const results = await Promise.allSettled(
      alteracoes.map(async (alteracao) => {
        try {
          const produtoInfo = alteracao.nome ? ` (${alteracao.nome})` : '';
          console.log(`[API] 🔧 Atualizando produto ${alteracao.id}${produtoInfo} na linha ${alteracao.linha}`);
          
          const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'updateCell',
              spreadsheetId,
              range: `Sheet1!C${alteracao.linha}`, // Coluna C = Disponivel
              value: alteracao.disponivel ? 'TRUE' : 'FALSE'
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const resultado = await response.json();
          
          if (!resultado.success) {
            throw new Error(resultado.error || 'Erro do Google Apps Script');
          }

          console.log(`[API] ✅ Produto ${alteracao.id} atualizado com sucesso`);

          return { 
            sucesso: true, 
            id: alteracao.id,
            disponivel: alteracao.disponivel,
            resultado 
          };

        } catch (error) {
          console.error(`[API] ❌ Erro ao atualizar produto ${alteracao.id}:`, error);
          return { 
            sucesso: false, 
            id: alteracao.id,
            erro: error instanceof Error ? error.message : 'Erro desconhecido' 
          };
        }
      })
    );

    // Análise de resultados
    const sucessos = results.filter(result => 
      result.status === 'fulfilled' && result.value.sucesso
    ).length;
    
    const erros = results.filter(result => 
      result.status === 'rejected' || 
      (result.status === 'fulfilled' && !result.value.sucesso)
    );

    const detalhesErros = erros.map(result => {
      if (result.status === 'rejected') {
        return { erro: result.reason };
      } else if (result.status === 'fulfilled') {
        return result.value;
      }
      return null;
    }).filter(Boolean);

    console.log(`[API] 📊 Resultado: ${sucessos} sucessos, ${erros.length} erros`);
    
    const response = {
      sucesso: sucessos,
      erros: erros.length,
      total: alteracoes.length,
      message: erros.length === 0 
        ? `✅ ${sucessos} produtos atualizados com sucesso!`
        : `⚠️ ${sucessos} produtos atualizados, ${erros.length} com erro`,
      detalhes: results.map(r => r.status === 'fulfilled' ? r.value : { sucesso: false, erro: 'rejected' }),
      timestamp: new Date().toISOString()
    };

    if (detalhesErros.length > 0) {
      (response as any).detalhesErros = detalhesErros;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] ❌ Erro geral:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Buscar linha do produto por ID
 * Útil se você não souber a linha exata
 */
export async function buscarLinhaPorId(produtoId: number): Promise<number | null> {
  try {
    // Esta função assumiria que você tem outra API para buscar
    // Por enquanto, retorna null (implementar se necessário)
    return null;
  } catch (error) {
    console.error('[API] Erro ao buscar linha:', error);
    return null;
  }
}