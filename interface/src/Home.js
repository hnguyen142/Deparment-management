import React, { Component } from 'react';
import { variables } from './Variables.js';

export default class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      departments: [],
      employees: [],
      loading: true,
      showDetailModal: false,
      modalType: '',
      modalData: [],
      stats: {
        totalDepartments: 0,
        totalEmployees: 0,
        recentJoins: 0,
        averageEmployeesPerDept: 0
      }
    };
  }

  componentDidMount() {
    this.loadDashboardData();
  }

  loadDashboardData = async () => {
    try {
      const [deptResponse, empResponse] = await Promise.all([
        fetch(variables.API_URL + 'department'),
        fetch(variables.API_URL + 'employee')
      ]);

      const departments = await deptResponse.json();
      const employees = await empResponse.json();

      // Calculate recent joins (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentJoins = employees.filter(emp => {
        const joinDate = new Date(emp.DateOfJoining);
        return joinDate >= thirtyDaysAgo;
      }).length;

      const stats = {
        totalDepartments: departments.length,
        totalEmployees: employees.length,
        recentJoins,
        averageEmployeesPerDept: departments.length > 0 ? 
          Math.round((employees.length / departments.length) * 10) / 10 : 0
      };

      this.setState({
        departments,
        employees,
        stats,
        loading: false
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      this.setState({ loading: false });
    }
  };

  getRecentEmployees = () => {
    return this.state.employees
      .sort((a, b) => new Date(b.DateOfJoining) - new Date(a.DateOfJoining))
      .slice(0, 5);
  };

  getDepartmentDistribution = () => {
    const distribution = {};
    this.state.employees.forEach(emp => {
      distribution[emp.Department] = (distribution[emp.Department] || 0) + 1;
    });
    return Object.entries(distribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  // Modal handlers
  openModal = (type, data = []) => {
    this.setState({
      showDetailModal: true,
      modalType: type,
      modalData: data
    });
  };

  closeModal = () => {
    this.setState({
      showDetailModal: false,
      modalType: '',
      modalData: []
    });
  };

  // Click handlers for stats cards
  handleDepartmentsClick = () => {
    this.openModal('departments', this.state.departments);
  };

  handleEmployeesClick = () => {
    this.openModal('employees', this.state.employees);
  };

  handleRecentJoinsClick = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEmployees = this.state.employees.filter(emp => {
      const joinDate = new Date(emp.DateOfJoining);
      return joinDate >= thirtyDaysAgo;
    });
    
    this.openModal('recentJoins', recentEmployees);
  };

  handleDistributionClick = () => {
    const distribution = this.getDepartmentDistribution();
    this.openModal('distribution', distribution);
  };

  // Navigation handlers
  navigateTo = (path) => {
    window.location.href = path;
  };

  formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  renderPieChart = (data) => {
    const total = data.reduce((sum, [, count]) => sum + count, 0);
    const colors = ['#0d6efd', '#198754', '#ffc107', '#0dcaf0', '#6c757d'];
    
    let currentAngle = 0;
    const radius = 90;
    const centerX = 100;
    const centerY = 100;

    return (
      <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
        {data.map(([dept, count], index) => {
          const angle = (count / total) * 360;
          const color = colors[index % colors.length];
          
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
          const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
          const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
          const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');
          
          currentAngle += angle;
          
          return (
            <path
              key={dept}
              d={pathData}
              fill={color}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}
        {/* Center circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r="30"
          fill="white"
          stroke="#dee2e6"
          strokeWidth="2"
        />
        <text
          x={centerX}
          y={centerY - 5}
          textAnchor="middle"
          fontSize="12"
          fill="#6c757d"
          transform={`rotate(90 ${centerX} ${centerY})`}
        >
          Total
        </text>
        <text
          x={centerX}
          y={centerY + 8}
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill="#495057"
          transform={`rotate(90 ${centerX} ${centerY})`}
        >
          {total}
        </text>
      </svg>
    );
  };

  renderModalContent = () => {
    const { modalType, modalData } = this.state;

    switch (modalType) {
      case 'departments':
        return (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Department Name</th>
                  <th>Employee Count</th>
                </tr>
              </thead>
              <tbody>
                {modalData.map(dept => {
                  const empCount = this.state.employees.filter(emp => emp.Department === dept.DepartmentName).length;
                  return (
                    <tr key={dept.DepartmentId}>
                      <td>{dept.DepartmentId}</td>
                      <td>{dept.DepartmentName}</td>
                      <td>
                        <span className="badge bg-primary">{empCount}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );

      case 'employees':
        return (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Join Date</th>
                </tr>
              </thead>
              <tbody>
                {modalData.map(emp => (
                  <tr key={emp.EmployeeId}>
                    <td>{emp.EmployeeId}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" 
                             style={{ width: '30px', height: '30px', fontSize: '12px' }}>
                          <span className="text-white fw-bold">{emp.EmployeeName.charAt(0)}</span>
                        </div>
                        {emp.EmployeeName}
                      </div>
                    </td>
                    <td>{emp.Department}</td>
                    <td>{this.formatDate(emp.DateOfJoining)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'recentJoins':
        return (
          <div>
            {modalData.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Join Date</th>
                      <th>Days Ago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map(emp => {
                      const joinDate = new Date(emp.DateOfJoining);
                      const today = new Date();
                      const daysAgo = Math.floor((today - joinDate) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <tr key={emp.EmployeeId}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="bg-warning rounded-circle d-flex align-items-center justify-content-center me-2" 
                                   style={{ width: '30px', height: '30px', fontSize: '12px' }}>
                                <span className="text-white fw-bold">{emp.EmployeeName.charAt(0)}</span>
                              </div>
                              {emp.EmployeeName}
                            </div>
                          </td>
                          <td>{emp.Department}</td>
                          <td>{this.formatDate(emp.DateOfJoining)}</td>
                          <td>
                            <span className="badge bg-success">{daysAgo} days ago</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="display-1 text-muted mb-3">📭</div>
                <h5>No Recent Joins</h5>
                <p className="text-muted">No employees have joined in the last 30 days.</p>
              </div>
            )}
          </div>
        );

      case 'distribution':
        return (
          <div>
            <div className="row mb-4">
              <div className="col-md-6">
                {/* Bar Chart */}
                <h6 className="fw-bold mb-3">📊 Employee Distribution</h6>
                <div className="chart-container">
                  {modalData.map(([dept, count], index) => {
                    const percentage = this.state.stats.totalEmployees > 0 ? 
                      Math.round((count / this.state.stats.totalEmployees) * 100) : 0;
                    const colors = ['#0d6efd', '#198754', '#ffc107', '#0dcaf0', '#6c757d'];
                    const color = colors[index % colors.length];
                    
                    return (
                      <div key={dept} className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-semibold">{dept || 'Unassigned'}</span>
                          <span className="text-muted">{count} ({percentage}%)</span>
                        </div>
                        <div className="progress mb-2" style={{ height: '20px' }}>
                          <div 
                            className="progress-bar d-flex align-items-center justify-content-center text-white fw-bold"
                            role="progressbar"
                            style={{ width: `${percentage}%`, backgroundColor: color }}
                            aria-valuenow={percentage}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          >
                            {percentage > 15 ? `${count}` : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="col-md-6">
                {/* Pie Chart Representation */}
                <h6 className="fw-bold mb-3">🥧 Visual Distribution</h6>
                <div className="d-flex justify-content-center">
                  <div style={{ width: '200px', height: '200px', position: 'relative' }}>
                    {this.renderPieChart(modalData)}
                  </div>
                </div>
                <div className="mt-3">
                  {modalData.map(([dept, count], index) => {
                    const colors = ['#0d6efd', '#198754', '#ffc107', '#0dcaf0', '#6c757d'];
                    const color = colors[index % colors.length];
                    
                    return (
                      <div key={dept} className="d-flex align-items-center mb-2">
                        <div className="me-2" style={{ 
                          width: '12px', 
                          height: '12px', 
                          backgroundColor: color,
                          borderRadius: '2px'
                        }}></div>
                        <small className="fw-semibold">{dept || 'Unassigned'}: {count}</small>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>No data available</div>;
    }
  };

  render() {
    const { stats, loading } = this.state;
    const recentEmployees = this.getRecentEmployees();
    const deptDistribution = this.getDepartmentDistribution();

    if (loading) {
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="container-fluid">
        {/* Welcome Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="bg-gradient p-4 rounded-3 text-white position-relative overflow-hidden" 
                 style={{ 
                   background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                   minHeight: '200px'
                 }}>
              <div className="position-relative z-index-2">
                <h1 className="display-4 fw-bold mb-3">Welcome to Department Management</h1>
                <p className="lead mb-0">
                  Streamline your organization with powerful tools for managing departments and employees.
                </p>
              </div>
              {/* Background decoration */}
              <div className="position-absolute top-0 end-0 opacity-25" style={{ fontSize: '200px' }}>
                🏢
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card border-0 shadow-sm h-100 clickable-card" 
                 onClick={this.handleDepartmentsClick}
                 style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                 onMouseEnter={(e) => e.target.closest('.card').style.transform = 'translateY(-2px)'}
                 onMouseLeave={(e) => e.target.closest('.card').style.transform = 'translateY(0)'}>
              <div className="card-body text-center">
                <div className="display-6 text-primary mb-2">🏬</div>
                <h3 className="fw-bold text-primary">{stats.totalDepartments}</h3>
                <p className="text-muted mb-0">Total Departments</p>
                <small className="text-primary">Click to view all</small>
              </div>
            </div>
          </div>
          
          <div className="col-md-3 mb-3">
            <div className="card border-0 shadow-sm h-100 clickable-card"
                 onClick={this.handleEmployeesClick}
                 style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                 onMouseEnter={(e) => e.target.closest('.card').style.transform = 'translateY(-2px)'}
                 onMouseLeave={(e) => e.target.closest('.card').style.transform = 'translateY(0)'}>
              <div className="card-body text-center">
                <div className="display-6 text-success mb-2">👥</div>
                <h3 className="fw-bold text-success">{stats.totalEmployees}</h3>
                <p className="text-muted mb-0">Total Employees</p>
                <small className="text-success">Click to view all</small>
              </div>
            </div>
          </div>
          
          <div className="col-md-3 mb-3">
            <div className="card border-0 shadow-sm h-100 clickable-card"
                 onClick={this.handleRecentJoinsClick}
                 style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                 onMouseEnter={(e) => e.target.closest('.card').style.transform = 'translateY(-2px)'}
                 onMouseLeave={(e) => e.target.closest('.card').style.transform = 'translateY(0)'}>
              <div className="card-body text-center">
                <div className="display-6 text-warning mb-2">🆕</div>
                <h3 className="fw-bold text-warning">{stats.recentJoins}</h3>
                <p className="text-muted mb-0">Recent Joins (30 days)</p>
                <small className="text-warning">Click to view details</small>
              </div>
            </div>
          </div>
          
          <div className="col-md-3 mb-3">
            <div className="card border-0 shadow-sm h-100 clickable-card"
                 onClick={this.handleDistributionClick}
                 style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                 onMouseEnter={(e) => e.target.closest('.card').style.transform = 'translateY(-2px)'}
                 onMouseLeave={(e) => e.target.closest('.card').style.transform = 'translateY(0)'}>
              <div className="card-body text-center">
                <div className="display-6 text-info mb-2">📊</div>
                <h3 className="fw-bold text-info">{stats.averageEmployeesPerDept}</h3>
                <p className="text-muted mb-0">Avg per Department</p>
                <small className="text-info">Click to view chart</small>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Recent Employees */}
          <div className="col-lg-6 mb-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-transparent border-bottom-0 pb-0 d-flex justify-content-between align-items-center">
                <h5 className="card-title fw-bold mb-0">
                  <span className="text-primary">📋</span> Recent Employees
                </h5>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => this.navigateTo('/employee')}
                >
                  View All
                </button>
              </div>
              <div className="card-body">
                {recentEmployees.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {recentEmployees.map((emp, index) => (
                      <div key={emp.EmployeeId} 
                           className="list-group-item border-0 px-0 clickable-item"
                           style={{ cursor: 'pointer', borderRadius: '8px', transition: 'background-color 0.2s' }}
                           onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                           onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                           onClick={() => this.navigateTo('/employee')}>
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0 me-3">
                            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center" 
                                 style={{ width: '40px', height: '40px' }}>
                              <span className="text-white fw-bold">
                                {emp.EmployeeName.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-1 fw-semibold">{emp.EmployeeName}</h6>
                            <p className="mb-0 text-muted small">
                              {emp.Department} • Joined {this.formatDate(emp.DateOfJoining)}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="text-muted">→</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center py-3">No employees found</p>
                )}
              </div>
            </div>
          </div>

          {/* Department Distribution */}
          <div className="col-lg-6 mb-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-transparent border-bottom-0 pb-0 d-flex justify-content-between align-items-center">
                <h5 className="card-title fw-bold mb-0">
                  <span className="text-success">📈</span> Department Distribution
                </h5>
                <button 
                  className="btn btn-sm btn-outline-success"
                  onClick={this.handleDistributionClick}
                >
                  View Chart
                </button>
              </div>
              <div className="card-body">
                {deptDistribution.length > 0 ? (
                  <div className="space-y-3">
                    {deptDistribution.map(([dept, count], index) => {
                      const percentage = stats.totalEmployees > 0 ? 
                        Math.round((count / stats.totalEmployees) * 100) : 0;
                      const colors = ['primary', 'success', 'warning', 'info', 'secondary'];
                      const color = colors[index % colors.length];
                      
                      return (
                        <div key={dept} 
                             className="mb-3 clickable-item p-2 rounded"
                             style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                             onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                             onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                             onClick={() => this.navigateTo('/department')}>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-semibold">{dept || 'Unassigned'}</span>
                            <span className="text-muted">{count} ({percentage}%)</span>
                          </div>
                          <div className="progress" style={{ height: '8px' }}>
                            <div 
                              className={`progress-bar bg-${color}`}
                              role="progressbar"
                              style={{ width: `${percentage}%` }}
                              aria-valuenow={percentage}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted text-center py-3">No distribution data available</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent border-bottom-0">
                <h5 className="card-title fw-bold mb-0">
                  <span className="text-warning">⚡</span> Quick Actions
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="d-grid">
                      <button 
                        className="btn btn-outline-primary btn-lg py-3"
                        onClick={() => this.navigateTo('/department')}
                      >
                        <div className="d-flex align-items-center justify-content-center">
                          <span className="me-2" style={{ fontSize: '24px' }}>🏬</span>
                          <div className="text-start">
                            <div className="fw-bold">Manage Departments</div>
                            <small className="text-muted">Add, edit, or view departments</small>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <div className="d-grid">
                      <button 
                        className="btn btn-outline-success btn-lg py-3"
                        onClick={() => this.navigateTo('/employee')}
                      >
                        <div className="d-flex align-items-center justify-content-center">
                          <span className="me-2" style={{ fontSize: '24px' }}>👥</span>
                          <div className="text-start">
                            <div className="fw-bold">Manage Employees</div>
                            <small className="text-muted">Add, edit, or view employees</small>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-muted py-3 border-top">
          <small>Department Management System • Built with React & Bootstrap</small>
        </div>

        {/* Detail Modal */}
        {this.state.showDetailModal && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {this.state.modalType === 'departments' && '🏬 All Departments'}
                    {this.state.modalType === 'employees' && '👥 All Employees'}
                    {this.state.modalType === 'recentJoins' && '🆕 Recent Joins (30 days)'}
                    {this.state.modalType === 'distribution' && '📊 Department Distribution Chart'}
                  </h5>
                  <button type="button" className="btn-close" onClick={this.closeModal}></button>
                </div>
                <div className="modal-body">
                  {this.renderModalContent()}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={this.closeModal}>
                    Close
                  </button>
                  {this.state.modalType === 'departments' && (
                    <button type="button" className="btn btn-primary" onClick={() => this.navigateTo('/department')}>
                      Manage Departments
                    </button>
                  )}
                  {(this.state.modalType === 'employees' || this.state.modalType === 'recentJoins') && (
                    <button type="button" className="btn btn-primary" onClick={() => this.navigateTo('/employee')}>
                      Manage Employees
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}