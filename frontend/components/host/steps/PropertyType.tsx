import { Home, Mountain, Building, Trees, Waves, Sun } from "lucide-react";

const categories = [
  { value: "beach", label: "Beach", icon: Waves },
  { value: "mountain", label: "Mountain", icon: Mountain },
  { value: "city", label: "City", icon: Building },
  { value: "lake", label: "Lake", icon: Waves },
  { value: "desert", label: "Desert", icon: Sun },
  { value: "luxury", label: "Luxury", icon: Home },
  { value: "historic", label: "Historic", icon: Building },
  { value: "nature", label: "Nature", icon: Trees },
  { value: "cottage", label: "Cottage", icon: Home },
];

export default function PropertyType({
  category,
  setCategory,
}: {
  category: string;
  setCategory: (value: string) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold text-gray-900 mb-2">
          What type of place will you host?
        </h1>
        <p className="text-lg text-gray-600">
          Choose the category that best describes your property
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`p-6 rounded-xl border-2 transition-all ${
                category === cat.value
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <Icon className="w-8 h-8 mb-3 text-gray-700" />
              <div className="text-left">
                <div className="font-medium text-gray-900">{cat.label}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
