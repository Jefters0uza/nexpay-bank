const path = require('path');
const QRCode = require('qrcode');

const {
    mainMenu,
    backMenu,
    walletMenu,
    affiliateMenu
} = require('../menus/mainMenu');

const {
    createPixDeposit
} = require('../../services/pushinPay');

const userStates = {};

const RULES = {
    deposit: {
        minimum: 20,
        maximum: 1500
    },

    withdraw: {
        minimum: 25,
        fee: 0
    },

    support: {
        startHour: 10,
        endHour: 20
    }
};

const isOperationalTime = () => {

    const currentHour = new Date().getHours();

    return (
        currentHour >= RULES.support.startHour &&
        currentHour < RULES.support.endHour
    );

};

const clearTemporaryMessage = async (ctx) => {

    try {

        const state = userStates[ctx.from.id];

        if (!state) return;

        if (!state.messageId) return;

        await ctx.telegram.deleteMessage(
            ctx.chat.id,
            state.messageId
        );

        delete userStates[ctx.from.id].messageId;

    } catch (error) {

    }

};

module.exports = (
    bot,
    usersDatabase,
    pendingPayments
) => {

    const getUser = (userId) => {

        if (!usersDatabase[userId]) {

            usersDatabase[userId] = {
                balance: 0,
                deposited: 0,
                withdrawed: 0,
                pixData: null,
                createdAt: new Date().toLocaleString('pt-BR')
            };

        }

        return usersDatabase[userId];

    };

    const getHomeCaption = (ctx) => {

        const user = getUser(ctx.from.id);

        const currentDate = new Date();

        const formattedDate = currentDate.toLocaleString('pt-BR');

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

    bot.start(async (ctx) => {

        try {

            delete userStates[ctx.from.id];

            getUser(ctx.from.id);

            await ctx.replyWithPhoto(
                {
                    source: path.resolve(__dirname, '../../assets/logo.jpeg')
                },
                {
                    caption: getHomeCaption(ctx),
                    parse_mode: 'HTML',
                    ...mainMenu()
                }
            );

        } catch (error) {

            console.log('❌ ERRO NO START:', error);

        }

    });

    bot.action('deposit', async (ctx) => {

        try {

            await ctx.answerCbQuery();

            await clearTemporaryMessage(ctx);

            userStates[ctx.from.id] = {
                action: 'waiting_deposit_amount'
            };

            await ctx.editMessageCaption(
`💳 <b>DEPÓSITO VIA PIX</b>

━━━━━━━━━━━━━━━

📌 <b>REGRAS</b>

• Mínimo: R$ ${RULES.deposit.minimum.toFixed(2)}
• Máximo: R$ ${RULES.deposit.maximum.toFixed(2)}

━━━━━━━━━━━━━━━

⚡ Digite o valor do depósito.`,
                {
                    parse_mode: 'HTML',
                    ...backMenu()
                }
            );

            const askMessage = await ctx.reply(
                `💰 Digite o valor do depósito.`,
            );

            userStates[ctx.from.id].messageId = askMessage.message_id;

        } catch (error) {

            console.log('❌ ERRO NO DEPÓSITO:', error);

        }

    });

    bot.on('text', async (ctx) => {

        try {

            const userState = userStates[ctx.from.id];

            if (!userState) return;

            if (
                userState.action ===
                'waiting_deposit_amount'
            ) {

                await clearTemporaryMessage(ctx);

                const value = Number(
                    ctx.message.text
                        .replace(',', '.')
                        .replace('R$', '')
                        .trim()
                );

                if (
                    isNaN(value) ||
                    value < RULES.deposit.minimum ||
                    value > RULES.deposit.maximum
                ) {

                    const askMessage = await ctx.reply(
                        `❌ Valor inválido.\n\nDigite um valor entre R$ ${RULES.deposit.minimum} e R$ ${RULES.deposit.maximum}.`
                    );

                    userStates[ctx.from.id].messageId =
                        askMessage.message_id;

                    return;

                }

                const webhookUrl =
`https://tecofertamax.shop/webhook/pushinpay`;

                const payment = await createPixDeposit(
                    value,
                    webhookUrl
                );

                if (!payment) {

                    await ctx.reply(
                        `❌ Erro ao gerar PIX.`
                    );

                    return;

                }

                pendingPayments[payment.id] = {
                    id: payment.id,
                    amount: value,
                    userId: ctx.from.id,
                    firstName: ctx.from.first_name,
                    status: 'pending'
                };

                const qrCodeImage = await QRCode.toBuffer(
                    payment.qr_code
                );

                await ctx.replyWithPhoto(
                    {
                        source: qrCodeImage
                    },
                    {
                        caption:
`💳 <b>PAGAMENTO PIX GERADO</b>

━━━━━━━━━━━━━━━

💰 Valor:
R$ ${value.toFixed(2)}

━━━━━━━━━━━━━━━

📋 <b>PIX COPIA E COLA</b>

<code>${payment.qr_code}</code>

━━━━━━━━━━━━━━━

⚠️ O saldo será liberado
somente após o pagamento REAL.

━━━━━━━━━━━━━━━

🕒 Aguardando pagamento...`,
                        parse_mode: 'HTML',
                        ...backMenu()
                    }
                );

                await bot.telegram.sendMessage(
                    process.env.ADMIN_TELEGRAM_ID,
`💰 <b>NOVO PIX GERADO</b>

━━━━━━━━━━━━━━━

👤 Usuário:
${ctx.from.first_name}

🆔 ID:
<code>${ctx.from.id}</code>

💵 Valor:
R$ ${value.toFixed(2)}

🧾 TXID:
<code>${payment.id}</code>

━━━━━━━━━━━━━━━

⏳ STATUS:
AGUARDANDO PAGAMENTO`,
                    {
                        parse_mode: 'HTML'
                    }
                );

                delete userStates[ctx.from.id];

                return;

            }

        } catch (error) {

            console.log('❌ ERRO AO RECEBER TEXTO:', error);

        }

    });

    bot.action('withdraw', async (ctx) => {

        try {

            await ctx.answerCbQuery();

            await clearTemporaryMessage(ctx);

            const user = getUser(ctx.from.id);

            if (
                user.balance <
                RULES.withdraw.minimum
            ) {

                return await ctx.editMessageCaption(
`❌ <b>SALDO INSUFICIENTE</b>

━━━━━━━━━━━━━━━

Saque mínimo:
R$ ${RULES.withdraw.minimum.toFixed(2)}

━━━━━━━━━━━━━━━

Saldo atual:
R$ ${user.balance.toFixed(2)}`,
                    {
                        parse_mode: 'HTML',
                        ...backMenu()
                    }
                );

            }

            await ctx.editMessageCaption(
`💸 <b>SAQUE SOLICITADO</b>

━━━━━━━━━━━━━━━

💰 Valor disponível:
R$ ${user.balance.toFixed(2)}

━━━━━━━━━━━━━━━

⏳ Seu saque entrou
em análise manual.`,
                {
                    parse_mode: 'HTML',
                    ...backMenu()
                }
            );

            await bot.telegram.sendMessage(
                process.env.ADMIN_TELEGRAM_ID,
`💸 <b>NOVO PEDIDO DE SAQUE</b>

━━━━━━━━━━━━━━━

👤 Usuário:
${ctx.from.first_name}

🆔 ID:
<code>${ctx.from.id}</code>

💰 Saldo:
R$ ${user.balance.toFixed(2)}

━━━━━━━━━━━━━━━

⚠️ Aguardando aprovação manual.`,
                {
                    parse_mode: 'HTML'
                }
            );

        } catch (error) {

            console.log('❌ ERRO NO SAQUE:', error);

        }

    });

    bot.action('wallet', async (ctx) => {

        try {

            await ctx.answerCbQuery();

            await clearTemporaryMessage(ctx);

            const user = getUser(ctx.from.id);

            const firstName =
                ctx.from.first_name || 'Usuário';

            await ctx.editMessageCaption(
`💼 <b>CARTEIRA DIGITAL</b>

━━━━━━━━━━━━━━━

👤 Titular:
${firstName}

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

📅 Conta criada:
${user.createdAt}`,
                {
                    parse_mode: 'HTML',
                    ...walletMenu()
                }
            );

        } catch (error) {

            console.log('❌ ERRO NA CARTEIRA:', error);

        }

    });

    bot.action('support', async (ctx) => {

        try {

            await ctx.answerCbQuery();

            await clearTemporaryMessage(ctx);

            const supportOnline =
                isOperationalTime();

            const supportStatus =
                supportOnline
                    ? '🟢 SUPORTE ONLINE'
                    : '🟡 SUPORTE OFFLINE';

            await ctx.editMessageCaption(
`🎧 <b>CENTRAL DE SUPORTE</b>

━━━━━━━━━━━━━━━

${supportStatus}

🕒 Atendimento:
10h às 20h`,
                {
                    parse_mode: 'HTML',
                    ...backMenu()
                }
            );

        } catch (error) {

            console.log('❌ ERRO NO SUPORTE:', error);

        }

    });

    bot.action('home', async (ctx) => {

        try {

            await ctx.answerCbQuery();

            await clearTemporaryMessage(ctx);

            delete userStates[ctx.from.id];

            await ctx.editMessageCaption(
                getHomeCaption(ctx),
                {
                    parse_mode: 'HTML',
                    ...mainMenu()
                }
            );

        } catch (error) {

            console.log('❌ ERRO HOME:', error);

        }

    });

};