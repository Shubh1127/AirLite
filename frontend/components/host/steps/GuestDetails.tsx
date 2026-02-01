import { Minus, Plus } from "lucide-react";

export default function GuestDetails({
  maxGuests,
  bedrooms,
  beds,
  bathrooms,
  setMaxGuests,
  setBedrooms,
  setBeds,
  setBathrooms,
}: {
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  setMaxGuests: (value: number) => void;
  setBedrooms: (value: number) => void;
  setBeds: (value: number) => void;
  setBathrooms: (value: number) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold text-gray-900 mb-2">
          Share some basics about your place
        </h1>
        <p className="text-lg text-gray-600">
          You'll add more details later, like bed types
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between py-6 border-b border-gray-200">
          <div>
            <div className="font-medium text-gray-900">Guests</div>
            <div className="text-sm text-gray-500">Maximum number of guests</div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMaxGuests(Math.max(1, maxGuests - 1))}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors disabled:opacity-30"
              disabled={maxGuests <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-medium">{maxGuests}</span>
            <button
              onClick={() => setMaxGuests(maxGuests + 1)}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between py-6 border-b border-gray-200">
          <div>
            <div className="font-medium text-gray-900">Bedrooms</div>
            <div className="text-sm text-gray-500">Number of bedrooms</div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setBedrooms(Math.max(1, bedrooms - 1))}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors disabled:opacity-30"
              disabled={bedrooms <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-medium">{bedrooms}</span>
            <button
              onClick={() => setBedrooms(bedrooms + 1)}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between py-6 border-b border-gray-200">
          <div>
            <div className="font-medium text-gray-900">Beds</div>
            <div className="text-sm text-gray-500">Total number of beds</div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setBeds(Math.max(1, beds - 1))}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors disabled:opacity-30"
              disabled={beds <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-medium">{beds}</span>
            <button
              onClick={() => setBeds(beds + 1)}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between py-6">
          <div>
            <div className="font-medium text-gray-900">Bathrooms</div>
            <div className="text-sm text-gray-500">Number of bathrooms</div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setBathrooms(Math.max(0.5, bathrooms - 0.5))}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-medium">{bathrooms}</span>
            <button
              onClick={() => setBathrooms(bathrooms + 0.5)}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
