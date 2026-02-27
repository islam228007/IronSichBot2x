import discord
from discord.ext import commands
import os

# ===================== НАЛАШТУВАННЯ =====================

BOT_TOKEN = os.environ.get(“BOT_TOKEN”)

SERVER_NAME = “EU | 5X”

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
print(f”Bot online: {bot.user}”)
await bot.change_presence(activity=discord.Game(name=SERVER_NAME))

@bot.command(name=“wipe”)
async def wipe(ctx):
lines = “\n”.join(f”**{w[‘day’]}** -> {w[‘time’]}” for w in WIPE_SCHEDULE)
embed = discord.Embed(title=“Wipe Schedule”, description=lines, color=discord.Color.orange())
await ctx.send(embed=embed)

bot.run(BOT_TOKEN)
