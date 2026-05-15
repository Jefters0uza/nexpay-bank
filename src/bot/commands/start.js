const path = require('path');

const {
    mainMenu,
    backMenu
} = require('../menus/mainMenu');

const {
    userStates
} = require('../../states/userStates');

const {
    getUser
} = require('../../database/users');

const {
    clearTemporaryMessage,
    isOperationalTime
} = require('../../utils/helpers');

const walletHandler =
    require('../handlers/walletHandler');

const withdrawHandler =
    require('../handlers/withdrawHandler');

const termsHandler =
    require('../handlers/termsHandler');

const affiliateHandler =
    require('../handlers/affiliateHandler');

const historyHandler =
    require('../handlers/historyHandler');

const textHandler =
    require('../handlers/textHandler');

module.exports = (
    bot,
    usersDatabase,
    pendingPayments
) => {

    /*
    ===============================
    EVITA DUPLICAR HANDLERS
    ===============================
    */

    if (!bot.handlersLoaded) {

        console.log(
            '✅ CARREGANDO HANDLERS'
        );

        walletHandler(bot);

        withdrawHandler(bot);

        termsHandler(bot);

        affiliateHandler(bot);

        historyHandler(bot);

        textHandler(
            bot,
            pendingPayments
        );

        bot.handlersLoaded = true;

        console.log(
            '✅ HANDLERS CARREGADOS'
        );

    }

    /*
    ===============================
    HOME
    ===============================
    */

    const getHomeCaption = (ctx) => {

        const user =
            getUser(ctx.from.id);

        const formattedDate =
            new Date()
                .toLocaleString('pt-BR');

        return `🏦 <b>BEM-VINDO À NEXPAY BANK</b>

Sua privacidade em primeiro lugar.

━━━━━━━━━━━━━━━

🆔 <b>ID DO USUÁRIO:</b>
<code>${ctx.from.id}</code>

💰 <b>TAXA DA PLATAFORMA:</b>
6% sobre depósitos

🕒 <b>ATUALIZADO EM:</b>
${formattedDate}

━━━━━━━━━━━━━━━

💵 <b>SALDO DISPONÍVEL:</b>

R$ ${user.balance.toFixed(2)}`;

    };

    /*
    ===============================
    START
    ===============================
    */

    console.log(
        '✅ START HANDLER CARREGADO'
    );

    bot.start(async (ctx) => {

    try {

        console.log('🚀 START EXECUTADO');

        delete userStates[
            ctx.from.id
        ];

        const user =
            getUser(ctx.from.id);

        const startPayload =
            ctx.payload;

        if (
            startPayload &&
            !user.invitedBy &&
            startPayload !==
                String(ctx.from.id)
        ) {

            user.invitedBy =
                Number(startPayload);

        }

        await ctx.reply(
`🏦 BEM-VINDO À NEXPAY BANK

💰 Saldo:
R$ ${user.balance.toFixed(2)}`,
            {
                ...mainMenu()
            }
        );

        console.log('✅ START ENVIADO');

    } catch (error) {

        console.log(
            '❌ ERRO START'
        );

        console.log(error);

    }

});

    /*
    ===============================
    DEPÓSITO
    ===============================
    */

    bot.action(
        'deposit',
        async (ctx) => {

            try {

                await ctx.answerCbQuery();

                await clearTemporaryMessage(
                    ctx,
                    userStates
                );

                userStates[
                    ctx.from.id
                ] = {

                    action:
                        'waiting_deposit_amount'

                };

                await ctx.editMessageCaption(
`💳 <b>DEPÓSITO VIA PIX</b>

━━━━━━━━━━━━━━━

📌 REGRAS

• Mínimo: R$ 20
• Máximo: R$ 1500

━━━━━━━━━━━━━━━

💰 Digite o valor do depósito.`,
                    {
                        parse_mode:
                            'HTML',

                        ...backMenu()
                    }
                );

                const askMessage =
                    await ctx.reply(
                        `💰 Envie o valor do depósito.`
                    );

                userStates[
                    ctx.from.id
                ].messageId =
                    askMessage.message_id;

            } catch (error) {

                console.log(
                    '❌ ERRO DEPOSIT'
                );

                console.log(error);

            }

        }
    );

    /*
    ===============================
    SUPORTE
    ===============================
    */

    bot.action(
        'support',
        async (ctx) => {

            try {

                await ctx.answerCbQuery();

                await clearTemporaryMessage(
                    ctx,
                    userStates
                );

                const supportOnline =
                    isOperationalTime();

                const supportStatus =
                    supportOnline
                        ? '🟢 ONLINE'
                        : '🟡 OFFLINE';

                await ctx.editMessageCaption(
`🎧 <b>SUPORTE</b>

━━━━━━━━━━━━━━━

${supportStatus}

🕒 Atendimento:
10h às 20h`,
                    {
                        parse_mode:
                            'HTML',

                        ...backMenu()
                    }
                );

            } catch (error) {

                console.log(
                    '❌ ERRO SUPPORT'
                );

                console.log(error);

            }

        }
    );

    /*
    ===============================
    HOME
    ===============================
    */

    bot.action(
        'home',
        async (ctx) => {

            try {

                await ctx.answerCbQuery();

                await clearTemporaryMessage(
                    ctx,
                    userStates
                );

                delete userStates[
                    ctx.from.id
                ];

                await ctx.editMessageCaption(
                    getHomeCaption(ctx),
                    {
                        parse_mode:
                            'HTML',

                        ...mainMenu()
                    }
                );

            } catch (error) {

                console.log(
                    '❌ ERRO HOME'
                );

                console.log(error);

            }

        }
    );

};