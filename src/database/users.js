const fs = require('fs');

const path = require('path');

const databasePath = path.resolve(
    __dirname,
    '../data/users.json'
);

let usersDatabase = {};

/*
=================================
CARREGAR DATABASE
=================================
*/

const loadDatabase = () => {

    try {

        if (
            !fs.existsSync(databasePath)
        ) {

            fs.writeFileSync(
                databasePath,
                '{}'
            );

        }

        const data =
            fs.readFileSync(
                databasePath,
                'utf-8'
            );

        usersDatabase =
            JSON.parse(data);

        console.log(
            '✅ DATABASE CARREGADA'
        );

    } catch (error) {

        console.log(
            '❌ ERRO LOAD DATABASE'
        );

        console.log(error);

        usersDatabase = {};

    }

};

/*
=================================
SALVAR DATABASE
=================================
*/

const saveDatabase = () => {

    try {

        fs.writeFileSync(
            databasePath,

            JSON.stringify(
                usersDatabase,
                null,
                4
            )
        );

    } catch (error) {

        console.log(
            '❌ ERRO SAVE DATABASE'
        );

        console.log(error);

    }

};

/*
=================================
PEGAR USUÁRIO
=================================
*/

const getUser = (userId) => {

    if (!usersDatabase[userId]) {

        usersDatabase[userId] = {

            balance: 0,

            deposited: 0,

            withdrawed: 0,

            affiliateBalance: 0,

            affiliateEarnings: 0,

            invitedBy: null,

            referrals: [],

            history: [],

            pixData: null,

            createdAt:
                new Date()
                    .toLocaleString('pt-BR')

        };

        saveDatabase();

    }

    return usersDatabase[userId];

};

/*
=================================
ADICIONAR HISTÓRICO
=================================
*/

const addHistory = (
    userId,
    type,
    amount
) => {

    const user =
        getUser(userId);

    user.history.push({

        type,

        amount,

        date:
            new Date()
                .toLocaleString('pt-BR')

    });

    saveDatabase();

};

/*
=================================
ATUALIZAR USER
=================================
*/

const updateUser = (
    userId,
    data
) => {

    usersDatabase[userId] = {

        ...getUser(userId),

        ...data

    };

    saveDatabase();

};

loadDatabase();

module.exports = {

    usersDatabase,

    getUser,

    addHistory,

    updateUser,

    saveDatabase

};