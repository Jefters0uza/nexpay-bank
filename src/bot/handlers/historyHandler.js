const {
    backMenu
} = require('../menus/mainMenu');

const {
    getUser
} = require('../../database/users');

module.exports = (bot) => {

    bot.action('history', async (ctx) => {

        try {

            await ctx.answerCbQuery();

            const user = getUser(ctx.from.id);

            if (
                !user.history ||
                user.history.length === 0
            ) {

                return await ctx.editMessageCaption(
`📜 <b>HISTÓRICO</b>

━━━━━━━━━━━━━━━

Nenhuma movimentação encontrada.`,
                    {
                        parse_mode: 'HTML',
                        ...backMenu()
                    }
                );

            }

            let historyText =
`📜 <b>HISTÓRICO FINANCEIRO</b>

━━━━━━━━━━━━━━━

`;

            user.history
                .slice()
                .reverse()
                .forEach((item) => {

                    historyText +=
`💰 ${item.type}

Valor:
R$ ${item.amount.toFixed(2)}

Data:
${item.date}

━━━━━━━━━━━━━━━

`;

                });

            await ctx.editMessageCaption(
                historyText,
                {
                    parse_mode: 'HTML',
                    ...backMenu()
                }
            );

        } catch (error) {

            console.log('❌ ERRO HISTORY');
            console.log(error);

        }

    });

};