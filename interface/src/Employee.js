import React, { Component } from 'react';
import { variables } from './Variables.js';

export default class Employee extends Component {
  constructor(props) {
    super(props);
    this.state = {
      departments: [],
      employees: [],
      modalTitle: "",
      EmployeeId: 0,
      EmployeeName: "",
      Department: "",
      DateOfJoining: "",
      PhotoFileName: "anonymous.png",
      PhotoPath: variables.PHOTO_URL
    };
  }

  componentDidMount() {
    this.refreshList();
  }

  refreshList = () => {
    fetch(variables.API_URL + 'department')
      .then((r) => r.json())
      .then((data) => this.setState({ departments: data }))
      .catch((err) => console.error('Fetch departments failed:', err));
    
    fetch(variables.API_URL + 'employee')
      .then((r) => r.json())
      .then((data) => this.setState({ employees: data }))
      .catch((err) => console.error('Fetch employees failed:', err));
  };

  changeEmployeeName = (e) => {
    this.setState({ EmployeeName: e.target.value });
  };

  changeDepartment = (e) => {
    this.setState({ Department: e.target.value });
  };

  changeDateOfJoining = (e) => {
    this.setState({ DateOfJoining: e.target.value });
  };

  addClick = () => {
    this.setState({
      modalTitle: "Add Employee",
      EmployeeId: 0,
      EmployeeName: "",
      Department: "",
      DateOfJoining: "",
      PhotoFileName: "anonymous.png"
    });
  };

  editClick = (emp) => {
    this.setState({
      modalTitle: 'Edit Employee',
      EmployeeId: emp.EmployeeId,
      EmployeeName: emp.EmployeeName,
      Department: emp.Department,
      DateOfJoining: emp.DateOfJoining,
      PhotoFileName: emp.PhotoFileName
    });
  };

  createClick = async () => {
    const { EmployeeName, Department, DateOfJoining, PhotoFileName } = this.state;
    
    if (!EmployeeName.trim()) {
      alert('Please enter an employee name');
      return;
    }

    try {
      const res = await fetch(variables.API_URL + 'employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ EmployeeName, Department, DateOfJoining, PhotoFileName }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const result = await res.json();
      alert(typeof result === 'string' ? result : 'Created successfully');

      this.refreshList();
    } catch (e) {
      console.error('Create failed:', e);
      alert('Create failed. Check console for details.');
    }
  };

  updateClick = async () => {
    const { EmployeeId, EmployeeName, Department, DateOfJoining, PhotoFileName } = this.state;

    try {
      const res = await fetch(variables.API_URL + 'employee', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ EmployeeId, EmployeeName, Department, DateOfJoining, PhotoFileName }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const result = await res.json();
      alert(typeof result === 'string' ? result : 'Updated successfully');

      this.refreshList();
    } catch (e) {
      console.error('Update failed:', e);
      alert('Update failed. Check console for details.');
    }
  };

  deleteClick = async (id) => {
    if (!window.confirm('Are you sure?')) return;

    try {
      const res = await fetch(variables.API_URL + 'employee/' + id, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      this.refreshList();
    } catch (e) {
      console.error('Delete failed:', e);
      alert('Delete failed. Check console for details.');
    }
  };

  imageUpload = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("file", e.target.files[0], e.target.files[0].name);

    fetch(variables.API_URL + 'employee/savefile', {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        this.setState({ PhotoFileName: data });
      });
  };

  render() {
    const {
      departments,
      employees,
      modalTitle,
      EmployeeId,
      EmployeeName,
      Department,
      DateOfJoining,
      PhotoPath,
      PhotoFileName
    } = this.state;

    return (
      <div className="container mt-3">
        <button
          type="button"
          className="btn btn-primary m-2 float-end"
          data-bs-toggle="modal"
          data-bs-target="#exampleModal"
          onClick={this.addClick}
        >
          Add Employee
        </button>

        <table className="table table-striped">
          <thead>
            <tr>
              <th>EmployeeId</th>
              <th>EmployeeName</th>
              <th>Department</th>
              <th>DateOfJoining</th>
              <th>Options</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.EmployeeId}>
                <td>{emp.EmployeeId}</td>
                <td>{emp.EmployeeName}</td>
                <td>{emp.Department}</td>
                <td>{emp.DateOfJoining}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-light me-1"
                    data-bs-toggle="modal"
                    data-bs-target="#exampleModal"
                    onClick={() => this.editClick(emp)}
                    title="Edit"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="bi bi-pencil-square"
                      viewBox="0 0 16 16"
                    >
                      <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                      <path
                        fillRule="evenodd"
                        d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"
                      />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => this.deleteClick(emp.EmployeeId)}
                    title="Delete"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="bi bi-trash-fill"
                      viewBox="0 0 16 16"
                    >
                      <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Modal */}
        <div
          className="modal fade"
          id="exampleModal"
          tabIndex={-1}
          aria-hidden="true"
          aria-labelledby="exampleModalLabel"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 id="exampleModalLabel" className="modal-title">
                  {modalTitle}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                />
              </div>

              <div className="modal-body">
                <div className="d-flex flex-row bd-highlight mb-3">
                  <div className="p-2 w-50 bd-highlight">
                    <div className="input-group mb-3">
                      <span className="input-group-text">Emp Name</span>
                      <input
                        type="text"
                        className="form-control"
                        value={EmployeeName}
                        onChange={this.changeEmployeeName}
                      />
                    </div>

                    <div className="input-group mb-3">
                      <span className="input-group-text">Department</span>
                      <select
                        className="form-select"
                        onChange={this.changeDepartment}
                        value={Department}
                      >
                        <option value="">Select Department</option>
                        {departments.map((dep) => (
                          <option key={dep.DepartmentId} value={dep.DepartmentName}>
                            {dep.DepartmentName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="input-group mb-3">
                      <span className="input-group-text">Date of Joining</span>
                      <input
                        type="date"
                        className="form-control"
                        value={DateOfJoining}
                        onChange={this.changeDateOfJoining}
                      />
                    </div>
                  </div>

                  <div className="p-2 w-50 bd-highlight">
                    <img 
                      width="250px" 
                      height="250px"
                      src={PhotoPath + PhotoFileName}
                      alt="Employee"
                    />
                    <input 
                      className="m-2" 
                      type="file" 
                      onChange={this.imageUpload}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  {EmployeeId === 0 ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={this.createClick}
                      data-bs-dismiss="modal"
                    >
                      Create
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={this.updateClick}
                      data-bs-dismiss="modal"
                    >
                      Update
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}