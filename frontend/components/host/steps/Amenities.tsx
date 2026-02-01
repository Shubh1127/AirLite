import { Check } from "lucide-react";

const popularAmenities = [
  "wifi",
  "kitchen",
  "parking",
  "air conditioning",
  "heating",
  "pool",
  "hot tub",
  "gym",
  "tv",
  "washer",
  "dryer",
  "fireplace",
  "balcony",
  "garden",
  "bbq grill",
];

export default function Amenities({
  amenities,
  setAmenities,
}: {
  amenities: string[];
  setAmenities: (value: string[]) => void;
}) {
  const toggleAmenity = (amenity: string) => {
    if (amenities.includes(amenity)) {
      setAmenities(amenities.filter((a) => a !== amenity));
    } else {
      setAmenities([...amenities, amenity]);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold text-gray-900 mb-2">
          Tell guests what your place has to offer
        </h1>
        <p className="text-lg text-gray-600">
          You can add more amenities after you publish your listing
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {popularAmenities.map((amenity) => (
          <button
            key={amenity}
            onClick={() => toggleAmenity(amenity)}
            className={`p-6 rounded-xl border-2 transition-all text-left relative ${
              amenities.includes(amenity)
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200 hover:border-gray-400"
            }`}
          >
            <div className="capitalize font-medium text-gray-900">{amenity}</div>
            {amenities.includes(amenity) && (
              <div className="absolute top-4 right-4">
                <Check className="w-5 h-5 text-gray-900" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
