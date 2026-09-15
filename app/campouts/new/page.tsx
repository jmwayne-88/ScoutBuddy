import { createCampout } from "../actions";

export default function NewCampoutPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl">Create a campout</h1>
      <form action={createCampout} className="space-y-3 max-w-md">
        <div>
          <label className="block text-sm font-medium">Campout name</label>
          <input name="name" required className="border border-scout-gray-pale rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Date</label>
          <input name="date" type="date" required className="border border-scout-gray-pale rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Location (optional)</label>
          <input
            name="location"
            placeholder="e.g. Eagle Lake, Pine Ridge"
            className="border border-scout-gray-pale rounded px-2 py-1 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Description (optional)</label>
          <textarea name="description" rows={2} className="border border-scout-gray-pale rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Photo URL (optional)</label>
          <input
            name="imageUrl"
            type="url"
            placeholder="https://..."
            className="border border-scout-gray-pale rounded px-2 py-1 w-full"
          />
        </div>
        <button type="submit" className="btn-primary">
          Create campout
        </button>
      </form>
    </div>
  );
}
