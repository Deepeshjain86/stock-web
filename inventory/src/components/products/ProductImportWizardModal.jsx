import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  XMarkIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
  TableCellsIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { productsAPI } from '../../services/api';

const MANDATORY_ERP_FIELDS = [
  { key: 'name', label: 'Product Name', required: true, aliases: ['name', 'product name', 'product', 'item', 'item name', 'title', 'description of goods'] },
  { key: 'category', label: 'Category', required: true, aliases: ['category', 'cat', 'category name', 'group', 'product category'] },
  { key: 'unit', label: 'Unit of Measure', required: true, aliases: ['unit', 'uom', 'unit of measure', 'pkg', 'unit name'] },
  { key: 'purchasePrice', label: 'Purchase Price (Cost)', required: true, aliases: ['purchase price', 'purchase_price', 'cost price', 'cost', 'buy price', 'purchase rate', 'cost_price'] },
  { key: 'sellingPrice', label: 'Selling Price (Rate)', required: true, aliases: ['selling price', 'selling_price', 'sale price', 'selling rate', 'sale rate', 'sale_price', 'selling_rate'] }
];

const OPTIONAL_ERP_FIELDS = [
  { key: 'barcode', label: 'Barcode', aliases: ['barcode', 'code', 'ean', 'upc', 'bar code'] },
  { key: 'sku', label: 'SKU / Item Code', aliases: ['sku', 'item code', 'product code', 'part no', 'code'] },
  { key: 'brand', label: 'Brand', aliases: ['brand', 'brand name', 'company', 'make'] },
  { key: 'mrp', label: 'MRP', aliases: ['mrp', 'm.r.p', 'm.r.p.', 'max retail price', 'mrp price'] },
  { key: 'gst', label: 'GST Tax %', aliases: ['gst', 'tax', 'gst %', 'tax %', 'tax percentage', 'hsn/sac tax'] },
  { key: 'openingStock', label: 'Opening Stock', aliases: ['opening stock', 'stock', 'qty', 'quantity', 'initial stock', 'opening qty', 'on hand'] },
  { key: 'minimumStock', label: 'Min Stock Level', aliases: ['min stock', 'minimum stock', 'reorder level', 'min_stock'] },
  { key: 'maximumStock', label: 'Max Stock Level', aliases: ['max stock', 'maximum stock', 'max_stock'] },
  { key: 'sub_category', label: 'Sub Category', aliases: ['sub category', 'sub_category', 'sub-category', 'subcat'] },
  { key: 'measurement_value', label: 'Measurement / Size', aliases: ['measurement value', 'measurement', 'size', 'volume', 'weight'] },
  { key: 'expiryDate', label: 'Expiry Date (YYYY-MM-DD)', aliases: ['expiry date', 'expiry', 'exp date', 'exp_date'] },
  { key: 'description', label: 'Description / Notes', aliases: ['description', 'notes', 'remarks', 'item description'] }
];

const ALL_ERP_FIELDS = [...MANDATORY_ERP_FIELDS, ...OPTIONAL_ERP_FIELDS];

