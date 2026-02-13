const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ]
});

// Система зберігання даних (warns, mutes)
const dataPath = path.join(__dirname, 'data.json');
let data = { warns: {}, mutes: {} };

// Завантаження даних
if (fs.existsSync(dataPath)) {
    data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

// Збереження даних
function saveData() {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// Префікс команд
const PREFIX = '!';

client.on('ready', () => {
    console.log(`✅ Бот ${client.user.tag} успішно запущений!`);
    client.user.setActivity('!help для допомоги', { type: 'PLAYING' });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // ===== КОМАНДА HELP =====
    if (command === 'help' || command === 'допомога') {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📋 Список команд бота')
            .setDescription('Ось всі доступні команди:')
            .addFields(
                { name: '🛡️ Модерація', value: '`!warn` - Видати попередження\n`!warns` - Переглянути попередження\n`!clearwarns` - Очистити попередження\n`!mute` - Замутити користувача\n`!unmute` - Розмутити користувача\n`!kick` - Кікнути користувача\n`!ban` - Забанити користувача\n`!unban` - Розбанити користувача', inline: false },
                { name: '🔧 Утиліти', value: '`!clear` - Очистити повідомлення\n`!userinfo` - Інформація про користувача\n`!serverinfo` - Інформація про сервер', inline: false },
                { name: '💬 Інше', value: '`!ping` - Перевірити пінг бота', inline: false }
            )
            .setFooter({ text: 'Використовуй команди розумно!' })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

    // ===== КОМАНДА PING =====
    if (command === 'ping') {
        const ping = Date.now() - message.createdTimestamp;
        return message.reply(`🏓 Понг! Затримка: ${Math.abs(ping)}ms | API: ${Math.round(client.ws.ping)}ms`);
    }

    // ===== КОМАНДА WARN =====
    if (command === 'warn') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ У тебе немає прав для використання цієї команди!');
        }

        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Вкажи користувача! Приклад: `!warn @user причина`');

        const reason = args.slice(1).join(' ') || 'Причина не вказана';

        if (!data.warns[user.id]) data.warns[user.id] = [];
        data.warns[user.id].push({
            reason: reason,
            moderator: message.author.tag,
            date: new Date().toISOString()
        });
        saveData();

        const warnCount = data.warns[user.id].length;

        const embed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('⚠️ Попередження видано')
            .addFields(
                { name: 'Користувач', value: `${user.tag}`, inline: true },
                { name: 'Модератор', value: `${message.author.tag}`, inline: true },
                { name: 'Причина', value: reason, inline: false },
                { name: 'Всього попереджень', value: `${warnCount}`, inline: true }
            )
            .setTimestamp();

        message.reply({ embeds: [embed] });

        // Автоматичні дії при досягненні кількості попереджень
        if (warnCount >= 3) {
            const member = message.guild.members.cache.get(user.id);
            if (member) {
                try {
                    await member.ban({ reason: `Автобан: ${warnCount} попереджень` });
                    message.channel.send(`🔨 ${user.tag} було автоматично забанено за ${warnCount} попереджень!`);
                } catch (error) {
                    message.channel.send('❌ Не вдалося забанити користувача.');
                }
            }
        }
    }

    // ===== КОМАНДА WARNS =====
    if (command === 'warns') {
        const user = message.mentions.users.first() || message.author;
        const warns = data.warns[user.id] || [];

        if (warns.length === 0) {
            return message.reply(`${user.tag} не має попереджень! ✅`);
        }

        const embed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle(`⚠️ Попередження користувача ${user.tag}`)
            .setDescription(`Всього попереджень: ${warns.length}`);

        warns.forEach((warn, index) => {
            embed.addFields({
                name: `Попередження #${index + 1}`,
                value: `**Причина:** ${warn.reason}\n**Модератор:** ${warn.moderator}\n**Дата:** ${new Date(warn.date).toLocaleString('uk-UA')}`,
                inline: false
            });
        });

        message.reply({ embeds: [embed] });
    }

    // ===== КОМАНДА CLEARWARNS =====
    if (command === 'clearwarns') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ У тебе немає прав для використання цієї команди!');
        }

        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Вкажи користувача! Приклад: `!clearwarns @user`');

        data.warns[user.id] = [];
        saveData();

        message.reply(`✅ Всі попередження користувача ${user.tag} було очищено!`);
    }

    // ===== КОМАНДА MUTE =====
    if (command === 'mute') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ У тебе немає прав для використання цієї команди!');
        }

        const member = message.mentions.members.first();
        if (!member) return message.reply('❌ Вкажи користувача! Приклад: `!mute @user 10m причина`');

        const timeArg = args[1];
        const reason = args.slice(2).join(' ') || 'Причина не вказана';

        // Парсинг часу (наприклад: 10m, 1h, 1d)
        let duration = 600000; // За замовчуванням 10 хвилин
        if (timeArg) {
            const timeValue = parseInt(timeArg);
            const timeUnit = timeArg.slice(-1);
            
            if (timeUnit === 'm') duration = timeValue * 60000;
            else if (timeUnit === 'h') duration = timeValue * 3600000;
            else if (timeUnit === 'd') duration = timeValue * 86400000;
        }

        try {
            await member.timeout(duration, reason);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🔇 Користувача замучено')
                .addFields(
                    { name: 'Користувач', value: `${member.user.tag}`, inline: true },
                    { name: 'Модератор', value: `${message.author.tag}`, inline: true },
                    { name: 'Час', value: timeArg || '10m', inline: true },
                    { name: 'Причина', value: reason, inline: false }
                )
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            message.reply('❌ Не вдалося замутити користувача!');
        }
    }

    // ===== КОМАНДА UNMUTE =====
    if (command === 'unmute') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ У тебе немає прав для використання цієї команди!');
        }

        const member = message.mentions.members.first();
        if (!member) return message.reply('❌ Вкажи користувача! Приклад: `!unmute @user`');

        try {
            await member.timeout(null);
            message.reply(`✅ З користувача ${member.user.tag} знято мут!`);
        } catch (error) {
            message.reply('❌ Не вдалося розмутити користувача!');
        }
    }

    // ===== КОМАНДА KICK =====
    if (command === 'kick') {
        if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return message.reply('❌ У тебе немає прав для використання цієї команди!');
        }

        const member = message.mentions.members.first();
        if (!member) return message.reply('❌ Вкажи користувача! Приклад: `!kick @user причина`');

        const reason = args.slice(1).join(' ') || 'Причина не вказана';

        try {
            await member.kick(reason);
            
            const embed = new EmbedBuilder()
                .setColor('#ff6600')
                .setTitle('👢 Користувача кікнуто')
                .addFields(
                    { name: 'Користувач', value: `${member.user.tag}`, inline: true },
                    { name: 'Модератор', value: `${message.author.tag}`, inline: true },
                    { name: 'Причина', value: reason, inline: false }
                )
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            message.reply('❌ Не вдалося кікнути користувача!');
        }
    }

    // ===== КОМАНДА BAN =====
    if (command === 'ban') {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply('❌ У тебе немає прав для використання цієї команди!');
        }

        const member = message.mentions.members.first();
        if (!member) return message.reply('❌ Вкажи користувача! Приклад: `!ban @user причина`');

        const reason = args.slice(1).join(' ') || 'Причина не вказана';

        try {
            await member.ban({ reason: reason });
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🔨 Користувача забанено')
                .addFields(
                    { name: 'Користувач', value: `${member.user.tag}`, inline: true },
                    { name: 'Модератор', value: `${message.author.tag}`, inline: true },
                    { name: 'Причина', value: reason, inline: false }
                )
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            message.reply('❌ Не вдалося забанити користувача!');
        }
    }

    // ===== КОМАНДА UNBAN =====
    if (command === 'unban') {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply('❌ У тебе немає прав для використання цієї команди!');
        }

        const userId = args[0];
        if (!userId) return message.reply('❌ Вкажи ID користувача! Приклад: `!unban 123456789`');

        try {
            await message.guild.members.unban(userId);
            message.reply(`✅ Користувача з ID ${userId} розбанено!`);
        } catch (error) {
            message.reply('❌ Не вдалося розбанити користувача! Перевір ID.');
        }
    }

    // ===== КОМАНДА CLEAR =====
    if (command === 'clear' || command === 'purge') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply('❌ У тебе немає прав для використання цієї команди!');
        }

        const amount = parseInt(args[0]);
        if (!amount || amount < 1 || amount > 100) {
            return message.reply('❌ Вкажи кількість повідомлень від 1 до 100! Приклад: `!clear 10`');
        }

        try {
            await message.channel.bulkDelete(amount + 1, true);
            const msg = await message.channel.send(`✅ Видалено ${amount} повідомлень!`);
            setTimeout(() => msg.delete(), 3000);
        } catch (error) {
            message.reply('❌ Не вдалося видалити повідомлення!');
        }
    }

    // ===== КОМАНДА USERINFO =====
    if (command === 'userinfo') {
        const user = message.mentions.users.first() || message.author;
        const member = message.guild.members.cache.get(user.id);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle(`👤 Інформація про ${user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'ID', value: user.id, inline: true },
                { name: 'Нікнейм', value: user.username, inline: true },
                { name: 'Дискримінатор', value: `#${user.discriminator}`, inline: true },
                { name: 'Приєднався', value: member.joinedAt.toLocaleDateString('uk-UA'), inline: true },
                { name: 'Аккаунт створено', value: user.createdAt.toLocaleDateString('uk-UA'), inline: true },
                { name: 'Ролі', value: member.roles.cache.map(r => r.name).join(', ') || 'Немає ролей', inline: false }
            )
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }

    // ===== КОМАНДА SERVERINFO =====
    if (command === 'serverinfo') {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`🏠 Інформація про сервер`)
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .addFields(
                { name: 'Назва', value: message.guild.name, inline: true },
                { name: 'ID', value: message.guild.id, inline: true },
                { name: 'Власник', value: `<@${message.guild.ownerId}>`, inline: true },
                { name: 'Учасників', value: `${message.guild.memberCount}`, inline: true },
                { name: 'Створено', value: message.guild.createdAt.toLocaleDateString('uk-UA'), inline: true },
                { name: 'Ролей', value: `${message.guild.roles.cache.size}`, inline: true }
            )
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
});

// Запуск бота
client.login(process.env.DISCORD_TOKEN);
