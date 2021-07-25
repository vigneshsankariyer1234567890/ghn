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

channel_id = sys.argv[1]
channel_hash = sys.argv[2]
ads = sys.argv[3]
volunteers = sys.argv[4]
charity_admins = []
users = []

reader = csv.reader(ads.split(','))
for row in reader:
    charity_admins.append(row[0])

reader = csv.reader(volunteers.split(','))
for row in reader:
    users.append(row[0])

async def addCharityAdminsToGroup(api_id: str, api_hash: str, char_users: List[str]):
    if char_users[0] == "blank":
        return dict({
            "success": True,
            "api_id": api_id,
            "api_access_hash": api_hash,
            "errors": [],
            "timeout": 30
        })
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
    if volunteers[0] == "blank":
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
    d = await addCharityAdminsToGroup(channel_id,channel_hash,charity_admins)
    check = d["success"]
    if check:
        e = await addVolunteersToGroup(d["api_id"], d["api_access_hash"], users)
        return json.dumps(e)
    return json.dumps(d)

if __name__ == "__main__":
    with client:
        print(client.loop.run_until_complete(proc()))
        sys.stdout.flush()