export default function ProductImportWizardModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Upload, 2: Map Columns, 3: Validate & Preview, 4: Results
  const [file, setFile] = useState(null);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [columnMap, setColumnMap] = useState({}); // erpFieldKey -> fileHeaderName
  const [mappingErrors, setMappingErrors] = useState([]);
  
  // Validation state
  const [validatedRows, setValidatedRows] = useState([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'valid' | 'invalid'
  
  // Import Execution state
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [serverFailedRecords, setServerFailedRecords] = useState([]);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const resetWizard = () => {
    setStep(1);
    setFile(null);
    setFileHeaders([]);
    setRawRows([]);
    setColumnMap({});
    setMappingErrors([]);
    setValidatedRows([]);
    setValidCount(0);
    setInvalidCount(0);
    setImportSummary(null);
    setServerFailedRecords([]);
    setIsImporting(false);
  };

  const handleModalClose = () => {
    resetWizard();
    onClose();
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Product Name': 'Amul Butter 500g',
        'Barcode': '8901262010052',
        'SKU': 'SKU-AMUL-500',
        'Category': 'Dairy',
        'Brand': 'Amul',
        'Unit': 'Packet',
        'Purchase Price': 235.00,
        'Selling Price': 275.00,
        'MRP': 275.00,
        'GST %': 5,
        'Opening Stock': 25,
        'Min Stock': 5,
        'Max Stock': 50,
        'Description': 'Fresh salted butter 500g pack'
      },
      {
        'Product Name': 'Fortune Sunflower Oil 1L',
        'Barcode': '8906007280011',
        'SKU': 'SKU-FORT-1L',
        'Category': 'Edible Oil',
        'Brand': 'Fortune',
        'Unit': 'Pouch',
        'Purchase Price': 120.00,
        'Selling Price': 145.00,
        'MRP': 150.00,
        'GST %': 5,
        'Opening Stock': 40,
        'Min Stock': 10,
        'Max Stock': 100,
        'Description': 'Refined sunflower cooking oil 1 Litre'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample_Products');
    XLSX.writeFile(wb, 'Standard_Product_Import_Template.xlsx');
  };

  // Step 1: Read & Parse Excel / CSV File
  const handleFileSelect = (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    parseFile(uploadedFile);
  };

  const parseFile = (uploadedFile) => {
    setFile(uploadedFile);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        if (!jsonRows || jsonRows.length < 2) {
          alert('Uploaded file is empty or has no data rows below the header.');
          return;
        }

        // Header row (row 0)
        const headers = jsonRows[0].map(h => h ? h.toString().trim() : '').filter(Boolean);
        if (headers.length === 0) {
          alert('Could not detect column headers in the uploaded file.');
          return;
        }

        // Data rows
        const dataRows = [];
        for (let i = 1; i < jsonRows.length; i++) {
          const rowArr = jsonRows[i];
          // Check if row has any non-empty value
          if (rowArr.some(cell => cell !== '' && cell !== null && cell !== undefined)) {
            const rowObj = {};
            headers.forEach((h, idx) => {
              rowObj[h] = rowArr[idx] !== undefined ? rowArr[idx] : '';
            });
            dataRows.push({ __rowNum: i + 1, ...rowObj });
          }
        }

        setFileHeaders(headers);
        setRawRows(dataRows);

        // Auto Map Columns
        const autoMap = {};
        const assignedHeaders = new Set();

        ALL_ERP_FIELDS.forEach(erpField => {
          // 1. Try exact match first
          let matchedHeader = headers.find(h => {
            if (assignedHeaders.has(h)) return false;
            const hLower = h.toLowerCase().replace(/[^a-z0-9]/g, '');
            return erpField.aliases.some(alias => {
              const aLower = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
              return hLower === aLower;
            });
          });

          // 2. Try substring match if no exact match found
          if (!matchedHeader) {
            matchedHeader = headers.find(h => {
              if (assignedHeaders.has(h)) return false;
              const hLower = h.toLowerCase().replace(/[^a-z0-9]/g, '');
              return erpField.aliases.some(alias => {
                const aLower = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
                return aLower.length >= 4 && (hLower.includes(aLower) || aLower.includes(hLower));
              });
            });
          }

          if (matchedHeader) {
            autoMap[erpField.key] = matchedHeader;
            assignedHeaders.add(matchedHeader);
          } else {
            autoMap[erpField.key] = '';
          }
        });

        setColumnMap(autoMap);
        validateColumnMapping(autoMap);
        setStep(2);
      } catch (err) {
        alert('Failed to read Excel/CSV file: ' + err.message);
      }
    };

    reader.readAsBinaryString(uploadedFile);
  };

  // Step 2: Validate Column Mapping
  const validateColumnMapping = (currentMap) => {
    const errors = [];
    MANDATORY_ERP_FIELDS.forEach(m => {
      if (!currentMap[m.key] || currentMap[m.key] === '') {
        errors.push(m.label);
      }
    });

    if (currentMap.purchasePrice && currentMap.sellingPrice && currentMap.purchasePrice === currentMap.sellingPrice) {
      errors.push(`Purchase Price & Selling Price cannot be mapped to the same column ('${currentMap.purchasePrice}')`);
    }

    setMappingErrors(errors);
    return errors.length === 0;
  };

  const handleMapChange = (erpKey, selectedHeader) => {
    const newMap = { ...columnMap, [erpKey]: selectedHeader };
    setColumnMap(newMap);
    validateColumnMapping(newMap);
  };

  // Step 2 -> Step 3: Run Row-Level Validation
  const handleProceedToValidation = () => {
    if (!validateColumnMapping(columnMap)) {
      alert(`Cannot proceed! Mandatory column(s) missing: ${mappingErrors.join(', ')}`);
      return;
    }

    // Process each row
    const seenBarcodes = new Set();
    const seenSkus = new Set();
    let valid = 0;
    let invalid = 0;

    const validated = rawRows.map(row => {
      const getVal = (erpKey) => {
        const header = columnMap[erpKey];
        return header ? row[header] : '';
      };

      const name = (getVal('name') || '').toString().trim();
      const category = (getVal('category') || '').toString().trim();
      const unit = (getVal('unit') || 'Pcs').toString().trim();
      const rawPurchase = getVal('purchasePrice');
      const rawSelling = getVal('sellingPrice');
      const rawMrp = getVal('mrp');
      const rawGst = getVal('gst');
      const rawStock = getVal('openingStock');
      const barcode = (getVal('barcode') || '').toString().trim();
      const sku = (getVal('sku') || '').toString().trim();
      const brand = (getVal('brand') || '').toString().trim();
      const minStock = getVal('minimumStock');
      const maxStock = getVal('maximumStock');
      const subCategory = (getVal('sub_category') || '').toString().trim();
      const measurementVal = (getVal('measurement_value') || '').toString().trim();
      const expiryDate = getVal('expiryDate');
      const description = (getVal('description') || '').toString().trim();

      const purchasePrice = rawPurchase !== '' && !isNaN(Number(rawPurchase)) ? Number(rawPurchase) : NaN;
      const sellingPrice = rawSelling !== '' && !isNaN(Number(rawSelling)) ? Number(rawSelling) : NaN;
      const mrp = rawMrp !== '' && !isNaN(Number(rawMrp)) ? Number(rawMrp) : (isNaN(sellingPrice) ? 0 : sellingPrice);
      const gst = rawGst !== '' && !isNaN(Number(rawGst)) ? Number(rawGst) : 0;
      const openingStock = rawStock !== '' && !isNaN(Number(rawStock)) ? Number(rawStock) : 0;

      const rowErrors = [];

      if (!name) rowErrors.push('Missing Product Name');
      if (!category) rowErrors.push('Missing Category');
      if (!unit) rowErrors.push('Missing Unit');
      if (isNaN(purchasePrice) || purchasePrice < 0) rowErrors.push(`Invalid Purchase Price ('${rawPurchase}')`);
      if (isNaN(sellingPrice) || sellingPrice < 0) rowErrors.push(`Invalid Selling Price ('${rawSelling}')`);
      if (!isNaN(openingStock) && openingStock < 0) rowErrors.push('Opening Stock cannot be negative');

      if (barcode) {
        if (seenBarcodes.has(barcode.toLowerCase())) {
          rowErrors.push(`Duplicate Barcode '${barcode}' in file`);
        } else {
          seenBarcodes.add(barcode.toLowerCase());
        }
      }

      if (sku) {
        if (seenSkus.has(sku.toLowerCase())) {
          rowErrors.push(`Duplicate SKU '${sku}' in file`);
        } else {
          seenSkus.add(sku.toLowerCase());
        }
      }

      const isValid = rowErrors.length === 0;
      if (isValid) valid++;
      else invalid++;

      return {
        rowNumber: row.__rowNum,
        name,
        category,
        unit,
        purchasePrice: isNaN(purchasePrice) ? 0 : purchasePrice,
        sellingPrice: isNaN(sellingPrice) ? 0 : sellingPrice,
        mrp: isNaN(mrp) ? 0 : mrp,
        gst,
        openingStock,
        barcode,
        sku,
        brand,
        minimumStock: minStock !== '' && !isNaN(Number(minStock)) ? Number(minStock) : 5,
        maximumStock: maxStock !== '' && !isNaN(Number(maxStock)) ? Number(maxStock) : 100,
        sub_category: subCategory,
        measurement_value: measurementVal,
        expiryDate,
        description,
        isValid,
        errors: rowErrors
      };
    });

    setValidatedRows(validated);
    setValidCount(valid);
    setInvalidCount(invalid);
    setStep(3);
  };

  // Step 3 -> Step 4: Execute Bulk Import
  const handleConfirmImport = async () => {
    const validRecordsOnly = validatedRows.filter(r => r.isValid);
    if (validRecordsOnly.length === 0) {
      alert('No valid records to import! Please fix row errors and try again.');
      return;
    }

    setIsImporting(true);
    try {
      const res = await productsAPI.bulkImport(validRecordsOnly, { duplicateHandling: 'skip' });
      
      const serverSummary = res.summary || {
        totalRecords: rawRows.length,
        successCount: res.successCount || validRecordsOnly.length,
        failedCount: (rawRows.length - (res.successCount || validRecordsOnly.length))
      };

      // Combine client pre-validation failures + backend runtime duplicate/validation failures
      const clientFailures = validatedRows.filter(r => !r.isValid).map(r => ({
        rowNumber: r.rowNumber,
        name: r.name || 'N/A',
        barcode: r.barcode || 'N/A',
        sku: r.sku || 'N/A',
        category: r.category || 'N/A',
        reason: r.errors.join('; ')
      }));

      const allFailures = [...clientFailures, ...(res.failedRecords || [])];

      setImportSummary({
        totalRecords: rawRows.length,
        successCount: serverSummary.successCount,
        failedCount: allFailures.length
      });
      setServerFailedRecords(allFailures);
      setStep(4);
      if (onSuccess) onSuccess();
    } catch (err) {
      alert('Bulk Import Failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsImporting(false);
    }
  };

  // Download Error Report for Failed Rows
  const handleDownloadErrorReport = () => {
    if (serverFailedRecords.length === 0) return;

    const reportData = serverFailedRecords.map(f => ({
      'Row #': f.rowNumber,
      'Product Name': f.name,
      'Barcode': f.barcode,
      'SKU': f.sku,
      'Category': f.category,
      'Validation Error Reason': f.reason
    }));

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import_Errors');
    XLSX.writeFile(wb, `Product_Import_Error_Report_${Date.now()}.xlsx`);
  };

  const filteredPreviewRows = validatedRows.filter(r => {
    if (filterMode === 'valid') return r.isValid;
    if (filterMode === 'invalid') return !r.isValid;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#16241C] border border-slate-200 dark:border-[#1B6E4C]/30 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#101A15]/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#1B6E4C]/10 text-[#1B6E4C] dark:text-[#4FBE8B] rounded-xl font-bold">
              <TableCellsIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Enterprise Product Import Wizard
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1B6E4C]/10 text-[#1B6E4C] dark:text-[#4FBE8B] font-bold border border-[#1B6E4C]/20">
                  Tally & Zoho Standard
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Bulk import products with smart mapping, pre-validation & transaction safety
              </p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Indicator */}
        <div className="px-6 py-3 bg-slate-100/70 dark:bg-[#121E18] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#1B6E4C] dark:text-[#4FBE8B]' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-[#1B6E4C] text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-500'}`}>1</span>
            Upload File
          </div>
          <div className="h-0.5 w-10 bg-slate-300 dark:bg-slate-700" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#1B6E4C] dark:text-[#4FBE8B]' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-[#1B6E4C] text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-500'}`}>2</span>
            Column Mapping
          </div>
          <div className="h-0.5 w-10 bg-slate-300 dark:bg-slate-700" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-[#1B6E4C] dark:text-[#4FBE8B]' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-[#1B6E4C] text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-500'}`}>3</span>
            Pre-Validation & Preview
          </div>
          <div className="h-0.5 w-10 bg-slate-300 dark:bg-slate-700" />
          <div className={`flex items-center gap-2 ${step >= 4 ? 'text-[#1B6E4C] dark:text-[#4FBE8B]' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 4 ? 'bg-[#1B6E4C] text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-500'}`}>4</span>
            Import Summary
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* STEP 1: UPLOAD FILE */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">Need a format guide?</h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">Download our official standard template pre-formatted with sample product rows.</p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" /> Download Sample Template
                </button>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#1B6E4C] dark:hover:border-[#4FBE8B] bg-slate-50/50 dark:bg-[#101A15]/40 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-lg group"
              >
                <div className="p-4 rounded-full bg-[#1B6E4C]/10 text-[#1B6E4C] dark:text-[#4FBE8B] mb-3 group-hover:scale-110 transition-transform">
                  <ArrowUpTrayIcon className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">Select or Drag Excel/CSV File</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                  Supports <span className="font-semibold text-[#1B6E4C] dark:text-[#4FBE8B]">.xlsx, .xls, .csv</span> files exported from Tally, Marg, Zoho or Excel
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Validation Banner if Mandatory Columns Missing */}
              {mappingErrors.length > 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl flex items-start gap-3 text-amber-900 dark:text-amber-200">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider">Mandatory Columns Unmapped / Missing</h5>
                    <p className="text-xs font-semibold mt-0.5">
                      The uploaded file does not contain matching header(s) for required fields: <span className="underline font-bold">{mappingErrors.join(', ')}</span>. Please map them below before proceeding.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Map Uploaded Columns to ERP Fields</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Match your Excel columns to standard system product attributes.</p>
                </div>
                <div className="text-xs font-bold text-slate-500">
                  File: <span className="text-slate-800 dark:text-slate-200 font-extrabold">{file?.name}</span> ({rawRows.length} rows)
                </div>
              </div>

              {/* Mandatory Fields Section */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-100 dark:bg-[#121E18] px-4 py-2 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Required Mandatory ERP Fields (Must Map)</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400">5 Fields Required</span>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-[#16241C]">
                  {MANDATORY_ERP_FIELDS.map(erpField => {
                    const isMapped = Boolean(columnMap[erpField.key]);
                    return (
                      <div key={erpField.key} className={`p-3 rounded-xl border ${isMapped ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20' : 'border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            {erpField.label}
                            <span className="text-[10px] text-rose-500 font-bold">*Required</span>
                          </label>
                          {isMapped ? (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5"><CheckCircleIcon className="w-3.5 h-3.5" /> Mapped</span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5"><ExclamationCircleIcon className="w-3.5 h-3.5" /> Unmapped</span>
                          )}
                        </div>
                        <select
                          value={columnMap[erpField.key] || ''}
                          onChange={(e) => handleMapChange(erpField.key, e.target.value)}
                          className="w-full text-xs bg-white dark:bg-[#101A15] border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold focus:ring-2 focus:ring-[#1B6E4C]"
                        >
                          <option value="">-- Select Matching Column --</option>
                          {fileHeaders.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Optional Fields Section */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-100 dark:bg-[#121E18] px-4 py-2 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Optional Fields & Identifiers
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 bg-white dark:bg-[#16241C]">
                  {OPTIONAL_ERP_FIELDS.map(erpField => (
                    <div key={erpField.key} className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{erpField.label}</label>
                      <select
                        value={columnMap[erpField.key] || ''}
                        onChange={(e) => handleMapChange(erpField.key, e.target.value)}
                        className="w-full text-xs bg-white dark:bg-[#101A15] border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 font-medium"
                      >
                        <option value="">(Ignore Field)</option>
                        {fileHeaders.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PRE-VALIDATION & PREVIEW */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#101A15] border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <TableCellsIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">{validatedRows.length}</div>
                    <div className="text-xs font-bold text-slate-500">Total Rows Processed</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CheckCircleIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{validCount}</div>
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-500">Valid Rows (Will Import)</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <XCircleIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-rose-600 dark:text-rose-400">{invalidCount}</div>
                    <div className="text-xs font-bold text-rose-700 dark:text-rose-500">Invalid Rows (Will Skip)</div>
                  </div>
                </div>
              </div>

              {/* Table Filter Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Show:</span>
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterMode === 'all' ? 'bg-[#1B6E4C] text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    All ({validatedRows.length})
                  </button>
                  <button
                    onClick={() => setFilterMode('valid')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterMode === 'valid' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    Valid Only ({validCount})
                  </button>
                  <button
                    onClick={() => setFilterMode('invalid')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterMode === 'invalid' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    Invalid Only ({invalidCount})
                  </button>
                </div>

                <div className="text-xs text-slate-500 font-semibold">
                  ⚡ Duplicate Prevention Mode: <span className="font-extrabold text-[#1B6E4C] dark:text-[#4FBE8B]">Skip Duplicates</span>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-[#121E18] text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider z-10">
                    <tr>
                      <th className="p-3">Status</th>
                      <th className="p-3">Row #</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Unit</th>
                      <th className="p-3">Purchase Price</th>
                      <th className="p-3">Selling Price</th>
                      <th className="p-3">Barcode</th>
                      <th className="p-3">Validation Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {filteredPreviewRows.map((r, idx) => (
                      <tr key={idx} className={r.isValid ? 'hover:bg-slate-50 dark:hover:bg-slate-800/30' : 'bg-rose-50/40 dark:bg-rose-950/20'}>
                        <td className="p-3">
                          {r.isValid ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                              READY
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                              SKIP
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-slate-500">{r.rowNumber}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{r.name || <span className="text-rose-500 font-bold">Missing</span>}</td>
                        <td className="p-3">{r.category || <span className="text-rose-500 font-bold">Missing</span>}</td>
                        <td className="p-3">{r.unit}</td>
                        <td className="p-3 font-mono">₹{r.purchasePrice}</td>
                        <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{r.sellingPrice}</td>
                        <td className="p-3 font-mono">{r.barcode || '—'}</td>
                        <td className="p-3 text-rose-600 dark:text-rose-400 font-bold text-[11px]">
                          {r.isValid ? <span className="text-emerald-600 dark:text-emerald-400">All checks passed</span> : r.errors.join('; ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 4: IMPORT RESULTS */}
          {step === 4 && importSummary && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#101A15] border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{importSummary.totalRecords}</div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mt-1">Total Uploaded</div>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-center">
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{importSummary.successCount}</div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mt-1">Imported Successfully</div>
                </div>

                <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-center">
                  <div className="text-3xl font-black text-rose-600 dark:text-rose-400">{importSummary.failedCount}</div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400 mt-1">Failed / Skipped Rows</div>
                </div>
              </div>

              {/* Action Banner for Error Report */}
              {serverFailedRecords.length > 0 ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-xl flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-black uppercase text-amber-900 dark:text-amber-200">Validation Error Report Ready</h5>
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                      {serverFailedRecords.length} records were skipped due to validation or duplicate issues. You can download the error log to correct and re-upload.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadErrorReport}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 shrink-0"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" /> Download Error Report
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-emerald-800 dark:text-emerald-200 font-bold text-xs flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                  100% of product records were validated and imported into the database without any errors!
                </div>
              )}

              {/* Failed Records Detailed Table */}
              {serverFailedRecords.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">Detailed Skipped / Failed Records Log</h5>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 dark:bg-[#121E18] text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="p-3">Row #</th>
                          <th className="p-3">Product Name</th>
                          <th className="p-3">Barcode</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Exact Failure Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                        {serverFailedRecords.map((f, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="p-3 font-bold text-slate-500">{f.rowNumber}</td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{f.name}</td>
                            <td className="p-3 font-mono">{f.barcode}</td>
                            <td className="p-3">{f.category}</td>
                            <td className="p-3 text-rose-600 dark:text-rose-400 font-bold">{f.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Navigation Controls */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#101A15]/50 flex items-center justify-between">
          {step === 1 && (
            <button
              onClick={handleModalClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          )}

          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Back
              </button>
              <button
                onClick={handleProceedToValidation}
                disabled={mappingErrors.length > 0}
                className="px-5 py-2 bg-[#1B6E4C] hover:bg-[#14523A] disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95"
              >
                Validate Data & Preview ({rawRows.length} Rows) →
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Back to Column Map
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={isImporting || validCount === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#1B6E4C] hover:bg-[#14523A] disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-lg transition-all active:scale-95"
              >
                {isImporting ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" /> Processing Bulk Database Transaction...
                  </>
                ) : (
                  <>Confirm & Import {validCount} Valid Products</>
                )}
              </button>
            </>
          )}

          {step === 4 && (
            <button
              onClick={handleModalClose}
              className="ml-auto px-6 py-2.5 bg-[#1B6E4C] hover:bg-[#14523A] text-white text-xs font-black rounded-xl shadow-lg transition-all active:scale-95"
            >
              Done & Close
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
