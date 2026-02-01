'use client';

export default function PropertiesPage() {
  const properties = [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Properties</h1>
      {properties.length === 0 ? (
        <p className="text-gray-500">No properties listed yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Property cards will go here */}
        </div>
      )}
    </div>
  );
}
