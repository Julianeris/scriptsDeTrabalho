SELECT
    200                                                      AS MANDT,
    REPLACE(TaxReceipt.id, '-', '')                          AS ID,
    3000                                                     AS EMPRESA,
    Supplier.externalCode                                    AS FILIAL,
    TaxReceipt.federalTaxId                                  AS CNPJ,
    JSON_EXTRACT(supplier.address, '$.uf')                   AS UF,
    EXTRACT (YEAR FROM TaxReceipt.issuedAt )                 AS ANO,
    EXTRACT (MONTH FROM TaxReceipt.issuedAt )                AS MES,
    customer.federalTaxId                                    AS CPF_CNPJ_USUARIO,
    JSON_EXTRACT(customer.address, '$.uf')                   AS UF_USUARIO,
    customer.name                                            AS RAZAO_SOCIAL_USUARIO,
    coalesce(TO_CHAR(Invoice.createdAt, 'DDMMYYYY'), null)   AS DT_FATURA,
    Invoice.number                                           AS NUM_FATURA,
    JSON_EXTRACT(Item.metadata, $'.itemNumber')         AS NUM_ORDEM_ITEM,
    InvoiceItem.id                                           AS COD_ITEM,
    InvoiceItem.description                                  AS DESCR_ITEM,
    Item.price                                               AS VL_ITEM,
    xxxxxx.origemItem                                        AS ORIGEM_ITEM,
    Supplier.federalTaxId                                    AS CNPJ_PART,
    Supplier.name                                            AS RAZAO_SOCIAL_PART,
    Invoice.totalPrice                                       AS VL_TOTAL_FATURA,
    taxReceipt.issuedAt                                      AS DT_DOC,
    JSON_EXTRACT(TaxReceipt.documentModelSpec, $'model')     AS COD_MOD,
    SUBSTRING(serialNumber.prefix, 1)                        AS SER,
    TaxReceipt.taxReceiptNumber                              AS NUM_DOC,
    TaxReceipt.totalPrice                                    AS VL_DOC,
    NOMO                                                	 AS SOURCE_SYSTEM,
    xxxxx.xxxxx                                              AS SOURCE_DATE,
    xxxxx.xxxxx                                              AS SOURCE_TIME,
    xxxxx.xxxxx                                              AS SOURCE_FILE,
    xxxxx.xxxxx                                              AS SOURCE_USER
FROM
    dbo.TaxReceipt AS TaxReceipt
LEFT JOIN dbo.supplier as Supplier ON TaxReceipt.supplierId = Supplier.id
LEFT JOIN dbo.customer customer ON TaxReceipt.customerId = customer.id
LEFT JOIN dbo.Invoice Invoice ON Invoice.id = InvoiceItem.invoiceId
LEFT JOIN dbo.Item Item ON Item.supplierId = supplier.id
LEFT JOIN dbo.serialNumber serialNumber ON TaxReceipt.serialNumberId = serialNumber.id
      
