const {
    affiliateMenu
} = require('../menus/mainMenu');

module.exports = (bot) => {

    bot.action('affiliate', async (ctx) => {

        try {

            await ctx.answerCbQuery();

            const affiliateLink =
`https://t.me/NexPayBank_bot?start=${ctx.from.id}`;

            await ctx.editMessageCaption(
`🏦 <b>PROGRAMA DE AFILIADOS</b>

━━━━━━━━━━━━━━━

💰 Comissão:
1,5%

━━━━━━━━━━━━━━━

⚡ Você recebe comissão
automaticamente no
PRIMEIRO depósito
confirmado do indicado.

━━━━━━━━━━━━━━━

💸 Saque mínimo afiliado:
R$ 25,00

━━━━━━━━━━━━━━━

🔗 SEU LINK:

<code>${affiliateLink}</code>

━━━━━━━━━━━━━━━

📢 Basta divulgar seu link.
Quando o indicado fizer
o primeiro depósito REAL,
a comissão cai automaticamente
em seu saldo NexPay.`,
                {
                    parse_mode: 'HTML',
                    ...affiliateMenu()
                }
            );

        } catch (error) {

            console.log('❌ ERRO AFFILIATE');
            console.log(error);

        }

    });

    bot.action(
        'share_affiliate',
        async (ctx) => {

            try {

                await ctx.answerCbQuery(
                    '🔗 Link copiado e pronto para divulgação.',
                    {
                        show_alert: true
                    }
                );

            } catch (error) {

                console.log(error);

            }

        }
    );

};