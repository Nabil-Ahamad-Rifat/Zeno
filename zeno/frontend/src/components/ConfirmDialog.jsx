import Modal from './Modal.jsx'

const ConfirmDialog = ({ isOpen, onClose, onConfirm, message }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Delete">
      <div className="space-y-4">
        <p className="text-gray-700">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
