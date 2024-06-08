import * as admin from "firebase-admin";
import * as bq from "@google-cloud/bigquery";


const dataPlatformProjectId = "nomo-algar-development-7da0";
admin.initializeApp({

    credential: admin.credential.applicationDefault(),
    projectId: dataPlatformProjectId
  });


const firestore = admin.firestore();
const datasetName = "nomo_algar_dataset";
const tableWaitlist = "waitlist";
//const tableOpportunity = "opportunity";
//const tableRegister = "register";
const createdAt = admin.firestore.Timestamp.fromDate(new Date("2024-01-23"));


const BigQuery = new bq.BigQuery({
    projectId: dataPlatformProjectId,
});

interface CollectionConfig  {
    name: string;
    fields: string[];
  }

async function exportHistoricalDataToBigQuery() {
    try{ 

        //const parseUtms = (utm) => {
        //const utmValue = utm ?? [];
        //return Array.isArray(utmValue) ? utmValue.join(", ") : utm;
        //    }

        const collectionsConfig: CollectionConfig[] = [
            {
                name: tableWaitlist,
                fields:["id", "referralCode", "active", "waitlistCreatedAt", "referralSource", "utmSource", "utmMedium", "utmCampaign", "utmContent", "metadata", "createdAt"],
            },
            //{
            //    name:tableOpportunity,
            //    fields: ["id", "opportunityCreatedAt", "city", "state", "zipcode", "areacode", "productId", "productState", "metadata", "createdAt"]
            //},
            //{
            //    name: tableRegister,
            //    fields: ["id", "registerCreatedAt", "lineId", "opportunityId", "workflow", "createdAt"]
            //}
        ]

        for (const collectionConfig of collectionsConfig) {
            const historicalDataQuerySnapshot = await firestore.collection("Register").where("createdAt","<", createdAt).get();
            const transformedData: Record <string, any> [] = [];
            historicalDataQuerySnapshot.forEach((doc) => {
            const data = doc.data();
                //console.log(`data log ${data}`);

                const selectedFields: Record <string, any> = {};
//Waitlist
                //const fieldTransformations = {
                //    "createdAt": (data) => new Date(data["createdAt"]._seconds * 1000),
                //    "waitlistCreatedAt": (data) => new Date(data["createdAt"]._seconds * 1000),
                //    "active": (data) => data["active"]?.toString() ?? "true",
                //    "id": (data) => data["referralCode"],
                //    "referralSource": (data) => data["referralSource"] ?? "null",
                //    "utmSource": (data) => {
                //        return parseUtms(data.utms?.utmSource ?? undefined);
                //    },
                //    "utmMedium":(data) => {
                //        return parseUtms(data.utms?.utmMedium ?? undefined);
                //    },
                //    "utmCampaign": (data) => {
                //        return parseUtms(data.utms?.utmCampaign ?? undefined);
                //    },
                //    "utmContent": (data) => {
                //        return parseUtms(data.utms?.utmContent ?? undefined);
                //    },
                //    "metadata": (data) => ({
                //        "zipCode": data?.metadata?.zipCode ?? "null",
                //        "ddd": data?.metadata?.ddd ?? "null"
                //    })
                //}
//
                //for (const field of collectionConfig.fields) {
                //    const transform = fieldTransformations[field] || ((data) => data[field]);
                //    selectedFields[field] = transform(data);
                //}


//Opportunity
                //const fieldTransformations = {
                //    "id": (data) => getSHA256ofString(data["id"]),
                //    "createdAt": (data) => new Date(data["createdAt"]._seconds * 1000),
                //    "opportunityCreatedAt": (data) => new Date(data["createdAt"]._seconds * 1000),
                //    "city": (data) => data.deliveryAddress?.city ?? "null",
                //    "state": (data) => data.deliveryAddress?.state ?? "null",
                //    "zipcode": (data) => data.deliveryAddress?.zipCode ?? "null",
                //    "areacode": (data) => data.line?.areaCode ?? "null",
                //    "productState": (data) => data["state"] ?? "null",
                //    "metadata": (data) => JSON.stringify(data["metadata"]),
                //    "productId": (data) => data["productId"]?.toString() ?? "b2aea274-5125-4747-89bc-9707dbc998ab"
                //}
////
                //for (const field of collectionConfig.fields) {
                //    const transform = fieldTransformations[field] || ((data) => data[field]);
                //    selectedFields[field] = transform(data);
                //}
 //

//register
                //const fieldTransformations = {
                //    "id": (data) => getSHA256ofString(data["id"]),
                //    "createdAt": (data) => new Date(data["createdAt"]._seconds * 1000),
                //    "registerCreatedAt": (data) => new Date(data["createdAt"]._seconds * 1000),
                //    "opportunityId": (data) => data["id"],
                //    "workflow": (data) => JSON.stringify(data["workflow"])
                //}
//
                for (const field of collectionConfig.fields) {
                    const transform = fieldTransformations[field] || ((data) => data[field]);
                    selectedFields[field] = transform(data);
                }


                transformedData.push(selectedFields);
            });
            console.log(transformedData);

            if (transformedData.length > 0){
               await BigQuery.dataset(datasetName).table(collectionConfig.name).insert(transformedData);
               //console.log(result[0]);
            }

            console.log(`Old data to ${collectionConfig.name} are exported to BigQuery`)
        }
    } catch (error){
        console.error("Export faild: ", error);
        //console.error("Export faild: ", error.response.insertErrors[0].errors[0]);
    } 
}

