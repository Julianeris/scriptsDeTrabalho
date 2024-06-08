import * as uuid from "https://deno.land/std@0.184.0/uuid/mod.ts";
import { parse } from "https://deno.land/std@0.82.0/encoding/csv.ts";


const WAVE_API_TOKEN =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlpuN3NqdEdqY3BmSmU4SnJzUXFaYSJ9.eyJpc3MiOiJodHRwczovL3RlbGVjYWxsLXByb2R1Y3Rpb24udXMuYXV0aDAuY29tLyIsInN1YiI6Imw3bFdCbnFxenZ4bU8wZkZNREpUUGN3bU1SSFZ0VUNOQGNsaWVudHMiLCJhdWQiOiJodHRwczovL2FwaS53YXZlLm5vbW8uY29tLmJyIiwiaWF0IjoxNzE3NjA1NDkwLCJleHAiOjE3MTc2OTE4OTAsImd0eSI6ImNsaWVudC1jcmVkZW50aWFscyIsImF6cCI6Imw3bFdCbnFxenZ4bU8wZkZNREpUUGN3bU1SSFZ0VUNOIn0.Bv_ZiMynwwDnuOuahb6jibYxi_wwAB_b7yo9YkHhC9iI2wBKvPXXsgUg7W-SEcC37jq6Xzh5SkGzEk7LR1UXzb7XKHlCrskmXgz0B8hu_bvxYz0RyoJu7Jb_gyOF408jgHWydLcSIu618CDBlSGFbr0_zrl-KKhcclJjdbEtsaM81_eNdgO5VM_w272HZhyDhcBGVpScjUUopFax5K2JVBjNqtRaOiarMlOsE2wKmPEDSsck2Y9ko-OLuiGzvUvr1m87E63m3CHw2SJOX_aZ5Dxj19c8f7AJUkZSSZHRq81wLg6J5wWUvcQBIXZeW8kGCF0PSGLnwnwFabwMp8htFw";
const RECONCILIATION_ID = "4e3501fe-7122-44a3-9ec2-74b895c97269";
const REFERENCE_DATE = {
  start:"2024-05-01T00:00:00.000Z",
  end:"2024-06-01T00:00:00.000Z",
}

const invoiceItensMaxSize = 30;
const SUPPLIER_ID = "56b2ec47-1b3c-43ac-9d0b-a8ebbf604540";
const BROKER_ID = "ad9d96a5-5109-49cd-829c-1b5bcbc6a298";


  // const filename =
  //   "/Users/marcosaugusto/nomo/Migraçao Telecall Billing/Telecall/transactions_telecall_mar.csv";
