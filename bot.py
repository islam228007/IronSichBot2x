import discord
from discord.ext import commands

# ===================== НАЛАШТУВАННЯ =====================

import os
BOT_TOKEN = os.environ.get("BOT_TOKEN")


SERVER_IP = “your.server.ip:28015”
SERVER_NAME = “EU | 5X”

# Розклад вайпів (редагуй під себе)

WIPE_SCHEDULE = [
{“day”: “Wednesday”, “time”: “4:00 PM London Time”},
{“day”: “Saturday”,  “time”: “1:00 PM London Time”},
]

# ========================================================

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix=”!”, intents=intents)

@bot.event
async def on_ready():
print(f”✅ Бот запущено як {bot.user}”)
await bot.change_presence(activity=discord.Game(name=f”{SERVER_NAME}”))

# Команда !wipe — показує розклад вайпів

@bot.command(name=“wipe”)
async def wipe(ctx):
lines = “\n”.join(f”🗓️ **{w[‘day’]}** → {w[‘time’]}” for w in WIPE_SCHEDULE)
embed = discord.Embed(title=“⚡ Wipe Schedule”, description=lines, color=discord.Color.orange())
await ctx.send(embed=embed)

# Команда !ip — показує IP сервера

@bot.command(name=“ip”)
async def ip(ctx):
embed = discord.Embed(
title=“🖥️ Server IP”,
description=f”`{SERVER_IP}`”,
color=discord.Color.blue(),
)
await ctx.send(embed=embed)

bot.run(BOT_TOKEN)
