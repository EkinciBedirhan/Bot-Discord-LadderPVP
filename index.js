const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const TOKEN = process.env.TOKEN;
if (!TOKEN) {
    console.error("❌ Erreur : Le TOKEN n'est pas défini. Vérifie les variables d'environnement sur Railway.");
    process.exit(1);
}
const GUILD_ID = process.env.GUILD_ID;
const LADDER_CHANNEL_ID = process.env.LADDER_CHANNEL_ID;
const LADDER_FILE = 'ladder.json';
const LADDER_MSG_FILE = 'ladder_msg.json';

let ladder = fs.existsSync(LADDER_FILE) ? JSON.parse(fs.readFileSync(LADDER_FILE)) : {};
let ladderMessageId = fs.existsSync(LADDER_MSG_FILE) ? JSON.parse(fs.readFileSync(LADDER_MSG_FILE)).messageId : null;

function saveLadder() {
    fs.writeFileSync(LADDER_FILE, JSON.stringify(ladder, null, 2));
}

function saveLadderMessageId(messageId) {
    fs.writeFileSync(LADDER_MSG_FILE, JSON.stringify({ messageId }));
}

function updateLadder(players, pointsPerPlayer) {
    players.forEach(player => {
        if (!ladder[player]) ladder[player] = 0;
        ladder[player] += pointsPerPlayer;
    });
    saveLadder();
}

function getLadder() {
    const sortedLadder = Object.entries(ladder).sort((a, b) => b[1] - a[1]);
    return `🏆 **Classement des joueurs :**\n\n` +
        sortedLadder.map(([player, points], index) => `${index + 1}. <@${player}> - ${points} points`).join('\n');
}

async function updateLadderMessage(channel) {
    const ladderContent = getLadder();

    try {
        if (!ladderMessageId) {
            throw new Error("Aucun ID de message enregistré.");
        }

        // Essaye de récupérer et modifier l'ancien message
        const message = await channel.messages.fetch(ladderMessageId);
        await message.edit(ladderContent);
        console.log("✅ Message du ladder mis à jour !");
    } catch (error) {
        console.log("⚠️ Message introuvable, création d'un nouveau...");

        // Supprime le fichier JSON pour éviter les erreurs d'ID corrompu
        if (fs.existsSync(LADDER_MSG_FILE)) {
            fs.unlinkSync(LADDER_MSG_FILE);
        }

        // Envoie un nouveau message et stocke son ID
        const newMessage = await channel.send(ladderContent);
        ladderMessageId = newMessage.id;
        saveLadderMessageId(newMessage.id);
        console.log("✅ Nouveau message du ladder créé !");
    }
}


// Vérification des permissions (Admin ou "Gérer les messages")
function hasPermission(member) {
    return member.roles.cache.some(role => role.name === 'Admin') || member.permissions.has(PermissionFlagsBits.ManageMessages);
}

client.once('ready', () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, member } = interaction;

    if (commandName === 'attaque-perco' || commandName === 'defense-perco') {
        const players = [];
        for (let i = 1; i <= 5; i++) {
            let player = options.getUser(`joueur${i}`);
            if (player) players.push(player.id);
        }

        const difficulte = options.getInteger('difficulte');
        const victoire = options.getString('victoire');
        const screenshot = options.getAttachment('screenshot');
        const pointsPerPlayer = commandName === 'attaque-perco' 
    ? options.getInteger('difficulte') // 1 point par défenseur
    : options.getInteger('attaquants') * 1.5; // 1.5 points par attaquant


    if (victoire === 'oui') {
        updateLadder(players, pointsPerPlayer);
    }
    

        const embed = new EmbedBuilder()
            .setColor(commandName === 'attaque-perco' ? 0xffa500 : 0x008000)
            .setTitle(`📜 Rapport de ${commandName === 'attaque-perco' ? "l'attaque" : 'la défense'} Percepteur`)
            .addFields(
                { name: '🛡 Défenseurs', value: `${difficulte}`, inline: true },
                { name: '🏆 Résultat', value: victoire === 'oui' ? 'Victoire ✅' : 'Défaite ❌', inline: true },
                { name: '🧑‍🤝‍🧑 Joueurs impliqués', value: players.map(id => `<@${id}>`).join(', ') || 'Aucun', inline: false },
                { name: '🌟 Screenshot', value: `[Clique ici](${screenshot.url})`, inline: false }
            )
            .setImage(screenshot.url)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        if (victoire === 'oui') {
            await interaction.followUp(`✅ **${commandName === 'attaque-perco' ? 'Attaque' : 'Défense'} enregistrée !** Chaque joueur gagne **${pointsPerPlayer} point${pointsPerPlayer > 1 ? 's' : ''}**.`);
        } else {
            await interaction.followUp(`❌ **${commandName === 'attaque-perco' ? 'Attaque' : 'Défense'} perdue ! Aucun point attribué.**`);
        }
        
        const ladderChannel = await client.channels.fetch(LADDER_CHANNEL_ID);
        await updateLadderMessage(ladderChannel);
    }

    // Commande pour réinitialiser le ladder
    if (commandName === 'reset-ladder') {
        if (!hasPermission(member)) {
            return interaction.reply({ content: "❌ Vous n'avez pas la permission d'utiliser cette commande.", ephemeral: true });
        }
        ladder = {};
        saveLadder();
        await interaction.reply("🗑️ **Ladder réinitialisé avec succès !**");

        const ladderChannel = await client.channels.fetch(LADDER_CHANNEL_ID);
        await updateLadderMessage(ladderChannel);
    }

    // Commande pour retirer des points
    if (commandName === 'retirer-points') {
        if (!hasPermission(member)) {
            return interaction.reply({ content: "❌ Vous n'avez pas la permission d'utiliser cette commande.", ephemeral: true });
        }

        const player = options.getUser('joueur');
        const points = options.getInteger('points');

        if (ladder[player.id]) {
            ladder[player.id] -= points;
            if (ladder[player.id] < 0) ladder[player.id] = 0;
            saveLadder();
            await interaction.reply(`🔻 **${points} points retirés à <@${player.id}>.**`);
        } else {
            await interaction.reply("❌ Ce joueur n'a pas encore de points.");
        }

        const ladderChannel = await client.channels.fetch(LADDER_CHANNEL_ID);
        await updateLadderMessage(ladderChannel);
    }

    // Commande pour ajouter des points
    if (commandName === 'ajouter-points') {
        if (!hasPermission(member)) {
            return interaction.reply({ content: "❌ Vous n'avez pas la permission d'utiliser cette commande.", ephemeral: true });
        }

        const player = options.getUser('joueur');
        const points = options.getInteger('points');

        if (!ladder[player.id]) ladder[player.id] = 0;
        ladder[player.id] += points;
        saveLadder();
        await interaction.reply(`✅ **${points} points ajoutés à <@${player.id}>.**`);

        const ladderChannel = await client.channels.fetch(LADDER_CHANNEL_ID);
        await updateLadderMessage(ladderChannel);
    }
});

client.login(TOKEN);
