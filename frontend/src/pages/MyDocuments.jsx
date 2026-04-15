import Sidebar from "../components/Sidebar";

export default function MyDocuments() {

  return (
    <div className="flex bg-gray-100 min-h-screen">

      <Sidebar />

      <div className="flex-1 p-6">

        <h1 className="text-3xl font-bold mb-6">
          My Documents
        </h1>

        <p>Documents will appear here.</p>

      </div>

    </div>
  );
}