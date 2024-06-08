import * as uuid from "https://deno.land/std@0.184.0/uuid/mod.ts";
import { parse } from "https://deno.land/std@0.82.0/encoding/csv.ts";


const WAVE_API_TOKEN =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlpuN3NqdEdqY3BmSmU4SnJzUXFaYSJ9.eyJpc3MiOiJodHRwczovL3RlbGVjYWxsLXByb2R1Y3Rpb24udXMuYXV0aDAuY29tLyIsInN1YiI6Imw3bFdCbnFxenZ4bU8wZkZNREpUUGN3bU1SSFZ0VUNOQGNsaWVudHMiLCJhdWQiOiJodHRwczovL2FwaS53YXZlLm5vbW8uY29tLmJyIiwiaWF0IjoxNzE3Njk0OTc0LCJleHAiOjE3MTc3ODEzNzQsImd0eSI6ImNsaWVudC1jcmVkZW50aWFscyIsImF6cCI6Imw3bFdCbnFxenZ4bU8wZkZNREpUUGN3bU1SSFZ0VUNOIn0.AMbAJ-HLl51cwjDXNJJSGJnuW3Rhj5YvaqfbAMxtMJbfZfPhsvU4jSteRSFV8aUlOUURDHBCXGaw3d22JI195pTdjK4a3wguGQQ6DrgwTdYsg671gcMxPKArFhBn9l-BDWCK9a7tDobPPvMAAQgNnTwv7IQx06B8Z0_ULpZivFrchw8D5PqMUVhWsTqH7l4nfYKyMR1ySPH6XbIBV7YX4BN47dLksOlecM4V9epwc34_k-DhHO2iNPSNYaZYheQf1oK5CrYHBl1tDRIvp4t7HaWX3bGKjrobMwe_lXgu3mg9C3cRyfHFFtM5A7tqLWAaAIQyAJGj875IOxzZ5CWPjg";
const RECONCILIATION_ID = "15606f0e-e9cb-4ed2-8f2e-58096525d374";
const REFERENCE_DATE = {
  start:"2024-01-01T00:00:00.000Z",
  end:"2024-02-01T00:00:00.000Z",
}

const invoiceItensMaxSize = 30;
const SUPPLIER_ID = "56b2ec47-1b3c-43ac-9d0b-a8ebbf604540";
const BROKER_ID = "81dd2380-3eaf-44ab-9911-08c418aac30e";


  // const filename =
  //   "/Users/marcosaugusto/nomo/Migraçao Telecall Billing/Telecall/transactions_telecall_mar.csv";
const filename = "C:/Users/Nomo - Julia/Nomo/Faturamento_Fluke/jan24Fluke.csv";

main();

