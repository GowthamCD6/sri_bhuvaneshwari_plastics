import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Calendar, X, Plus, Search, ExternalLink, Save, Send, Filter, Check, GitBranch, User, Upload, FileText, Eye, Trash2 } from 'lucide-react';
import './PurchaseIndents.css';
import { purchaseIndentService, materialService } from '../../../services/apiService';
import formulaCalculatorService from '../../../services/formulaCalculatorService';
import useAuthStore from '../../../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const resolvePoFilePath = (source) => {
  if (!source) return null;
  return source.po_file_path || source.poFilePath || source.filePath || null;
};

const resolveIndentArray = (response) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.indents)) return response.data.indents;
  return [];
};

const normalizeText = (value) => String(value ?? '').trim().toLowerCase();

const resolveFormulaRow = (rows, componentName, rawMaterialName = '') => {
  const normalizedComponent = normalizeText(componentName);
  if (!normalizedComponent) return null;

  const normalizedRawMaterial = normalizeText(rawMaterialName);
  const rowsForComponent = rows.filter((row) => normalizeText(row.part_name) === normalizedComponent);

  if (rowsForComponent.length === 0) return null;

  if (normalizedRawMaterial) {
    const exactRawMaterialMatch = rowsForComponent.find(
      (row) => normalizeText(row.raw_material) === normalizedRawMaterial
    );

    if (exactRawMaterialMatch) return exactRawMaterialMatch;
  }

  return rowsForComponent[0];
};

const resolveMaterialRecord = (materials, componentName, rawMaterialName = '') => {
  const normalizedRawMaterial = normalizeText(rawMaterialName);
  if (normalizedRawMaterial) {
    const exactRawMaterialMatch = materials.find((material) => {
      const materialName = normalizeText(material.material_name || material.materialName || material.description);
      const materialCode = normalizeText(material.material_code || material.materialCode);
      return materialName === normalizedRawMaterial || materialCode === normalizedRawMaterial;
    });

    if (exactRawMaterialMatch) {
      return exactRawMaterialMatch;
    }
  }

  const normalizedComponent = normalizeText(componentName);
  if (!normalizedComponent) return null;

  return materials.find((material) => {
    const materialName = normalizeText(material.material_name || material.materialName || material.description);
    const materialCode = normalizeText(material.material_code || material.materialCode);
    return materialName === normalizedComponent || materialCode === normalizedComponent;
  }) || null;
};

const resolveStockFields = (materialRecord) => {
  if (!materialRecord) {
    return {
      currentStock: '0',
      orderQuantity: '',
      stockMatched: false,
    };
  }

  const currentStock = materialRecord.current_stock ?? materialRecord.stock_quantity ?? materialRecord.available_stock ?? 0;
  const reorderQuantity = materialRecord.reorder_quantity ?? materialRecord.reorder_level ?? materialRecord.min_stock_level ?? '';

  return {
    currentStock: String(currentStock),
    orderQuantity: reorderQuantity === '' || reorderQuantity == null ? '' : String(reorderQuantity),
    stockMatched: true,
  };
};

const buildFormulaFields = (rows, componentName, rawMaterialName = '') => {
  const formulaRow = resolveFormulaRow(rows, componentName, rawMaterialName);

  return {
    rawMaterial: formulaRow?.raw_material || rawMaterialName || '',
    formulaRawMaterial: formulaRow?.raw_material || rawMaterialName || '',
    formulaRmCost: formulaRow?.raw_material_cost_per_component != null
      ? Number(formulaRow.raw_material_cost_per_component).toFixed(2)
      : '',
    formulaRmRate: formulaRow?.rate_per_kg != null
      ? Number(formulaRow.rate_per_kg).toFixed(2)
      : '',
    formulaPiecesPerKg: formulaRow?.pieces_per_kg != null
      ? Number(formulaRow.pieces_per_kg).toFixed(2)
      : '',
    formulaRmPercentage: formulaRow?.rm_percentage != null
      ? Number(formulaRow.rm_percentage).toFixed(2)
      : '',
    formulaMatched: Boolean(formulaRow),
  };
};

const formatPercentage = (value) => {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return value || '';
  return (numericValue * 100).toFixed(2).replace(/\.00$/, '');
};

const getCustomerOrderQuantity = (orderItems = []) => {
  const total = orderItems.reduce((sum, item) => {
    const quantity = Number(item?.quantity);
    return sum + (Number.isFinite(quantity) ? quantity : 0);
  }, 0);

  if (!Number.isFinite(total) || total <= 0) {
    return '';
  }

  return Number.isInteger(total) ? String(total) : String(Number(total.toFixed(2)));
};

