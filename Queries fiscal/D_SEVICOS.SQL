SELECT
    "200"                                                                                                                       AS MANDT,
    "3000"                                                                                                                      AS EMPRESA,
    "0001"                                                                                                                      AS FILIAL,
    taxReceipt.documentModel                                                                                                    AS COD_MOD,
    taxReceipt.taxReceiptNumber                                                                                                 AS NUM_DOC,
    SUBSTRING(serialNumber.prefix FROM 1 FOR 1)                                                                                 AS SER, 
    taxReceipt.metadata->>'itemNumber'                                                                                          AS NUM_ITEM,
    coalesce(TO_CHAR(TaxReceipt.issuedAt, 'DDMMYYYY'), null)                                                                    AS DT_DOC,
    customer.address->'city'->>'id'                                                                                             AS COD_MUN,
    RIGHT('0000' + CAST(TaxReceipt.taxReceiptNumber AS VARCHAR), 4)                                                             AS NRO_ORD,
    SUBSTRING(serialNumber.prefix FROM 1 FOR 1)                                                                                 AS SER_CONV,  
    "0"                                                                                                                         AS IND_REC,
        CASE 
        WHEN TaxReceipt.status = 'Canceled' THEN '02'
        ELSE '00'
    END                                                                                                                         AS COD_SIT
    CONCAT('N', customer.id)                                                                                                    AS COD_PART,
    NULL                                                                                                                        AS COD_CONS,
    coalesce(TO_CHAR(TaxReceipt.issuedAt, 'DDMMYYYY'), null)                                                                    AS DT_APUR, 
                                                                                                                                AS COD_AUTH,     
    NULL                                                                                                                        AS REF_DOC_ITEM,
    "1"                                                                                                                         AS QTD_CONS_DOC,
    taxReceipt.totalPrice                                                                                                       AS VL_SERV_DOC,
    "0"                                                                                                                         AS VL_SERV_NT_DOC, 
    "0"                                                                                                                         AS VL_TERC_DOC,
    supplier.address ->>'uf'                                                                                                    AS UF_COD_MUN,
                                                                                                                                AS COD_CLASS
    CONCAT('N', item.id)                                                                                                        AS COD_ITEM,
    item.description                                                                                                            AS DESCR_COMPL,
    "1,000000"                                                                                                                  AS QTD_CONTRATADA,
    "0"                                                                                                                         AS QTD_FORNECIDA,                
    UND                                                                                                                         AS UNID,
    taxReceipt.documentModel->'data'->>'cfop'                                                                                   AS CFOP,
    item.unitAmount                                                                                                             AS VL_ITEM,
    "0"                                                                                                                         AS VL_DESC,    
    "0"                                                                                                                         AS VL_DA,    
    item.unitAmount                                                                                                             AS VL_OPR,
    item.unitAmount                                                                                                             AS VL_OPR_ISENTO,
    item.unitAmount                                                                                                             AS VL_OUTRAS,
    "0"                                                                                                                         AS VL_RED_BC,
                                                                                                                                AS CST_ICMS,
                                                                                                                                AS ALIQ_ICMS
                                                                                                                                AS VL_BC_ICMS
                                                                                                                                AS VL_ICMS
    "0"                                                                                                                         AS VL_BC_ICMS_UF
    "0"                                                                                                                         AS VL_ICMS_UF
    NULL                                                                                                                        AS CST_PIS,
    NULL                                                                                                                        AS ALIQ_PIS,
    NULL                                                                                                                        AS VL_BC_PIS,
    NULL                                                                                                                        AS VL_PIS,
    NULL                                                                                                                        AS CST_COFINS,
    NULL                                                                                                                        AS ALIQ_COFINS,
    NULL                                                                                                                        AS VL_BC_COFINS,
    NULL                                                                                                                        AS VL_COFINS,
    NULL                                                                                                                        AS COD_CTA,
    NULL                                                                                                                        AS COD_OBS,
    NULL                                                                                                                        AS COD_AUTH_REG_CAD,
    NULL                                                                                                                        AS COD_AUTH_REG_CAB,
    NULL                                                                                                                        AS COD_AUTH_REG_ITM,
    NULL                                                                                                                        AS COD_FORN,
    invoice.number                                                                                                              AS NRO_FATURA,
    (customer.contact->>'phone'->>'areaCode') || (customer.contact->>'phone'->>'phoneNumber')                                   AS NRO_TEL_PRINCIPAL
    customer.federalTaxId                                                                                                       AS NRO_CONTRATO,
    "1.000"                                                                                                                     AS QTD_FATURADA,
    NULL                                                                                                                        AS IND_DESC_JUD,
    NULL                                                                                                                        AS TP_ISENCAO_REDUCAO,
    CASE 
        WHEN LENGTH (customer.federalTaxId) = 14 THEN '1'
        WHEN LENGTH (customer.federalTaxId) = 11 THEN '2'
    END                                                                                                                         AS TP_INFORMACAO,
                                                                                                                                AS TP_CLIENTE,
    "0"                                                                                                                         AS SUBCLASSE_CONSUMO,
    Supplier.federalTaxId                                                                                                       AS CNPJ_EMITENTE,
    invoice.totalPrice                                                                                                          AS VL_TOTAL_FATURA_DOC,
    CASE 
        WHEN taxReceipt.uf = 'SP' THEN Invoice.referenceStartDate    
        ELSE NULL
    END                                                                                                                         AS DT_LEIT_ANT,
    CASE 
        WHEN taxReceipt.uf = 'SP' THEN Invoice.referenceEndDate    
        ELSE NULL
    END                                                                                                                         AS DT_LEIT_ATU,
    invoice.status                                                                                                              AS CANCELADO,
    "0"                                                                                                                         AS VL_FORN,
    "0"                                                                                                                         AS VL_BC_ICMS_ST,
    "0"                                                                                                                         AS VL_ICMS_ST,
    NULL                                                                                                                        AS CONS,  
    "1"                                                                                                                         AS FASE_UTILIZACAO,    
    "0"                                                                                                                         AS GRUPO_TENSAO,
    "0"                                                                                                                         AS TARIFA_APLICADA,
    NULL                                                                                                                        AS INFORMACOES_ADICIONAIS,
    customer.federalTaxId                                                                                                       AS CNPJ_CPF_DEST,
    CASE 
        WHEN customer.stateTaxIds IS NULL THEN 'ISENTO'  
        ELSE customer.stateTaxIds
    END                                                                                                                         AS IE_DEST,                           
    customer.address->>'street'                                                                                                 AS ENDE_DEST,
    customer.address->>'streetNumber'                                                                                           AS NUMERO_DEST,
    customer.address->>'complement'                                                                                             AS COMPL_DEST,
    customer.address->>'zipcode'                                                                                                AS CEP_DEST,
    customer.address->>'neighborhood'                                                                                           AS BAIRRO_DEST,
    customer.address->'city'->>'name'                                                                                           AS DESC_MUN_DEST,
    customer.address->'state'->>'name'                                                                                          AS UF_DEST,
    (customer->'contact'->'phone'->>'areaCode') || (customer->'contact'->'phone'->>'phoneNumber')                               AS FONE_DEST,
    customer.name                                                                                                               AS RAZAO_SOCIAL_DEST,
    taxReceipt->>'metadata'->>'msisdn'                                                                                          AS NUM_UNIDADE_CONSUMIDORA,
    packet.packetType                                                                                                           AS COD_SIT_CONV,            
    NULL                                                                                                                        AS NRO_CONTRATO_ITEM,
    "1-saida"                                                                                                                   AS IND_OPER,
    "R-Receita"                                                                                                                 AS PCO_CATEGORY,
    "02-Comunicação"                                                                                                            AS CATEGORIA_CFOP,
    NULL                                                                                                                        AS COD_MUN_DEST,
    NULL                                                                                                                        AS FIN_DOCE,
    NULL                                                                                                                        AS VL_ICMS_FCP_DIFAL,
                                                                                                                                AS IND_PREPAGO
FROM dbo.TaxReceipt as TaxReceipt
    LEFT JOIN dbo.supplier as supplier ON TaxReceipt.supplierId = supplier.id
    LEFT JOIN dbo.customer as customer ON TaxReceipt.customerId = customer.id
    LEFT JOIN dbo.serialNumber as serialNumber ON TaxReceipt.serialNumberId = serialNumber.id
    LEFT JOIN dbo.invoice as invoice ON TaxReceipt.invoiceId = invoice.id
    LEFT JOIN dbo.item as item ON customer.item = item.id
    LEFT JOIN dbo.packet as packet ON serialNumber.id = packet.serialNumberId;                                           