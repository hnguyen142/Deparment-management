import React, { Component } from 'react';
import { variables } from './Variables.js';

export default class Department extends Component {
  constructor(props) {
    super(props);
    this.state = {
      departments: [],
      departmentsWithoutFilter: [],
      modalTitle: '',
      DepartmentName: '',
      DepartmentId: 0,

      // filters
      DepartmentIdFilter: '',
      DepartmentNameFilter: '',
    };
  }

  componentDidMount() {
    this.refreshList();
  }

  refreshList = () => {
    fetch(variables.API_URL + 'department')
      .then((r) => r.json())
      .then((data) =>
        this.setState({
          departments: data,
          departmentsWithoutFilter: data,
        })
      )
      .catch((err) => console.error('Fetch departments failed:', err));
  };

  // ---------- Filters & Sorting ----------
  FilterFn = () => {
    const {
      DepartmentIdFilter,
      DepartmentNameFilter,
      departmentsWithoutFilter,
    } = this.state;

    const idFilter = DepartmentIdFilter.toString().trim().toLowerCase();
    const nameFilter = DepartmentNameFilter.toString().trim().toLowerCase();

    const filteredData = departmentsWithoutFilter.filter((el) => {
      const idStr = (el.DepartmentId ?? '').toString().toLowerCase();
      const nameStr = (el.DepartmentName ?? '').toString().toLowerCase();
      return idStr.includes(idFilter) && nameStr.includes(nameFilter);
    });

    this.setState({ departments: filteredData });
  };

  sortResult = (prop, asc) => {
    // sort the currently displayed data immutably
    const sortedData = [...this.state.departments].sort((a, b) => {
      const av = a[prop];
      const bv = b[prop];

      if (av === bv) return 0;
      if (asc) return av > bv ? 1 : -1;
      return bv > av ? 1 : -1;
    });

    this.setState({ departments: sortedData });
  };

  changeDepartmentIdFilter = (e) => {
    const value = e.target.value;
    this.setState({ DepartmentIdFilter: value }, this.FilterFn);
  };

  changeDepartmentNameFilter = (e) => {
    const value = e.target.value;
    this.setState({ DepartmentNameFilter: value }, this.FilterFn);
  };

  // ---------- CRUD ----------
  changeDepartmentName = (e) => {
    this.setState({ DepartmentName: e.target.value });
  };

  addClick = () => {
    this.setState({
      modalTitle: 'Add Department',
      DepartmentId: 0,
      DepartmentName: '',
    });
  };

  editClick = (dep) => {
    this.setState({
      modalTitle: 'Edit Department',
      DepartmentId: dep.DepartmentId,
      DepartmentName: dep.DepartmentName,
    });
  };

  createClick = async () => {
    const { DepartmentName } = this.state;
    if (!DepartmentName.trim()) {
      alert('Please enter a department name');
      return;
    }

    try {
      const res = await fetch(variables.API_URL + 'department', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ DepartmentName }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const result = await res.json().catch(() => null);
      alert(typeof result === 'string' ? result : 'Created successfully');

      this.refreshList();
      this.setState({ DepartmentName: '', DepartmentId: 0 });
    } catch (e) {
      console.error('Create failed:', e);
      alert('Create failed. Check console for details.');
    }
  };

  updateClick = async () => {
    const { DepartmentId, DepartmentName } = this.state;

    try {
      const res = await fetch(variables.API_URL + 'department', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ DepartmentId, DepartmentName }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const result = await res.json().catch(() => null);
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
      const res = await fetch(variables.API_URL + 'department/' + id, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.refreshList();
    } catch (e) {
      console.error('Delete failed:', e);
      alert('Delete failed. Check console for details.');
    }
  };

  // ---------- Render ----------
  render() {
    const {
      departments,
      modalTitle,
      DepartmentId,
      DepartmentName,
      DepartmentIdFilter,
      DepartmentNameFilter,
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
          Add Department
        </button>

        <table className="table table-striped">
          <thead>
            <tr>
              <th>
                <div className="d-flex align-items-center">
                  <span className="me-2 fw-semibold">DepartmentId</span>
                  <input
                    className="form-control m-2"
                    value={DepartmentIdFilter}
                    onChange={this.changeDepartmentIdFilter}
                    placeholder="Filter by ID"
                  />
                  <button
                    type="button"
                    className="btn btn-light"
                    title="Sort asc"
                    onClick={() => this.sortResult('DepartmentId', true)}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="btn btn-light ms-1"
                    title="Sort desc"
                    onClick={() => this.sortResult('DepartmentId', false)}
                  >
                    ▼
                  </button>
                </div>
              </th>

              <th>
                <div className="d-flex align-items-center">
                  <span className="me-2 fw-semibold">DepartmentName</span>
                  <input
                    className="form-control m-2"
                    value={DepartmentNameFilter}
                    onChange={this.changeDepartmentNameFilter}
                    placeholder="Filter by name"
                  />
                </div>
              </th>

              <th className="fw-semibold">Options</th>
            </tr>
          </thead>

          <tbody>
            {departments.map((dep) => (
              <tr key={dep.DepartmentId}>
                <td>{dep.DepartmentId}</td>
                <td>{dep.DepartmentName}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-light me-1"
                    data-bs-toggle="modal"
                    data-bs-target="#exampleModal"
                    onClick={() => this.editClick(dep)}
                    title="Edit"
                  >
                    ✎
                  </button>

                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => this.deleteClick(dep.DepartmentId)}
                    title="Delete"
                  >
                    🗑️
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
                <div className="input-group mb-3">
                  <span className="input-group-text">DepartmentName</span>
                  <input
                    type="text"
                    className="form-control"
                    value={DepartmentName}
                    onChange={this.changeDepartmentName}
                  />
                </div>

                {DepartmentId === 0 ? (
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
    );
  }
}
