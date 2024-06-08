const admin = require ("firebase-admin");
const { createObjectCsvWriter } = require ("csv-writer");
const dataPlatformProjectId = "algar-mvne-production-e5d3";


admin.initializeApp({

    credential: admin.credential.applicationDefault(),
    projectId: dataPlatformProjectId
  });


const firestore = admin.firestore();
const createdAt = admin.firestore.Timestamp.fromDate(new Date("2024-06-08"));


  async function getEmails() {
    try { 
        const historicalDataQuerySnapshot = await firestore.collection("Register").where("createdAt", ">", createdAt).get();
        console.log(`Historical data: ${historicalDataQuerySnapshot.size} documents found`);
        
        const transformedData = [];
        
        historicalDataQuerySnapshot.forEach((doc) => {
            const data = doc.data();

            const selectedFields = {
                lineId: data["lineId"],
                registerCreatedAt: new Date(data["createdAt"]._seconds * 1000),
                email: data.opportunity?.user?.email,
                name: data.opportunity?.line?.holder?.name,
                phoneNumber: data.opportunity?.line?.holder?.phone,
            };

            transformedData.push(selectedFields);
        });

        console.log('transformedData', transformedData);
        //const csvWriter = createObjectCsvWriter({
        //    path: "output.csv",
        //    header: [
        //        {id: "lineId", title: "Line ID"},
        //        {id: "registerCreatedAt", title: "Register Created At"},
        //        {id: "email", title: "Email"},
        //        {id: "name", title: "Name"}
        //    ]
        //});
//
        //await csvWriter.writeRecords(transformedData);
        //console.log("CSV file generated: output.csv");
    } catch (error) {
        console.error("Export failed: ", error);
    }
}

getEmails();