exportHistoricalDataToBigQuery().catch(console.error);

//waitlist local 

async function exportHistoricalDataToBigQuery() {
    try{ 

        const parseUtms = (utm:string | string[]): string => 
            Array.isArray(utm) ? utm.join(",") : utm ?? "";

        const collectionsConfig: CollectionConfig[] = [
            {
                name: tableWaitlist,
                fields:["id", "referralCode", "active", "waitlistCreatedAt", "referralSource", "utmSource", "utmMedium", "utmCampaign", "utmContent", "metadata", "createdAt", "email"],
            },
        ]

        for (const collectionConfig of collectionsConfig) {
            const historicalDataQuerySnapshot = await firestore.collection("Referral.1705968261829.Customer").where("createdAt","<", createdAt).get();
            console.log(`historical data ${historicalDataQuerySnapshot}`);
            const transformedData: Record <string, any> [] = [];
            historicalDataQuerySnapshot.forEach((doc) => {
            const data = doc.data();

            const selectedFields: Record <string, any> = {};

                const fieldTransformations = {
                    "createdAt": (data) => new Date(data["createdAt"]._seconds * 1000),
                    "waitlistCreatedAt": (data) => new Date(data["createdAt"]._seconds * 1000),
                    "active": (data) => data["active"]?.toString() ?? "true",
                    "id": (data) => data["referralCode"],
                    "referralSource": (data) => data["referralSource"] ?? "null",
                    "email": (data) => encrypt(data["email"]),
                    "utmSource": (data) => {
                        return parseUtms(data.utms?.utmSource ?? undefined);
                    },
                    "utmMedium":(data) => {
                        return parseUtms(data.utms?.utmMedium ?? undefined);
                    },
                    "utmCampaign": (data) => {
                        return parseUtms(data.utms?.utmCampaign ?? undefined);
                    },
                    "utmContent": (data) => {
                        return parseUtms(data.utms?.utmContent ?? undefined);
                    },
                    "metadata": (data) => ({
                        "zipCode": data?.metadata?.zipCode ?? "null",
                        "ddd": data?.metadata?.ddd ?? "null"
                    })
                }

                for (const field of collectionConfig.fields) {
                    const transform = fieldTransformations[field] || ((data) => data[field]);
                    selectedFields[field] = transform(data);
                }

                transformedData.push(selectedFields);
            });
            console.log(transformedData);

            if (transformedData.length > 0){
               await BigQuery.dataset(datasetName).table(collectionConfig.name).insert(transformedData);
            }

            console.log(`Old data to ${collectionConfig.name} are exported to BigQuery`)
        }
    } catch (error){
        //console.error("Export faild: ", error);
        console.error("Export faild: ", error.response.insertErrors[0].errors[0]);
    } 
}

