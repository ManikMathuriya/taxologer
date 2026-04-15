import Sidebar from "../components/Sidebar";

export default function Payments() {

  return (
    <div className="flex bg-gray-100 min-h-screen">

      <Sidebar />

      <div className="flex-1 p-6">

        <h1 className="text-3xl font-bold mb-6">
          Payments
        </h1>

        <p>Payment history will appear here.</p>

      </div>

    </div>
  );
}


