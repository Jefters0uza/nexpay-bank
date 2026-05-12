const {
    backMenu
} = require('../menus/mainMenu');

module.exports = (bot) => {

    bot.action('terms', async (ctx) => {

        try {

            await ctx.answerCbQuery();

            await ctx.editMessageCaption(
`📄 <b>TERMOS DE USO — NEXPAY</b>

━━━━━━━━━━━━━━━

Última atualização:
Maio de 2026

━━━━━━━━━━━━━━━

🏦 A NexPay atua como
plataforma tecnológica
voltada para automação
e gerenciamento de
operações digitais.

━━━━━━━━━━━━━━━

🔐 O usuário concorda em:

• utilizar a plataforma
de forma lícita;

• manter sigilo de acesso;

• não compartilhar contas;

• respeitar os termos
operacionais da plataforma.

━━━━━━━━━━━━━━━

⚠️ A NexPay poderá:

• monitorar operações;

• realizar verificações;

• limitar funcionalidades;

• suspender acessos
em caso de risco.

━━━━━━━━━━━━━━━

🔒 Os dados são tratados
conforme LGPD e medidas
de segurança digital.

━━━━━━━━━━━━━━━

© 2026 NexPay
Todos os direitos reservados.`,
                {
                    parse_mode: 'HTML',
                    ...backMenu()
                }
            );

        } catch (error) {

            console.log('❌ ERRO TERMS');
            console.log(error);

        }

    });

};