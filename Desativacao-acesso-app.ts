const fs = require('fs');

const USERS_API_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFmNDBmMGE4ZWYzZDg4MDk3OGRjODJmMjVjM2VjMzE3YzZhNWI3ODEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI5Njk5NjMyNTY1NDYtcDVzOG9zZDRkcHBjYzhjNmF0dWNjOTczZWxlaWgzMHEuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI5Njk5NjMyNTY1NDYtcDVzOG9zZDRkcHBjYzhjNmF0dWNjOTczZWxlaWgzMHEuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDc1NzA1MjY1NDAwMjE1Mjg5MTgiLCJoZCI6Im5vbW8uY29tLmJyIiwiZW1haWwiOiJtYXJjb3MuYXVndXN0b0Bub21vLmNvbS5iciIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYmYiOjE3MDUwOTE5MTIsIm5hbWUiOiJNYXJjb3MgQXVndXN0byIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NKcG5vb1NZekpCbDZhRE1EMmhSa2p0eXFENXRMdnNHVWlJNS1Ga2VMRFI4M1U9czk2LWMiLCJnaXZlbl9uYW1lIjoiTWFyY29zIiwiZmFtaWx5X25hbWUiOiJBdWd1c3RvIiwibG9jYWxlIjoicHQtQlIiLCJpYXQiOjE3MDUwOTIyMTIsImV4cCI6MTcwNTA5NTgxMiwianRpIjoiZGNhYjk3YjEzNDZkNTA5YTYyYjU5NjZhNjE3YTNjNWEyM2Q2OWE4ZCJ9.BJ3SteTDLx68MBjo2z1eDN7KuNacXPLR0vl1mDS7bPt5hwp1bUyrElltXsWFpaOkJi--DL2lluAGWczskY9MbVcEcDv9B3_SY6JKIxdEkZRD8HQImFQXUePKqy94XPAqkuO3VhKrnxG_j8NI1rGEklhYz5zVDoXD5UfQQR4_dlWVtZOYNZcPaGbdkUUM1Po-EnbUVR_dzkFxjSbO3PQ7l-dUTYFDisHjU0hGYKfaTkpHQ4ry_m3dZQfLpsqqpL_YQJqBzl45uFcSbbHyHUM5nof8xfwMD7VE31RZNksHSsSR-XcH5Fggfmme_vOkESFUtWWiRSPRC4xje2MU7OHT9Q";
const NOMO_DOMAIN = 'nomo.com.br'; //variavel com o dominio Nomo

type User = {
    id: string,
    email: string,
    displayName: string,
    lineIds: string[],
    lastSignInTime: string,
    createdAt: string
};

async function fetchGetUsers() { // função fetch para pegar os usuários
    const urlListUsers = "https://us-central1-mobile-firebase-prod-329501.cloudfunctions.net/api/v1/users"; // chamo o link da api
    try {

        let response = await fetch(urlListUsers, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${USERS_API_TOKEN}`
            } //chama a requisição e autoriza
        });
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.statusText}`); // se retornar erro na chamada 
        }
        const data = await response.json(); // registra todos os dados json na variável data
        // console.log("Dados da API", data); // imprime todos os dados
        return data.data;
    }
    catch (error) {
        console.error('Erro durante a requisição:', error); // captura erros durante a requisição
        throw error;
    }
}

function filterUserByDominio(allUsers): User[] { //função para filtrar dominio do e-mail
    try {
        if (allUsers && Array.isArray(allUsers)) { // valida se o existe uma array dentro de allusers
            const filterUsers = allUsers.filter(user => !user.email.endsWith(`@${NOMO_DOMAIN}`));
            // console.log("Retorna os usuários filtrados", filterUsers)
            return filterUsers // variavel que armazena os dados filtrados (possuem email de dominio diferente)
            //trecho de código que retorna todos os e-mails que foram ignorados pelo código acima
            // allUsers.forEach(user => { 
            //  if (user.email.endsWith(`@${NOMO_DOMAIN}`)) {
            //  console.log("E-mail ignorado:", user.email);
            //   }
            //   });
        } else {
            console.log('Nenhum usuário encontrado ou formato de dados inválido.');
            return [];
        }
    } catch (error) {
        console.error("Erro de execução:", error); // captura erros durante a função 
        return [];
    }
}

async function removeAccess(userId: string, lineId: string | undefined): Promise<any> { //função para remover acesso (trabalhando aqui)
    if (lineId === undefined) return { status: 'OK', body: undefined };

    try {
        const urlUserRemoveGrantAccess = `https://us-central1-mobile-firebase-prod-329501.cloudfunctions.net/api/v1/users/${userId}/removeGrant`; // chamo o link da api
        const response = await fetch(urlUserRemoveGrantAccess, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${USERS_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ lineId })
            //chama a requisição de remoção
        });

        if (!response.ok) {
            console.log(await response.json());
            throw new Error(`Erro na requisição: ${response.statusText}`); // se retornar erro na chamada 
        }

        const data = await response.json(); // registra todos os dados json na variável data
        return { status: response.statusText, body: data.body };
    } catch (error) {
        console.log('Erro ao remover o acesso', error);
        throw error;
    }
}
// chamar a URL que aciona a API
// fazer o body da api 




// criar documento

async function main() {
    const allUsers = await fetchGetUsers(); // armazena os dados capturados na função anterior em all users
    const filteredUsers = filterUserByDominio(allUsers);
    console.log('All users length: ', allUsers.length);
    console.log('Filtered users length: ', filteredUsers.length);

    let index = 1;
    for (const user of filteredUsers) {
        const start = new Date();
        console.log(`${user.displayName}: Iniciando remoção de acesso. [userId=${user.id},lineId=${user.lineIds[0]}]`);
        const result = await removeAccess(user.id, user.lineIds[0]);
        console.log(`${user.displayName}: ${result.status}${result.body ? result.body : ''}\n`);
        
        const end = new Date();
        console.log('Stats:')
        console.log(`${index}/${filteredUsers.length} = ${((index)*100/filteredUsers.length).toFixed(2)}%`);
        console.log(`Duração: ${end.getTime() - start.getTime()}ms\n`)
        index = index + 1;
    }
}
main()