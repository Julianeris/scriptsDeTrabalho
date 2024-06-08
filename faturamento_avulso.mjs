import * as xlsx from "xlsx";
import { promises as fs } from "fs";
import crypto from 'crypto';

const invoiceItensMaxSize = 30;
const RECONCILIATION_ID = "74eb5fcb-504f-4c21-9e5d-fce4ad25209a";//RECONCILIATION_ID; // Recebe o reconciliation_id disponível no console
const WAVE_API_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlpuN3NqdEdqY3BmSmU4SnJzUXFaYSJ9.eyJpc3MiOiJodHRwczovL3RlbGVjYWxsLXByb2R1Y3Rpb24udXMuYXV0aDAuY29tLyIsInN1YiI6Imw3bFdCbnFxenZ4bU8wZkZNREpUUGN3bU1SSFZ0VUNOQGNsaWVudHMiLCJhdWQiOiJodHRwczovL2FwaS53YXZlLm5vbW8uY29tLmJyIiwiaWF0IjoxNzA2MTIzOTMyLCJleHAiOjE3MDYyMTAzMzIsImF6cCI6Imw3bFdCbnFxenZ4bU8wZkZNREpUUGN3bU1SSFZ0VUNOIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.N6524f7K1MrspDzpKAYWi_qJS0gSRknvJHZ1f8EtEWNFtfPdQHMpRh2xly32BDzrBvYBZchswNqvEIJYa2fz64aErBLDwJtccOpJdTdNyvDxhYxqXOgyAfP4LdY2d46CurKPWgOLGYLfR9ylyIi35IPfMWgPv4Fi06zDUL64q1nwjvkFUoGiAvN4ECuu1RKYaiVW27V3j_DCImkpkFlWDLV4pGY8S55bfV3CLTaFO7weFxxBihpNy-J-s6Q-4YQWkX-PkD4Svyflxlr-YSDX1GDEG4jjYctijBhmiVmnL5CcYvS8JkSN0SouXNdOaQgXrLE-0yCuha-ltmQGejhJcw"

//  Pega a data de referencia, broker e supplier ID com base no reconcialition informado
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
    const referenceEndDate = data.referenceEndDate;
    const supplier_id = data.config.supplierId;
    const broker_id = data.config.brokerId;


    if (referenceStartDate !== undefined && referenceEndDate !== undefined) {
      console.log("Reference Start Date:", referenceStartDate);
      console.log("Reference End Date:", referenceEndDate);
      console.log("Supllier Id", supplier_id);
      console.log("Broker Id", broker_id);
    } else {
      console.error("As propriedades referenceStartDate ou referenceEndDate estão undefined na resposta da API.");
    }
  })
  .catch(error => {
    console.error("Erro ao chamar a API:", error);
  }
);

const filePath = "C:\\Users\\Nomo - Julia\\Nomo\\Faturamento avulso\\Relação de valores\\Fat Telecall - 1223.xlsx";

async function getData(filePath) {
    try {
        const fileContent = await fs.readFile(filePath);
        const workbook = xlsx.read(fileContent);
        const sheetName = workbook.SheetNames[0]; 
        if (sheetName) {
            const sheet = workbook.Sheets[sheetName];
            const jsonData = xlsx.utils.sheet_to_json(sheet);

            console.log("Dados da planilha:", jsonData);

            return jsonData;
        } else {
            console.error("Não foi possível encontrar uma planilha no arquivo.");
            return [];
        }
    } catch (error) {
        console.error("Erro ao ler o arquivo:", error.message);
        return [];
    }
}

const data = await getData(filePath);


  