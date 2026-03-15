import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Calendar, X, Plus, Search, ExternalLink, Save, Send, Filter, Check, GitBranch, User, Upload, FileText, Eye, Trash2 } from 'lucide-react';
import './PurchaseIndents.css';
import { purchaseIndentService } from '../../../services/apiService';
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
  
  console.log('=== NAVIGATION STATE CHECK ===');
  console.log('location.state:', location.state);
  console.log('passedIndentId:', passedIndentId);
  console.log('fromCustomerOrder:', fromCustomerOrder);
  console.log('orderData:', orderData);

  // State declarations - NO DUMMY DATA
  const [materials, setMaterials] = useState([]);
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
    poReference: '',
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
      poReference: formData.poReference,
      orderQuantity: formData.orderQuantity,
      rmCost: formData.rmCost,
      rmRate: formData.rmRate,
      piecesPerKg: formData.piecesPerKg,
      rmPercentage: formData.rmPercentage,
      poFilePath: formData.poFilePath,
      materials: materials.map((m) => ({
        description: m.description,
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
      console.error('Delete indent error:', deleteError);
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
    console.log('=== PURCHASE INDENT COMPONENT MOUNTED ===');
    console.log('Current user:', user);
    console.log('User roleName:', user?.roleName);
    console.log('Is view mode:', isViewMode);
    console.log('Passed indent ID:', passedIndentId);
  }, []);

  // Debug: Track formData.poFilePath changes
  useEffect(() => {
    console.log('=== FORM DATA PO FILE PATH CHANGED ===');
    console.log('formData.poFilePath:', formData.poFilePath);
    console.log('Should show View button:', !!formData.poFilePath);
  }, [formData.poFilePath]);

  // Debug: Track workflow stage changes
  useEffect(() => {
    console.log('=== WORKFLOW STAGE CHANGED ===');
    console.log('formData.workflowStage:', formData.workflowStage);
  }, [formData.workflowStage]);

  // Pre-fill form if coming from customer order (ONLY for new indents, not when viewing existing)
  useEffect(() => {
    // CRITICAL: Only run if explicitly coming from customer order AND no indent ID exists
    // This prevents overwriting materials when viewing existing indents
    if (fromCustomerOrder && orderData && !passedIndentId && !createdIndentId && !indentDataLoaded) {
      console.log('=== PURCHASE INDENT: Receiving customer order data ===');
      console.log('Order Data:', orderData);
      console.log('Order Items:', orderData.orderItems);
      console.log('Indent Date:', orderData.indentDate);
      console.log('Indent ID:', orderData.indentId);
      
      // Get earliest required_by_date from order items
      let earliestRequiredDate = '';
      if (orderData.orderItems && orderData.orderItems.length > 0) {
        const dates = orderData.orderItems
          .map(item => item.required_by_date || item.required_date)
          .filter(date => date);
        console.log('Extracted dates from items:', dates);
        if (dates.length > 0) {
          earliestRequiredDate = dates.sort()[0];
        }
      }

      console.log('Setting form data with:');
      console.log('- indentNumber:', orderData.indentId);
      console.log('- indentDate:', orderData.indentDate);
      console.log('- requiredByDate:', earliestRequiredDate);
      console.log('- requestedBy:', orderData.customerName);

      setFormData(prev => ({
        ...prev,
        department: 'stores',
        indentNumber: orderData.indentId || prev.indentNumber,
        customerPart: orderData.indentId || orderData.orderId || '',
        customerOrderId: orderData.orderId, // Store numeric order_id
        requestedBy: orderData.customerName || '',
        indentDate: toDateInputValue(orderData.indentDate) || prev.indentDate,
        requiredByDate: toDateInputValue(earliestRequiredDate) || prev.requiredByDate,
        justification: `Purchase indent for customer order ${orderData.indentId || orderData.orderId}`,
      }));

      // Pre-fill materials from order items ONLY for new indents
      if (orderData.orderItems && orderData.orderItems.length > 0) {
        const orderMaterials = orderData.orderItems.map((item, idx) => ({
          id: Date.now() + idx,
          description: item.component_name || item.component || '',
          preferredSupplier: item.preferred_supplier || '',
          requiredQuantity: item.quantity || '',
          requiredDate: item.required_by_date || item.required_date || '',
          onHand: '0',
          order: item.quantity || '',
          status: 'pending',
          uom: item.unit || item.uom || 'kg',
          isEditing: false
        }));
        console.log('Setting materials from customer order (NEW indent only):', orderMaterials);
        setMaterials(orderMaterials);
      } else {
        console.log('No order items to set as materials');
      }
    } else if (passedIndentId || createdIndentId) {
      console.log('⚠️ SKIPPING customer order data - viewing existing indent ID:', passedIndentId || createdIndentId);
    }
  }, [fromCustomerOrder, orderData, passedIndentId, createdIndentId, indentDataLoaded]);

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
      if (!passedIndentId) return;

      try {
        setLoading(true);
        const token = useAuthStore.getState().token;
        if (!token) {
          setError('No authentication token found');
          return;
        }

        const response = await purchaseIndentService.getIndentById(passedIndentId);
        
        if (response.success && response.data) {
          const indent = response.data;
          
          console.log('=== FETCHED INDENT DATA ===');
          console.log('Full indent:', indent);
          console.log('PO Number from DB:', indent.po_number);
          console.log('PO Reference from DB:', indent.po_reference);
          
          setFormData({
            department: indent.department || 'stores',
            requestedBy: indent.customer_name || indent.requested_by_name || '',
            priority: indent.priority || 'Standard',
            indentNumber: indent.indent_number || '',
            indentDate: toDateInputValue(indent.indent_date || indent.request_date) || getTodayDate(),
            requiredByDate: toDateInputValue(indent.required_by_date) || '',
            justification: indent.justification || '',
            customerPart: indent.customer_order_indent_id || indent.customer_order_id || '',
            customerOrderId: indent.customer_order_id || null,
            orderQuantity: indent.order_quantity || '',
            poNumber: indent.po_number || '',
            poReference: indent.po_reference || '',
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
          
          console.log('=== FORM DATA AFTER SET ===');
          console.log('Workflow Stage:', indent.workflow_stage || 'QMS Init');
          console.log('poNumber:', indent.po_number || '(empty)');
          console.log('poReference:', indent.po_reference || '(empty)');
          console.log('poFilePath from DB:', resolvePoFilePath(indent) || '(no file)');
          console.log('Store Officer Notes:', indent.store_officer_notes || '(none)');
          console.log('QMS Notes:', indent.qms_notes || '(none)');
          console.log('Admin Notes:', indent.admin_notes || '(none)');
          console.log('Indent Date from DB:', indent.indent_date || indent.request_date);
          console.log('Required By Date from DB:', indent.required_by_date);

          console.log('Materials from indent:', indent.materials);
          if (indent.materials && indent.materials.length > 0) {
            const mappedMaterials = indent.materials.map(m => ({
              id: m.indent_material_id,
              description: m.material_description,
              preferredSupplier: m.preferred_supplier || '',
              requiredQuantity: m.quantity,
              requiredDate: toDateInputValue(indent.required_by_date) || '',
              onHand: m.current_stock || '0',
              order: m.required_stock || '',
              status: 'pending',
              uom: m.unit_of_measurement || 'kg',
              isEditing: false
            }));
            console.log('✅ FETCH INDENT: Setting', mappedMaterials.length, 'materials');
            console.log('Material descriptions:', mappedMaterials.map(m => m.description));
            console.log('Full materials data:', mappedMaterials);
            setMaterials(mappedMaterials);
            setIndentDataLoaded(true);
          } else {
            console.log('⚠️ No materials found in indent or materials array is empty');
            console.log('indent.materials value:', indent.materials);
            setMaterials([]);
            setIndentDataLoaded(true);
          }
        }
      } catch (err) {
        console.error('Error fetching indent:', err);
        setError('Failed to load purchase indent');
      } finally {
        setLoading(false);
      }
    };

    fetchIndent();
  }, [passedIndentId]);

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
      preferredSupplier: '',
      requiredQuantity: '',
      requiredDate: '',
      onHand: '0',
      order: '',
      status: 'pending',
      uom: 'kg',
      isEditing: true
    };
    setMaterials([...materials, newMaterial]);
    setIsEditingMaterial(newMaterial.id);    clearFieldError('materials');
    };

  // Handle remove material
  const handleRemoveMaterial = (id) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  // Handle edit material
  const handleEditMaterial = (id) => {
    setIsEditingMaterial(id);
    setMaterials(prevMaterials => prevMaterials.map(m => 
      m.id === id ? { ...m, isEditing: true } : m
    ));
  };

  // Handle save material edits
  const handleSaveMaterial = (id, updatedFields) => {
    setMaterials(prevMaterials => prevMaterials.map(m => 
      m.id === id ? { ...m, ...updatedFields, isEditing: false } : m
    ));
    setIsEditingMaterial(null);
  };

  // Handle material field change
  const handleMaterialChange = (id, field, value) => {
    setMaterials(prevMaterials => prevMaterials.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
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

    console.log('Opening file URL:', fileUrl);
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

      const token = useAuthStore.getState().token;
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }

      // Generate indent number if not exists - use timestamp for uniqueness
      const indentNumber = formData.indentNumber || `PI-${new Date().getFullYear()}-${Date.now()}`;

      // Determine workflow based on role and action
      let workflowStage = 'QMS Init';
      let status = 'Draft';

      console.log('User role:', user?.roleName);
      console.log('Action:', action);
      console.log('passedIndentId:', passedIndentId);

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
        poReference: formData.poReference || null,
        orderQuantity: formData.orderQuantity || null,
        rmCost: formData.rmCost || null,
        rmRate: formData.rmRate || null,
        piecesPerKg: formData.piecesPerKg || null,
        rmPercentage: formData.rmPercentage || null,
        materials: materials.map(m => ({
          description: m.description,
          quantity: m.requiredQuantity,
          unit: m.uom || 'kg',
          currentStock: m.onHand || '0',
          requiredStock: m.order || m.requiredQuantity,
          preferredSupplier: m.preferredSupplier || '',
          estimatedCost: null,
          specifications: null
        }))
      };

      console.log('Submitting indent data:', indentData);
      console.log('Materials count:', materials.length);
      console.log('Action:', action, 'Workflow Stage:', workflowStage, 'Status:', status);
      console.log('Full indent data being sent:', JSON.stringify(indentData, null, 2));

      let response;
      let finalIndentId = createdIndentId || passedIndentId;
      
      // ALWAYS check if indent with this number exists (resubmission should overwrite)
      if (!finalIndentId && indentNumber) {
        console.log('Checking for existing indent with number:', indentNumber);
        try {
          const checkResponse = await purchaseIndentService.getAllIndents({});
          const existingIndent = resolveIndentArray(checkResponse).find(i => i.indent_number === indentNumber);
          
          if (existingIndent?.indent_id) {
            console.log('Found existing indent - will overwrite ID:', existingIndent.indent_id);
            finalIndentId = existingIndent.indent_id;
            setCreatedIndentId(existingIndent.indent_id);
            if (!formData.indentNumber) {
              setFormData(prev => ({ ...prev, indentNumber: indentNumber }));
            }
          }
        } catch (checkError) {
          console.log('Could not check for existing indent:', checkError.message);
        }
      }
      
      if (finalIndentId) {
        // Update existing indent (including resubmissions)
        console.log('Updating existing indent:', finalIndentId);
        
        // If submitting to next stage (not just saving draft), use sendToNextStage
        if (action === 'submit') {
          console.log('Submitting to next workflow stage - using sendToNextStage');
          response = await purchaseIndentService.sendToNextStage(finalIndentId, {
            poNumber: formData.poNumber || null,
            poReference: formData.poReference || null,
            orderQuantity: formData.orderQuantity || null,
            rmCost: formData.rmCost || null,
            rmRate: formData.rmRate || null,
            piecesPerKg: formData.piecesPerKg || null,
            rmPercentage: formData.rmPercentage || null,
            materials: materials.map(m => ({
              description: m.description,
              quantity: m.requiredQuantity,
              unit: m.uom || 'kg',
              currentStock: m.onHand || '0',
              requiredStock: m.order || m.requiredQuantity,
              preferredSupplier: m.preferredSupplier || ''
            })),
            comments: user?.roleName === 'StoreOfficer' 
              ? 'PO details filled by Store Officer' 
              : 'Sent for Store Officer review'
          });
        } else {
          // Just saving as draft - use regular update
          console.log('Saving as draft - using updateIndentStatus');
          response = await purchaseIndentService.updateIndentStatus(finalIndentId, {
            status: status,
            workflowStage: workflowStage,
            poNumber: formData.poNumber || null,
            poReference: formData.poReference || null,
            orderQuantity: formData.orderQuantity || null,
            rmCost: formData.rmCost || null,
            rmRate: formData.rmRate || null,
            piecesPerKg: formData.piecesPerKg || null,
            rmPercentage: formData.rmPercentage || null,
            materials: materials.map(m => ({
              description: m.description,
              quantity: m.requiredQuantity,
              unit: m.uom || 'kg',
              currentStock: m.onHand || '0',
              requiredStock: m.order || m.requiredQuantity,
              preferredSupplier: m.preferredSupplier || ''
            }))
          });
        }
      } else {
        // No existing indent found - create new one
        console.log('Creating new indent');
        try {
          response = await purchaseIndentService.createIndent(indentData);
          
          // Store the created indent ID for subsequent operations
          if (response.success && response.data?.indent_id) {
            setCreatedIndentId(response.data.indent_id);
            console.log('Stored created indent ID:', response.data.indent_id);
          }
        } catch (createError) {
          // If creation fails due to duplicate, fetch and update instead
          if (createError.message?.includes('already exists')) {
            console.log('Creation failed - indent exists. Fetching and updating...');
            const allIndents = await purchaseIndentService.getAllIndents({});
            const existingIndent = resolveIndentArray(allIndents).find(i => i.indent_number === indentNumber);
            
            if (existingIndent?.indent_id) {
              console.log('Found indent ID:', existingIndent.indent_id, '- Overwriting');
              setCreatedIndentId(existingIndent.indent_id);
              finalIndentId = existingIndent.indent_id;
              
              if (action === 'submit') {
                response = await purchaseIndentService.sendToNextStage(finalIndentId, {
                  poNumber: formData.poNumber || null,
                  poReference: formData.poReference || null,
                  orderQuantity: formData.orderQuantity || null,
                  rmCost: formData.rmCost || null,
                  rmRate: formData.rmRate || null,
                  piecesPerKg: formData.piecesPerKg || null,
                  rmPercentage: formData.rmPercentage || null,
                  materials: materials.map(m => ({
                    description: m.description,
                    quantity: m.requiredQuantity,
                    unit: m.uom || 'kg',
                    currentStock: m.onHand || '0',
                    requiredStock: m.order || m.requiredQuantity,
                    preferredSupplier: m.preferredSupplier || ''
                  })),
                  comments: 'Resubmitted application'
                });
              } else {
                response = await purchaseIndentService.updateIndentStatus(finalIndentId, {
                  status: status,
                  workflowStage: workflowStage,
                  poNumber: formData.poNumber || null,
                  poReference: formData.poReference || null,
                  orderQuantity: formData.orderQuantity || null,
                  rmCost: formData.rmCost || null,
                  rmRate: formData.rmRate || null,
                  piecesPerKg: formData.piecesPerKg || null,
                  rmPercentage: formData.rmPercentage || null,
                  materials: materials.map(m => ({
                    description: m.description,
                    quantity: m.requiredQuantity,
                    unit: m.uom || 'kg',
                    currentStock: m.onHand || '0',
                    requiredStock: m.order || m.requiredQuantity,
                    preferredSupplier: m.preferredSupplier || ''
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

      console.log('=== API RESPONSE ===');
      console.log('Success:', response.success);
      console.log('Response data:', response.data);
      console.log('Full response:', JSON.stringify(response, null, 2));

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
            console.log('===== FILE UPLOAD STARTING =====');
            console.log('Uploading PO file for indent:', savedIndentId);
            console.log('Selected file:', selectedPOFile.name);
            const uploadResponse = await purchaseIndentService.uploadPOFile(savedIndentId, selectedPOFile);
            console.log('Upload response:', uploadResponse);
            if (uploadResponse.success) {
              console.log('PO file uploaded successfully!');
              console.log('Response data:', uploadResponse.data);
              // Update formData with the actual file path from server
              const actualFilePath = resolvePoFilePath(uploadResponse.data);
              console.log('Extracted file path:', actualFilePath);
              setFormData(prev => ({ 
                ...prev, 
                poFilePath: actualFilePath 
              }));
              setSelectedPOFile(null); // Clear file selection after upload
              console.log('===== FILE UPLOAD COMPLETE =====');
              console.log('formData.poFilePath should now be:', actualFilePath);
            } else {
              console.error('Upload failed - response not successful:', uploadResponse);
            }
          } catch (uploadError) {
            console.error('===== FILE UPLOAD ERROR =====');
            console.error('Failed to upload PO file:', uploadError);
            poUploadFailed = true;
            poUploadErrorMessage = uploadError.message || 'Failed to upload PO file.';
          }
        } else {
          console.log('Skipping file upload - selectedPOFile:', !!selectedPOFile, 'savedIndentId:', savedIndentId);
        }
        
        // Refetch the indent data after any submission to get updated workflow, materials, and file path
        if (savedIndentId) {
          try {
            console.log('Refreshing indent data after submission...');
            const refreshResponse = await purchaseIndentService.getIndentById(savedIndentId);
            if (refreshResponse.success && refreshResponse.data) {
              const indent = refreshResponse.data;
              console.log('Refreshed indent data:', indent);
              
              // Update formData with latest data
              setFormData(prev => ({ 
                ...prev,
                workflowStage: indent.workflow_stage || prev.workflowStage,
                poFilePath: resolvePoFilePath(indent) || prev.poFilePath,
                poNumber: indent.po_number || prev.poNumber,
                poReference: indent.po_reference || prev.poReference
              }));
              
              // Update materials if present
              if (indent.materials && indent.materials.length > 0) {
                const mappedMaterials = indent.materials.map(m => ({
                  id: m.indent_material_id,
                  description: m.material_description,
                  preferredSupplier: m.preferred_supplier || '',
                  requiredQuantity: m.quantity,
                  requiredDate: toDateInputValue(indent.required_by_date) || '',
                  onHand: m.current_stock || '0',
                  order: m.required_stock || '',
                  status: 'pending',
                  uom: m.unit_of_measurement || 'kg',
                  isEditing: false
                }));
                console.log('✅ Refresh: Setting', mappedMaterials.length, 'materials:', mappedMaterials.map(m => m.description));
                setMaterials(mappedMaterials);
              } else {
                console.log('⚠️ Refresh: No materials in response');
              }
            }
          } catch (refreshError) {
            console.log('Could not refresh indent data:', refreshError.message);
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
      console.error('Submit error:', err);
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
    material.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.preferredSupplier.toLowerCase().includes(searchQuery.toLowerCase())
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
    console.log(`🎨 Rendering material card ${index + 1}:`, material.description, '| isEditing:', material.isEditing);
    if (material.isEditing) {
      console.log('  ↳ Rendering EDITING mode');
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
            <div className="pi-material-column">
              <div className="pi-material-label">Stock & order</div>
              <div className="pi-material-stock-edit">
                <input
                  type="text"
                  value={material.onHand}
                  onChange={(e) => handleMaterialChange(material.id, 'onHand', e.target.value)}
                  className="pi-input-small"
                  placeholder="On hand"
                />
                <span className="pi-material-bullet">•</span>
                <input
                  type="text"
                  value={material.order}
                  onChange={(e) => handleMaterialChange(material.id, 'order', e.target.value)}
                  className="pi-input-small"
                  placeholder="Order"
                />
              </div>
            </div>
          </div>
          <div className="pi-material-actions">
            <button 
              onClick={() => handleSaveMaterial(material.id, material)}
              className="pi-btn pi-btn-primary"
            >
              <Check size={14} />
              Save
            </button>
            <button 
              onClick={() => handleRemoveMaterial(material.id)}
              className="pi-btn pi-btn-outline"
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        </div>
      );
    }

    console.log('  ↳ Rendering DISPLAY mode');
    return (
      <div key={material.id} className="pi-material-card">
        <div className="pi-material-number">{index + 1}</div>
        <div className="pi-material-content">
          <div className="pi-material-column">
            <div className="pi-material-label">Material description</div>
            <div className="pi-material-value">{material.description}</div>
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
          <div className="pi-material-column">
            <div className="pi-material-label">Stock & order</div>
            <div className="pi-material-value-normal">
              {showStock ? (
                <div className="pi-stock-info">
                  <div className="pi-stock-item">
                    <span className="pi-stock-label">On hand:</span>
                    <span className="pi-stock-value">{material.onHand} {material.uom}</span>
                  </div>
                  <div className="pi-stock-separator">·</div>
                  <div className="pi-stock-item">
                    <span className="pi-stock-label">Order:</span>
                    <span className="pi-stock-value">{material.order} {material.uom}</span>
                  </div>
                </div>
              ) : (
                <div className="pi-stock-item">
                  <span className="pi-stock-label">Order:</span>
                  <span className="pi-stock-value">{material.order} {material.uom}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="pi-material-actions">
          <button 
            onClick={() => handleEditMaterial(material.id)}
            className="pi-btn pi-btn-action"
          >
            Edit
          </button>
          <button 
            onClick={() => handleRemoveMaterial(material.id)}
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
                <div className="pi-total-order">
                  Total Order Quantity: {calculateTotalOrder()} units
                </div>
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
                  onClick={() => setShowStock(!showStock)}
                  className={`pi-btn ${showStock ? 'pi-btn-primary' : 'pi-btn-filter'}`}
                >
                  <Filter size={14} />
                  {showStock ? 'Hide Stock' : 'Show Stock'}
                </button>
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
              {console.log('🔍 RENDERING MATERIALS LIST:', {
                materialsLength: materials.length,
                filteredLength: filteredMaterials.length,
                groupBySupplier,
                searchQuery,
                userRole: user?.roleName,
                isViewMode,
                passedIndentId,
                materialsData: materials.map(m => ({ id: m.id, desc: m.description, isEditing: m.isEditing }))
              })}
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

            <div className="pi-materials-footer">
              <span className="pi-materials-footer-text">
                Materials added: {materials.length} | Total items: {calculateTotalOrder()}
              </span>
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

            <div className="pi-form-grid-2">
              {/* Customer Part */}
              <div className="pi-form-field">
                <label className="pi-label">Customer part</label>
                <div className="pi-input-wrapper">
                  <input
                    type="text"
                    placeholder="Search and select part"
                    value={formData.customerPart}
                    onChange={(e) => setFormData({...formData, customerPart: e.target.value})}
                    className="pi-input pi-input-with-icon"
                  />
                  <Search size={16} className="pi-input-icon" />
                </div>
              </div>

              {/* Order Quantity */}
              <div className="pi-form-field">
                <label className="pi-label">Order quantity</label>
                <input
                  type="number"
                  placeholder="Enter quantity"
                  value={formData.orderQuantity}
                  onChange={(e) => setFormData({...formData, orderQuantity: e.target.value})}
                  className="pi-input"
                />
              </div>
            </div>

            <div className="pi-form-grid-2">
              {/* Purchase Number */}
              <div className="pi-form-field">
                <label className="pi-label">
                  Purchase number
                  {user?.roleName !== 'StoreOfficer' && <span style={{fontSize: '12px', color: '#64748b'}}> (Store Officer will fill)</span>}
                </label>
                <input
                  type="text"
                  placeholder="Enter purchase number (optional)"
                  value={formData.poNumber}
                  onChange={(e) => setFormData({...formData, poNumber: e.target.value})}
                  className="pi-input"
                  readOnly={user?.roleName !== 'StoreOfficer'}
                />
              </div>

              {/* PO Reference */}
              <div className="pi-form-field">
                <label className="pi-label">
                  PO Reference
                  {user?.roleName !== 'StoreOfficer' && <span style={{fontSize: '12px', color: '#64748b'}}> (Store Officer will fill)</span>}
                </label>
                <input
                  type="text"
                  placeholder="Enter PO reference"
                  value={formData.poReference}
                  onChange={(e) => setFormData({...formData, poReference: e.target.value})}
                  className="pi-input"
                  readOnly={user?.roleName !== 'StoreOfficer'}
                />
              </div>
            </div>

            <div className="pi-form-grid-2">
              {/* RM Cost */}
              <div className="pi-form-field">
                <label className="pi-label">RM cost</label>
                <input
                  type="number"
                  placeholder="Enter raw material cost"
                  value={formData.rmCost || ''}
                  onChange={(e) => setFormData({...formData, rmCost: e.target.value})}
                  className="pi-input"
                />
              </div>
            </div>

            <div className="pi-form-grid">
              {/* RM Rate */}
              <div className="pi-form-field">
                <label className="pi-label">RM rate / kg</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter rate"
                  value={formData.rmRate}
                  onChange={(e) => setFormData({...formData, rmRate: e.target.value})}
                  className="pi-input"
                />
              </div>

              {/* No. of Pieces / kg */}
              <div className="pi-form-field">
                <label className="pi-label">No. of pieces / kg</label>
                <input
                  type="number"
                  placeholder="Enter pieces per kg"
                  value={formData.piecesPerKg}
                  onChange={(e) => setFormData({...formData, piecesPerKg: e.target.value})}
                  className="pi-input"
                />
              </div>

              {/* RM% */}
              <div className="pi-form-field">
                <label className="pi-label">RM%</label>
                <input
                  type="number"
                  placeholder="Enter RM percentage"
                  value={formData.rmPercentage}
                  onChange={(e) => setFormData({...formData, rmPercentage: e.target.value})}
                  className="pi-input"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pi-footer">
            <div className="pi-document-code">Document code: SBP/PI/IB/02-00 | v1.0</div>
            <div className="pi-footer-actions">
              <button 
                onClick={() => handleSubmit('save')}
                className="pi-btn pi-btn-outline"
                disabled={loading}
              >
                <Save size={16} />
                Save draft
              </button>
              <button 
                onClick={() => handleSubmit('submit')}
                className="pi-btn pi-btn-primary"
                disabled={loading}
              >
                <Send size={16} />
                {user?.roleName === 'StoreOfficer' && passedIndentId ? 'Send to QMS for Verification' : 'Submit for approval'}
              </button>
              {currentIndentId && isDeleteAllowed && (
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