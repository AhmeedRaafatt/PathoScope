// src/data/icd10_codes.js
// Common ICD-10 codes for pathology diagnoses

export const commonICD10Codes = [
    // Malignant Neoplasms - Breast
    { code: 'C50.911', desc: 'Malignant neoplasm of unspecified site of right female breast' },
    { code: 'C50.912', desc: 'Malignant neoplasm of unspecified site of left female breast' },
    { code: 'C50.919', desc: 'Malignant neoplasm of unspecified site of breast' },
    
    // Malignant Neoplasms - Lung
    { code: 'C34.90', desc: 'Malignant neoplasm of unspecified part of bronchus or lung' },
    { code: 'C34.91', desc: 'Malignant neoplasm of unspecified part of right bronchus or lung' },
    { code: 'C34.92', desc: 'Malignant neoplasm of unspecified part of left bronchus or lung' },
    
    // Malignant Neoplasms - Colon
    { code: 'C18.9', desc: 'Malignant neoplasm of colon, unspecified' },
    { code: 'C20', desc: 'Malignant neoplasm of rectum' },
    
    // Malignant Neoplasms - Prostate
    { code: 'C61', desc: 'Malignant neoplasm of prostate' },
    
    // Malignant Neoplasms - Skin
    { code: 'C43.9', desc: 'Malignant melanoma of skin, unspecified' },
    { code: 'C44.90', desc: 'Basal cell carcinoma of skin, unspecified' },
    
    // Malignant Neoplasms - Lymphatic/Hematopoietic
    { code: 'C85.90', desc: 'Non-Hodgkin lymphoma, unspecified' },
    { code: 'C91.10', desc: 'Chronic lymphocytic leukemia' },
    
    // Benign Neoplasms
    { code: 'D10.9', desc: 'Benign neoplasm of pharynx, unspecified' },
    { code: 'D12.6', desc: 'Benign neoplasm of colon, unspecified' },
    { code: 'D22.9', desc: 'Melanocytic nevi, unspecified' },
    { code: 'D24', desc: 'Benign neoplasm of breast' },
    { code: 'D29.1', desc: 'Benign neoplasm of prostate' },
    
    // Carcinoma In Situ
    { code: 'D05.90', desc: 'Unspecified type of carcinoma in situ of breast' },
    { code: 'D04.9', desc: 'Carcinoma in situ of skin, unspecified' },
    
    // Neoplasms of Uncertain Behavior
    { code: 'D37.9', desc: 'Neoplasm of uncertain behavior of oral cavity and digestive organs' },
    { code: 'D38.1', desc: 'Neoplasm of uncertain behavior of trachea, bronchus and lung' },
    { code: 'D48.5', desc: 'Neoplasm of uncertain behavior of skin' },
    { code: 'D49.2', desc: 'Neoplasm of unspecified behavior of bone, soft tissue, and skin' },
    
    // Inflammatory/Infectious Conditions
    { code: 'N61.0', desc: 'Mastitis without abscess' },
    { code: 'K35.80', desc: 'Unspecified acute appendicitis' },
    { code: 'K40.90', desc: 'Unilateral inguinal hernia' },
    { code: 'J18.9', desc: 'Pneumonia, unspecified organism' },
    
    // Benign Masses/Cysts
    { code: 'N60.01', desc: 'Solitary cyst of right breast' },
    { code: 'N60.02', desc: 'Solitary cyst of left breast' },
    { code: 'N80.0', desc: 'Endometriosis of uterus' },
    
    // Polyps
    { code: 'K62.1', desc: 'Rectal polyp' },
    { code: 'K63.5', desc: 'Polyp of colon' },
    { code: 'N84.0', desc: 'Polyp of corpus uteri' },
    
    // Dysplasia
    { code: 'D06.9', desc: 'Carcinoma in situ of cervix, unspecified' },
    { code: 'K62.82', desc: 'Anal intraepithelial neoplasia (AIN)' },
    
    // Other Common Findings
    { code: 'R19.00', desc: 'Intra-abdominal and pelvic swelling, mass and lump, unspecified' },
    { code: 'R22.9', desc: 'Localized swelling, mass and lump, unspecified' },
    { code: 'R91.8', desc: 'Other nonspecific abnormal finding of lung field' },
    
    // Normal/No Significant Findings
    { code: 'Z00.00', desc: 'Encounter for general adult medical examination without abnormal findings' },
    { code: 'Z12.39', desc: 'Encounter for other screening for malignant neoplasm of breast' }
]

// Helper function to search ICD codes
export function searchICD10(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) return commonICD10Codes
    
    const lowerSearch = searchTerm.toLowerCase()
    return commonICD10Codes.filter(item => 
        item.code.toLowerCase().includes(lowerSearch) ||
        item.desc.toLowerCase().includes(lowerSearch)
    )
}

// Get ICD by code
export function getICDByCode(code) {
    return commonICD10Codes.find(item => item.code === code)
}

// Group ICD codes by category
export const icdCategories = {
    malignant: commonICD10Codes.filter(c => c.code.startsWith('C')),
    benign: commonICD10Codes.filter(c => c.code.startsWith('D1') || c.code.startsWith('D2')),
    inSitu: commonICD10Codes.filter(c => c.code.startsWith('D0')),
    uncertain: commonICD10Codes.filter(c => c.code.startsWith('D3') || c.code.startsWith('D4')),
    other: commonICD10Codes.filter(c => !c.code.startsWith('C') && !c.code.startsWith('D'))
}