const { Markup } = require('telegraf');

const mainMenu = () => {

    return Markup.inlineKeyboard([

        [
            Markup.button.callback('📥 DEPOSITAR', 'deposit'),
            Markup.button.callback('💸 SACAR', 'withdraw')
        ],

        [
            Markup.button.callback('💼 CARTEIRA', 'wallet'),
            Markup.button.callback('🎧 SUPORTE', 'support')
        ]

    ]);

};

const backMenu = () => {

    return Markup.inlineKeyboard([

        [
            Markup.button.callback('⬅️ VOLTAR', 'home')
        ]

    ]);

};

const walletMenu = () => {

    return Markup.inlineKeyboard([

        [
            Markup.button.callback('📄 TERMOS DE USO', 'terms'),
            Markup.button.callback('🏦 SEJA AFILIADO', 'affiliate')
        ],

        [
            Markup.button.callback('📜 HISTÓRICO', 'history'),
            Markup.button.callback('⬅️ VOLTAR', 'home')
        ]

    ]);

};

const affiliateMenu = () => {

    return Markup.inlineKeyboard([

        [
            Markup.button.callback('📤 COMPARTILHAR', 'share_affiliate')
        ],

        [
            Markup.button.callback('⬅️ VOLTAR', 'wallet')
        ]

    ]);

};

module.exports = {
    mainMenu,
    backMenu,
    walletMenu,
    affiliateMenu
};