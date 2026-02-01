import { X } from "lucide-react";
import { useState } from "react";

export default function HouseRules({
  houseRules,
  cancellationPolicy,
  setHouseRules,
  setCancellationPolicy,
}: {
  houseRules: string[];
  cancellationPolicy: string;
  setHouseRules: (value: string[]) => void;
  setCancellationPolicy: (value: string) => void;
}) {
  const [newRule, setNewRule] = useState("");

  const addRule = () => {
    if (newRule.trim()) {
      setHouseRules([...houseRules, newRule.trim()]);
      setNewRule("");
    }
  };

  const removeRule = (index: number) => {
    setHouseRules(houseRules.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold text-gray-900 mb-2">
          Set house rules for your guests
        </h1>
        <p className="text-lg text-gray-600">
          Guests must agree to your house rules before they book
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add a house rule
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addRule()}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="e.g., No smoking, No pets, Quiet hours after 10 PM"
            />
            <button
              onClick={addRule}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {houseRules.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Your rules</div>
            {houseRules.map((rule, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <span className="text-gray-900">{rule}</span>
                <button
                  onClick={() => removeRule(index)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Cancellation policy
          </label>
          <div className="space-y-3">
            {[
              {
                value: "flexible",
                label: "Flexible",
                description: "Full refund 1 day prior to arrival",
              },
              {
                value: "moderate",
                label: "Moderate",
                description: "Full refund 5 days prior to arrival",
              },
              {
                value: "strict",
                label: "Strict",
                description: "Full refund for cancellations made within 48 hours of booking, if the check-in date is at least 14 days away",
              },
            ].map((policy) => (
              <button
                key={policy.value}
                onClick={() => setCancellationPolicy(policy.value)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  cancellationPolicy === policy.value
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <div className="font-medium text-gray-900 mb-1">
                  {policy.label}
                </div>
                <div className="text-sm text-gray-600">
                  {policy.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
