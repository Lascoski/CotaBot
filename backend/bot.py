import os
import requests
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")


def enviar_mensagem(texto):
    if not BOT_TOKEN or not CHAT_ID:
        print("Token ou Chat ID do Telegram não configurado.")
        return False

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"

    dados = {
        "chat_id": CHAT_ID,
        "text": texto
    }

    try:
        resposta = requests.post(
            url,
            data=dados,
            timeout=10
        )

        if resposta.status_code == 200:
            print("Mensagem enviada pelo Telegram.")
            return True

        print("Erro ao enviar mensagem:")
        print(resposta.text)
        return False

    except Exception as erro:
        print("Erro ao conectar com Telegram:")
        print(erro)
        return False