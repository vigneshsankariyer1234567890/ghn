from typing import List
from telethon import TelegramClient, functions
from telethon.sessions import StringSession
from decouple import config
import sys
from telethon import errors
import json
from telethon.tl.types import InputPeerChannel
import csv

api_id = config('TELE_API_ID')
api_hash = config('TELE_API_HASH')
sessionStr = config('TELE_SESSION_STR')

client = TelegramClient(StringSession(sessionStr), api_id, api_hash)
channelname = sys.argv[1]
about = sys.argv[2]
ads = sys.argv[3]
volunt = sys.argv[4]
charity_admins = []
users = []

reader = csv.reader(ads.split(','))
for row in reader:
    charity_admins.append(row[0])

reader = csv.reader(volunt.split(','))
for row in reader:
    users.append(row[0])


async def createGroup(name: str, ab: str):
    if ads=="blank":
        return dict({
            "success": False,
            "api_id": None,
            "api_access_hash": None,
            "errors": [dict({
                "field": "Charity", "message": "You need to have at least one charity admin."
            })]
        })
    try:
        created_private_channel = await client(functions.channels.CreateChannelRequest(
            name,
            ab,
            broadcast=False, megagroup=True))
        new_channel_id = created_private_channel.chats[0].id
        new_channel_access_hash = created_private_channel.chats[0].access_hash
        return dict({
            "success": True,
            "api_id": str(new_channel_id),
            "api_access_hash": str(new_channel_access_hash),
            "errors": [],
            "timeout": 0
        })
    except errors.ChannelsTooMuchError:
        return dict({
            "success": False,
            "api_id": None,
            "api_access_hash": None,
            "errors": [{"field": "Fatal", "message": "Please contact Givehub developers"}],
            "timeout": 60*60
        })
    except errors.ChatAboutTooLongError:
        return dict({
            "success": False,
            "api_id": None,
            "api_access_hash": None,
            "errors": [{"field": "About", "message": "About description too long"}],
            "timeout": 150
        })
    except errors.UserRestrictedError:
        return dict({
            "success": False,
            "api_id": None,
            "api_access_hash": None,
            "errors": [{"field": "Fatal", "message": "Please contact Givehub developers"}],
            "timeout": 150
        })
    except errors.rpcerrorlist.UserNotMutualContactError as e:
        f = e.message
        return dict({
            "success": False,
            "api_id": None,
            "api_access_hash": None,
            "errors": [{"field": "UserError", "message": "We're unable to add your users as volunteers due to mutual contacts. Please try to export your contacts instead. error: "+f}],
            "timeout": 150
        })
    
async def addCharityAdminsToGroup(api_id: str, api_hash: str, char_users: List[str]):
    try:
        channel = InputPeerChannel(channel_id=int(api_id),access_hash=int(api_hash))
        await client(functions.channels.InviteToChannelRequest(channel,char_users))
        for user in char_users:
            await client.edit_admin(channel,user,is_admin=True)
        return dict({
            "success": True,
            "api_id": api_id,
            "api_access_hash": api_hash,
            "errors": [],
            "timeout": 30
        })
    except errors.ChannelInvalidError as e:
        return dict({
            "success": False,
            "api_id": None,
            "api_access_hash": None,
            "errors": [{"field": "Channel", "message": "The channel seems to have been deleted."}],
            "timeout": 150
        })
    except errors.UserPrivacyRestrictedError as e:
        f = e.message
        return dict({
            "success": False,
            "api_id": None,
            "api_access_hash": None,
            "errors": [{"field": "UserError", "message": "One of the users may have bad privacy settings: "+f}],
            "timeout": 150
        })
    except errors.rpcerrorlist.UserNotMutualContactError as e:
        f = e.message
        return dict({
            "success": False,
            "api_id": None,
            "api_access_hash": None,
            "errors": [{"field": "UserError", "message": "We're unable to add your users as volunteers due to mutual contacts. Please try to export your contacts instead. error: "+f}],
            "timeout": 150
        })

async def addVolunteersToGroup(api_id: str, api_hash: str, volunteers: List[str]):
    if volunt == "blank":
        return dict({
            "success": True,
            "api_id": api_id,
            "api_access_hash": api_hash,
            "errors": [],
            "timeout": 30
        })
    try:
        channel = InputPeerChannel(channel_id=int(api_id),access_hash=int(api_hash))
        await client(functions.channels.InviteToChannelRequest(channel,volunteers))
        return dict({
            "success": True,
            "api_id": api_id,
            "api_access_hash": api_hash,
            "errors": [],
            "timeout": 30
        })
    except errors.ChannelInvalidError as e:
        return dict({
            "success": False,
            "api_id": None,
            "api_access_hash": None,
            "errors": [{"field": "Channel", "message": "The channel seems to have been deleted."}],
            "timeout": 150
        })
    except errors.UserPrivacyRestrictedError as e:
        f = e.message
        return dict({
            "success": False,
            "api_id": None,
            "api_access_hash": None,
            "errors": [{"field": "UserError", "message": "One of the users may have bad privacy settings: "+f}],
            "timeout": 150
        })
    except errors.rpcerrorlist.UserNotMutualContactError as e:
        f = e.message
        return dict({
            "success": False,
            "api_id": None,
            "api_access_hash": None,
            "errors": [{"field": "UserError", "message": "We're unable to add your users as volunteers due to mutual contacts. Please try to export your contacts instead. error: "+f}],
            "timeout": 150
        })
    

async def proc():
    d = await createGroup(channelname, about)
    check = d["success"]
    if check:
        e = await addCharityAdminsToGroup(d["api_id"], d["api_access_hash"], charity_admins)
        check2 = e["success"]
        if check2:
            f = await addVolunteersToGroup(e["api_id"], e["api_access_hash"], users)
            return json.dumps(f)
        return json.dumps(e)
    else:
        return json.dumps(d)

if __name__ == "__main__":
    with client:
        print(client.loop.run_until_complete(proc()))
        sys.stdout.flush()
    