import sqlite3
import os

CAMINHO_BANCO = os.path.join(os.path.dirname(__file__), "cotabot.db")


def conectar():
    return sqlite3.connect(CAMINHO_BANCO)


# --------------------------------------------------
# CRIAR TABELAS
# --------------------------------------------------

def criar_tabelas():
    conexao = conectar()
    cursor = conexao.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            email TEXT,
            senha TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alertas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            moeda TEXT NOT NULL,
            valor_alvo REAL NOT NULL,
            status TEXT DEFAULT 'ativo'
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cotacoes_historico (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            moeda TEXT NOT NULL,
            valor REAL NOT NULL,
            data TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS mensagens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            texto TEXT NOT NULL,
            data TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS configuracoes (
            id INTEGER PRIMARY KEY,
            resumo_diario INTEGER DEFAULT 0
        )
    """)

    cursor.execute("""
        INSERT OR IGNORE INTO configuracoes (id, resumo_diario)
        VALUES (1, 0)
    """)

    conexao.commit()
    conexao.close()


# --------------------------------------------------
# ALERTAS
# --------------------------------------------------

def criar_alerta(moeda, valor_alvo):
    conexao = conectar()
    cursor = conexao.cursor()

    cursor.execute(
        "INSERT INTO alertas (moeda, valor_alvo, status) VALUES (?, ?, ?)",
        (moeda, valor_alvo, "ativo")
    )

    conexao.commit()
    conexao.close()


def buscar_alertas():
    conexao = conectar()
    conexao.row_factory = sqlite3.Row
    cursor = conexao.cursor()

    cursor.execute("SELECT * FROM alertas ORDER BY id DESC")
    dados = cursor.fetchall()

    conexao.close()

    return [dict(item) for item in dados]


def buscar_alertas_ativos():
    conexao = conectar()
    conexao.row_factory = sqlite3.Row
    cursor = conexao.cursor()

    cursor.execute("SELECT * FROM alertas WHERE status = 'ativo'")
    dados = cursor.fetchall()

    conexao.close()

    return [dict(item) for item in dados]


def marcar_alerta_atingido(id_alerta):
    conexao = conectar()
    cursor = conexao.cursor()

    cursor.execute(
        "UPDATE alertas SET status = 'atingido' WHERE id = ?",
        (id_alerta,)
    )

    conexao.commit()
    conexao.close()


def excluir_alerta(id_alerta):
    conexao = conectar()
    cursor = conexao.cursor()

    cursor.execute(
        "DELETE FROM alertas WHERE id = ?",
        (id_alerta,)
    )

    conexao.commit()
    conexao.close()


# --------------------------------------------------
# COTAÇÕES
# --------------------------------------------------

def salvar_cotacao(moeda, valor):
    conexao = conectar()
    cursor = conexao.cursor()

    cursor.execute(
        "INSERT INTO cotacoes_historico (moeda, valor) VALUES (?, ?)",
        (moeda, valor)
    )

    conexao.commit()
    conexao.close()


# --------------------------------------------------
# MENSAGENS
# --------------------------------------------------

def salvar_mensagem(texto):
    conexao = conectar()
    cursor = conexao.cursor()

    cursor.execute(
        "INSERT INTO mensagens (texto) VALUES (?)",
        (texto,)
    )

    conexao.commit()
    conexao.close()


def buscar_mensagens():
    conexao = conectar()
    conexao.row_factory = sqlite3.Row
    cursor = conexao.cursor()

    cursor.execute("SELECT * FROM mensagens ORDER BY id DESC")
    dados = cursor.fetchall()

    conexao.close()

    return [dict(item) for item in dados]


# --------------------------------------------------
# CONFIGURAÇÕES
# --------------------------------------------------

def obter_resumo_diario():
    conexao = conectar()
    cursor = conexao.cursor()

    cursor.execute(
        "SELECT resumo_diario FROM configuracoes WHERE id = 1"
    )

    resultado = cursor.fetchone()

    conexao.close()

    if resultado:
        return bool(resultado[0])

    return False


def atualizar_resumo_diario(ativo):
    conexao = conectar()
    cursor = conexao.cursor()

    cursor.execute(
        "UPDATE configuracoes SET resumo_diario = ? WHERE id = 1",
        (1 if ativo else 0,)
    )

    conexao.commit()
    conexao.close()