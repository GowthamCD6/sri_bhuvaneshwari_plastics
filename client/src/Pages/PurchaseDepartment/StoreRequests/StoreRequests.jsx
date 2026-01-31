import React, { useState, useMemo } from 'react';
import { Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import './StoreRequests.css';

const StoreRequests = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Sample data matching the screenshot
  const [requests, setRequests] = useState([
    {
      id: 'REQ-2024-089',
      material: 'Polypropylene Granules',
      code: 'RM-004-RED',
      specs: 'Color: Red',
      qtyNeeded: '500 kg',
      reason: 'Low stock alert in warehouse',
      location: 'Loc: WH-A12',
      requestDate: 'Oct 24, 2024',
      priority: 'Critical',
      status: 'pending'
    },
    {
      id: 'REQ-2024-092',
      material: 'Packaging Box Type B',
      code: 'PKG-BOX-B',
      specs: '20×20×10',
      qtyNeeded: '2000 Units',
      reason: 'Upcoming production demand',
      location: 'Order: PO-9921',
      requestDate: 'Oct 24, 2024',
      priority: 'High',
      status: 'pending'
    },
    {
      id: 'REQ-2024-095',
      material: 'Machine Oil (Hydraulic)',
      code: 'MNT-OIL-22',
      specs: '50L Drum',
      qtyNeeded: '50 Liters',
      reason: 'Quarterly maintenance',
      location: 'Dept: Production',
      requestDate: 'Oct 23, 2024',
      priority: 'Normal',
      status: 'pending'
    },
    {
      id: 'REQ-2024-085',
      material: 'Black Masterbatch',
      code: 'MB-BLK-01',
      specs: '',
      qtyNeeded: '100 kg',
      reason: 'Regular stock replenishment',
      location: '',
      requestDate: 'Oct 20, 2024',
      priority: 'Normal',
      status: 'processed'
    },
    {
      id: 'REQ-2024-078',
      material: 'HDPE Pellets',
      code: 'RM-HDPE-01',
      specs: 'Grade A',
      qtyNeeded: '800 kg',
      reason: 'Production batch requirement',
      location: 'Order: PO-9918',
      requestDate: 'Oct 18, 2024',
      priority: 'High',
      status: 'processed'
    },
    {
      id: 'REQ-2024-072',
      material: 'Lubricant Oil',
      code: 'MNT-LUB-05',
      specs: '20L Can',
      qtyNeeded: '30 Liters',
      reason: 'Machine maintenance schedule',
      location: 'Dept: Maintenance',
      requestDate: 'Oct 15, 2024',
      priority: 'Normal',
      status: 'processed'
    },
    {
      id: 'REQ-2024-068',
      material: 'Color Pigment Blue',
      code: 'PIG-BLU-02',
      specs: '',
      qtyNeeded: '25 kg',
      reason: 'Custom order requirement',
      location: 'Order: PO-9915',
      requestDate: 'Oct 12, 2024',
      priority: 'Critical',
      status: 'pending'
    },
    {
      id: 'REQ-2024-065',
      material: 'Stretch Film',
      code: 'PKG-STR-01',
      specs: '500mm width',
      qtyNeeded: '50 Rolls',
      reason: 'Packaging supplies low',
      location: 'Loc: WH-B03',
      requestDate: 'Oct 10, 2024',
      priority: 'Normal',
      status: 'pending'
    },
    {
      id: 'REQ-2024-060',
      material: 'PP Compound Natural',
      code: 'RM-PP-NAT',
      specs: '',
      qtyNeeded: '1200 kg',
      reason: 'Monthly stock requirement',
      location: '',
      requestDate: 'Oct 08, 2024',
      priority: 'High',
      status: 'processed'
    },
    {
      id: 'REQ-2024-055',
      material: 'Adhesive Tape',
      code: 'PKG-TAP-02',
      specs: '48mm × 100m',
      qtyNeeded: '200 Rolls',
      reason: 'Packaging material stock',
      location: 'Loc: WH-B05',
      requestDate: 'Oct 05, 2024',
      priority: 'Normal',
      status: 'processed'
    },
    {
      id: 'REQ-2024-050',
      material: 'ABS Granules White',
      code: 'RM-ABS-WHT',
      specs: 'High Impact',
      qtyNeeded: '600 kg',
      reason: 'Special order production',
      location: 'Order: PO-9910',
      requestDate: 'Oct 03, 2024',
      priority: 'Critical',
      status: 'pending'
    },
    {
      id: 'REQ-2024-045',
      material: 'Cleaning Solvent',
      code: 'MNT-CLN-01',
      specs: '',
      qtyNeeded: '100 Liters',
      reason: 'Mould cleaning requirement',
      location: 'Dept: Production',
      requestDate: 'Oct 01, 2024',
      priority: 'Normal',
      status: 'processed'
    }
  ]);

  const filters = [
    { id: 'all', label: 'All Requests' },
    { id: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'pending').length },
    { id: 'processed', label: 'Processed' },
    { id: 'critical', label: 'Critical' }
  ];

  // Filter and search logic
  const filteredRequests = useMemo(() => {
    let result = [...requests];

    // Apply filter
    if (activeFilter === 'pending') {
      result = result.filter(r => r.status === 'pending');
    } else if (activeFilter === 'processed') {
      result = result.filter(r => r.status === 'processed');
    } else if (activeFilter === 'critical') {
      result = result.filter(r => r.priority === 'Critical');
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.id.toLowerCase().includes(query) ||
        r.material.toLowerCase().includes(query) ||
        r.code.toLowerCase().includes(query) ||
        r.reason.toLowerCase().includes(query)
      );
    }

    return result;
  }, [requests, activeFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRequests(paginatedRequests.map(r => r.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSelectRequest = (id) => {
    setSelectedRequests(prev => 
      prev.includes(id) 
        ? prev.filter(r => r !== id)
        : [...prev, id]
    );
  };

  const handleCreateIndent = (requestId) => {
    setRequests(prev => prev.map(r => 
      r.id === requestId ? { ...r, status: 'processed' } : r
    ));
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'Critical': return 'priority-critical';
      case 'High': return 'priority-high';
      case 'Normal': return 'priority-normal';
      default: return 'priority-normal';
    }
  };

  return (
    <div className="sr-container">
      <div className="sr-content">
        {/* Filter Tabs and Search */}
        <div className="sr-toolbar">
          <div className="sr-filters">
            {filters.map(filter => (
              <button
                key={filter.id}
                className={`sr-filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
                onClick={() => { setActiveFilter(filter.id); setCurrentPage(1); }}
              >
                {filter.label}
                {filter.count !== undefined && (
                  <span className="sr-filter-count">({filter.count})</span>
                )}
              </button>
            ))}
          </div>
          <div className="sr-search">
            <Search size={16} className="sr-search-icon" />
            <input
              type="text"
              placeholder="Search by request ID, material..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="sr-table-container">
          <table className="sr-table">
            <thead>
              <tr>
                <th className="sr-th-checkbox">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedRequests.length === paginatedRequests.length && paginatedRequests.length > 0}
                  />
                </th>
                <th>Request ID</th>
                <th>Requested Material</th>
                <th>Qty Needed</th>
                <th>Reason & Details</th>
                <th>Request Date</th>
                <th>Priority</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRequests.map((request) => (
                <tr key={request.id} className={selectedRequests.includes(request.id) ? 'selected' : ''}>
                  <td className="sr-td-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedRequests.includes(request.id)}
                      onChange={() => handleSelectRequest(request.id)}
                    />
                  </td>
                  <td className="sr-td-id">{request.id}</td>
                  <td className="sr-td-material">
                    <div className="sr-material-name">{request.material}</div>
                    <div className="sr-material-code">
                      Code: {request.code}
                      {request.specs && ` | ${request.specs}`}
                    </div>
                  </td>
                  <td className="sr-td-qty">
                    <span className="sr-qty-value">{request.qtyNeeded}</span>
                  </td>
                  <td className="sr-td-reason">
                    <div className="sr-reason-text">{request.reason}</div>
                    {request.location && (
                      <div className="sr-reason-location">{request.location}</div>
                    )}
                  </td>
                  <td className="sr-td-date">{request.requestDate}</td>
                  <td className="sr-td-priority">
                    {request.status === 'processed' ? (
                      <span className="sr-status-badge status-processed">Processed</span>
                    ) : (
                      <span className={`sr-priority-badge ${getPriorityClass(request.priority)}`}>
                        {request.priority}
                      </span>
                    )}
                  </td>
                  <td className="sr-td-actions">
                    <div className="sr-actions">
                      {request.status === 'pending' ? (
                        <button 
                          className="sr-btn-create"
                          onClick={() => handleCreateIndent(request.id)}
                        >
                          Create Indent
                        </button>
                      ) : (
                        <button className="sr-btn-created" disabled>
                          Indent Created
                        </button>
                      )}
                      <button className="sr-btn-view">
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="sr-pagination">
          <span className="sr-pagination-info">
            Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length} requests
          </span>
          <div className="sr-pagination-controls">
            <button
              className="sr-page-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="sr-page-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreRequests;
