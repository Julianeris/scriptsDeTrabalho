SELECT 
    "200"                                                              AS MANDT,
    REPLACE(CAST(invoice.id AS TEXT), '-', '')                         AS ID,
    "3000"                                                             AS EMPRESA,
    "0001"                                                             AS FILIAL,
    TaxReceipt.documentModel                                           AS COD_MOD,
    NULL                                                               AS COD_MUN,
    SUBSTRING(serialNumber.prefix, FROM 1 FOR 1)                       AS SER,
    NULL                                                               AS SUB,
    "7"                                                                AS IND_REC,
    taxReceipt.documentModelSpec->'data'->>'itemCategory'              AS COD_CLASS,
    Item.unitAmount                                                    AS QTD_CONS,
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day'     AS DT_LANCTO,
    TaxReceipt.issuedAt                                                AS DT_DOC_INI, 
    TaxReceipt.updatedAt                                               AS DT_DOC_FIN,
    TaxReceipt.totalPrice                                              AS VL_DOC,
    Item.totalPrice                                                    AS VL_ITEM,
    Item.description                                                   AS VL_DESC,
    NULL                                                               AS VL_TERC,
    NULL                                                               AS NUM_PROC
FROM 
    dbo.invoice as invoice
LEFT JOIN dbo.supplier as Supplier ON invoice.supplierId = Supplier.id
LEFT JOIN dbo.TaxReceipt as TaxReceipt ON invoice.someKey = TaxReceipt.someKey
LEFT JOIN dbo.serialNumber as serialNumber ON TaxReceipt.serialNumberId = serialNumber.id
LEFT JOIN dbo.Item Item ON Item.supplierId = supplier.id;