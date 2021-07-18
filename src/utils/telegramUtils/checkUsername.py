from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon import errors
from decouple import config
import sys
import json

api_id = config('TELE_API_ID')
api_hash = config('TELE_API_HASH')
sessionStr = config('TELE_SESSION_STR')
# prodSessionStr = check .env.production

client = TelegramClient(StringSession(sessionStr), api_id, api_hash)
u = sys.argv[1]

async def check(username):

    try:
        user = await client.get_entity(username)
    except errors.FloodWaitError as e:
        d = dict(
            {'success': False, 'errors': [{
                'field': 'Requests', 'message': 'Too many requests'
                }], 'timeout': e.seconds
                }
            )
        return json.dumps(d)
    except errors.rpcerrorlist.UsernameNotOccupiedError as e:
        d = dict(
            {'success': False, 'errors': [{
                'field': 'Username', 'message': 'A valid telegram username was not provided.'
                }], 'timeout': 60
                }
            )
        return json.dumps(d)
    except ValueError as e:
        d = dict(
            {'success': False, 'errors': [{
                'field': 'Username', 'message': 'A valid telegram username was not provided.'
                }], 'timeout': 60
                }
            )
        return json.dumps(d)
    d = dict(
        {'success': True, 'errors': [], 'timeout': 0
                }
    )
    return json.dumps(d)

if __name__ == "__main__":
    with client:
        print(client.loop.run_until_complete(check(u)))
        sys.stdout.flush()