const NewPurchaseIndent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { indentId } = useParams();
  const { user } = useAuthStore();
  
  // Helper function to get today's date without timezone offset
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Convert backend date/ISO timestamp into an <input type="date"> value (YYYY-MM-DD)
  // using LOCAL calendar parts to avoid "one day before" timezone bugs.
  const toDateInputValue = (value) => {
    if (!value) return '';
    if (typeof value === 'string') {
      // If already in YYYY-MM-DD format, return as-is.
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

      // If it has a timestamp (contains 'T'), parse it and use LOCAL date
      if (value.includes('T')) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        // Use local date methods to preserve the date as it appears in the user's timezone
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      // If it's just a date string without time (YYYY-MM-DD)
      if (value.includes('-') && !value.includes('T')) {
        return value; // Already in correct format
      }
    }

    // For any other format, parse and use local date
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Safely parse a date string (including YYYY-MM-DD) into a LOCAL Date for display.
  const parseLocalDate = (value) => {
    if (!value) return null;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  
  // Check if we're viewing/editing an existing indent OR coming from customer order
  const isViewMode = location.state?.isViewMode || false;
  const passedIndentId = location.state?.indentId || indentId;
  const fromCustomerOrder = location.state?.fromCustomerOrder === true;
  const orderData = fromCustomerOrder ? location.state?.orderData : null;
  
  // Track if we've loaded indent data
  const [indentDataLoaded, setIndentDataLoaded] = useState(false);
  

  // State declarations - NO DUMMY DATA
  const [materials, setMaterials] = useState([]);
  const [formulaRows, setFormulaRows] = useState([]);
  const [formulaRowsLoaded, setFormulaRowsLoaded] = useState(false);
  const [materialCatalog, setMaterialCatalog] = useState([]);
  const [materialCatalogLoaded, setMaterialCatalogLoaded] = useState(false);
  const [createdIndentId, setCreatedIndentId] = useState(passedIndentId || null);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [formData, setFormData] = useState({
    department: 'stores',
    requestedBy: '',
    priority: 'Standard',
    indentNumber: '',
    indentDate: getTodayDate(),
    requiredByDate: '',
    justification: '',
    customerPart: '',
    customerOrderId: null, // Numeric order_id for database
    orderQuantity: '',
    poNumber: '',
    poDate: '',
    rmCost: '',
    rmRate: '',
    piecesPerKg: '',
    rmPercentage: '',
    status: 'Draft',
    workflowStage: 'QMS Init',
    accountantNotes: '',
    poFilePath: null
  });

  const [isEditingMaterial, setIsEditingMaterial] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStock, setShowStock] = useState(false);
  const [groupBySupplier, setGroupBySupplier] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedPOFile, setSelectedPOFile] = useState(null);
  const [modalState, setModalState] = useState({ show: false, title: '', message: '', type: 'info' });
  const fileInputRef = useRef(null);
  const currentIndentId = passedIndentId || createdIndentId;

  const isDeleteAllowed = ['QMS', 'Admin'].includes(user?.roleName);

  const sanitizeFileName = (value) => {
    return String(value || 'purchase-indent').replace(/[^a-zA-Z0-9-_]/g, '-');
  };

  const downloadIndentSnapshot = (savedIndentId, savedIndentNumber) => {
    const snapshot = {
      indentId: savedIndentId || null,
      indentNumber: savedIndentNumber || formData.indentNumber || null,
      department: formData.department,
      requestedBy: formData.requestedBy,
      priority: formData.priority,
      indentDate: formData.indentDate,
      requiredByDate: formData.requiredByDate,
      status: formData.status,
      workflowStage: formData.workflowStage,
      poNumber: formData.poNumber,
      poDate: formData.poDate,
      orderQuantity: formData.orderQuantity,
      rmCost: formData.rmCost,
      rmRate: formData.rmRate,
      piecesPerKg: formData.piecesPerKg,
      rmPercentage: formData.rmPercentage,
      poFilePath: formData.poFilePath,
      materials: materials.map((m) => ({
        description: m.description,
        rawMaterial: m.rawMaterial,
        preferredSupplier: m.preferredSupplier,
        requiredQuantity: m.requiredQuantity,
        requiredDate: m.requiredDate,
        onHand: m.onHand,
        order: m.order,
        uom: m.uom
      })),
      exportedAt: new Date().toISOString()
    };

    const fileBase = sanitizeFileName(savedIndentNumber || formData.indentNumber || 'purchase-indent');
    const fileName = `${fileBase}-draft.json`;
    const fileContent = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([fileContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteIndent = async () => {
    if (!currentIndentId || !isDeleteAllowed) return;

    const confirmed = window.confirm('Delete this purchase indent permanently? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setLoading(true);
      await purchaseIndentService.deleteIndent(currentIndentId);
      showModal('Deleted', 'Purchase indent deleted successfully.', 'success');

      setTimeout(() => {
        if (user?.roleName === 'QMS') {
          navigate('/customer-orders');
        } else if (user?.roleName === 'Admin') {
          navigate('/admin-purchase-indents');
        } else {
          navigate(-1);
        }
      }, 800);
    } catch (deleteError) {
      showModal('Delete Failed', deleteError.message || 'Failed to delete purchase indent.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate indent number on component mount if not editing existing
  useEffect(() => {
    if (!passedIndentId && !formData.indentNumber) {
      const autoIndentNumber = `PI-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      setFormData(prev => ({ ...prev, indentNumber: autoIndentNumber }));
    }
  }, [passedIndentId]);

  // Modal helper function
  const showModal = (title, message, type = 'info') => {
    setModalState({ show: true, title, message, type });
  };

  const closeModal = () => {
    setModalState({ show: false, title: '', message: '', type: 'info' });
  };

  // Debug: Log user info on mount
  useEffect(() => {
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadFormulaRows = async () => {
      try {
        const data = await formulaCalculatorService.getDefaultCalculator();
        if (!isActive) return;

        setFormulaRows(Array.isArray(data?.rows) ? data.rows : []);
      } catch (error) {
        if (isActive) {
          setFormulaRows([]);
        }
      } finally {
        if (isActive) {
          setFormulaRowsLoaded(true);
        }
      }
    };

    loadFormulaRows();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadMaterialCatalog = async () => {
      try {
        const response = await materialService.getAllMaterials();
        if (!isActive) return;

        const list = Array.isArray(response?.materials)
          ? response.materials
          : Array.isArray(response?.data)
            ? response.data
            : [];

        setMaterialCatalog(list);
      } catch (error) {
        if (isActive) {
          setMaterialCatalog([]);
        }
      } finally {
        if (isActive) {
          setMaterialCatalogLoaded(true);
        }
      }
    };

    loadMaterialCatalog();

    return () => {
      isActive = false;
    };
  }, []);

  // Debug: Track formData.poFilePath changes
  useEffect(() => {
  }, [formData.poFilePath]);

  // Debug: Track workflow stage changes
  useEffect(() => {
  }, [formData.workflowStage]);

  // Pre-fill form if coming from customer order (ONLY for new indents, not when viewing existing)
  useEffect(() => {
    if (!formulaRowsLoaded) return;
    if (!materialCatalogLoaded) return;

    // CRITICAL: Only run if explicitly coming from customer order AND no indent ID exists
    // This prevents overwriting materials when viewing existing indents
    if (fromCustomerOrder && orderData && !passedIndentId && !createdIndentId && !indentDataLoaded) {
      
      // Get earliest required_by_date from order items
      let earliestRequiredDate = '';
      if (orderData.orderItems && orderData.orderItems.length > 0) {
        const dates = orderData.orderItems
          .map(item => item.required_by_date || item.required_date)
          .filter(date => date);
        if (dates.length > 0) {
          earliestRequiredDate = dates.sort()[0];
        }
      }


      const orderQuantity = getCustomerOrderQuantity(orderData.orderItems || []);

      setFormData(prev => ({
        ...prev,
        department: 'stores',
        indentNumber: orderData.indentId || prev.indentNumber,
        customerPart: orderData.indentId || orderData.orderId || '',
        customerOrderId: orderData.orderId, // Store numeric order_id
        requestedBy: orderData.customerName || '',
        indentDate: toDateInputValue(orderData.indentDate) || prev.indentDate,
        requiredByDate: toDateInputValue(earliestRequiredDate) || prev.requiredByDate,
        orderQuantity: orderQuantity || prev.orderQuantity,
        justification: `Purchase indent for customer order ${orderData.indentId || orderData.orderId}`,
      }));

      // Pre-fill materials from order items ONLY for new indents
      if (orderData.orderItems && orderData.orderItems.length > 0) {
        const orderMaterials = orderData.orderItems.map((item, idx) => {
          const formulaFields = buildFormulaFields(
            formulaRows,
            item.component_name || item.component || '',
            item.raw_material || item.rawMaterial || ''
          );
          const materialRecord = resolveMaterialRecord(
            materialCatalog,
            item.component_name || item.component || '',
            formulaFields.formulaRawMaterial || formulaFields.rawMaterial || ''
          );
          const stockFields = resolveStockFields(materialRecord);

          // Calculate initial order quantity based on required quantity and pieces per kg
          const reqQty = parseFloat(item.quantity);
          const pieces = parseFloat(formulaFields.formulaPiecesPerKg);
          const rmPercent = parseFloat(formulaFields.formulaRmPercentage);
          
          let calculatedOrder = stockFields.orderQuantity || '';
          if (!isNaN(reqQty) && !isNaN(pieces) && pieces > 0) {
            const percentVal = !isNaN(rmPercent) ? rmPercent : 100;
            calculatedOrder = ((reqQty / pieces) * (percentVal / 100)).toFixed(2);
          } else if (!isNaN(reqQty) && (isNaN(pieces) || pieces <= 0)) {
            // Default to required quantity if no formula exists
            calculatedOrder = String(reqQty);
          }

          return {
            id: Date.now() + idx,
            description: item.component_name || item.component || '',
            rawMaterial: formulaFields.rawMaterial,
            preferredSupplier: item.preferred_supplier || '',
            requiredQuantity: item.quantity || '',
            requiredDate: item.required_by_date || item.required_date || '',
            onHand: stockFields.currentStock,
            order: calculatedOrder,
            status: 'pending',
            uom: item.unit || item.uom || 'kg',
            isEditing: false,
            formulaRawMaterial: formulaFields.formulaRawMaterial,
            formulaRmCost: formulaFields.formulaRmCost,
            formulaRmRate: formulaFields.formulaRmRate,
            formulaPiecesPerKg: formulaFields.formulaPiecesPerKg,
            formulaRmPercentage: formulaFields.formulaRmPercentage,
            formulaMatched: formulaFields.formulaMatched,
            stockMatched: stockFields.stockMatched,
            customerPart: orderData.indentId || orderData.orderId || item.component_name || item.description || '',
            poNumber: '',
            poDate: '',
            rmCost: formulaFields.formulaRmCost || '',
            rmRate: formulaFields.formulaRmRate || '',
            piecesPerKg: formulaFields.formulaPiecesPerKg || '',
            rmPercentage: formulaFields.formulaRmPercentage ? formatPercentage(formulaFields.formulaRmPercentage) : '',
          };
        });
        setMaterials(orderMaterials);
      } else {
      }
    } else if (passedIndentId || createdIndentId) {
    }
  }, [fromCustomerOrder, orderData, passedIndentId, createdIndentId, indentDataLoaded, formulaRowsLoaded, materialCatalogLoaded, formulaRows, materialCatalog]);

  // Dynamic workflow steps based on current workflow stage
  const workflowSteps = [
    {
      key: 'qms-init',
      title: 'QMS Initiated',
      subtitle: 'Quality team created indent',
      actor: 'QMS',
      user: formData.requestedBy || 'S. Chen (QMS)',
      date: parseLocalDate(formData.indentDate)
        ? parseLocalDate(formData.indentDate).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        : null,
      status: formData.workflowStage === 'QMS Init' ? 'current' : 'completed'
    },
    {
      key: 'store-officer',
      title: 'Store Officer Review',
      subtitle: 'Stock and requirement verification',
      actor: 'Store Officer',
      user: ['Store Officer', 'QMS Verified', 'Admin', 'Accountant', 'Completed'].includes(formData.workflowStage) ? 'Store Officer' : null,
      date: null,
      note: formData.storeOfficerNotes || null,
      status: formData.workflowStage === 'Store Officer' ? 'current' : 
              formData.workflowStage === 'QMS Init' ? 'pending' : 'completed'
    },
    {
      key: 'qms-verified',
      title: 'QMS Verified',
      subtitle: 'Final quality verification',
      actor: 'QMS',
      user: ['Admin', 'Accountant', 'Completed'].includes(formData.workflowStage) ? 'QMS Team' : null,
      date: null,
      note: formData.qmsNotes || null,
      status: formData.workflowStage === 'QMS Verified' ? 'current' : 
              ['QMS Init', 'Store Officer'].includes(formData.workflowStage) ? 'pending' : 'completed'
    },
    {
      key: 'admin',
      title: 'Admin Approval',
      subtitle: 'Pending final authorization',
      actor: 'Admin',
      user: ['Accountant', 'Completed'].includes(formData.workflowStage) ? 'Admin' : null,
      date: null,
      note: formData.adminNotes || null,
      status: formData.workflowStage === 'Admin' ? 'current' : 
              ['QMS Init', 'Store Officer', 'QMS Verified'].includes(formData.workflowStage) ? 'pending' : 'completed'
    },
    {
      key: 'accountant',
      title: 'Accountant Processing',
      subtitle: 'Purchase order and billing process',
      actor: 'Accountant',
      user: formData.workflowStage === 'Completed' ? 'Accountant' : null,
      date: null,
      note: formData.accountantNotes || null,
      status: formData.workflowStage === 'Accountant' ? 'current' : 
              formData.workflowStage === 'Completed' ? 'completed' : 'pending'
    }
  ];

  // Fetch existing indent if indentId is provided
  useEffect(() => {
    const fetchIndent = async () => {
      if (!passedIndentId || !formulaRowsLoaded || !materialCatalogLoaded) return;

      try {
        setLoading(true);


        const response = await purchaseIndentService.getIndentById(passedIndentId);
        
        if (response.success && response.data) {
          const indent = response.data;
          
          
          setFormData({
            department: indent.department || 'stores',
            requestedBy: indent.customer_name || indent.requested_by_name || '',
            priority: indent.priority || 'Standard',
            indentNumber: indent.indent_number || '',
            indentDate: toDateInputValue(indent.indent_date || indent.request_date) || getTodayDate(),
            requiredByDate: toDateInputValue(indent.required_by_date) || '',
            justification: indent.justification || '',
            customerPart: indent.customer_part_name || indent.customer_order_indent_id || indent.customer_order_id || '',
            customerOrderId: indent.customer_order_id || null,
            orderQuantity: indent.order_quantity || '',
            poNumber: indent.po_number || '',
            poDate: indent.po_date || '',
            rmCost: indent.rm_cost || '',
            rmRate: indent.rm_rate || '',
            piecesPerKg: indent.pieces_per_kg || '',
            rmPercentage: indent.rm_percentage || '',
            status: indent.status || 'Draft',
            workflowStage: indent.workflow_stage || 'QMS Init',
            accountantNotes: indent.accountant_notes || '',
            storeOfficerNotes: indent.store_officer_notes || '',
            qmsNotes: indent.qms_notes || '',
            adminNotes: indent.admin_notes || '',
            poFilePath: resolvePoFilePath(indent)
          });
          

          if (indent.materials && indent.materials.length > 0) {
            const mappedMaterials = indent.materials.map(m => {
              const formulaFields = buildFormulaFields(
                formulaRows,
                m.material_description,
                m.raw_material || ''
              );
              const materialRecord = resolveMaterialRecord(
                materialCatalog,
                m.material_description,
                formulaFields.formulaRawMaterial || formulaFields.rawMaterial || m.raw_material || ''
              );
              const stockFields = resolveStockFields(materialRecord);

              return {
                id: m.indent_material_id,
                description: m.material_description,
                rawMaterial: formulaFields.rawMaterial,
                preferredSupplier: m.preferred_supplier || '',
                requiredQuantity: m.quantity,
                requiredDate: toDateInputValue(indent.required_by_date) || '',
                onHand: stockFields.currentStock,
                order: stockFields.orderQuantity,
                status: 'pending',
                uom: m.unit_of_measurement || 'kg',
                isEditing: false,
                formulaRawMaterial: formulaFields.formulaRawMaterial,
                formulaRmCost: formulaFields.formulaRmCost,
                formulaRmRate: formulaFields.formulaRmRate,
                formulaPiecesPerKg: formulaFields.formulaPiecesPerKg,
                formulaRmPercentage: formulaFields.formulaRmPercentage,
                formulaMatched: formulaFields.formulaMatched,
                stockMatched: stockFields.stockMatched,
                customerPart: m.customer_part || m.material_description || '',
                poNumber: m.po_number || '',
                poDate: m.po_date || '',
                rmCost: m.rm_cost || formulaFields.formulaRmCost || '',
                rmRate: m.rm_rate || formulaFields.formulaRmRate || '',
                piecesPerKg: m.pieces_per_kg || formulaFields.formulaPiecesPerKg || '',
                rmPercentage: m.rm_percentage || (formulaFields.formulaRmPercentage ? formatPercentage(formulaFields.formulaRmPercentage) : '') || '',
              };
            });
            setMaterials(mappedMaterials);
            setIndentDataLoaded(true);
          } else {
            setMaterials([]);
            setIndentDataLoaded(true);
          }
        }
      } catch (err) {
        setError('Failed to load purchase indent');
      } finally {
        setLoading(false);
      }
    };

    fetchIndent();
  }, [passedIndentId, formulaRowsLoaded, materialCatalogLoaded, formulaRows, materialCatalog]);

  // Clear validation errors when user starts typing
  const clearFieldError = (fieldName) => {
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Handle add material
  const handleAddMaterial = () => {
    const newMaterial = {
      id: Date.now(),
      description: '',
      rawMaterial: '',
      preferredSupplier: '',
      requiredQuantity: '',
      requiredDate: '',
      onHand: '0',
      order: '',
      status: 'pending',
      uom: 'kg',
      formulaRawMaterial: '',
      formulaRmCost: '',
      formulaRmRate: '',
      formulaPiecesPerKg: '',
      formulaRmPercentage: '',
      formulaMatched: false,
      customerPart: formData.indentNumber || '',
      poNumber: '',
      poDate: '',
      rmCost: '',
      rmRate: '',
      piecesPerKg: '',
      rmPercentage: '',
      isEditing: true,
      isNew: true
    };
    setMaterials([...materials, newMaterial]);
    setIsEditingMaterial(newMaterial.id);
    clearFieldError('materials');
    };

  // Handle remove material
  const handleRemoveMaterial = (id) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  // Handle cancel edit
  const handleCancelMaterial = (id) => {
    setMaterials(prevMaterials => prevMaterials.flatMap(material => {
      if (material.id !== id) return [material];

      if (material.isNew) {
        return [];
      }

      const { originalMaterial, isNew, ...restoredMaterial } = material;
      return [{
        ...(originalMaterial || restoredMaterial),
        isEditing: false,
        isNew: false
      }];
    }));
    setIsEditingMaterial(null);
  };

  // Handle edit material
  const handleEditMaterial = (id) => {
    setIsEditingMaterial(id);
    setMaterials(prevMaterials => prevMaterials.map(m => 
      m.id === id ? { ...m, originalMaterial: { ...m }, isEditing: true } : m
    ));
  };

  // Handle save material edits
  const handleSaveMaterial = (id, updatedFields) => {
    setMaterials(prevMaterials => prevMaterials.map(m => 
      m.id === id ? { ...m, ...updatedFields, isEditing: false, isNew: false, originalMaterial: undefined } : m
    ));
    setIsEditingMaterial(null);
  };

  // Handle material field change
  const handleMaterialChange = (id, field, value) => {
    setMaterials(prevMaterials => prevMaterials.map((material) => {
      if (material.id !== id) return material;

      const updatedMaterial = { ...material, [field]: value };

      if (field === 'description' || field === 'rawMaterial' || field === 'customerPart') {
        const formulaFields = buildFormulaFields(
          formulaRows,
          field === 'description' ? value : updatedMaterial.description,
          field === 'rawMaterial' ? value : updatedMaterial.rawMaterial
        );
        const materialRecord = resolveMaterialRecord(
          materialCatalog,
          field === 'description' ? value : updatedMaterial.description,
          field === 'rawMaterial' ? value : updatedMaterial.rawMaterial
        );
        const stockFields = resolveStockFields(materialRecord);

        return {
          ...updatedMaterial,
          ...formulaFields,
          onHand: stockFields.currentStock,
          order: stockFields.orderQuantity,
          stockMatched: stockFields.stockMatched,
          rmCost: formulaFields.formulaRmCost || updatedMaterial.rmCost,
          rmRate: formulaFields.formulaRmRate || updatedMaterial.rmRate,
          piecesPerKg: formulaFields.formulaPiecesPerKg || updatedMaterial.piecesPerKg,
          rmPercentage: formulaFields.formulaRmPercentage ? formatPercentage(formulaFields.formulaRmPercentage) : updatedMaterial.rmPercentage,
        };
      }

      if (field === 'requiredQuantity' || field === 'rmRate' || field === 'piecesPerKg' || field === 'rmPercentage') {
        const reqQty = parseFloat(field === 'requiredQuantity' ? value : updatedMaterial.requiredQuantity);
        const rate = parseFloat(field === 'rmRate' ? value : updatedMaterial.rmRate);
        const pieces = parseFloat(field === 'piecesPerKg' ? value : updatedMaterial.piecesPerKg);
        const rmPercent = parseFloat(field === 'rmPercentage' ? value : updatedMaterial.rmPercentage);
        
        if (!isNaN(rate) && !isNaN(pieces) && pieces > 0) {
          const percentVal = !isNaN(rmPercent) ? rmPercent : 100;
          updatedMaterial.rmCost = ((rate / pieces) * (percentVal / 100)).toFixed(2);
        }

        // Auto-calculate order quantity if we have piecesPerKg
        if (!isNaN(reqQty) && !isNaN(pieces) && pieces > 0) {
          const percentVal = !isNaN(rmPercent) ? rmPercent : 100;
          updatedMaterial.order = ((reqQty / pieces) * (percentVal / 100)).toFixed(2);
        } else if (field === 'requiredQuantity' && (isNaN(pieces) || pieces <= 0)) {
           // Fallback: if no pieces per kg, order qty is just required qty
           if (!isNaN(reqQty)) {
             updatedMaterial.order = String(reqQty);
           }
        }
        
        return updatedMaterial;
      }

      if (field === 'onHand' || field === 'order') {
        return {
          ...updatedMaterial,
          stockMatched: false,
        };
      }

      return updatedMaterial;
    }));
  };

  // Calculate total order quantity
  const calculateTotalOrder = () => {
    return materials.reduce((total, material) => {
      const orderQty = parseFloat(material.order) || 0;
      return total + orderQty;
    }, 0);
  };

  // Handle PO file selection
  const handlePOFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showModal('File Too Large', 'File size must be less than 10MB', 'error');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type)) {
      showModal('Invalid File Type', 'Only PDF, images (JPG, PNG), and documents (DOC, DOCX, XLS, XLSX) are allowed', 'error');
      return;
    }

    setSelectedPOFile(file);
    showModal('File Selected', `File "${file.name}" selected. It will be uploaded when you submit the indent.`, 'success');
  };

  // Handle view PO file
  const handleViewPOFile = () => {
    if (!formData.poFilePath) return;

    const apiOrigin = new URL(API_BASE_URL).origin;
    const fileUrl = currentIndentId
      ? `${API_BASE_URL}/purchase-indents/${currentIndentId}/download-po`
      : `${apiOrigin}/uploads/${formData.poFilePath}`;

    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  // Handle submit form
  const handleSubmit = async (action = 'submit') => {
    try {
      setLoading(true);
      setError(null);
      let poUploadFailed = false;
      let poUploadErrorMessage = '';
      
      if (action === 'submit') {
        const errors = {};
        
        if (!formData.department || formData.department.trim() === '') {
          errors.department = 'Department is required';
        }
        if (!formData.requestedBy || formData.requestedBy.trim() === '') {
          errors.requestedBy = 'Requested by field is required';
        }
        if (!materials || materials.length === 0) {
          errors.materials = 'Please add at least one material';
        }
        
        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          setLoading(false);
          return;
        }
      }



      // Generate indent number if not exists - use timestamp for uniqueness
      const indentNumber = formData.indentNumber || `PI-${new Date().getFullYear()}-${Date.now()}`;

      // Determine workflow based on role and action
      let workflowStage = 'QMS Init';
      let status = 'Draft';


      if (action === 'submit') {
        if (user?.roleName === 'StoreOfficer' && passedIndentId) {
          // Store Officer sending back to QMS
          workflowStage = 'QMS Verified';
          status = 'Pending QMS Verification';
        } else if (user?.roleName === 'QMS') {
          // QMS sending to Store Officer
          workflowStage = 'Store Officer';
          status = 'Pending Store Review';
        }
      }

      const indentData = {
        indentNumber: indentNumber,
        customerOrderId: formData.customerOrderId || null,
        requestDate: formData.indentDate,
        requiredByDate: formData.requiredByDate || formData.indentDate,
        priority: formData.priority || 'Standard',
        workflowStage: workflowStage,
        status: status,
        poNumber: formData.poNumber || null,
        poDate: formData.poDate || null,
        orderQuantity: formData.orderQuantity || null,
        rmCost: formData.rmCost || null,
        rmRate: formData.rmRate || null,
        piecesPerKg: formData.piecesPerKg || null,
        rmPercentage: formData.rmPercentage || null,
        materials: materials.map(m => ({
          description: m.description,
          rawMaterial: m.rawMaterial || null,
          quantity: m.requiredQuantity,
          unit: m.uom || 'kg',
          currentStock: m.onHand || '0',
          requiredStock: m.order || m.requiredQuantity,
          preferredSupplier: m.preferredSupplier || '',
          estimatedCost: null,
          specifications: null,
          customerPart: m.customerPart || null,
          poNumber: m.poNumber || null,
          poDate: m.poDate || null,
          rmCost: m.rmCost || null,
          rmRate: m.rmRate || null,
          piecesPerKg: m.piecesPerKg || null,
          rmPercentage: m.rmPercentage || null
        }))
      };


      let response;
      let finalIndentId = createdIndentId || passedIndentId;
      
      // ALWAYS check if indent with this number exists (resubmission should overwrite)
      if (!finalIndentId && indentNumber) {
        try {
          const checkResponse = await purchaseIndentService.getAllIndents({});
          const existingIndent = resolveIndentArray(checkResponse).find(i => i.indent_number === indentNumber);
          
          if (existingIndent?.indent_id) {
            finalIndentId = existingIndent.indent_id;
            setCreatedIndentId(existingIndent.indent_id);
            if (!formData.indentNumber) {
              setFormData(prev => ({ ...prev, indentNumber: indentNumber }));
            }
          }
        } catch (checkError) {
        }
      }
      
      if (finalIndentId) {
        // Update existing indent (including resubmissions)
        
        // If submitting to next stage (not just saving draft), use sendToNextStage
        if (action === 'submit') {
          response = await purchaseIndentService.sendToNextStage(finalIndentId, {
            poNumber: formData.poNumber || null,
            poDate: formData.poDate || null,
            orderQuantity: formData.orderQuantity || null,
            rmCost: formData.rmCost || null,
            rmRate: formData.rmRate || null,
            piecesPerKg: formData.piecesPerKg || null,
            rmPercentage: formData.rmPercentage || null,
            materials: materials.map(m => ({
              description: m.description,
              rawMaterial: m.rawMaterial || null,
              quantity: m.requiredQuantity,
              unit: m.uom || 'kg',
              currentStock: m.onHand || '0',
              requiredStock: m.order || m.requiredQuantity,
              preferredSupplier: m.preferredSupplier || '',
              customerPart: m.customerPart || null,
              poNumber: m.poNumber || null,
              poDate: m.poDate || null,
              rmCost: m.rmCost || null,
              rmRate: m.rmRate || null,
              piecesPerKg: m.piecesPerKg || null,
              rmPercentage: m.rmPercentage || null
            })),
            comments: user?.roleName === 'StoreOfficer' 
              ? 'PO details filled by Store Officer' 
              : 'Sent for Store Officer review'
          });
        } else {
          // Just saving as draft - use regular update
          response = await purchaseIndentService.updateIndentStatus(finalIndentId, {
            status: status,
            workflowStage: workflowStage,
            poNumber: formData.poNumber || null,
            poDate: formData.poDate || null,
            orderQuantity: formData.orderQuantity || null,
            rmCost: formData.rmCost || null,
            rmRate: formData.rmRate || null,
            piecesPerKg: formData.piecesPerKg || null,
            rmPercentage: formData.rmPercentage || null,
            materials: materials.map(m => ({
              description: m.description,
              rawMaterial: m.rawMaterial || null,
              quantity: m.requiredQuantity,
              unit: m.uom || 'kg',
              currentStock: m.onHand || '0',
              requiredStock: m.order || m.requiredQuantity,
              preferredSupplier: m.preferredSupplier || '',
              customerPart: m.customerPart || null,
              poNumber: m.poNumber || null,
              poDate: m.poDate || null,
              rmCost: m.rmCost || null,
              rmRate: m.rmRate || null,
              piecesPerKg: m.piecesPerKg || null,
              rmPercentage: m.rmPercentage || null
            }))
          });
        }
      } else {
        // No existing indent found - create new one
        try {
          response = await purchaseIndentService.createIndent(indentData);
          
          // Store the created indent ID for subsequent operations
          if (response.success && response.data?.indent_id) {
            setCreatedIndentId(response.data.indent_id);
          }
        } catch (createError) {
          // If creation fails due to duplicate, fetch and update instead
          if (createError.message?.includes('already exists')) {
            const allIndents = await purchaseIndentService.getAllIndents({});
            const existingIndent = resolveIndentArray(allIndents).find(i => i.indent_number === indentNumber);
            
            if (existingIndent?.indent_id) {
              setCreatedIndentId(existingIndent.indent_id);
              finalIndentId = existingIndent.indent_id;
              
              if (action === 'submit') {
                response = await purchaseIndentService.sendToNextStage(finalIndentId, {
                  poNumber: formData.poNumber || null,
                  poDate: formData.poDate || null,
                  orderQuantity: formData.orderQuantity || null,
                  rmCost: formData.rmCost || null,
                  rmRate: formData.rmRate || null,
                  piecesPerKg: formData.piecesPerKg || null,
                  rmPercentage: formData.rmPercentage || null,
                  materials: materials.map(m => ({
                    description: m.description,
                    rawMaterial: m.rawMaterial || null,
                    quantity: m.requiredQuantity,
                    unit: m.uom || 'kg',
                    currentStock: m.onHand || '0',
                    requiredStock: m.order || m.requiredQuantity,
                    preferredSupplier: m.preferredSupplier || '',
                    customerPart: m.customerPart || null,
                    poNumber: m.poNumber || null,
                    poDate: m.poDate || null,
                    rmCost: m.rmCost || null,
                    rmRate: m.rmRate || null,
                    piecesPerKg: m.piecesPerKg || null,
                    rmPercentage: m.rmPercentage || null
                  })),
                  comments: 'Resubmitted application'
                });
              } else {
                response = await purchaseIndentService.updateIndentStatus(finalIndentId, {
                  status: status,
                  workflowStage: workflowStage,
                  poNumber: formData.poNumber || null,
                  poDate: formData.poDate || null,
                  orderQuantity: formData.orderQuantity || null,
                  rmCost: formData.rmCost || null,
                  rmRate: formData.rmRate || null,
                  piecesPerKg: formData.piecesPerKg || null,
                  rmPercentage: formData.rmPercentage || null,
                  materials: materials.map(m => ({
                    description: m.description,
                    rawMaterial: m.rawMaterial || null,
                    quantity: m.requiredQuantity,
                    unit: m.uom || 'kg',
                    currentStock: m.onHand || '0',
                    requiredStock: m.order || m.requiredQuantity,
                    preferredSupplier: m.preferredSupplier || '',
                    customerPart: m.customerPart || null,
                    poNumber: m.poNumber || null,
                    poDate: m.poDate || null,
                    rmCost: m.rmCost || null,
                    rmRate: m.rmRate || null,
                    piecesPerKg: m.piecesPerKg || null,
                    rmPercentage: m.rmPercentage || null
                  }))
                });
              }
            } else {
              throw createError;
            }
          } else {
            throw createError;
          }
        }
      }


      if (response.success) {
        // Update formData with the saved indent number and ID
        const savedIndentId = response.data?.indent_id || finalIndentId;
        const savedIndentNumber = response.data?.indent_number || indentNumber;
        
        if (!formData.indentNumber) {
          setFormData(prev => ({ 
            ...prev, 
            indentNumber: savedIndentNumber 
          }));
        }
        
        if (savedIndentId && !createdIndentId) {
          setCreatedIndentId(savedIndentId);
        }
        
        // Upload PO file if selected
        if (selectedPOFile && savedIndentId) {
          try {
            const uploadResponse = await purchaseIndentService.uploadPOFile(savedIndentId, selectedPOFile);
            if (uploadResponse.success) {
              // Update formData with the actual file path from server
              const actualFilePath = resolvePoFilePath(uploadResponse.data);
              setFormData(prev => ({ 
                ...prev, 
                poFilePath: actualFilePath 
              }));
              setSelectedPOFile(null); // Clear file selection after upload
            } else {
            }
          } catch (uploadError) {
            poUploadFailed = true;
            poUploadErrorMessage = uploadError.message || 'Failed to upload PO file.';
          }
        } else {
        }
        
        // Refetch the indent data after any submission to get updated workflow, materials, and file path
        if (savedIndentId) {
          try {
            const refreshResponse = await purchaseIndentService.getIndentById(savedIndentId);
            if (refreshResponse.success && refreshResponse.data) {
              const indent = refreshResponse.data;
              
              // Update formData with latest data
              setFormData(prev => ({ 
                ...prev,
                workflowStage: indent.workflow_stage || prev.workflowStage,
                poFilePath: resolvePoFilePath(indent) || prev.poFilePath,
                poNumber: indent.po_number || prev.poNumber,
                poDate: indent.po_date || prev.poDate
              }));
              
              // Update materials if present
              if (indent.materials && indent.materials.length > 0) {
                const mappedMaterials = indent.materials.map(m => ({
                  id: m.indent_material_id,
                  description: m.material_description,
                  rawMaterial: m.raw_material || '',
                  preferredSupplier: m.preferred_supplier || '',
                  requiredQuantity: m.quantity,
                  requiredDate: toDateInputValue(indent.required_by_date) || '',
                  onHand: String(m.current_stock ?? m.stock_quantity ?? '0'),
                  order: String(m.required_stock ?? ''),
                  status: 'pending',
                  uom: m.unit_of_measurement || 'kg',
                  formulaRawMaterial: buildFormulaFields(formulaRows, m.material_description, m.raw_material || '').formulaRawMaterial,
                  formulaRmCost: buildFormulaFields(formulaRows, m.material_description, m.raw_material || '').formulaRmCost,
                  formulaRmRate: buildFormulaFields(formulaRows, m.material_description, m.raw_material || '').formulaRmRate,
                  formulaPiecesPerKg: buildFormulaFields(formulaRows, m.material_description, m.raw_material || '').formulaPiecesPerKg,
                  formulaRmPercentage: buildFormulaFields(formulaRows, m.material_description, m.raw_material || '').formulaRmPercentage,
                  formulaMatched: buildFormulaFields(formulaRows, m.material_description, m.raw_material || '').formulaMatched,
                  stockMatched: true,
                  isEditing: false
                }));
                setMaterials(mappedMaterials);
              } else {
              }
            }
          } catch (refreshError) {
          }
        }

        if (poUploadFailed) {
          showModal(
            'PO File Upload Failed',
            `Purchase indent was saved, but the PO file could not be uploaded. ${poUploadErrorMessage}`,
            'error'
          );
        } else {
          if (action !== 'submit') {
            downloadIndentSnapshot(savedIndentId, savedIndentNumber);
          }

          showModal('Success', 
            action === 'submit' 
              ? (user?.roleName === 'StoreOfficer' ? 'Sent to QMS for verification!' : 'Purchase indent submitted successfully!')
              : 'Draft saved successfully!',
            'success'
          );
        }
        
        setTimeout(() => {
          if (action === 'submit' && !poUploadFailed) {
            if (user?.roleName === 'StoreOfficer') {
              navigate('/verify-indents');
            } else if (user?.roleName === 'QMS') {
              // Navigate to VerifyStoreIndents so QMS can see their created indent with materials
              navigate('/verify-store-indents');
            } else {
              // For other roles, go back
              navigate(-1);
            }
          }
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to process purchase indent');
    } finally {
      setLoading(false);
    }
  };

  // Handle date picker
  const handleDateSelect = (field, date) => {
    setFormData({...formData, [field]: date});
  };

  // Filter materials based on search
  const filteredMaterials = materials.filter(material => 
    String(material.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(material.rawMaterial || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(material.preferredSupplier || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group materials by supplier
  const groupedMaterials = groupBySupplier 
    ? materials.reduce((groups, material) => {
        const supplier = material.preferredSupplier || 'No Supplier';
        if (!groups[supplier]) groups[supplier] = [];
        groups[supplier].push(material);
        return groups;
      }, {})
    : null;

  // Render material card with edit capability
  const renderMaterialCard = (material, index) => {

    const { compStock, rmStock } = (() => {
      const normalizedComponent = normalizeText(material.description);
      const normalizedRawMaterial = normalizeText(material.rawMaterial);
      
      let comp = '0';
      let rm = '0';
      
      if (normalizedComponent) {
        const compRecord = materialCatalog.find(m => {
          const mName = normalizeText(m.material_name || m.materialName || m.description);
          const mCode = normalizeText(m.material_code || m.materialCode);
          return mName === normalizedComponent || mCode === normalizedComponent;
        });
        if (compRecord) comp = String(compRecord.current_stock ?? compRecord.stock_quantity ?? compRecord.available_stock ?? 0);
      }
      
      if (normalizedRawMaterial) {
        const rmRecord = materialCatalog.find(m => {
          const mName = normalizeText(m.material_name || m.materialName || m.description);
          const mCode = normalizeText(m.material_code || m.materialCode);
          return mName === normalizedRawMaterial || mCode === normalizedRawMaterial;
        });
        if (rmRecord) rm = String(rmRecord.current_stock ?? rmRecord.stock_quantity ?? rmRecord.available_stock ?? 0);
      }
      return { compStock: comp, rmStock: rm };
    })();
    if (material.isEditing) {
      return (
        <div key={material.id} className="pi-material-card editing">
          <div className="pi-material-number">{index + 1}</div>
          <div className="pi-material-content">
            <div className="pi-material-column">
              <div className="pi-material-label">Material description</div>
              <input
                type="text"
                value={material.description}
                onChange={(e) => handleMaterialChange(material.id, 'description', e.target.value)}
                className="pi-input"
                placeholder="Enter material description"
                autoFocus
                readOnly={isViewMode}
              />
            </div>
            <div className="pi-material-column">
              <div className="pi-material-label">Raw material</div>
              <input
                type="text"
                value={material.rawMaterial}
                onChange={(e) => handleMaterialChange(material.id, 'rawMaterial', e.target.value)}
                className="pi-input"
                placeholder="Enter raw material"
                readOnly={isViewMode}
              />
            </div>
            <div className="pi-material-column">
              <div className="pi-material-label">Preferred supplier</div>
              <input
                type="text"
                value={material.preferredSupplier}
                onChange={(e) => handleMaterialChange(material.id, 'preferredSupplier', e.target.value)}
                className="pi-input"
                placeholder="Enter preferred supplier"
                readOnly={isViewMode}
              />
            </div>
            <div className="pi-material-column">
              <div className="pi-material-label">Required quantity</div>
              <input
                type="number"
                value={material.requiredQuantity}
                onChange={(e) => handleMaterialChange(material.id, 'requiredQuantity', e.target.value)}
                className="pi-input"
                placeholder="Enter quantity"
                readOnly={isViewMode}
              />
            </div>
            <div className="pi-material-column" style={{ minWidth: '180px' }}>
              <div className="pi-material-label">Available Stock</div>
              <div style={{ fontSize: '12px', color: '#64748b', background: '#f8fafc', padding: '6px', borderRadius: '4px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span>Component:</span>
                  <span style={{ fontWeight: 500, color: '#334155' }}>{compStock} {material.uom}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Raw Material:</span>
                  <span style={{ fontWeight: 500, color: '#334155' }}>{rmStock} {material.uom}</span>
                </div>
              </div>
            </div>
            

          </div>
          <div className="pi-material-actions">
            <button 
              onClick={() => handleSaveMaterial(material.id, material)}
              type="button"
              className="pi-btn pi-btn-primary"
            >
              <Check size={14} />
              Save
            </button>
            <button 
              onClick={() => handleCancelMaterial(material.id)}
              type="button"
              className="pi-btn pi-btn-outline"
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={material.id} className="pi-material-card">
        <div className="pi-material-number">{index + 1}</div>
        <div className="pi-material-content">
          <div className="pi-material-column">
            <div className="pi-material-label">Material description</div>
            <div className="pi-material-value">{material.description}</div>
          </div>
          <div className="pi-material-column">
            <div className="pi-material-label">Raw material</div>
            <div className="pi-material-value-normal">
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                {material.rawMaterial || 'Not selected'}
              </div>
            </div>
          </div>
          <div className="pi-material-column">
            <div className="pi-material-label">Preferred supplier</div>
            <div className="pi-material-value-normal">{material.preferredSupplier}</div>
          </div>
          <div className="pi-material-column">
            <div className="pi-material-label">Required quantity</div>
            <div className="pi-material-value-normal">
              <div style={{fontSize: '14px', fontWeight: '500', color: '#1e293b'}}>{material.requiredQuantity}</div>
              {material.requiredDate && (
                <div style={{marginTop: '4px', fontSize: '12px', color: '#64748b'}}>
                  Required on {parseLocalDate(material.requiredDate)?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>
          </div>
          <div className="pi-material-column" style={{ minWidth: '180px' }}>
            <div className="pi-material-label">Available Stock</div>
            <div className="pi-material-value-normal">
              <div style={{ fontSize: '12px', color: '#64748b', background: '#f8fafc', padding: '6px', borderRadius: '4px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span>Component:</span>
                  <span style={{ fontWeight: 500, color: '#334155' }}>{compStock} {material.uom}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Raw Material:</span>
                  <span style={{ fontWeight: 500, color: '#334155' }}>{rmStock} {material.uom}</span>
                </div>
              </div>
            </div>
          </div>


        </div>
        <div className="pi-material-actions">
          <button 
            onClick={() => handleEditMaterial(material.id)}
            type="button"
            className="pi-btn pi-btn-action"
          >
            Edit
          </button>
          <button 
            onClick={() => handleRemoveMaterial(material.id)}
            type="button"
            className="pi-btn pi-btn-action"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="purchase-indent-page">
      <div className="purchase-indent-container">
        {/* Error Display */}
        {error && (
          <div style={{ padding: '12px 16px', marginBottom: '16px', background: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c33' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Success/Error Messages */}
        {validationErrors.success && (
          <div className="pi-message-container">
            <div className="pi-success-message">
              <Check size={16} />
              {validationErrors.success}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="pi-header">
          <div className="pi-header-left">
            <h1>{passedIndentId ? 'View Purchase Indent' : 'New Purchase Indent'}</h1>
            <p>{passedIndentId ? `Viewing indent ${formData.indentNumber}` : 'Capture material requirements and send to purchasing for approval.'}</p>
          </div>
          <div className="pi-header-right">
            <button
              type="button"
              className="pi-workflow-btn"
              onClick={() => setShowWorkflow(true)}
              title="View workflow status"
              aria-label="View workflow status"
            >
              <GitBranch size={18} />
            </button>
            {formData.workflowStage && (
              <div className="pi-workflow-badge" style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                backgroundColor: formData.workflowStage === 'QMS Init' ? '#eff6ff' : formData.workflowStage === 'Store Officer' ? '#fef3c7' : formData.workflowStage === 'QMS Verified' ? '#dcfce7' : '#f3f4f6',
                color: formData.workflowStage === 'QMS Init' ? '#1e40af' : formData.workflowStage === 'Store Officer' ? '#92400e' : formData.workflowStage === 'QMS Verified' ? '#166534' : '#374151',
                marginRight: '12px'
              }}>
                {formData.workflowStage}
              </div>
            )}
            <div className="pi-draft-status">
              {formData.status} • {formData.indentNumber || 'New'}
            </div>
          </div>
        </div>

        {/* Workflow Status Modal */}
        {showWorkflow && (
          <div className="pi-workflow-overlay" onClick={() => setShowWorkflow(false)}>
            <div className="pi-workflow-modal" onClick={(e) => e.stopPropagation()}>
              <div className="pi-workflow-header">
                <div>
                  <div className="pi-workflow-title">Workflow Status</div>
                  <div className="pi-workflow-subtitle">Indent {formData.indentNumber}</div>
                </div>
                <button
                  type="button"
                  className="pi-workflow-close"
                  onClick={() => setShowWorkflow(false)}
                  aria-label="Close workflow"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="pi-workflow-body">
                <div className="pi-workflow-timeline">
                  {workflowSteps.map((step, index) => {
                    const isCompleted = step.status === 'completed';
                    const isCurrent = step.status === 'current';
                    const isPending = step.status === 'pending';
                    return (
                      <div key={step.key} className={`pi-workflow-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}>
                        <div className="pi-workflow-marker">
                          <div className="pi-workflow-icon">
                            {isCompleted ? (
                              <Check size={12} strokeWidth={3} />
                            ) : isCurrent ? (
                              <div className="pi-current-dot" />
                            ) : (
                              <div className="pi-pending-dot" />
                            )}
                          </div>
                          {index !== workflowSteps.length - 1 && <div className="pi-workflow-line" />}
                        </div>
                        <div className="pi-workflow-content">
                          <div className="pi-workflow-step-header">
                            <div className="pi-workflow-step-title">{step.title}</div>
                            {isCurrent && <span className="pi-current-badge">Current Step</span>}
                          </div>
                          <div className="pi-workflow-step-subtitle">{step.subtitle}</div>
                          {step.date && (
                            <div className="pi-workflow-timestamp">{step.date}</div>
                          )}
                          {step.user && (
                            <div className="pi-workflow-user">
                              <div className="pi-user-avatar">
                                <User size={14} />
                              </div>
                              <span className="pi-user-name">{step.user}</span>
                            </div>
                          )}
                          {step.note && (
                            <div className="pi-workflow-note">{step.note}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="pi-form-content">
          {/* Indent Details Section */}
          <div className="pi-section">
            <h2 className="pi-section-title">Indent details</h2>
            <p className="pi-section-subtitle">Basic information used to identify and track this indent.</p>

            <div className="pi-form-grid">
              {/* Indent Number */}
              <div className="pi-form-field">
                <label className="pi-label">Indent number</label>
                <input
                  type="text"
                  value={formData.indentNumber}
                  readOnly
                  className="pi-input"
                  placeholder="PI-XXXX-XXX"
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
              </div>

              {/* Indent Date */}
              <div className="pi-form-field">
                <label className="pi-label">Indent date</label>
                <div className="pi-input-wrapper">
                  <input
                    type="date"
                    value={formData.indentDate}
                    onChange={(e) => setFormData({...formData, indentDate: e.target.value})}
                    className="pi-input pi-input-with-icon"
                  />
                  <Calendar size={16} className="pi-input-icon" />
                </div>
              </div>

              {/* Required By Date */}
              <div className="pi-form-field">
                <label className="pi-label">Required by date *</label>
                <div className="pi-input-wrapper">
                  <input
                    type="date"
                    required
                    value={formData.requiredByDate}
                    onChange={(e) => setFormData({...formData, requiredByDate: e.target.value})}
                    className="pi-input pi-input-with-icon"
                  />
                  <Calendar size={16} className="pi-input-icon" />
                </div>
              </div>
            </div>

            <div className="pi-form-grid">
              {/* Department */}
              <div className="pi-form-field">
                <label className="pi-label">Department *</label>
                <select
                  value={formData.department}
                  onChange={(e) => {
                    setFormData({...formData, department: e.target.value});
                    clearFieldError('department');
                  }}
                  className={`pi-select ${validationErrors.department ? 'pi-input-error' : ''}`}
                  required
                  disabled={isViewMode || user?.roleName === 'StoreOfficer'}
                >
                  <option value="">Choose department</option>
                  <option value="QMS">QMS</option>
                  <option value="production">Production</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="quality">Quality</option>
                  <option value="stores">Stores</option>
                  <option value="engineering">Engineering</option>
                </select>
                {validationErrors.department && (
                  <div className="pi-error-message">{validationErrors.department}</div>
                )}
              </div>

              {/* Requested By - Simple Text Input */}
              <div className="pi-form-field">
                <label className="pi-label">Requested by *</label>
                <input
                  type="text"
                  placeholder="Enter requester name"
                  value={formData.requestedBy}
                  onChange={(e) => {
                    setFormData({...formData, requestedBy: e.target.value});
                    clearFieldError('requestedBy');
                  }}
                  className={`pi-input ${validationErrors.requestedBy ? 'pi-input-error' : ''}`}
                  required
                  disabled={isViewMode}
                />
                {validationErrors.requestedBy && (
                  <div className="pi-error-message">{validationErrors.requestedBy}</div>
                )}
              </div>

              {/* Priority */}
              <div className="pi-form-field">
                <label className="pi-label">Priority</label>
                <div className="pi-priority-group">
                  {['Standard', 'High', 'Urgent'].map((priority) => (
                    <label key={priority} className="pi-priority-label">
                      <input
                        type="radio"
                        name="priority"
                        value={priority}
                        checked={formData.priority === priority}
                        onChange={(e) => setFormData({...formData, priority: e.target.value})}
                        disabled={isViewMode}
                      />
                      <span>{priority}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Materials Requested */}
          <div className="pi-section">
            <div className="pi-section-header">
              <div>
                <h2 className="pi-section-title">Materials requested</h2>
                <p className="pi-section-subtitle">List all raw materials or components to be purchased.</p>
                {validationErrors.materials && (
                  <div className="pi-error-message">{validationErrors.materials}</div>
                )}

              </div>
              <button onClick={handleAddMaterial} className="pi-btn pi-btn-add-material">
                <Plus size={16} />
                Add material
              </button>
            </div>

            {/* Materials Header */}
            <div className="pi-materials-header">
              <div className="pi-materials-count">{materials.length} materials</div>
              <div className="pi-materials-search">
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pi-input-search"
                />
              </div>
              <div className="pi-materials-toggles">

                <button 
                  onClick={() => setGroupBySupplier(!groupBySupplier)}
                  className={`pi-btn ${groupBySupplier ? 'pi-btn-primary' : 'pi-btn-filter'}`}
                >
                  {groupBySupplier ? 'Ungroup' : 'Group by Supplier'}
                </button>
              </div>
            </div>

            {/* Materials List */}
            <div className="pi-materials-list">
              {materials.length === 0 ? (
                <div style={{padding: '40px', textAlign: 'center', color: '#64748b'}}>
                  <p>No materials added yet. Click "Add material" to get started.</p>
                </div>
              ) : groupBySupplier ? (
                Object.entries(groupedMaterials).map(([supplier, supplierMaterials]) => (
                  <div key={supplier} className="pi-supplier-group">
                    <div className="pi-supplier-header">
                      <h4>{supplier}</h4>
                      <span>{supplierMaterials.length} materials</span>
                    </div>
                    {supplierMaterials.map((material, index) => 
                      renderMaterialCard(material, index)
                    )}
                  </div>
                ))
              ) : (
                filteredMaterials.map((material, index) => 
                  renderMaterialCard(material, index)
                )
              )}
            </div>


          </div>

          {/* Part & PO Reference */}
          <div className="pi-section">
            <div className="pi-section-header">
              <div>
                <h2 className="pi-section-title">Part & PO reference</h2>
                <p className="pi-section-subtitle">Link this indent to customer parts and existing purchase orders.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {formData.poFilePath ? (
                  <>
                    <button 
                      type="button"
                      onClick={handleViewPOFile}
                      className="pi-btn pi-btn-primary"
                    >
                      <Eye size={14} />
                      View PO File
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, poFilePath: null }));
                        fileInputRef.current?.click();
                      }}
                      className="pi-btn pi-btn-secondary"
                    >
                      <Upload size={14} />
                      Replace File
                    </button>
                  </>
                ) : (
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="pi-btn pi-btn-secondary"
                    disabled={uploadingFile}
                  >
                    <Upload size={14} />
                    {selectedPOFile ? `Selected: ${selectedPOFile.name.substring(0, 25)}...` : 'Upload PO File'}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handlePOFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  style={{ display: 'none' }}
                />
              </div>
            </div>
            {selectedPOFile && !formData.poFilePath && (
              <p style={{ fontSize: '12px', color: '#3b82f6', marginTop: '8px', marginBottom: '16px' }}>
                <FileText size={14} style={{ display: 'inline', marginRight: '4px' }} />
                File "{selectedPOFile.name}" selected. Click Submit to upload.
              </p>
            )}
            {formData.poFilePath && (
              <p style={{ fontSize: '12px', color: '#10b981', marginTop: '8px', marginBottom: '16px' }}>
                <FileText size={14} style={{ display: 'inline', marginRight: '4px' }} />
                PO file uploaded - Click "View PO File" button above to open
              </p>
            )}

            {/* Dynamic fields for each material */}
            {materials.length > 0 && materials.map((material, index) => (
              <div key={material.id} style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: '#3b82f6', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>{index + 1}</span>
                  {material.description || 'New Material'} {material.rawMaterial ? <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 'normal' }}>({material.rawMaterial})</span> : ''}
                </h4>

                <div className="pi-form-grid-2" style={{ marginBottom: '16px' }}>
                  <div className="pi-form-field">
                    <label className="pi-label">Customer part</label>
                    <input
                      type="text"
                      value={material.customerPart || ''}
                      onChange={(e) => handleMaterialChange(material.id, 'customerPart', e.target.value)}
                      className="pi-input"
                      placeholder="Enter customer part"
                      readOnly={isViewMode}
                    />
                  </div>
                  
                  <div className="pi-form-field">
                    <label className="pi-label">Purchase Number {(user?.roleName !== 'StoreOfficer' && user?.roleName !== 'QMS') && <span style={{fontSize: '12px', color: '#64748b'}}> (Store Officer or QMS will fill)</span>}</label>
                    <input
                      type="text"
                      value={material.poNumber || ''}
                      onChange={(e) => handleMaterialChange(material.id, 'poNumber', e.target.value)}
                      className="pi-input"
                      placeholder="Enter PO number"
                      readOnly={isViewMode || (user?.roleName !== 'StoreOfficer' && user?.roleName !== 'QMS')}
                    />
                  </div>
                </div>

                <div className="pi-form-grid-2" style={{ marginBottom: '16px' }}>
                  <div className="pi-form-field">
                    <label className="pi-label">PO Date {(user?.roleName !== 'StoreOfficer' && user?.roleName !== 'QMS') && <span style={{fontSize: '12px', color: '#64748b'}}> (Store Officer or QMS will fill)</span>}</label>
                    <input
                      type="date"
                      value={material.poDate || ''}
                      onChange={(e) => handleMaterialChange(material.id, 'poDate', e.target.value)}
                      className="pi-input"
                      placeholder="Select PO Date"
                      readOnly={isViewMode || (user?.roleName !== 'StoreOfficer' && user?.roleName !== 'QMS')}
                    />
                  </div>

                  <div className="pi-form-field">
                    <label className="pi-label">RM Cost</label>
                    <input
                      type="number"
                      value={material.rmCost || ''}
                      onChange={(e) => handleMaterialChange(material.id, 'rmCost', e.target.value)}
                      className="pi-input"
                      placeholder="Enter RM cost"
                      readOnly={isViewMode}
                    />
                  </div>
                </div>

                <div className="pi-form-grid">
                  <div className="pi-form-field">
                    <label className="pi-label">RM rate / kg</label>
                    <input
                      type="number"
                      value={material.rmRate || ''}
                      onChange={(e) => handleMaterialChange(material.id, 'rmRate', e.target.value)}
                      className="pi-input"
                      placeholder="Rate"
                      readOnly={isViewMode}
                    />
                  </div>

                  <div className="pi-form-field">
                    <label className="pi-label">No. of pieces / kg</label>
                    <input
                      type="number"
                      value={material.piecesPerKg || ''}
                      onChange={(e) => handleMaterialChange(material.id, 'piecesPerKg', e.target.value)}
                      className="pi-input"
                      placeholder="Pieces"
                      readOnly={isViewMode}
                    />
                  </div>

                  <div className="pi-form-field">
                    <label className="pi-label">RM%</label>
                    <input
                      type="text"
                      value={material.rmPercentage || ''}
                      onChange={(e) => handleMaterialChange(material.id, 'rmPercentage', e.target.value)}
                      className="pi-input"
                      placeholder="RM%"
                      readOnly={isViewMode}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="pi-footer">
            <div className="pi-document-code">Document code: SBP/PI/IB/02-00 | v1.0</div>
            <div className="pi-footer-actions">
              
              {user?.roleName === 'Accountant' ? (
                formData.workflowStage === 'Accountant' && (
                  <button 
                    onClick={() => handleSubmit('submit')}
                    className="pi-btn pi-btn-primary"
                    disabled={loading}
                  >
                    <Check size={16} />
                    Mark as Processed
                  </button>
                )
              ) : (
                <button 
                  onClick={() => handleSubmit('submit')}
                  className="pi-btn pi-btn-primary"
                  disabled={loading}
                >
                  <Send size={16} />
                  {user?.roleName === 'StoreOfficer' && passedIndentId ? 'Send to QMS for Verification' : 'Submit for approval'}
                </button>
              )}

              {currentIndentId && isDeleteAllowed && user?.roleName !== 'Accountant' && (
                <button
                  onClick={handleDeleteIndent}
                  className="pi-btn pi-btn-outline"
                  disabled={loading}
                  style={{ color: '#b91c1c', borderColor: '#fecaca' }}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      {modalState.show && (
        <div className="pi-modal-overlay" onClick={closeModal}>
          <div className="pi-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`pi-modal-header pi-modal-${modalState.type}`}>
              <h3>{modalState.title}</h3>
              <button onClick={closeModal} className="pi-modal-close">
                <X size={20} />
              </button>
            </div>
            <div className="pi-modal-body">
              <p>{modalState.message}</p>
            </div>
            <div className="pi-modal-footer">
              <button onClick={closeModal} className="pi-btn pi-btn-primary">
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewPurchaseIndent;