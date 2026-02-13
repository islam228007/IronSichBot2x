const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
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

// Система зберігання даних
const dataPath = path.join(__dirname, 'data.json');
let data = { warns: {}, mutes: {} };

if (fs.existsSync(dataPath)) {
    data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

function saveData() {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// Реєстрація slash команд
const commands = [
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Показати всі команди бота'),
    
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Перевірити затримку бота'),
    
    new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Видати попередження користувачу')
        .addUserOption(option => 
            option.setName('користувач')
                .setDescription('Користувач для попередження')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('причина')
                .setDescription('Причина попередження')
                .setRequired(false)),
    
    new SlashCommandBuilder()
        .setName('warns')
        .setDescription('Переглянути попередження користувача')
        .addUserOption(option =>
            option.setName('користувач')
                .setDescription('Користувач для перегляду попереджень')
                .setRequired(false)),
    
    new SlashCommandBuilder()
        .setName('clearwarns')
        .setDescription('Очистити попередження користувача')
        .addUserOption(option =>
            option.setName('користувач')
                .setDescription('Користувач для очищення попереджень')
                .setRequired(true)),
    
    new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Замутити користувача')
        .addUserOption(option =>
            option.setName('користувач')
                .setDescription('Користувач для муту')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('час')
                .setDescription('Час муту (наприклад: 10m, 1h, 1d)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('причина')
                .setDescription('Причина муту')
                .setRequired(false)),
    
    new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Розмутити користувача')
        .addUserOption(option =>
            option.setName('користувач')
                .setDescription('Користувач для розмуту')
                .setRequired(true)),
    
    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Кікнути користувача')
        .addUserOption(option =>
            option.setName('користувач')
                .setDescription('Користувач для кіку')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('причина')
                .setDescription('Причина кіку')
                .setRequired(false)),
    
    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Забанити користувача')
        .addUserOption(option =>
            option.setName('користувач')
                .setDescription('Користувач для бану')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('причина')
                .setDescription('Причина бану')
                .setRequired(false)),
    
    new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Розбанити користувача за ID')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('ID користувача для розбану')
                .setRequired(true)),
    
    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Очистити повідомлення')
        .addIntegerOption(option =>
            option.setName('кількість')
                .setDescription('Кількість повідомлень для видалення (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)),
    
    new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Інформація про користувача')
        .addUserOption(option =>
            option.setName('користувач')
                .setDescription('Користувач для перегляду інформації')
                .setRequired(false)),
    
    new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Інформація про сервер')
];

client.once('ready', async () => {
    console.log(`✅ Бот ${client.user.tag} успішно запущений!`);
    
    // Реєстрація slash команд
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    try {
        console.log('🔄 Реєстрація slash команд...');
        
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        
        console.log('✅ Slash команди успішно зареєстровані!');
    } catch (error) {
        console.error('❌ Помилка реєстрації команд:', error);
    }
    
    client.user.setActivity('/help для допомоги');
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    // ===== КОМАНДА HELP =====
    if (commandName === 'help') {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📋 Список команд бота')
            .setDescription('Ось всі доступні команди:')
            .addFields(
                { name: '🛡️ Модерація', value: '`/warn` - Видати попередження\n`/warns` - Переглянути попередження\n`/clearwarns` - Очистити попередження\n`/mute` - Замутити користувача\n`/unmute` - Розмутити користувача\n`/kick` - Кікнути користувача\n`/ban` - Забанити користувача\n`/unban` - Розбанити користувача', inline: false },
                { name: '🔧 Утиліти', value: '`/clear` - Очистити повідомлення\n`/userinfo` - Інформація про користувача\n`/serverinfo` - Інформація про сервер', inline: false },
                { name: '💬 Інше', value: '`/ping` - Перевірити пінг бота', inline: false }
            )
            .setFooter({ text: 'Використовуй команди розумно!' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== КОМАНДА PING =====
    if (commandName === 'ping') {
        const ping = Date.now() - interaction.createdTimestamp;
        return interaction.reply({ 
            content: `🏓 Понг! Затримка: ${Math.abs(ping)}ms | API: ${Math.round(client.ws.ping)}ms`,
            ephemeral: true 
        });
    }

    // ===== КОМАНДА WARN =====
    if (commandName === 'warn') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ content: '❌ У тебе немає прав для використання цієї команди!', ephemeral: true });
        }

        const user = interaction.options.getUser('користувач');
        const reason = interaction.options.getString('причина') || 'Причина не вказана';

        if (!data.warns[user.id]) data.warns[user.id] = [];
        data.warns[user.id].push({
            reason: reason,
            moderator: interaction.user.tag,
            date: new Date().toISOString()
        });
        saveData();

        const warnCount = data.warns[user.id].length;

        const embed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('⚠️ Попередження видано')
            .addFields(
                { name: 'Користувач', value: `${user.tag}`, inline: true },
                { name: 'Модератор', value: `${interaction.user.tag}`, inline: true },
                { name: 'Причина', value: reason, inline: false },
                { name: 'Всього попереджень', value: `${warnCount}`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        // Автобан при 3 попередженнях
        if (warnCount >= 3) {
            const member = interaction.guild.members.cache.get(user.id);
            if (member) {
                try {
                    await member.ban({ reason: `Автобан: ${warnCount} попереджень` });
                    await interaction.followUp(`🔨 ${user.tag} було автоматично забанено за ${warnCount} попереджень!`);
                } catch (error) {
                    await interaction.followUp({ content: '❌ Не вдалося забанити користувача.', ephemeral: true });
                }
            }
        }
    }

    // ===== КОМАНДА WARNS =====
    if (commandName === 'warns') {
        const user = interaction.options.getUser('користувач') || interaction.user;
        const warns = data.warns[user.id] || [];

        if (warns.length === 0) {
            return interaction.reply({ content: `${user.tag} не має попереджень! ✅`, ephemeral: true });
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

        interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== КОМАНДА CLEARWARNS =====
    if (commandName === 'clearwarns') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ content: '❌ У тебе немає прав для використання цієї команди!', ephemeral: true });
        }

        const user = interaction.options.getUser('користувач');
        data.warns[user.id] = [];
        saveData();

        interaction.reply({ content: `✅ Всі попередження користувача ${user.tag} було очищено!`, ephemeral: true });
    }

    // ===== КОМАНДА MUTE =====
    if (commandName === 'mute') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ content: '❌ У тебе немає прав для використання цієї команди!', ephemeral: true });
        }

        const member = interaction.options.getMember('користувач');
        const timeArg = interaction.options.getString('час') || '10m';
        const reason = interaction.options.getString('причина') || 'Причина не вказана';

        let duration = 600000; // За замовчуванням 10 хвилин
        const timeValue = parseInt(timeArg);
        const timeUnit = timeArg.slice(-1);
        
        if (timeUnit === 'm') duration = timeValue * 60000;
        else if (timeUnit === 'h') duration = timeValue * 3600000;
        else if (timeUnit === 'd') duration = timeValue * 86400000;

        try {
            await member.timeout(duration, reason);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🔇 Користувача замучено')
                .addFields(
                    { name: 'Користувач', value: `${member.user.tag}`, inline: true },
                    { name: 'Модератор', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Час', value: timeArg, inline: true },
                    { name: 'Причина', value: reason, inline: false }
                )
                .setTimestamp();

            interaction.reply({ embeds: [embed] });
        } catch (error) {
            interaction.reply({ content: '❌ Не вдалося замутити користувача!', ephemeral: true });
        }
    }

    // ===== КОМАНДА UNMUTE =====
    if (commandName === 'unmute') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ content: '❌ У тебе немає прав для використання цієї команди!', ephemeral: true });
        }

        const member = interaction.options.getMember('користувач');

        try {
            await member.timeout(null);
            interaction.reply({ content: `✅ З користувача ${member.user.tag} знято мут!`, ephemeral: true });
        } catch (error) {
            interaction.reply({ content: '❌ Не вдалося розмутити користувача!', ephemeral: true });
        }
    }

    // ===== КОМАНДА KICK =====
    if (commandName === 'kick') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({ content: '❌ У тебе немає прав для використання цієї команди!', ephemeral: true });
        }

        const member = interaction.options.getMember('користувач');
        const reason = interaction.options.getString('причина') || 'Причина не вказана';

        try {
            await member.kick(reason);
            
            const embed = new EmbedBuilder()
                .setColor('#ff6600')
                .setTitle('👢 Користувача кікнуто')
                .addFields(
                    { name: 'Користувач', value: `${member.user.tag}`, inline: true },
                    { name: 'Модератор', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Причина', value: reason, inline: false }
                )
                .setTimestamp();

            interaction.reply({ embeds: [embed] });
        } catch (error) {
            interaction.reply({ content: '❌ Не вдалося кікнути користувача!', ephemeral: true });
        }
    }

    // ===== КОМАНДА BAN =====
    if (commandName === 'ban') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ content: '❌ У тебе немає прав для використання цієї команди!', ephemeral: true });
        }

        const member = interaction.options.getMember('користувач');
        const reason = interaction.options.getString('причина') || 'Причина не вказана';

        try {
            await member.ban({ reason: reason });
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🔨 Користувача забанено')
                .addFields(
                    { name: 'Користувач', value: `${member.user.tag}`, inline: true },
                    { name: 'Модератор', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Причина', value: reason, inline: false }
                )
                .setTimestamp();

            interaction.reply({ embeds: [embed] });
        } catch (error) {
            interaction.reply({ content: '❌ Не вдалося забанити користувача!', ephemeral: true });
        }
    }

    // ===== КОМАНДА UNBAN =====
    if (commandName === 'unban') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ content: '❌ У тебе немає прав для використання цієї команди!', ephemeral: true });
        }

        const userId = interaction.options.getString('userid');

        try {
            await interaction.guild.members.unban(userId);
            interaction.reply({ content: `✅ Користувача з ID ${userId} розбанено!`, ephemeral: true });
        } catch (error) {
            interaction.reply({ content: '❌ Не вдалося розбанити користувача! Перевір ID.', ephemeral: true });
        }
    }

    // ===== КОМАНДА CLEAR =====
    if (commandName === 'clear') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({ content: '❌ У тебе немає прав для використання цієї команди!', ephemeral: true });
        }

        const amount = interaction.options.getInteger('кількість');

        try {
            await interaction.channel.bulkDelete(amount, true);
            await interaction.reply({ content: `✅ Видалено ${amount} повідомлень!`, ephemeral: true });
        } catch (error) {
            interaction.reply({ content: '❌ Не вдалося видалити повідомлення!', ephemeral: true });
        }
    }

    // ===== КОМАНДА USERINFO =====
    if (commandName === 'userinfo') {
        const user = interaction.options.getUser('користувач') || interaction.user;
        const member = interaction.guild.members.cache.get(user.id);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle(`👤 Інформація про ${user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'ID', value: user.id, inline: true },
                { name: 'Нікнейм', value: user.username, inline: true },
                { name: 'Приєднався', value: member.joinedAt.toLocaleDateString('uk-UA'), inline: true },
                { name: 'Аккаунт створено', value: user.createdAt.toLocaleDateString('uk-UA'), inline: true },
                { name: 'Ролі', value: member.roles.cache.map(r => r.name).join(', ') || 'Немає ролей', inline: false }
            )
            .setTimestamp();

        interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== КОМАНДА SERVERINFO =====
    if (commandName === 'serverinfo') {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`🏠 Інформація про сервер`)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .addFields(
                { name: 'Назва', value: interaction.guild.name, inline: true },
                { name: 'ID', value: interaction.guild.id, inline: true },
                { name: 'Власник', value: `<@${interaction.guild.ownerId}>`, inline: true },
                { name: 'Учасників', value: `${interaction.guild.memberCount}`, inline: true },
                { name: 'Створено', value: interaction.guild.createdAt.toLocaleDateString('uk-UA'), inline: true },
                { name: 'Ролей', value: `${interaction.guild.roles.cache.size}`, inline: true }
            )
            .setTimestamp();

        interaction.reply({ embeds: [embed], ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);
