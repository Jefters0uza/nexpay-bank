const {
    backMenu
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

const RULES = {
    withdraw: {
        minimum: 25
    }
};

module.exports = (bot) => {

    bot.action('withdraw', async (ctx) => {

        try {

            await ctx.answerCbQuery();

            await clearTemporaryMessage(
                ctx,
                userStates
            );

            const user =
                getUser(ctx.from.id);

            if (
                user.balance <
                RULES.withdraw.minimum
            ) {

                return await ctx.editMessageCaption(
`❌ <b>SALDO INSUFICIENTE</b>

━━━━━━━━━━━━━━━

💸 Saque mínimo:
R$ ${RULES.withdraw.minimum.toFixed(2)}

━━━━━━━━━━━━━━━

💰 Seu saldo:
R$ ${user.balance.toFixed(2)}`,
                    {
                        parse_mode: 'HTML',
                        ...backMenu()
                    }
                );

            }

            await ctx.editMessageCaption(
`💸 <b>SAQUE VIA PIX</b>

━━━━━━━━━━━━━━━

💰 Saldo disponível:
R$ ${user.balance.toFixed(2)}

━━━━━━━━━━━━━━━

⚡ O saque é enviado
manualmente pela equipe.

━━━━━━━━━━━━━━━

📌 Clique abaixo para
solicitar o saque.`,
                {
                    parse_mode: 'HTML',

                    reply_markup: {
                        inline_keyboard: [

                            [
                                {
                                    text:
                                        '💸 SOLICITAR SAQUE',

                                    callback_data:
                                        'request_withdraw'
                                }
                            ],

                            [
                                {
                                    text:
                                        '⬅️ VOLTAR',

                                    callback_data:
                                        'home'
                                }
                            ]

                        ]
                    }
                }
            );

        } catch (error) {

            console.log(
                '❌ ERRO WITHDRAW'
            );

            console.log(error);

        }

    });

    /*
    ================================
    INICIAR SOLICITAÇÃO
    ================================
    */

    bot.action(
        'request_withdraw',

        async (ctx) => {

            try {

                await ctx.answerCbQuery();

                userStates[
                    ctx.from.id
                ] = {

                    action:
                        'waiting_pix_name'

                };

                await ctx.reply(
`👤 Envie seu nome completo.`
                );

            } catch (error) {

                console.log(error);

            }

        }
    );

};