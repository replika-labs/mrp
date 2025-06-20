export default function StockStatusBadge({ current, min }) {
  const getStatus = () => {
    if (current === 0) return { label: 'Out of Stock', class: 'badge-error' }
    if (current <= min) return { label: 'Low Stock', class: 'badge-warning' }
    return { label: 'In Stock', class: 'badge-success' }
  }

  const status = getStatus()

  return (
    <div className={`badge ${status.class} font-medium`}>
      {status.label}
    </div>
  )
}