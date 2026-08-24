// =============================================================
// dados.ts - Camada de dados do CotaBot
// Usa localStorage para simular um banco de dados simples
// =============================================================

// --- Tipos (representam as tabelas do banco) ---

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  senha: string;
  resumo_diario: boolean; // configuração de resumo diário
};

export type Alerta = {
  id: number;
  usuario_id: number;
  moeda: "USD" | "EUR" | "BTC";
  valor_alvo: number;
  status: "ativo" | "atingido";
  criado_em: string;
};

export type CotacaoHistorico = {
  id: number;
  moeda: "USD" | "EUR" | "BTC";
  valor: number;
  consultado_em: string;
};

export type Mensagem = {
  id: number;
  texto: string;
  data: string;
};
// --- Funções auxiliares de localStorage ---

function salvar(chave: string, dados: unknown) {
  localStorage.setItem(chave, JSON.stringify(dados));
}

function carregar<T>(chave: string): T[] {
  const item = localStorage.getItem(chave);
  if (!item) return [];
  return JSON.parse(item) as T[];
}

function proximoId(lista: { id: number }[]): number {
  if (lista.length === 0) return 1;
  return Math.max(...lista.map((item) => item.id)) + 1;
}

// --- Usuários ---

export function buscarUsuarios(): Usuario[] {
  return carregar<Usuario>("cotabot_usuarios");
}

export function cadastrarUsuario(nome: string, email: string, senha: string): string | null {
  const usuarios = buscarUsuarios();
  const jaExiste = usuarios.find((u) => u.email === email);
  if (jaExiste) return "E-mail já cadastrado.";

  const novo: Usuario = {
    id: proximoId(usuarios),
    nome,
    email,
    senha,
    resumo_diario: false,
  };
  usuarios.push(novo);
  salvar("cotabot_usuarios", usuarios);
  return null; // null = sem erro
}

export function fazerLogin(email: string, senha: string): Usuario | null {
  const usuarios = buscarUsuarios();
  return usuarios.find((u) => u.email === email && u.senha === senha) ?? null;
}

export async function atualizarResumoDiario(
  usuario_id: number,
  ativo: boolean
): Promise<void> {
  await fetch("http://127.0.0.1:5000/configuracoes/resumo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ativo: ativo,
    }),
  });
}

export async function buscarResumoDiario(): Promise<boolean> {
  try {
    const resposta = await fetch(
      "http://127.0.0.1:5000/configuracoes/resumo"
    );

    if (!resposta.ok) {
      throw new Error("Erro ao buscar configuração");
    }

    const dados = await resposta.json();

    return dados.resumo_diario;
  } catch (erro) {
    console.error("Erro ao buscar resumo diário:", erro);
    return false;
  }
}

// --- Alertas ---

export async function buscarAlertas(usuario_id: number): Promise<Alerta[]> {
  try {
    const resposta = await fetch("http://127.0.0.1:5000/alertas");

    if (!resposta.ok) {
      throw new Error("Erro ao buscar alertas");
    }

    const dados = await resposta.json();

    return dados;
  } catch (erro) {
    console.error("Erro ao buscar alertas:", erro);
    return [];
  }
}

export async function criarAlerta(
  usuario_id: number,
  moeda: Alerta["moeda"],
  valor_alvo: number
): Promise<void> {
  const resposta = await fetch("http://127.0.0.1:5000/alertas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      moeda: moeda,
      valor_alvo: valor_alvo,
    }),
  });

  if (!resposta.ok) {
    throw new Error("Erro ao cadastrar alerta.");
  }
}

export async function excluirAlerta(alerta_id: number): Promise<void> {
  const resposta = await fetch(
    `http://127.0.0.1:5000/alertas/${alerta_id}`,
    {
      method: "DELETE",
    }
  );

  if (!resposta.ok) {
    throw new Error("Erro ao excluir alerta.");
  }
}


// --- Cotações (histórico) ---

export function salvarCotacao(moeda: CotacaoHistorico["moeda"], valor: number): void {
  const historico = carregar<CotacaoHistorico>("cotabot_cotacoes");
  const novo: CotacaoHistorico = {
    id: proximoId(historico),
    moeda,
    valor,
    consultado_em: new Date().toLocaleString("pt-BR"),
  };
  historico.push(novo);
  // Guarda só as últimas 100 entradas para não lotar o localStorage
  const recentes = historico.slice(-100);
  salvar("cotabot_cotacoes", recentes);
}

// --- Mensagens ---
export async function buscarMensagens(
  usuario_id: number
): Promise<Mensagem[]> {
  try {
    const resposta = await fetch("http://127.0.0.1:5000/mensagens");

    if (!resposta.ok) {
      throw new Error("Erro ao buscar mensagens");
    }

    const dados = await resposta.json();

    return dados;
  } catch (erro) {
    console.error("Erro ao buscar mensagens:", erro);
    return [];
  }
}

export function criarMensagem(usuario_id: number, texto: string): void {
  const todas = carregar<Mensagem>("cotabot_mensagens");
  const nova: Mensagem = {
    id: proximoId(todas),
    usuario_id,
    texto,
    criado_em: new Date().toLocaleString("pt-BR"),
  };
  todas.push(nova);
  salvar("cotabot_mensagens", todas);
}

// --- API de Cotações (AwesomeAPI) ---
// Documentação: https://docs.awesomeapi.com.br/api-de-moedas

export type CotacaoAtual = {
  USD: number | null;
  EUR: number | null;
  BTC: number | null;
};

export async function buscarCotacoesAPI(): Promise<CotacaoAtual> {
  try {
    const resposta = await fetch(
      "https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL"
    );
    const dados = await resposta.json();
    return {
      USD: parseFloat(dados["USDBRL"]?.bid ?? "0"),
      EUR: parseFloat(dados["EURBRL"]?.bid ?? "0"),
      BTC: parseFloat(dados["BTCBRL"]?.bid ?? "0"),
    };
  } catch (erro) {
    console.error("Erro ao buscar cotações:", erro);
    return { USD: null, EUR: null, BTC: null };
  }
}

export function formatarMoeda(moeda: string, valor: number | null): string {
  if (valor === null) return "Indisponível";
  if (moeda === "BTC") {
    return `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  }
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}