async function main() {
  const data = await getTransactionsFromSheets(filename);

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

  for (const customerTaxId of Object.keys(transactionsByCustomerTaxId)) {
    const customerTransactions: [] = transactionsByCustomerTaxId[customerTaxId];

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

    for (const groupId of Object.keys(transactionsGroup)) {
      const transactions = transactionsGroup[groupId];

      const start = new Date();
      console.log(`Iniciando invoiceId: `, transactions[0].invoiceId);
      const product = await getProductByExternalCode(
        transactions[0].productExternalCode,
      );

      if (!product || !product.components) {
        throw new Error(`Product not found or does not have components`);
      }

      const invoice = {
        id: transactions[0].invoiceId,
        customerId: await listCustomerById(
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
        metadata: {
          brokerReconciliationId: transactions[0].reconciliationId,
        }
      };

      const result = await createInvoice(invoice);
      const end = new Date();
      const delta = end.getTime() - start.getTime();
      console.log(`Invoice ${invoice.id} - ${result} - ${delta}ms\n`);
    }
  }
}

async function getTransactionsFromSheets(sheetsFilename: string): Promise<any[]> {

  const result: any[] = [];

  type PlanilhaColumns = {
    name?: string;
    taxId: string;
    msisdn: string;
    description: string;
    price: string;
  };

  try {
    const data = await getData<PlanilhaColumns>(filename);
    
    result.push(
      "invoiceId,transactionId,customerFederalTaxId,productExternalCode,msisdn,description,amount,referenceStartDate,referenceEndDate,autoApprove,brokerId,reconciliationId",
    );

    for (const row of data) {
      const customerData = await listCustomerById(row.taxId.trim());
      const customerFederalTaxId = customerData && customerData[0] && customerData[0].federalTaxId;
      console.log("Customer federal tax ID found:", customerFederalTaxId);
      const transactions = {
        invoiceId: crypto.randomUUID(),
        transactionId: crypto.randomUUID(),
        customerFederalTaxId: row.taxId.trim(),
        productExternalCode: "c044fa4a-3e9f-4d8d-a54d-dfb9b893784a",
        msisdn: row.msisdn.trim(),
        description: row.description.trim(),
        amount: row.price.replace(",", "."),
        referenceStartDate: REFERENCE_DATE.start,
        referenceEndDate: REFERENCE_DATE.end,
        autoApprove: true,
      };
  
      if (transactions.msisdn.length !== 13) throw Error(`Invalid msisdn ${transactions.msisdn}`);
      if (transactions.customerFederalTaxId.length !== 11 && transactions.customerFederalTaxId.length !== 14) throw Error(`Invalid tax id ${transactions.customerFederalTaxId}`);
  
      result.push(
        `"${transactions.invoiceId}","${transactions.transactionId}","${transactions.customerFederalTaxId}","${transactions.productExternalCode}","${transactions.msisdn}","${transactions.description}","${transactions.amount}","${transactions.referenceStartDate}","${transactions.referenceEndDate}","${transactions.autoApprove}","${BROKER_ID}","${RECONCILIATION_ID}"`,
      );
    }
  } catch (error) {
    console.log("Error fetching or processing data:", error);
    throw error;
  }

  return parse(result.join('\n'), {
    skipFirstRow: true,
  });
}

  async function getData<T>(csvFilename: string): Promise<T[]> {
    const decoder = new TextDecoder("utf-8");
    const data = await Deno.readFile(csvFilename);
    const text = decoder.decode(data);

    return parse(text, {
      skipFirstRow: true,
      separator: ",",
    });
  }


async function listCustomerById(taxId: any): Promise<string> {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append(
    "Authorization",
    `Bearer ${WAVE_API_TOKEN}`,
  );
  var requestOptions = {
    method: "GET",
    headers: myHeaders,
  };

  try {
    const response = await fetch(
      `https://api.wave.nomo.com.br/core/customers?federalTaxId=${encodeURIComponent(taxId)}`, 
      requestOptions
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch customer data: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.log("Error fetching customer data:", error);
    throw error;
  }
}


async function getTransactionsFromCsv(csvFilename: string): Promise<any[]> {
  const decoder = new TextDecoder("utf-8");
  const data = await Deno.readFile(csvFilename);
  const text = decoder.decode(data);

  return parse(text, {
    skipFirstRow: true,
  });
}

async function getProductByExternalCode(
  productExternalCode: string,
): Promise<any | undefined> {
  const products = [
    {
      "id": "bbeb20ad-62a8-4ded-97c8-da18d7ce7b9f",
      "createdAt": "2024-05-13T21:40:02.997Z",
      "name": "Fluke - Produto Avulso",
      "description": "Fluke - Produto Avulso",
      "externalCode": "c044fa4a-3e9f-4d8d-a54d-dfb9b893784a",
      "metadata": {},
      "components": [
        {
          "id": "f7f3c4b8-d899-41a3-9449-64342cda58f6",
          "createdAt": "2024-05-13T21:40:02.997Z",
          "name": "Prestação de Serviço de SMP",
          "catalogProductId": "bbeb20ad-62a8-4ded-97c8-da18d7ce7b9f",
          "interval": "SPOT",
          "description": "Prestação de Serviço de SMP",
          "externalCode": null,
          "externalTaxCode": "d98d9110-a9fb-4eca-95f4-9cccb59b8381",
          "pricing": {
            "model": "FLAT",
            "properties": {
              "unitPrice": "0.6",
              "billableMetricId": {
                "value": "3d251540-80f0-4cea-8799-5f77867f2f9e"
              }
            }
          }
        },
        {
          "id": "89a54c76-3b1a-4657-957b-9fca768d4f22",
          "createdAt": "2024-05-13T21:40:02.997Z",
          "name": "Prestação de Serviço de SVA",
          "catalogProductId": "bbeb20ad-62a8-4ded-97c8-da18d7ce7b9f",
          "interval": "SPOT",
          "description": "TPrestação de Serviço de SVA",
          "externalCode": null,
          "externalTaxCode": "da10d9fc-be69-4acb-9b04-90535e9b454f",
          "pricing": {
            "model": "FLAT",
            "properties": {
              "unitPrice": "0.4",
              "billableMetricId": {
                "value": "9f203100-8a95-4ecc-aeca-6163b159023c"
              }
            }
          }
        }
      ],
    },
  ];

  const product = products.find((p) => p.externalCode === productExternalCode);
  return product;
}

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