const filename = "C:/Users/Nomo - Julia/Nomo/Faturamento_Fluke/Fat Telecall - 0524.xlsx - Linhas.csv";

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
        metadata: {
          brokerReconciliationId: transactions[0].reconciliationId,
        }
      };
      const result = await createInvoice(invoice);
      const end = new Date();
      const delta = end.getTime() - start.getTime();
      console.log(`${invoice.id} - ${result} - ${delta}ms\n`);
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

    const data = await getData<PlanilhaColumns>(filename);
    const transactions = data.map((row) => ({
      invoiceId: crypto.randomUUID(),
      transactionId: crypto.randomUUID(),
      customerFederalTaxId: row.taxId.trim(),
      productExternalCode: "71d4d217-0518-4286-8e34-ccbc2d2c46e0",
      msisdn: row.msisdn.trim(),
      description: row.description.trim(),
      amount: row.price.replace(",", "."),
      referenceStartDate: REFERENCE_DATE.start,
      referenceEndDate: REFERENCE_DATE.end,
      autoApprove: true,
    }));

    result.push(
      "invoiceId,transactionId,customerFederalTaxId,productExternalCode,msisdn,description,amount,referenceStartDate,referenceEndDate,autoApprove,brokerId,reconciliationId",
    );
    transactions.forEach((row) => {
      if (row.msisdn.length !== 13) throw Error(`Invalid msisdn ${row.msisdn}`);
      if (row.customerFederalTaxId.length !== 11 && row.customerFederalTaxId.length !== 14) throw Error(`Invalid tax id ${row.customerFederalTaxId}`);

      result.push(
        `"${row.invoiceId}","${row.transactionId}","${row.customerFederalTaxId}","${row.productExternalCode}","${row.msisdn}","${row.description}","${row.amount}","${row.referenceStartDate}","${row.referenceEndDate}","${row.autoApprove}","${BROKER_ID}","${RECONCILIATION_ID}"`,
      );
    });
  
  return parse(result.join('\n'), {
    skipFirstRow: true,
  });

  async function getData<T>(csvFilename: string): Promise<T[]> {
    const decoder = new TextDecoder("utf-8");
    const data = await Deno.readFile(csvFilename);
    const text = decoder.decode(data);

    return parse(text, {
      skipFirstRow: true,
      separator: ",",
    });
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

async function getCustomerIdByFederalTaxId(
  customerFederalTaxId: string,
): Promise<string> {
  const mapper = {
    '00159834716': '4fe4ff07-676c-4bd3-8955-f6f4aac98120',
    '02373375000122': '84a4495b-7203-4d7f-a758-62161bdb16ca',
    '02810365000107': '2993b21b-6c17-448b-a94f-adf725a86a47',
    '03230210182': '3ea52e84-74c6-48c8-8947-54bd022f5c5f',
    '04160100000136': '6a5b4286-9132-49b5-a59a-119731adf09f',
    '04372400101': 'c63fdc08-a798-48f6-85b5-02dd348adf83',
    '04512986000130': 'b55fb1a6-0251-42f5-8fda-7f18423f81bd',
    '05808237769': 'de4195bd-2219-45c5-b434-9ac34650807b',
    '06960724759': '7934c2d8-2dfc-48dc-bbd6-44eef9bd463b',
    '07011269738': '5c67b8e8-df4f-41d4-bb71-1ac21b40a71f',
    '07625852000113': '9332e74f-53ac-4025-81e1-6021b02d5a9a',
    '09622623000170': 'e9252d74-9085-49c3-84fd-91acb772ce87',
    '10432376747': '0d854096-4f9c-4aef-9aab-136477ea94f3',
    '10489713000114': '02bb4209-5533-4ae1-a60c-16ad192ee769',
    '10828584710': 'fb7aae1e-6647-4b2b-af36-bab41ed97075',
    '11004572751': '50d5e9fa-2f63-4a03-9256-910df296356d',
    '11071041738': '50b346a9-1380-47ca-a112-30cbcdca3ec7',
    '11274764000191': 'e7180a5f-4e77-488a-98bc-14d28653f666',
    '11337373745': 'b480d4d3-6c9a-4fce-8af5-9f2274fc1675',
    '11694830896': '8d61aca5-2feb-497c-9dee-27b8450226c8',
    '11812715000165': 'b0c0ff43-9182-432c-9aca-7f823dbedbcd',
    '12327364000160': 'c32537ed-6a86-4f6c-bd88-3681cb17ab72',
    '12805462718': '26d79adb-accf-46d1-ad12-cacc121f8aa5',
    '13901641793': '73a7deb7-d997-4ddd-be55-7a399c2d85a9',
    '14566666000116': 'cd751d4e-9ab9-4231-aa50-49a440629067',
    '14628548773': 'e9a5789c-bd2d-418d-bbc0-a24833a527b2',
    '14806756000137': '44e9e9cd-971b-4bf7-bd2b-3a3dd1275029',
    '14939419762': 'd753235d-b934-4021-afcb-0a3b510c31d1',
    '15353333000171': '591b6b07-9bf6-4d2c-9888-6e39133cbd7d',
    '15867967000142': '561ae700-9bc1-431d-a531-ff990adcb0b1',
    '16961448000101': 'c9279379-c31a-4bc9-b226-3fe830997428',
    '18006518000106': '520e65b0-fce9-4685-8d2e-4d77fb191844',
    '18085238730': 'ba89a5a5-9f4c-4f11-9de0-3e9614f8f4a5',
    '18272847000190': '288e3dd2-6db0-4aad-8a97-54eb854c9d40',
    '18423179000155': 'acb6cd1f-fbc5-41c1-82a1-fee4510a1308',
    '20512557000119': '2347fc93-9e9e-47a4-a83a-3b547eecc6de',
    '20663096000185': 'ccd93c27-6a1f-4145-878f-197224360785',
    '22299932000110': '88d508ef-6cd6-4f88-9a9f-e3a6e95f0a3e',
    '22595088000174': '6af4d682-845d-435a-8d5f-48d9235ed8c7',
    '24022700000145': '12a8a0e3-f168-449a-9295-86992ec792a4',
    '26449214000133': 'f837fbb6-4336-4b96-8bcc-ddd2e7fa16a4',
    '26773559000148': '7b8a66e7-5698-4c22-b401-3322330b666b',
    '27714373000180': 'bcd6ca72-718c-472f-9fd6-c7aeee3c7c3e',
    '28418284000150': 'a0bface3-e55c-490c-8e1c-4a9e7006d190',
    '28562068000183': '6a562cda-7edb-409e-9fcd-961f74d86728',
    '28586749000181': '694607bd-eb74-46b5-8c8a-d5a5059f1121',
    '28934744000100': '44875cea-8c84-4086-9d09-eed43e29d636',
    '29237659000148': '56a570f1-4b0b-41df-abcd-7ceea4754fa1',
    '29612352000180': '473ceb48-c4a1-41d1-8252-719eda5c0fc9',
    '30072680000110': 'b33a8176-cfbb-47bd-a441-48ddf29368d5',
    '30280477000139': 'fffbe0ed-189b-4f46-abd2-8b99f19a3dfd',
    '30770970000137': '8f13ee07-aec6-4305-b555-384c7cfbb043',
    '31740791000110': '6fa89694-cf40-4037-a96a-7042bd0c4f0d',
    '31904610000143': '180c748a-b4ba-4018-a1ed-d1a4e32acad9',
    '32092059734': 'b52146e3-67b1-4a5f-8c2d-4305114e4660',
    '33969074000190': '9d975a21-5773-4362-9933-7c80ea778781',
    '34441181000103': 'c9c38883-624d-4d77-acb5-487d5ca6dfae',
    '35307745000182': '24a19910-86fe-49b2-ae89-168b33cc539e',
    '35711113000180': 'fee397ac-e285-4cdc-baf0-531e20a925af',
    '35898304000100': '782ab8f1-c3a3-4256-b5bc-e326044a8096',
    '35996604000114': '01ade71c-3cb8-4f55-8feb-54fc562af887',
    '36278717000147': '76dd80ee-471e-4a14-8cb1-47c4fa148a26',
    '36596370000180': 'd681f1f7-e1c3-47de-afc9-5ed5fe39c22e',
    '37520957000179': '066484a8-e2d2-4bc8-a73f-54f16c4dc12e',
    '37780720000127': '7a2f680e-e577-4d72-b656-f989935c0b59',
    '38111116000170': '36e4c5a4-a8e5-4a51-bc68-d60c2ac6cb7b',
    '38168926000163': 'feb09791-87bc-4f36-9c93-a48454ba8a16',
    '38338691000100': '466c7a41-a57f-42e3-9e71-f7119d94861d',
    '39359160000167': '5fe486ce-74d0-4c70-8eff-f6cf2c103da7',
    '40357033000108': 'eb1a0862-71ab-45b0-a556-80b8976777ae',
    '41648024000139': 'e35385b4-b354-433a-aa28-68eabb656d0c',
    '42221318000142': 'fb461109-fe60-4557-858f-a92912edf372',
    '43014388823': 'f102d1c0-ae38-4b5f-ba97-62c1d9d9cabb',
    '43156956000190': 'acb801d3-884f-43df-bb29-698bbccdf4b8',
    '44497648000190': '410dc555-87e8-469f-a149-89188b89db91',
    '45414499000111': '0bf98762-ea51-44d9-9be7-dbd565b9ac27',
    '45648952000154': '02d6cd81-b4f6-4775-b037-ac421e159e52',
    '46142039000144': '6c818bb8-a751-43b2-aa69-aeb21dca7840',
    '46214811854': '3cd800e6-13ab-43d4-84a8-b4e294f61a40',
    '46255562000187': '96cd009f-f727-4a1d-8b23-b4c2954b8b40',
    '46467691000139': 'fdf02721-6cd8-4e40-86b9-86e514c4acab',
    '46483702000174': 'bcb5662c-ba29-4c35-8123-7052be3aa45f',
    '47250599000185': '1197849c-d895-45e5-a65b-4df8290abb63',
    '47937326000103': 'cb16d4f4-b7a7-4b19-99ff-23f278848f8e',
    '48059363000200': '61c2a421-4d85-49ff-8777-609cbe2b59f8',
    '48651096000184': '4c05083f-e1f7-47aa-ab82-37ce17f90542',
    '49069205000112': 'cd5c98b8-90f8-49d9-9702-a7913cba3ed4',
    '49277573000156': '1164fe5e-79fc-4a5b-8e4f-1d321fd61564',
    '49760817000157': '75251a29-a23e-4569-a0d6-0e11ae68322a',
    '50095581812': 'b41eebfd-ae3d-400c-b727-7c81d51de0e9',
    '50129120000161': '2cf80639-da2f-44c4-87fd-0acc51c21948',
    '50378662000178': '1aaf76ea-db86-46a8-b7d9-07e9c591e879',
    '50765434000150': 'da665b64-6a04-4daa-afbe-0a00129e8a9b',
    '50916389000198': '34ae07a6-17b0-45b2-b7fa-66ec0cebdf5e',
    '52096592000190': '80ee029f-709e-4bb3-bb78-d1ac531f712d',
    '70323229131': '5198ab7c-6e76-4d6c-8ebb-b284f0400d24',
    '71718796404': 'bb264133-c509-4b44-b8ec-9e066771f189',
    '76004260720': '30a73281-93f6-426d-9413-40bf3749c99a',
    '83285091134': '58abde68-11f8-42d8-909a-75f75e930a36',
    '17688989000170': '795a0118-b7f0-456b-8297-fdd92e56be2a',
    '23322990000180': '03535e03-a456-4c21-bde9-ca9f29ad0a5d',
    '46849108000154': 'ec2be0e0-52ff-47c9-ad80-7c4c8188e5ea',
    '14512028000112': '3b3464bd-5a21-4c3d-8500-f330510c7ea1',
    '29811352000109': 'b0e1b0e0-2e7e-4b34-b508-a72080c97405',
    '48952696000182': 'b78b5ce5-6fb7-4de2-84e4-e11e4e62e16a',
    '28409535000130': '6d4e1b78-2382-4b8c-9c11-38c79d4c2505',
    '03170027000110': 'b2cc14ce-1ce7-46fa-a584-4a7663676f76',
    '44865789000119': 'e7beb293-d209-447b-b534-d0b1e263ee5f',
    '26436680144': 'e33dc300-2f2a-4be0-87a1-27adab00df60',
    '72768622168': '92eff330-d75a-4892-ae36-48f76c42a5ad',
    '46712845000100': 'cc67411c-6a44-4436-bf81-5b331223c995',
    '45282870000139': 'b7b089b1-8899-4316-8a5a-b8347898d211',
    '49958385000193': '75f850e8-3fd0-417a-b2b5-441d1cb57d50',
    '32659264000148':'b6dd2a25-027a-43a3-8f87-af25978cfee0',
    '53309800000155': '080a0b3c-2227-4b40-ba4c-49422ebf6adc',
    '40526420000120': '7b1417a2-f46c-465e-8087-0afac18febca',
    '47906895000191': '737b7454-745c-45d6-a6e4-a2783e9039b1',
  };

  return mapper[customerFederalTaxId];
}

async function getProductByExternalCode(
  productExternalCode: string,
): Promise<any> {
  return [
    {
      "id": "a015857e-b264-4a58-927f-0c96819f500b",
      "createdAt": "2023-06-18T21:52:32.973Z",
      "name": "Telecall - Produto Avulso",
      "description": "Telecall - Produto Avulso",
      "externalCode": "71d4d217-0518-4286-8e34-ccbc2d2c46e0",
      "metadata": {},
      "components": [
        {
          "id": "00ac7170-6903-4b63-8fa3-88c177640368",
          "createdAt": "2023-06-18T21:56:22.738Z",
          "name": "Prestação de Serviço de SMP",
          "catalogProductId": "a015857e-b264-4a58-927f-0c96819f500b",
          "interval": "SPOT",
          "description": "Prestação de Serviço de SMP",
          "externalCode": null,
          "externalTaxCode": "d98d9110-a9fb-4eca-95f4-9cccb59b8381",
          "pricing": {
            "id": "f93dcdc3-fe4f-449e-a208-c68ac6d0de21",
            "type": "FLAT",
            "properties": {
              "type": "FLAT",
              "unitAmount": "0.6",
              "billableMetricId": {
                "value": "3d251540-80f0-4cea-8799-5f77867f2f9e",
              },
            },
          },
        },
        {
          "id": "425ec919-1c3f-4ed7-bfaa-152b9267dff4",
          "createdAt": "2023-06-18T21:56:52.339Z",
          "name": "Prestação de Serviço de SVA",
          "catalogProductId": "a015857e-b264-4a58-927f-0c96819f500b",
          "interval": "SPOT",
          "description": "Prestação de Serviço de SVA",
          "externalCode": null,
          "externalTaxCode": "da10d9fc-be69-4acb-9b04-90535e9b454f",
          "pricing": {
            "id": "22bc6d46-faa5-4dfc-a0c8-19cd297f96e5",
            "type": "FLAT",
            "properties": {
              "type": "FLAT",
              "unitAmount": "0.4",
              "billableMetricId": {
                "value": "9f203100-8a95-4ecc-aeca-6163b159023c",
              },
            },
          },
        },
      ],
    },
  ].filter((product) => product.externalCode === productExternalCode)[0];
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
