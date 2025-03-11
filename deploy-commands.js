const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();

const commands = [
    new SlashCommandBuilder()
        .setName('attaque-perco')
        .setDescription("Lancer une attaque sur un percepteur")
        .addIntegerOption(option => 
            option.setName('difficulte')
                .setDescription('Nombre de défenseurs sur le percepteur')
                .setRequired(true)
                .addChoices(
                    { name: '0 défenseur', value: 0 },
                    { name: '1 défenseur', value: 1 },
                    { name: '2 défenseurs', value: 2 },
                    { name: '3 défenseurs', value: 3 },
                    { name: '4 défenseurs', value: 4 },
                    { name: '5 défenseurs', value: 5 },
                ))
        .addStringOption(option => 
            option.setName('victoire')
                .setDescription('Victoire ou défaite ? (oui/non)')
                .setRequired(true)
                .addChoices(
                    { name: 'Victoire', value: 'oui' },
                    { name: 'Défaite', value: 'non' }
                ))
        .addAttachmentOption(option => 
            option.setName('screenshot')
                .setDescription('Ajoute un screenshot de l’attaque')
                .setRequired(true))
        .addUserOption(option => 
            option.setName('joueur1')
                .setDescription('Premier joueur impliqué')
                .setRequired(true))
        .addUserOption(option => 
            option.setName('joueur2')
                .setDescription('Deuxième joueur impliqué')
                .setRequired(false))
        .addUserOption(option => 
            option.setName('joueur3')
                .setDescription('Troisième joueur impliqué')
                .setRequired(false))
        .addUserOption(option => 
            option.setName('joueur4')
                .setDescription('Quatrième joueur impliqué')
                .setRequired(false))
        .addUserOption(option => 
            option.setName('joueur5')
                .setDescription('Cinquième joueur impliqué')
                .setRequired(false)),

    new SlashCommandBuilder()
        .setName('defense-perco')
        .setDescription("Défendre un percepteur")
        .addIntegerOption(option => 
            option.setName('attaquants')
                .setDescription('Nombre d’attaquants sur le percepteur')
                .setRequired(true)
                .addChoices(
                    { name: '1 attaquant', value: 1 },
                    { name: '2 attaquants', value: 2 },
                    { name: '3 attaquants', value: 3 },
                    { name: '4 attaquants', value: 4 },
                    { name: '5 attaquants', value: 5 },
                ))
        .addStringOption(option => 
            option.setName('victoire')
                .setDescription('Victoire ou défaite ? (oui/non)')
                .setRequired(true)
                .addChoices(
                    { name: 'Victoire', value: 'oui' },
                    { name: 'Défaite', value: 'non' }
                ))
        .addAttachmentOption(option => 
            option.setName('screenshot')
                .setDescription('Ajoute un screenshot de la défense')
                .setRequired(true))
        .addUserOption(option => 
            option.setName('joueur1')
                .setDescription('Premier joueur impliqué')
                .setRequired(true))
        .addUserOption(option => 
            option.setName('joueur2')
                .setDescription('Deuxième joueur impliqué')
                .setRequired(false))
        .addUserOption(option => 
            option.setName('joueur3')
                .setDescription('Troisième joueur impliqué')
                .setRequired(false))
        .addUserOption(option => 
            option.setName('joueur4')
                .setDescription('Quatrième joueur impliqué')
                .setRequired(false))
        .addUserOption(option => 
            option.setName('joueur5')
                .setDescription('Cinquième joueur impliqué')
                .setRequired(false)),

    // Commande pour réinitialiser le ladder (Admin uniquement)
    new SlashCommandBuilder()
        .setName('reset-ladder')
        .setDescription('🔄 Réinitialise complètement le ladder.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    // Commande pour ajouter des points à un joueur (Admin uniquement)
    new SlashCommandBuilder()
        .setName('ajouter-points')
        .setDescription('➕ Ajoute des points à un joueur.')
        .addUserOption(option => option.setName('joueur').setDescription('Sélectionnez un joueur').setRequired(true))
        .addIntegerOption(option => option.setName('points').setDescription('Nombre de points à ajouter').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    // Commande pour retirer des points à un joueur (Admin uniquement)
    new SlashCommandBuilder()
        .setName('retirer-points')
        .setDescription('➖ Retire des points à un joueur.')
        .addUserOption(option => option.setName('joueur').setDescription('Sélectionnez un joueur').setRequired(true))
        .addIntegerOption(option => option.setName('points').setDescription('Nombre de points à retirer').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('🚀 Déploiement des commandes...');
        await rest.put(Routes.applicationGuildCommands(process.env.APPLICATION_ID, process.env.GUILD_ID), { body: commands });
        console.log('✅ Commandes enregistrées !');
    } catch (error) {
        console.error(error);
    }
})();
