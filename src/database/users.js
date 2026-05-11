const usersDatabase = {};

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

module.exports = {
    usersDatabase,
    getUser
};