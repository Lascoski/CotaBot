import { useState, useEffect } from "react";
import {
  fazerLogin,
  cadastrarUsuario,
  buscarAlertas,
  criarAlerta,
  excluirAlerta,
  buscarMensagens,
  buscarCotacoesAPI,
  salvarCotacao,
  formatarMoeda,
  atualizarResumoDiario,
  buscarResumoDiario,
  buscarUsuarios,
  type Usuario,
  type Alerta,
  type Mensagem,
  type CotacaoAtual,
} from "./dados";

// =====================================================================
// Tela de Login e Cadastro
// =====================================================================
function TelaLogin({ aoEntrar }: { aoEntrar: (usuario: Usuario) => void }) {
  const [tela, setTela] = useState<"login" | "cadastro">("login");

  // Login
  const [emailLogin, setEmailLogin] = useState("");
  const [senhaLogin, setSenhaLogin] = useState("");
  const [erroLogin, setErroLogin] = useState("");

  // Cadastro
  const [nome, setNome] = useState("");
  const [emailCad, setEmailCad] = useState("");
  const [senhaCad, setSenhaCad] = useState("");
  const [erroCad, setErroCad] = useState("");
  const [sucessoCad, setSucessoCad] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErroLogin("");
    const usuario = fazerLogin(emailLogin, senhaLogin);
    if (!usuario) {
      setErroLogin("E-mail ou senha incorretos.");
      return;
    }
    aoEntrar(usuario);
  }

  function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    setErroCad("");
    setSucessoCad("");
    if (!nome || !emailCad || !senhaCad) {
      setErroCad("Preencha todos os campos.");
      return;
    }
    const erro = cadastrarUsuario(nome, emailCad, senhaCad);
    if (erro) {
      setErroCad(erro);
      return;
    }
    setSucessoCad("Cadastro realizado! Faça o login.");
    setNome("");
    setEmailCad("");
    setSenhaCad("");
    setTimeout(() => setTela("login"), 1500);
  }

  return (
    <div style={{ maxWidth: 380, margin: "80px auto", padding: 20 }}>
      <h1 style={{ textAlign: "center", marginBottom: 4 }}>CotaBot</h1>
      <p style={{ textAlign: "center", color: "#666", marginBottom: 24 }}>
        Alertas de cotação de moedas
      </p>

      <div style={{ display: "flex", marginBottom: 16, borderBottom: "1px solid #ccc" }}>
        <button
          onClick={() => setTela("login")}
          style={{
            flex: 1,
            padding: "8px 0",
            background: "none",
            border: "none",
            borderBottom: tela === "login" ? "2px solid #333" : "none",
            fontWeight: tela === "login" ? "bold" : "normal",
            cursor: "pointer",
          }}
        >
          Login
        </button>
        <button
          onClick={() => setTela("cadastro")}
          style={{
            flex: 1,
            padding: "8px 0",
            background: "none",
            border: "none",
            borderBottom: tela === "cadastro" ? "2px solid #333" : "none",
            fontWeight: tela === "cadastro" ? "bold" : "normal",
            cursor: "pointer",
          }}
        >
          Cadastro
        </button>
      </div>

      {tela === "login" && (
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 12 }}>
            <label>E-mail:</label>
            <br />
            <input
              type="email"
              value={emailLogin}
              onChange={(e) => setEmailLogin(e.target.value)}
              style={{ width: "100%", padding: "6px 8px", marginTop: 4, border: "1px solid #ccc" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Senha:</label>
            <br />
            <input
              type="password"
              value={senhaLogin}
              onChange={(e) => setSenhaLogin(e.target.value)}
              style={{ width: "100%", padding: "6px 8px", marginTop: 4, border: "1px solid #ccc" }}
            />
          </div>
          {erroLogin && <p style={{ color: "red", margin: "8px 0" }}>{erroLogin}</p>}
          <button
            type="submit"
            style={{ width: "100%", padding: "8px", background: "#333", color: "#fff", border: "none", cursor: "pointer" }}
          >
            Entrar
          </button>
        </form>
      )}

      {tela === "cadastro" && (
        <form onSubmit={handleCadastro}>
          <div style={{ marginBottom: 12 }}>
            <label>Nome:</label>
            <br />
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={{ width: "100%", padding: "6px 8px", marginTop: 4, border: "1px solid #ccc" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>E-mail:</label>
            <br />
            <input
              type="email"
              value={emailCad}
              onChange={(e) => setEmailCad(e.target.value)}
              style={{ width: "100%", padding: "6px 8px", marginTop: 4, border: "1px solid #ccc" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Senha:</label>
            <br />
            <input
              type="password"
              value={senhaCad}
              onChange={(e) => setSenhaCad(e.target.value)}
              style={{ width: "100%", padding: "6px 8px", marginTop: 4, border: "1px solid #ccc" }}
            />
          </div>
          {erroCad && <p style={{ color: "red", margin: "8px 0" }}>{erroCad}</p>}
          {sucessoCad && <p style={{ color: "green", margin: "8px 0" }}>{sucessoCad}</p>}
          <button
            type="submit"
            style={{ width: "100%", padding: "8px", background: "#333", color: "#fff", border: "none", cursor: "pointer" }}
          >
            Cadastrar
          </button>
        </form>
      )}
    </div>
  );
}

// =====================================================================
// Formulário de Novo Alerta
// =====================================================================
function FormNovoAlerta({
  usuarioId,
  cotacoes,
  aoSalvar,
  aoCancelar,
}: {
  usuarioId: number;
  cotacoes: CotacaoAtual;
  aoSalvar: () => void;
  aoCancelar: () => void;
}) {
  const [moeda, setMoeda] = useState<"USD" | "EUR" | "BTC">("USD");
  const [valorAlvo, setValorAlvo] = useState("");
  const [erro, setErro] = useState("");

  async function handleSalvar(e: React.FormEvent) {
  e.preventDefault();
  setErro("");

  const valor = parseFloat(valorAlvo.replace(",", "."));

  if (isNaN(valor) || valor <= 0) {
    setErro("Informe um valor válido maior que zero.");
    return;
  }

  await criarAlerta(usuarioId, moeda, valor);

  aoSalvar();
}

  const cotacaoAtual = cotacoes[moeda];

  return (
    <div style={{ background: "#fff", border: "1px solid #ccc", padding: 20, marginBottom: 20 }}>
      <h3 style={{ marginTop: 0 }}>Novo Alerta</h3>

      {cotacaoAtual !== null && (
        <p style={{ color: "#555", marginBottom: 12 }}>
          Cotação atual do {moeda}: <strong>{formatarMoeda(moeda, cotacaoAtual)}</strong>
        </p>
      )}
      {cotacaoAtual === null && (
        <p style={{ color: "#888", marginBottom: 12 }}>Cotação não disponível no momento.</p>
      )}

      <form onSubmit={handleSalvar}>
        <div style={{ marginBottom: 12 }}>
          <label>Moeda:</label>
          <br />
          <select
            value={moeda}
            onChange={(e) => setMoeda(e.target.value as "USD" | "EUR" | "BTC")}
            style={{ padding: "6px 8px", marginTop: 4, border: "1px solid #ccc", width: 200 }}
          >
            <option value="USD">Dólar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="BTC">Bitcoin (BTC)</option>
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Valor-alvo (em R$):</label>
          <br />
          <input
            type="text"
            value={valorAlvo}
            onChange={(e) => setValorAlvo(e.target.value)}
            placeholder="Ex: 5.50"
            style={{ padding: "6px 8px", marginTop: 4, border: "1px solid #ccc", width: 200 }}
          />
        </div>

        {erro && <p style={{ color: "red", margin: "8px 0" }}>{erro}</p>}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="submit"
            style={{ padding: "7px 16px", background: "#2a7", color: "#fff", border: "none", cursor: "pointer" }}
          >
            Salvar Alerta
          </button>
          <button
            type="button"
            onClick={aoCancelar}
            style={{ padding: "7px 16px", background: "#aaa", color: "#fff", border: "none", cursor: "pointer" }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

// =====================================================================
// Tela de Alertas
// =====================================================================
function TelaAlertas({ usuario, cotacoes }: { usuario: Usuario; cotacoes: CotacaoAtual }) {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);

  async function recarregar() {
  const dados = await buscarAlertas(usuario.id);
  setAlertas(dados);
}

  useEffect(() => {
  recarregar();

  const intervalo = setInterval(() => {
    recarregar();
  }, 5000);

  return () => clearInterval(intervalo);
}, [usuario.id]);


  async function handleExcluir(id: number) {
  if (!confirm("Deseja excluir este alerta?")) return;

  await excluirAlerta(id);
  await recarregar();
}

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Meus Alertas</h2>
        {!mostrarForm && (
          <button
            onClick={() => setMostrarForm(true)}
            style={{ padding: "7px 14px", background: "#333", color: "#fff", border: "none", cursor: "pointer" }}
          >
            + Novo Alerta
          </button>
        )}
      </div>

      {mostrarForm && (
        <FormNovoAlerta
          usuarioId={usuario.id}
          cotacoes={cotacoes}
          aoSalvar={() => { setMostrarForm(false); recarregar(); }}
          aoCancelar={() => setMostrarForm(false)}
        />
      )}

      {alertas.length === 0 ? (
        <p style={{ color: "#888" }}>Nenhum alerta cadastrado.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
          <thead>
            <tr style={{ background: "#eee" }}>
              <th style={thStyle}>Moeda</th>
              <th style={thStyle}>Cotação Atual</th>
              <th style={thStyle}>Valor-Alvo</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Criado em</th>
              <th style={thStyle}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {alertas.map((alerta) => (
              <tr key={alerta.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={tdStyle}>{alerta.moeda}</td>
                <td style={tdStyle}>{formatarMoeda(alerta.moeda, cotacoes[alerta.moeda])}</td>
                <td style={tdStyle}>{formatarMoeda(alerta.moeda, alerta.valor_alvo)}</td>
                <td style={tdStyle}>
                  <span
                    style={{
                      padding: "2px 8px",
                      background: alerta.status === "ativo" ? "#d4edda" : "#fff3cd",
                      color: alerta.status === "ativo" ? "#155724" : "#856404",
                      border: `1px solid ${alerta.status === "ativo" ? "#c3e6cb" : "#ffeeba"}`,
                      fontSize: 12,
                    }}
                  >
                    {alerta.status === "ativo" ? "Ativo" : "Atingido"}
                  </span>
                </td>
                <td style={tdStyle}>{alerta.criado_em}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleExcluir(alerta.id)}
                    style={{ padding: "3px 10px", background: "#c33", color: "#fff", border: "none", cursor: "pointer", fontSize: 12 }}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// =====================================================================
// Tela de Mensagens
// =====================================================================
function TelaMensagens({ usuario }: { usuario: Usuario }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);

  async function carregarMensagens() {
    const dados = await buscarMensagens(usuario.id);
    setMensagens(dados);
  }

  useEffect(() => {
    carregarMensagens();

    const intervalo = setInterval(() => {
      carregarMensagens();
    }, 5000);

    return () => clearInterval(intervalo);
  }, [usuario.id]);

  return (
    <div>
      <h2>Mensagens</h2>

      {mensagens.length === 0 ? (
        <p style={{ color: "#888" }}>Nenhuma mensagem.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
          <thead>
            <tr style={{ background: "#eee" }}>
              <th style={thStyle}>Mensagem</th>
              <th style={{ ...thStyle, width: 160 }}>Data/Hora</th>
            </tr>
          </thead>
          <tbody>
            {[...mensagens].reverse().map((msg) => (
              <tr key={msg.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={tdStyle}>{msg.texto}</td>
                <td style={tdStyle}>{msg.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// =====================================================================
// Tela de Configurações
// =====================================================================
function TelaConfiguracoes({ usuario, aoAtualizar }: { usuario: Usuario; aoAtualizar: () => void }) {
  const [resumo, setResumo] = useState(false);

useEffect(() => {
  async function carregarResumo() {
    const ativo = await buscarResumoDiario();
    setResumo(ativo);
  }

  carregarResumo();
}, []);

  async function handleToggle() {
  const novoValor = !resumo;

  setResumo(novoValor);

  await atualizarResumoDiario(
    usuario.id,
    novoValor
  );
}

  return (
    <div>
      <h2>Configurações</h2>

      <div style={{ background: "#fff", border: "1px solid #ccc", padding: 16, maxWidth: 400 }}>
        <p style={{ margin: "0 0 12px 0", fontWeight: "bold" }}>Resumo Diário</p>
        <p style={{ margin: "0 0 12px 0", color: "#555", fontSize: 13 }}>
          Quando ativado, o sistema envia um resumo diário das cotações para as mensagens.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="checkbox"
            id="resumo"
            checked={resumo}
            onChange={handleToggle}
            style={{ width: 16, height: 16, cursor: "pointer" }}
          />
          <label htmlFor="resumo" style={{ cursor: "pointer" }}>
            {resumo ? "Ativado" : "Desativado"}
          </label>
        </div>
      </div>

      <div style={{ marginTop: 24, background: "#fff", border: "1px solid #ccc", padding: 16, maxWidth: 400 }}>
        <p style={{ margin: "0 0 8px 0", fontWeight: "bold" }}>Informações da Conta</p>
        <p style={{ margin: "4px 0", fontSize: 13 }}>
          <strong>Nome:</strong> {usuario.nome}
        </p>
        <p style={{ margin: "4px 0", fontSize: 13 }}>
          <strong>E-mail:</strong> {usuario.email}
        </p>
      </div>
    </div>
  );
}

// =====================================================================
// Estilos de tabela reutilizáveis
// =====================================================================
const thStyle: React.CSSProperties = {
  padding: "8px 10px",
  textAlign: "left",
  fontWeight: "bold",
  fontSize: 13,
  borderBottom: "1px solid #ccc",
};

const tdStyle: React.CSSProperties = {
  padding: "8px 10px",
  fontSize: 13,
  verticalAlign: "middle",
};

// =====================================================================
// App Principal
// =====================================================================
export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [paginaAtual, setPaginaAtual] = useState("alertas");
  const [cotacoes, setCotacoes] = useState<CotacaoAtual>({ USD: null, EUR: null, BTC: null });
  const [carregandoCotacoes, setCarregandoCotacoes] = useState(false);
  const [erroCotacoes, setErroCotacoes] = useState("");

  // Atualizar cotacoes da API
  async function atualizarCotacoes() {
    setCarregandoCotacoes(true);
    setErroCotacoes("");
    const resultado = await buscarCotacoesAPI();
    setCotacoes(resultado);
    if (resultado.USD === null) {
      setErroCotacoes("Não foi possível obter as cotações. Verifique a conexão.");
    } else {
      // Salva no histórico
      if (resultado.USD) salvarCotacao("USD", resultado.USD);
      if (resultado.EUR) salvarCotacao("EUR", resultado.EUR);
      if (resultado.BTC) salvarCotacao("BTC", resultado.BTC);
    }
    setCarregandoCotacoes(false);
  }

  // Ao fazer login, busca cotações e agenda atualização a cada 60 segundos
  useEffect(() => {
    if (!usuario) return;
    atualizarCotacoes();
    const intervalo = setInterval(atualizarCotacoes, 60000);
    return () => clearInterval(intervalo);
  }, [usuario]);

  // Recarregar dados do usuário (ex: após alterar configurações)
  function recarregarUsuario() {
    if (!usuario) return;
    const usuarios = buscarUsuarios();
    const atualizado = usuarios.find((u) => u.id === usuario.id);
    if (atualizado) setUsuario(atualizado);
  }

  function handleSair() {
    setUsuario(null);
    setPaginaAtual("alertas");
    setCotacoes({ USD: null, EUR: null, BTC: null });
  }

  // --- Tela de login ---
  if (!usuario) {
    return <TelaLogin aoEntrar={setUsuario} />;
  }

  // --- App logado ---
  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      {/* Cabeçalho */}
      <div style={{ background: "#333", color: "#fff", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <strong style={{ fontSize: 16 }}>CotaBot</strong>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13 }}>
          <span>Olá, {usuario.nome}</span>
          <button
            onClick={handleSair}
            style={{ background: "none", border: "1px solid #aaa", color: "#ddd", padding: "3px 10px", cursor: "pointer", fontSize: 12 }}
          >
            Sair
          </button>
        </div>
      </div>

      {/* Cotações no topo */}
      <div style={{ background: "#fff", borderBottom: "1px solid #ddd", padding: "8px 20px", display: "flex", gap: 24, alignItems: "center", fontSize: 13 }}>
        <span style={{ color: "#555" }}>Cotações:</span>
        {carregandoCotacoes && <span style={{ color: "#888" }}>Atualizando...</span>}
        {!carregandoCotacoes && erroCotacoes && <span style={{ color: "red" }}>{erroCotacoes}</span>}
        {!carregandoCotacoes && !erroCotacoes && (
          <>
            <span>USD: <strong>{formatarMoeda("USD", cotacoes.USD)}</strong></span>
            <span>EUR: <strong>{formatarMoeda("EUR", cotacoes.EUR)}</strong></span>
            <span>BTC: <strong>{formatarMoeda("BTC", cotacoes.BTC)}</strong></span>
          </>
        )}
        <button
          onClick={atualizarCotacoes}
          style={{ marginLeft: "auto", padding: "3px 10px", background: "#eee", border: "1px solid #ccc", cursor: "pointer", fontSize: 12 }}
        >
          Atualizar
        </button>
      </div>

      <div style={{ display: "flex" }}>
        {/* Menu lateral */}
        <nav style={{ width: 180, background: "#fff", borderRight: "1px solid #ddd", minHeight: "calc(100vh - 80px)", padding: "16px 0" }}>
          {[
            { id: "alertas", label: "Alertas" },
            { id: "mensagens", label: "Mensagens" },
            { id: "configuracoes", label: "Configurações" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPaginaAtual(item.id)}
              style={{
                display: "block",
                width: "100%",
                padding: "9px 20px",
                textAlign: "left",
                background: paginaAtual === item.id ? "#eee" : "none",
                border: "none",
                borderLeft: paginaAtual === item.id ? "3px solid #333" : "3px solid transparent",
                cursor: "pointer",
                fontWeight: paginaAtual === item.id ? "bold" : "normal",
                fontSize: 14,
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Conteúdo */}
        <main style={{ flex: 1, padding: 24 }}>
          {paginaAtual === "alertas" && (
            <TelaAlertas usuario={usuario} cotacoes={cotacoes} />
          )}
          {paginaAtual === "mensagens" && (
            <TelaMensagens usuario={usuario} />
          )}
          {paginaAtual === "configuracoes" && (
            <TelaConfiguracoes usuario={usuario} aoAtualizar={recarregarUsuario} />
          )}
        </main>
      </div>
    </div>
  );
}
