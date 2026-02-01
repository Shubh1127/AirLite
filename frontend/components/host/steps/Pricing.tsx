export default function Pricing({
  pricePerNight,
  cleaningFee,
  serviceFee,
  tax,
  setPricePerNight,
  setCleaningFee,
  setServiceFee,
  setTax,
}: {
  pricePerNight: number;
  cleaningFee: number;
  serviceFee: number;
  tax: number;
  setPricePerNight: (value: number) => void;
  setCleaningFee: (value: number) => void;
  setServiceFee: (value: number) => void;
  setTax: (value: number) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold text-gray-900 mb-2">
          Now, set your price
        </h1>
        <p className="text-lg text-gray-600">
          You can change it anytime
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base price per night (₹)
          </label>
          <input
            type="number"
            value={pricePerNight || ""}
            onChange={(e) => setPricePerNight(Number(e.target.value))}
            min="0"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="5000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cleaning fee (₹)
          </label>
          <input
            type="number"
            value={cleaningFee || ""}
            onChange={(e) => setCleaningFee(Number(e.target.value))}
            min="0"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service fee (₹)
          </label>
          <input
            type="number"
            value={serviceFee || ""}
            onChange={(e) => setServiceFee(Number(e.target.value))}
            min="0"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax (₹)
          </label>
          <input
            type="number"
            value={tax || ""}
            onChange={(e) => setTax(Number(e.target.value))}
            min="0"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="200"
          />
        </div>

        {pricePerNight > 0 && (
          <div className="bg-gray-50 rounded-lg p-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Base price</span>
              <span className="font-medium">₹{pricePerNight.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cleaning fee</span>
              <span className="font-medium">₹{cleaningFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Service fee</span>
              <span className="font-medium">₹{serviceFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium">₹{tax.toLocaleString()}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="font-semibold">Guest price per night</span>
              <span className="font-semibold">
                ₹{(pricePerNight + cleaningFee + serviceFee + tax).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
