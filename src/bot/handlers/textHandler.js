const QRCode = require('qrcode');

const {
    createPixDeposit
} = require('../../services/pushinPay');

const {
    userStates
} = require('../../states/userStates');

const {
    getUser,
    addHistory,
    saveDatabase
} = require('../../database/users');

module.exports = (
    bot,
    pendingPayments
) => {

    bot.on('text', async (ctx) => {

        try {

            const state =
                userStates[ctx.from.id];

            if (!state) return;

            /*
            =================================
            DEPÓSITO
            =================================
            */

            if (
                state.action ===
                'waiting_deposit_amount'
            ) {

                const value = Number(
                    ctx.message.text
                        .replace(',', '.')
                        .replace('R$', '')
                        .trim()
                );

                if (
                    isNaN(value) ||
                    value < 20 ||
                    value > 1500
                ) {

                    return await ctx.reply(
`❌ Valor inválido.

Digite entre R$ 20 e R$ 1500.`
                    );

                }

                const webhookUrl =
'https://tecofertamax.shop/webhook/pushinpay';

                const payment =
                    await createPixDeposit(
                        value,
                        webhookUrl
                    );

                if (!payment) {

                    return await ctx.reply(
`❌ Erro ao gerar PIX.`
                    );

                }

                pendingPayments[
                    payment.id
                ] = {

                    id: payment.id,

                    amount: value,

                    userId: ctx.from.id,

                    firstName:
                        ctx.from.first_name,

                    status: 'pending'

                };

                const qrCodeImage =
                    await QRCode.toBuffer(
                        payment.qr_code
                    );

                await ctx.replyWithPhoto(
                    {
                        source:
                            qrCodeImage
                    },
                    {
                        caption:
`💳 <b>PIX GERADO</b>

━━━━━━━━━━━━━━━

💰 Valor:
R$ ${value.toFixed(2)}

━━━━━━━━━━━━━━━

<code>${payment.qr_code}</code>

━━━━━━━━━━━━━━━

🕒 Aguardando pagamento...`,
                        parse_mode:
                            'HTML'
                    }
                );

                delete userStates[
                    ctx.from.id
                ];

                return;

            }

            /*
            =================================
            SAQUE
            =================================
            */

            const user =
                getUser(ctx.from.id);

            if (
                state.action ===
                'waiting_pix_name'
            ) {

                userStates[
                    ctx.from.id
                ] = {

                    action:
                        'waiting_pix_type',

                    pixName:
                        ctx.message.text

                };

                return await ctx.reply(
`🏦 Envie o tipo da chave PIX.

Ex:
CPF
EMAIL
TELEFONE`
                );

            }

            if (
                state.action ===
                'waiting_pix_type'
            ) {

                userStates[
                    ctx.from.id
                ] = {

                    ...state,

                    action:
                        'waiting_pix_key',

                    pixType:
                        ctx.message.text

                };

                return await ctx.reply(
`🔑 Agora envie sua chave PIX.`
                );

            }

            if (
                state.action ===
                'waiting_pix_key'
            ) {

                user.pixData = {

                    name:
                        state.pixName,

                    type:
                        state.pixType,

                    key:
                        ctx.message.text

                };

                addHistory(
                    ctx.from.id,
                    'SOLICITAÇÃO SAQUE',
                    user.balance
                );

                saveDatabase();

                await ctx.reply(
`✅ <b>SAQUE SOLICITADO</b>

━━━━━━━━━━━━━━━

💰 Valor:
R$ ${user.balance.toFixed(2)}

━━━━━━━━━━━━━━━

⏳ Solicitação enviada
para análise manual.`,
                    {
                        parse_mode:
                            'HTML'
                    }
                );

                await bot.telegram.sendMessage(
                    process.env
                        .ADMIN_TELEGRAM_ID,

`💸 <b>NOVO SAQUE</b>

━━━━━━━━━━━━━━━

👤 ${ctx.from.first_name}

🆔 <code>${ctx.from.id}</code>

💰 Valor:
R$ ${user.balance.toFixed(2)}

━━━━━━━━━━━━━━━

👤 Titular:
${state.pixName}

🏦 Tipo:
${state.pixType}

🔑 Chave:
<code>${ctx.message.text}</code>`,
                    {
                        parse_mode:
                            'HTML'
                    }
                );

                delete userStates[
                    ctx.from.id
                ];

            }

        } catch (error) {

            console.log(
                '❌ ERRO TEXT HANDLER'
            );

            console.log(error);

        }

    });

};