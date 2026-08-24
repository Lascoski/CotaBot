from flask import Flask, jsonify, request
from flask_cors import CORS

import requests
import threading
import time

from datetime import datetime

from banco import (
    criar_tabelas,
    criar_alerta,
    buscar_alertas,
    buscar_alertas_ativos,
    marcar_alerta_atingido,
    excluir_alerta,
    salvar_cotacao,
    salvar_mensagem,
    buscar_mensagens,
    obter_resumo_diario,
    atualizar_resumo_diario
)

from bot import enviar_mensagem


app = Flask(__name__)
CORS(app)

criar_tabelas()


# --------------------------------------------------
# BUSCAR COTAÇÕES NA AWESOME API
# --------------------------------------------------

def buscar_cotacoes():
    try:
        url = "https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL"

        resposta = requests.get(url, timeout=10)

        dados = resposta.json()

        cotacoes = {
            "USD": float(dados["USDBRL"]["bid"]),
            "EUR": float(dados["EURBRL"]["bid"]),
            "BTC": float(dados["BTCBRL"]["bid"])
        }

        return cotacoes

    except Exception as erro:
        print("Erro ao consultar cotações:")
        print(erro)

        return None


# --------------------------------------------------
# VERIFICAR ALERTAS
# --------------------------------------------------

def verificar_alertas():
    cotacoes = buscar_cotacoes()

    if cotacoes is None:
        return

    for moeda, valor in cotacoes.items():
        salvar_cotacao(moeda, valor)

    alertas = buscar_alertas_ativos()

    for alerta in alertas:

        moeda = alerta["moeda"]
        valor_alvo = alerta["valor_alvo"]

        valor_atual = cotacoes.get(moeda)

        if valor_atual is None:
            continue

        if valor_atual >= valor_alvo:

            texto = (
                f"🚨 CotaBot\n\n"
                f"{moeda} atingiu o valor definido!\n\n"
                f"Cotação atual: R$ {valor_atual:,.2f}\n"
                f"Valor alvo: R$ {valor_alvo:,.2f}"
            )

            enviar_mensagem(texto)

            salvar_mensagem(texto)

            marcar_alerta_atingido(alerta["id"])

            print(f"Alerta {alerta['id']} atingido!")


# --------------------------------------------------
# VERIFICAÇÃO AUTOMÁTICA
# --------------------------------------------------

def monitorar():
    ultimo_resumo = None

    while True:

        print("Verificando cotações...")

        # Verifica os alertas normalmente
        verificar_alertas()

        # Verifica se chegou o horário do resumo diário
        agora = datetime.now()

        if obter_resumo_diario():

            # Envia o resumo às 20:00
            if agora.hour == 20:

                data_hoje = agora.strftime("%Y-%m-%d")

                # Impede enviar várias vezes no mesmo dia
                if ultimo_resumo != data_hoje:
                    enviar_resumo_diario()
                    ultimo_resumo = data_hoje

        # Espera 60 segundos
        time.sleep(60)


# --------------------------------------------------
# ROTAS
# --------------------------------------------------

@app.route("/")
def inicio():
    return jsonify({
        "mensagem": "Backend do CotaBot funcionando!"
    })


@app.route("/cotacoes", methods=["GET"])
def cotacoes():
    dados = buscar_cotacoes()

    if dados is None:
        return jsonify({
            "erro": "Não foi possível buscar as cotações."
        }), 500

    return jsonify(dados)


@app.route("/alertas", methods=["GET"])
def listar_alertas():
    return jsonify(buscar_alertas())


@app.route("/alertas", methods=["POST"])
def cadastrar_alerta():

    dados = request.get_json()

    if not dados:
        return jsonify({
            "erro": "Dados não enviados."
        }), 400

    moeda = dados.get("moeda")
    valor_alvo = dados.get("valor_alvo")

    if moeda not in ["USD", "EUR", "BTC"]:
        return jsonify({
            "erro": "Moeda inválida."
        }), 400

    try:
        valor_alvo = float(valor_alvo)

    except:
        return jsonify({
            "erro": "Valor alvo inválido."
        }), 400

    criar_alerta(
        moeda,
        valor_alvo
    )

    return jsonify({
        "mensagem": "Alerta cadastrado com sucesso!"
    })


@app.route("/alertas/<int:id_alerta>", methods=["DELETE"])
def remover_alerta(id_alerta):

    excluir_alerta(id_alerta)

    return jsonify({
        "mensagem": "Alerta excluído."
    })


@app.route("/mensagens", methods=["GET"])
def mensagens():

    return jsonify(buscar_mensagens())


@app.route("/testar-bot", methods=["GET"])
def testar_bot():

    resultado = enviar_mensagem(
        "🤖 CotaBot funcionando! Esta é uma mensagem de teste."
    )

    if resultado:
        return jsonify({
            "mensagem": "Mensagem enviada!"
        })

    return jsonify({
        "erro": "Não foi possível enviar a mensagem."
    }), 500


def enviar_resumo_diario():
    cotacoes = buscar_cotacoes()

    if cotacoes is None:
        return

    texto = (
        "📊 Resumo Diário - CotaBot\n\n"
        f"USD: R$ {cotacoes['USD']:,.2f}\n"
        f"EUR: R$ {cotacoes['EUR']:,.2f}\n"
        f"BTC: R$ {cotacoes['BTC']:,.2f}"
    )

    enviar_mensagem(texto)
    salvar_mensagem(texto)

    print("Resumo diário enviado.")
# --------------------------------------------------
# CONFIGURAÇÕES - RESUMO DIÁRIO
# --------------------------------------------------

@app.route("/configuracoes/resumo", methods=["GET"])
def consultar_resumo():
    return jsonify({
        "resumo_diario": obter_resumo_diario()
    })


@app.route("/configuracoes/resumo", methods=["POST"])
def alterar_resumo():
    dados = request.get_json()

    ativo = dados.get("ativo", False)

    atualizar_resumo_diario(ativo)

    return jsonify({
        "mensagem": "Configuração atualizada.",
        "resumo_diario": ativo
    })


@app.route("/testar-resumo", methods=["GET"])
def testar_resumo():
    enviar_resumo_diario()

    return jsonify({
        "mensagem": "Resumo enviado!"
    })
# --------------------------------------------------
# INICIAR PROGRAMA
# --------------------------------------------------

if __name__ == "__main__":

    thread = threading.Thread(
        target=monitorar,
        daemon=True
    )

    thread.start()

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True,
        use_reloader=False
    )