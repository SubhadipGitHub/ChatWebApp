// DeleteDataModal.js
import React from 'react';

const DeleteDataModal = ({ show, handleClose, handleDelete }) => {
    return (
        <div className={`modal fade ${show ? 'show' : ''}`} style={{ display: show ? 'block' : 'none' }} tabIndex="-1" role="dialog" aria-labelledby="deleteDataModalLabel" aria-hidden={!show}>
            <div className="modal-dialog" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id="deleteDataModalLabel">Delete All Data</h5>
                    </div>
                    <div className="modal-body">
                        <p>Are you sure you want to delete all data?</p>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
                        <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteDataModal;
