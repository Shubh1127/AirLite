export default function TitleDescription({
  title,
  description,
  setTitle,
  setDescription,
}: {
  title: string;
  description: string;
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold text-gray-900 mb-2">
          Now, let's give your place a title
        </h1>
        <p className="text-lg text-gray-600">
          Short titles work best. Have fun with it—you can always change it later.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={50}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="Cozy beachfront villa with stunning sunset views"
          />
          <div className="text-sm text-gray-500 mt-1 text-right">
            {title.length}/50
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            placeholder="Describe what makes your place special. Share the highlights and what guests can expect during their stay."
          />
          <div className="text-sm text-gray-500 mt-1 text-right">
            {description.length}/500
          </div>
        </div>
      </div>
    </div>
  );
}
