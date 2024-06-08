import * as xlsx from "xlsx";
import { promises as fs } from "fs";


async function readXLSX(filePath){
  try{
    const fileContent = await fs.readFile(filePath);
    const workbook = xlsx.read(fileContent);
    const sheetName = workbook.SheetNames[0]; // Assume que estamos lendo a primeira planilha
    if (sheetName) {
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);
  
      for (const row of data) {
        console.log(row);
      }
    } else {
      console.error("Não foi possível encontrar uma planilha no arquivo.");
    }
  } catch (error) {
    console.error("Erro ao ler o arquivo:", error.message);
  }
}
// Substitua "caminho/do/seu/arquivo.csv" pelo caminho correto do seu arquivo CSV
const filePath = "C:\\Users\\Nomo - Julia\\Nomo\\Faturamento avulso\\Relação de valores\\Fat Telecall - 1223.xlsx";
await readXLSX(filePath);

//chamar variáveis necessárias 

//  Pega a data de referencia e o supplier ID com base no reconcialition informado
const urlGetBrokerReconciliation = `https://api.wave.nomo.com.br/brokers/reconciliations/${RECONCILIATION_ID}`
fetch(urlGetBrokerReconciliation, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${WAVE_API_TOKEN}`,
  },
})
  .then(response => response.json())
  .then(data => {
    const referenceStartDate = data.referenceStartDate;
    const referenceEndtDate = data.referenceEndDate;
    const supplier_id = data.config.supplierId;

    console.log("Start date", referenceStartDate);
    console.log("End date", referenceEndtDate);
    console.log("Supllier Id", supplier_id)
  })
  .catch (error => {
    console.error("Erro ao chamar a API", error)
  })
// Mapeamento da planilha enviada pela Telecall

type PlanilhaColumns = {
  name?: string;
  taxId: string;
  msisdn: string;
  description: string;
  price: string;
};
// função assincrona que pega os dados da planilha da Mari e enriquece com os nossos dados para a criação dos transactions
(async function dataEnrichment() => {
  const data = await getData<PlanilhaColumns>(filename); 
  const transactions = data.map((row) => ({ 
    invoiceId: crypto.randomUUID(), 
    transactionId: crypto.randomUUID(), 
    customerFederalTaxId: row.taxId, 
    productExternalCode: "71d4d217-0518-4286-8e34-ccbc2d2c46e0", // produto (aqui precisa aceitar qualquer produto)
    msisdn: `55${row.msisdn}`, 
    description: row.description, 
    amount: row.price.replace(",", "."), 
    referenceStartDate: referenceStartDate, 
    referenceEndDate: referenceEndtDate,
    autoApprove: true, 
  }));
})();

// função assincrona que adiciona um transactionByCustomerTaxId caso ele ainda não tenha
async function main() { 
  const data = await getTransactions(transactions);
  const transactionsByCustomerTaxId = data.reduce((acc, curr) => { 
      if (!acc[curr.customerFederalTaxId]) acc[curr.customerFederalTaxId] = []; 
      acc[curr.customerFederalTaxId].push(curr); 
      return acc; 
  }, {}); 

  console.log(
      `Iniciando a criação de ${
        Object.keys(transactionsByCustomerTaxId).length 
      } faturas`,
    );
// para cada objeto-chave criado para um documento associa o transaction ao documento do cliente  
    for (const customerTaxId of Object.keys(transactionsByCustomerTaxId)) { 
      const customerTransactions: [] = transactionsByCustomerTaxId[customerTaxId];  
// atribui um groupId para cada customerTransactions
      let groupId = 0;
      const transactionsGroup: Record<number, []> = {}; 
      customerTransactions.forEach((value, index) => { 
        if (index % invoiceItensMaxSize === 0) { 
          groupId = groupId + 1; 
          transactionsGroup[groupId] = []; 
        }
        transactionsGroup[groupId].push(value); 
      }); 
  
      console.log(customerTaxId);
// atribui inicia a criação da invoice, adicionando data e transaction da invoiceId
      for (const groupId of Object.keys(transactionsGroup)) { //cria um grupo de ids para cada objeto da transactiongroup
          const transactions = transactionsGroup[groupId]; 
    
          const start = new Date(); 
          console.log(`Iniciando invoiceId: `, transactions[0].invoiceId);
// recebe o produto pelo externalcode
          const product = await getProductByExternalCode(
            transactions[0].productExternalCode, 
          );
// cria o objeto json da invoice       
          const invoice = { 
            id: transactions[0].invoiceId,
            customerId: await getCustomerIdByFederalTaxId( 
              transactions[0].customerFederalTaxId,
            ),
            supplierId: SUPPLIER_ID, 
            referenceStartDate: transactions[0].referenceStartDate, 
            referenceEndDate: transactions[0].referenceEndDate, 
            description: transactions[0].description, 
            items: transactions.map((transaction) => { 
              return product.components.map((component) => ({ 
                id: uuid.v1.generate(), 
                invoiceId: transaction.invoiceId, 
                componentId: component.id, 
                description: component.description, 
                price: (Number(transaction.amount) * 
                  Number(component.pricing.properties.unitAmount)).toFixed(4),
                transactionId: transaction.transactionId, 
                referencePeriod: { 
                  startDate: transaction.referenceStartDate,
                  endDate: transaction.referenceEndDate,
                },
                metadata: { 
                  mvnoInvoiceId: transaction.reconciliationId, 
                  mvnoId: transaction.brokerId, 
                  customerTaxId: transaction.customerFederalTaxId, 
                  msisdn: transaction.msisdn, 
                },
              }));
            }).flatMap((value) => value),
            autoApprove: Boolean(transactions[0].autoApprove),
          };
// cria invoice, registra a data de finalização e o delta de tempo    
          const result = await createInvoice(invoice); 
          const end = new Date(); 
          const delta = end.getTime() - start.getTime(); 
          console.log(`${invoice.id} - ${result} - ${delta}ms\n`);
      }
  }
}
// cria função assincrona que recebe o valor de documento vs id do cliente  (aqui precisa pegar da API)
async function getCustomerIdByFederalTaxId( 
customerFederalTaxId: string,
): Promise<string> {
const mapper = {
  'federalTaxId' : 'id'
};

return mapper[customerFederalTaxId];
}

//cria função que pega produto pelo external code (aqui precisa pegar da API)
async function getProductByExternalCode( 
productExternalCode: string,
): Promise<any> {
return [
  { DADOS DO PRODUTO
  },
].filter((product) => product.externalCode === productExternalCode)[0]; //valida se o produto é o mesmo 
}
//função que aciona a API para a criação da invoice
async function createInvoice(invoice: any): Promise<string> { 
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append(
    "Authorization",
    `Bearer ${WAVE_API_TOKEN}`,
  );

  var raw = JSON.stringify(invoice);

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
  };

  let result = "";
  try {
    result = await fetch(
      "https://api.wave.nomo.com.br/billing/invoices",
      requestOptions,
    )
      .then((response) => response.text());
  } catch (error) {
    result = String(error);
    console.log("error", error);
  }

  return result;
}





--------------





// Substitua "caminho/do/seu/arquivo.csv" pelo caminho correto do seu arquivo CSV
await readXLSX(filePath);


