import discord
from discord.ext import commands
import os
from datetime import datetime

BOT_TOKEN = os.environ.get('BOT_TOKEN')
SERVER_NAME = 'EU | 5X'

WIPE_SCHEDULE = [
    {'day': 'Wednesday', 'time': '4:00 PM London Time'},
    {'day': 'Saturday',  'time': '1:00 PM London Time'},
]

WIPE_IMAGE = 'https://cdn.discordapp.com/attachments/1225464510236590250/1476781696392368148/Gemini_Generated_Image_mehq9rmehq9rmehq.png'

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix='!', intents=intents)

@bot.event
async def on_ready():
    print('Bot online: ' + str(bot.user))
    await bot.change_presence(activity=discord.Game(name=SERVER_NAME))

@bot.command(name='wipe')
async def wipe(ctx):
    lines = '\n'.join('**' + w['day'] + '** -> ' + w['time'] for w in WIPE_SCHEDULE)
    embed = discord.Embed(title='Wipe Schedule', description=lines, color=discord.Color.orange())
    await ctx.send(embed=embed)

@bot.command(name='testwipe')
async def testwipe(ctx):
    if ctx.author.id != ctx.guild.owner_id:
        return
    embed = discord.Embed(color=0x0000ff)
    embed.add_field(
        name='EU | 5X',
        value=(
            '**HAS JUST WIPED!**\n\n'
            'use the IP below to connect via your F1 console..\n'
            '```connect YOUR_SERVER_IP```\n'
            '**Wipe Schedule**\n'
            '• 16:00 - Wednesday\n'
            '• 13:00 - Saturday\n'
        ),
        inline=False
    )
    embed.set_image(url=WIPE_IMAGE)
    embed.set_footer(text='Server wiped ' + datetime.now().strftime('%m/%d/%Y %H:%M:%S'))
    await ctx.send(embed=embed)

bot.run(BOT_TOKEN)
