from telethon import TelegramClient
from telethon.sessions import StringSession
from decouple import config

api_id = config('TELE_API_ID')
api_hash = config('TELE_API_HASH')
sessionStr = config('TELE_SESSION_STR')
# prodSessionStr = check .env.production

client = TelegramClient(StringSession(sessionStr), api_id, api_hash)

## Boiler plate for setting up telegram client 
 