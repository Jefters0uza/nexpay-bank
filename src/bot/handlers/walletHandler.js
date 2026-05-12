const {
    walletMenu
} = require('../menus/mainMenu');

const {
    getUser
} = require('../../database/users');

const {
    clearTemporaryMessage
} = require('../../utils/helpers');

const {
    userStates
} = require('../../states/userStates');

module.exports = (bot) => {

    bot.action('wallet', async (ctx) => {

        try {

            await ctx.answerCbQuery();

            await clearTemporaryMessage(
                ctx,
                userStates
            );

            const user = getUser(ctx.from.id);

            await ctx.editMessageCaption(
`💼 <b>CARTEIRA DIGITAL</b>

━━━━━━━━━━━━━━━

👤 Usuário:
${ctx.from.first_name}

🆔 ID:
<code>${ctx.from.id}</code>

━━━━━━━━━━━━━━━

💰 Saldo:
R$ ${user.balance.toFixed(2)}

📥 Depositado:
R$ ${user.deposited.toFixed(2)}

📤 Sacado:
R$ ${user.withdrawed.toFixed(2)}

━━━━━━━━━━━━━━━

📅 Criada em:
${user.createdAt}`,
                {
                    parse_mode: 'HTML',
                    ...walletMenu()
                }
            );

        } catch (error) {

            console.log('❌ ERRO WALLET');
            console.log(error);

        }

    });

};