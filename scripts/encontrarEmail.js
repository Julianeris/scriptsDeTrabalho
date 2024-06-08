function encontrarEmails(array, limite = 200) {
    const emails = [];
    for (let i = 0; i < Math.min(array.length, limite); i++) {
        const lineHolder = array[i]?.lineHolder || {}; // Verifica se o campo lineHolder existe
        const contactEmails = lineHolder.contactEmails || []; // Verifica se o campo contactEmails existe dentro de lineHolder
        for (let j = 0; j < contactEmails.length; j++) {
            const email = contactEmails[j]?.props?.email?.props?.value; // Extrai o valor do email
            if (email) { // Verifica se o email é válido
                emails.push(email);
            }
        }
    }
    return emails;
}

const array = [ ]

const emails = encontrarEmails(array, 200);
console.log(emails);