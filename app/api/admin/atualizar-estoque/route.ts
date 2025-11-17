// ============================================
// ARQUIVO: app/api/admin/atualizar-estoque/route.ts
// ⚠️ IMPORTANTE: Este arquivo DEVE estar neste caminho exato!
// ============================================

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
  id: number;
  linha: number;
  disponivel: boolean;
  nome?: string;
}

interface RequestBody {
  alteracoes: AlteracaoEstoque[];
  spreadsheetId?: string;
}

// ============================================
// ENDPOINT GET - Teste de Saúde
// ============================================
export async function GET() {
  console.log('[API Route] 📡 GET recebido - API funcionando!');
  
  return NextResponse.json({
    status: 'OK',
    message: '✅ API de estoque do Coqueiro Belém funcionando!',
    timestamp: new Date().toISOString(),
    scriptConfigured: SCRIPT_URL.includes('AKfy'),
    projeto: 'O Coqueiro Belém',
    version: '2.0',
    endpoint: '/api/admin/atualizar-estoque'
  });
}

// ============================================
// ENDPOINT POST - Atualizar Estoque
// ============================================
export async function POST(request: NextRequest) {
  try {
    console.log('[API Route] 📥 POST recebido');
    
    const body: RequestBody = await request.json();
    console.log('[API Route] 📦 Body:', JSON.stringify(body, null, 2));
    
    const { alteracoes, spreadsheetId = SPREADSHEET_ID } = body;

    // Validações
    if (!alteracoes || !Array.isArray(alteracoes)) {
      console.error('[API Route] ❌ Dados inválidos');
      return NextResponse.json({ 
        error: 'Dados inválidos: alteracoes deve ser um array' 
      }, { status: 400 });
    }

    if (alteracoes.length === 0) {
      console.error('[API Route] ❌ Array vazio');
      return NextResponse.json({ 
        error: 'Nenhuma alteração fornecida' 
      }, { status: 400 });
    }

    console.log(`[API Route] 🔄 Processando ${alteracoes.length} alterações...`);

    // Processar alterações
    const results = await Promise.allSettled(
      alteracoes.map(async (alteracao) => {
        try {
          const produtoInfo = alteracao.nome ? ` (${alteracao.nome})` : '';
          console.log(`[API Route] 📝 Atualizando produto ${alteracao.id}${produtoInfo} - Linha ${alteracao.linha} - Valor: ${alteracao.disponivel}`);
          
          const payload = {
            action: 'updateCell',
            spreadsheetId,
            range: `Sheet1!C${alteracao.linha}`,
            value: alteracao.disponivel ? 'TRUE' : 'FALSE'
          };

          console.log(`[API Route] 🌐 Enviando para Google Apps Script:`, payload);
          
          const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          });

          console.log(`[API Route] 📡 Resposta do Google: Status ${response.status}`);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API Route] ❌ Erro HTTP ${response.status}:`, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const resultado = await response.json();
          console.log(`[API Route] ✅ Resultado do Google:`, resultado);
          
          if (!resultado.success) {
            throw new Error(resultado.error || 'Erro do Google Apps Script');
          }

          return { 
            sucesso: true, 
            id: alteracao.id,
            disponivel: alteracao.disponivel,
            resultado 
          };

        } catch (error) {
          console.error(`[API Route] ❌ Erro ao atualizar produto ${alteracao.id}:`, error);
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

    console.log(`[API Route] 📊 Resultado final: ${sucessos} sucessos, ${erros.length} erros`);

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

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API Route] ❌ Erro geral:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}