//opportunity
async function exportHistoricalDataToBigQuery() {
    try{ 

        const collectionsConfig: CollectionConfig[] = [
            {
                name:tableOpportunity,
                fields: ["id", "opportunityCreatedAt", "city", "state", "zipcode", "areacode", "productId", "productState", "metadata", "createdAt", "email"]
            },
        ]

        for (const collectionConfig of collectionsConfig) {
            const historicalDataQuerySnapshot = await firestore.collection("Opportunity").where("createdAt","<", createdAt).get();
            console.log(`historical data ${historicalDataQuerySnapshot}`);
            const transformedData: Record <string, any> [] = [];
            historicalDataQuerySnapshot.forEach((doc) => {
            const data = doc.data();

            const selectedFields: Record <string, any> = {};

                const fieldTransformations = {
                    "id": (data) => data["id"],
                    "createdAt": (data) => new Date(data["createdAt"]._seconds * 1000),
                    "opportunityCreatedAt": (data) => new Date(data["createdAt"]._seconds * 1000),
                    "email": (data) => encrypt(data.user["email"]),
                    "city": (data) => data.deliveryAddress?.city ?? "null",
                    "state": (data) => data.deliveryAddress?.state ?? "null",
                    "zipcode": (data) => data.deliveryAddress?.zipCode ?? "null",
                    "areacode": (data) => data.line?.areaCode ?? "null",
                    "productState": (data) => data["state"] ?? "null",
                    "metadata": (data) => JSON.stringify(data["metadata"]),
                    "productId": (data) => data["productId"]?.toString() ?? "b2aea274-5125-4747-89bc-9707dbc998ab"
                }

                for (const field of collectionConfig.fields) {
                    const transform = fieldTransformations[field] || ((data) => data[field]);
                    selectedFields[field] = transform(data);
                }

                transformedData.push(selectedFields);
            });
            console.log(transformedData);

            if (transformedData.length > 0){
               await BigQuery.dataset(datasetName).table(collectionConfig.name).insert(transformedData);
            }

            console.log(`Old data to ${collectionConfig.name} are exported to BigQuery`)
        }
    } catch (error){
        console.error("Export faild: ", error);
        //console.error("Export faild: ", error.response.insertErrors[0].errors[0]);
    } 
}

// register 

async function exportHistoricalDataToBigQuery() {
    try{ 

        const collectionsConfig: CollectionConfig[] = [
            {
                name: tableRegister,
                fields: ["id", "registerCreatedAt", "lineId", "opportunityId", "workflow", "createdAt", "email"]
            }
        ]

        for (const collectionConfig of collectionsConfig) {
            const historicalDataQuerySnapshot = await firestore.collection("Register").where("createdAt","<", createdAt).get();
            console.log(`historical data ${historicalDataQuerySnapshot}`);
            const transformedData: Record <string, any> [] = [];
            historicalDataQuerySnapshot.forEach((doc) => {
            const data = doc.data();

            const selectedFields: Record <string, any> = {};

                const fieldTransformations = {
                    "id": (data) => data["id"],
                    "createdAt": (data) => new Date(data["createdAt"]._seconds * 1000),
                    "registerCreatedAt": (data) => new Date(data["createdAt"]._seconds * 1000),
                    "opportunityId": (data) => data["id"],
                    "email": (data) => encrypt(data.opportunity.user["email"]),
                    "workflow": (data) => JSON.stringify(data["workflow"])
                }

                for (const field of collectionConfig.fields) {
                    const transform = fieldTransformations[field] || ((data) => data[field]);
                    selectedFields[field] = transform(data);
                }

                transformedData.push(selectedFields);
            });
            console.log(transformedData);

            if (transformedData.length > 0){
               await BigQuery.dataset(datasetName).table(collectionConfig.name).insert(transformedData);
            }

            console.log(`Old data to ${collectionConfig.name} are exported to BigQuery`)
        }
    } catch (error){
        console.error("Export faild: ", error);
        //console.error("Export faild: ", error.response.insertErrors[0].errors[0]);
    } 
}