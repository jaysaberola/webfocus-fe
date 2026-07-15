import AdminLayout from '@/components/Layout/AdminLayout'

export default function FileManagerPage() {
  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-3">File Manager</h3>
      <div
        style={{
          width: "100%",
          height: "75vh",
          border: "1px solid #dee2e6",
          borderRadius: 6,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <iframe
          src={`${process.env.NEXT_PUBLIC_API_URL}/admin/file-manager-ui`}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          }}
          loading="lazy"
        />
      </div>
    </div>
  )
}

FileManagerPage.Layout = AdminLayout
