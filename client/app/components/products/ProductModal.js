export default function ProductModal({ isOpen, onClose, mode = 'create', product }) {
  return (
    <dialog className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-2xl">
        <div className="border-b pb-4 mb-6">
          <h3 className="text-lg font-semibold">
            {mode === 'create' ? 'Add New Product' : 'Edit Product'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Product Name</span>
              </label>
              <input 
                type="text"
                className="input input-bordered"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            {/* Other form fields */}
          </div>

          <div className="modal-action border-t pt-4">
            <button 
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn btn-primary"
            >
              {mode === 'create' ? 'Create Product' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </dialog>
  )
}