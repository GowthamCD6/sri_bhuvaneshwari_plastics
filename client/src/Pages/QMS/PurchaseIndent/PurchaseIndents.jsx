import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Calendar, X, Plus, Search, ExternalLink, Save, Send, Filter, Check, GitBranch, User } from 'lucide-react';
import './PurchaseIndents.css';
import { purchaseIndentService } from '../../../services/apiService';
import useAuthStore from '../../../store/authStore';

const NewPurchaseIndent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { indentId } = useParams();
  const { user } = useAuthStore();
  
  // Check if we're viewing/editing an existing indent OR coming from customer order
  const isViewMode = location.state?.isViewMode || false;
  const passedIndentId = location.state?.indentId || indentId;
  const fromCustomerOrder = location.state?.fromCustomerOrder || false;
  const orderData = location.state?.orderData || null;

  // State declarations - NO DUMMY DATA
  const [materials, setMaterials] = useState([]);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [formData, setFormData] = useState({
    department: 'stores',
    requestedBy: '',
    priority: 'Standard',
    indentNumber: '',
    indentDate: new Date().toISOString().split('T')[0],
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
    accountantNotes: ''
  });

  const [isEditingMaterial, setIsEditingMaterial] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStock, setShowStock] = useState(false);
  const [groupBySupplier, setGroupBySupplier] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-generate indent number on component mount if not editing existing
  useEffect(() => {
    if (!passedIndentId && !formData.indentNumber) {
      const autoIndentNumber = `PI-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      setFormData(prev => ({ ...prev, indentNumber: autoIndentNumber }));
    }
  }, [passedIndentId]);

  // Debug: Log user info on mount
  useEffect(() => {
    console.log('=== PURCHASE INDENT COMPONENT MOUNTED ===');
    console.log('Current user:', user);
    console.log('User roleName:', user?.roleName);
    console.log('Is view mode:', isViewMode);
    console.log('Passed indent ID:', passedIndentId);
  }, []);

  // Pre-fill form if coming from customer order
  useEffect(() => {
    if (fromCustomerOrder && orderData) {
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

      // Format dates to YYYY-MM-DD if they exist (without timezone conversion)
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        // If already in YYYY-MM-DD format, return as is
        if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return dateStr;
        }
        // Otherwise convert carefully to avoid timezone issues
        try {
          const date = new Date(dateStr);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        } catch (e) {
          return dateStr;
        }
      };

      setFormData(prev => ({
        ...prev,
        department: 'stores',
        indentNumber: orderData.indentId || prev.indentNumber,
        customerPart: orderData.indentId || orderData.orderId || '',
        customerOrderId: orderData.orderId, // Store numeric order_id
        requestedBy: orderData.customerName || '',
        indentDate: formatDate(orderData.indentDate) || prev.indentDate,
        requiredByDate: formatDate(earliestRequiredDate) || prev.requiredByDate,
        justification: `Purchase indent for customer order ${orderData.indentId || orderData.orderId}`,
      }));

      // Pre-fill materials from order items
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
        setMaterials(orderMaterials);
      }
    }
  }, [fromCustomerOrder, orderData]);

  // Dynamic workflow steps based on current workflow stage
  const workflowSteps = [
    {
      key: 'qms-init',
      title: 'QMS Initiated',
      subtitle: 'Quality team created indent',
      actor: 'QMS',
      user: formData.requestedBy || 'S. Chen (QMS)',
      date: formData.indentDate ? new Date(formData.indentDate).toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }) : null,
      status: formData.workflowStage === 'QMS Init' ? 'current' : 'completed'
    },
    {
      key: 'store-officer',
      title: 'Store Officer Review',
      subtitle: 'Stock and requirement verification',
      actor: 'Store Officer',
      user: ['Store Officer', 'QMS Verified', 'Admin', 'Accountant', 'Completed'].includes(formData.workflowStage) ? 'R. Kumar (Store)' : null,
      date: ['Store Officer', 'QMS Verified', 'Admin', 'Accountant', 'Completed'].includes(formData.workflowStage) ? 'Oct 24, 11:45 AM' : null,
      note: ['QMS Verified', 'Admin', 'Accountant', 'Completed'].includes(formData.workflowStage) ? '"Specs match production requirement. Approved."' : null,
      status: formData.workflowStage === 'Store Officer' ? 'current' : 
              formData.workflowStage === 'QMS Init' ? 'pending' : 'completed'
    },
    {
      key: 'qms-verified',
      title: 'QMS Verified',
      subtitle: 'Final quality verification',
      actor: 'QMS',
      user: ['Admin', 'Accountant', 'Completed'].includes(formData.workflowStage) ? 'QMS Team' : null,
      date: ['Admin', 'Accountant', 'Completed'].includes(formData.workflowStage) ? 'Oct 24, 02:15 PM' : null,
      status: formData.workflowStage === 'QMS Verified' ? 'current' : 
              ['QMS Init', 'Store Officer'].includes(formData.workflowStage) ? 'pending' : 'completed'
    },
    {
      key: 'admin',
      title: 'Admin Approval',
      subtitle: 'Pending final authorization',
      actor: 'Admin',
      user: ['Accountant', 'Completed'].includes(formData.workflowStage) ? 'Admin' : null,
      date: ['Accountant', 'Completed'].includes(formData.workflowStage) ? 'Oct 24, 04:30 PM' : null,
      status: formData.workflowStage === 'Admin' ? 'current' : 
              ['QMS Init', 'Store Officer', 'QMS Verified'].includes(formData.workflowStage) ? 'pending' : 'completed'
    },
    {
      key: 'accountant',
      title: 'Accountant Processing',
      subtitle: 'Purchase order and billing process',
      actor: 'Accountant',
      user: formData.workflowStage === 'Completed' ? 'Accountant' : null,
      date: formData.workflowStage === 'Completed' ? 'Oct 25, 09:00 AM' : null,
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
          
          // Format dates properly (handle both date strings and ISO timestamps)
          const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          };
          
          setFormData({
            department: indent.department || 'stores',
            requestedBy: indent.requested_by_name || indent.customer_name || '',
            priority: indent.priority || 'Standard',
            indentNumber: indent.indent_number || '',
            indentDate: indent.indent_date?.split('T')[0] || indent.request_date?.split('T')[0] || new Date().toISOString().split('T')[0],
            requiredByDate: indent.required_by_date?.split('T')[0] || '',
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
            adminNotes: indent.admin_notes || ''
          });
          
          console.log('=== FORM DATA AFTER SET ===');
          console.log('poNumber:', indent.po_number || '');
          console.log('poReference:', indent.po_reference || '');

          if (indent.materials && indent.materials.length > 0) {
            setMaterials(indent.materials.map(m => ({
              id: m.indent_material_id,
              description: m.material_description,
              preferredSupplier: m.preferred_supplier || '',
              requiredQuantity: m.quantity,
              requiredDate: indent.required_by_date?.split('T')[0] || '',
              onHand: m.current_stock || '0',
              order: m.required_stock || '',
              status: 'pending',
              uom: m.unit_of_measurement || 'kg',
              isEditing: false
            })));
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
    setMaterials(materials.map(m => 
      m.id === id ? { ...m, isEditing: true } : m
    ));
  };

  // Handle save material edits
  const handleSaveMaterial = (id, updatedFields) => {
    setMaterials(materials.map(m => 
      m.id === id ? { ...m, ...updatedFields, isEditing: false } : m
    ));
    setIsEditingMaterial(null);
  };

  // Handle material field change
  const handleMaterialChange = (id, field, value) => {
    setMaterials(materials.map(m => 
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

  const normalizePriority = (value) => {
    const normalized = String(value || '').toLowerCase();
    if (normalized === 'high') return 'High';
    if (normalized === 'urgent') return 'Urgent';
    if (normalized === 'standard') return 'Standard';
    // Map legacy values to Standard
    if (normalized === 'medium' || normalized === 'low' || normalized === 'normal') return 'Standard';
    return 'Standard';
  };

  // Handle form submission
  const handleSubmit = async (action) => {
    try {
      setLoading(true);
      setError(null);
      
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
        priority: normalizePriority(formData.priority),
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
      if (passedIndentId) {
        // Update existing indent
        console.log('Updating existing indent:', passedIndentId);
        
        // If submitting to next stage (not just saving draft), use sendToNextStage
        if (action === 'submit') {
          console.log('Submitting to next workflow stage - using sendToNextStage');
          response = await purchaseIndentService.sendToNextStage(passedIndentId, {
            poNumber: formData.poNumber || null,
            poReference: formData.poReference || null,
            orderQuantity: formData.orderQuantity || null,
            rmCost: formData.rmCost || null,
            rmRate: formData.rmRate || null,
            piecesPerKg: formData.piecesPerKg || null,
            rmPercentage: formData.rmPercentage || null,
            comments: user?.roleName === 'StoreOfficer' 
              ? 'PO details filled by Store Officer' 
              : 'Sent for Store Officer review'
          });
        } else {
          // Just saving as draft - use regular update
          console.log('Saving as draft - using updateIndentStatus');
          response = await purchaseIndentService.updateIndentStatus(passedIndentId, {
            status: status,
            workflowStage: workflowStage,
            poNumber: formData.poNumber || null,
            poReference: formData.poReference || null,
            orderQuantity: formData.orderQuantity || null,
            rmCost: formData.rmCost || null,
            rmRate: formData.rmRate || null,
            piecesPerKg: formData.piecesPerKg || null,
            rmPercentage: formData.rmPercentage || null
          });
        }
      } else {
        // Create new indent
        console.log('Creating new indent');
        response = await purchaseIndentService.createIndent(indentData);
      }

      console.log('=== API RESPONSE ===');
      console.log('Success:', response.success);
      console.log('Response data:', response.data);
      console.log('Full response:', JSON.stringify(response, null, 2));

      if (response.success) {
        setValidationErrors({ 
          success: action === 'submit' 
            ? (user?.roleName === 'StoreOfficer' ? 'Sent to QMS for verification!' : 'Purchase indent submitted for approval!')
            : 'Draft saved successfully!' 
        });
        
        setTimeout(() => {
          if (action === 'submit') {
            if (user?.roleName === 'StoreOfficer') {
              navigate('/store-verify-indents');
            } else if (user?.roleName === 'QMS') {
              navigate('/qms-customer-orders');
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
                  Required on {new Date(material.requiredDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
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
                  {['Low', 'Medium', 'High', 'Urgent'].map((priority) => (
                    <label key={priority} className="pi-priority-label">
                      <input
                        type="radio"
                        name="priority"
                        value={priority}
                        checked={formData.priority === priority}
                        onChange={(e) => setFormData({...formData, priority: e.target.value})}
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
              {groupBySupplier ? (
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
              <button 
                onClick={() => alert('Linking PO...')}
                className="pi-btn pi-btn-secondary"
              >
                <ExternalLink size={14} />
                Link PO
              </button>
            </div>

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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPurchaseIndent;